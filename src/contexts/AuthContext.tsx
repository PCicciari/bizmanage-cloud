
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/types/database.types";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isBranchManager: boolean;
  branchId: string | null;
  logout: () => Promise<void>;
  forceReload: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isAdmin: false,
  isBranchManager: false,
  branchId: null,
  logout: async () => {},
  forceReload: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadCount, setLoadCount] = useState(0);
  const { toast } = useToast();

  const forceReload = useCallback(() => {
    console.log("Force reload triggered");
    setLoadCount(prev => prev + 1);
  }, []);

  // Function to fetch user profile
  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    console.log(`Fetching profile for user ${userId}`);
    
    try {
      // First, check if profile exists
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // Not the "no rows returned" error
          console.error("Error fetching profile:", error);
          return null;
        }
        return null;
      }
      
      console.log("Profile fetched successfully:", profile);
      return profile;
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      return null;
    }
  }, []);

  // Function to create user profile
  const createUserProfile = useCallback(async (userId: string, role: string = "admin"): Promise<UserProfile | null> => {
    console.log(`Creating profile for user ${userId} with role ${role}`);
    
    try {
      const profileData = {
        id: userId,
        role,
        created_at: new Date().toISOString()
      };
      
      const { data: newProfile, error } = await supabase
        .from("user_profiles")
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error("Error creating profile:", error);
        return null;
      }
      
      console.log("User profile created successfully:", newProfile);
      return newProfile;
    } catch (error) {
      console.error("Error in createUserProfile:", error);
      return null;
    }
  }, []);

  // Primary function to get or create user profile
  const getOrCreateProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    // First try to fetch existing profile
    let profile = await fetchUserProfile(userId);
    
    // If no profile exists, create one
    if (!profile) {
      console.log("No profile found, creating default profile");
      profile = await createUserProfile(userId);
    }
    
    return profile;
  }, [fetchUserProfile, createUserProfile]);

  useEffect(() => {
    let mounted = true;
    console.log("AuthContext: Initializing (load count:", loadCount, ")");
    
    // Set initial loading state
    if (mounted) setLoading(true);
    
    const initializeAuth = async () => {
      try {
        // Check if there's an active session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error retrieving session:", sessionError);
          if (mounted) setLoading(false);
          return;
        }
        
        if (!session) {
          // No session, we're done
          console.log("AuthContext: No session found");
          if (mounted) {
            setUser(null);
            setUserProfile(null);
            setLoading(false);
          }
          return;
        }
        
        // We have a session, set the user
        console.log("Session found, user:", session.user.id);
        if (mounted) setUser(session.user);
        
        // Get or create the user profile
        if (session?.user?.id) {
          try {
            const profile = await getOrCreateProfile(session.user.id);
            
            if (mounted) {
              if (profile) {
                console.log("Setting user profile:", profile);
                setUserProfile(profile);
              } else {
                console.error("Failed to get or create profile");
              }
              setLoading(false);
            }
          } catch (profileError) {
            console.error("Error in profile handling:", profileError);
            if (mounted) setLoading(false);
          }
        } else {
          if (mounted) setLoading(false);
        }
      } catch (error) {
        console.error("AuthContext: Error during initialization", error);
        if (mounted) {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        }
      }
    };

    // Initialize auth immediately
    initializeAuth();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("AuthContext: Auth state changed", { event, session: session?.user?.id });
      
      if (event === 'SIGNED_OUT') {
        // Clear all auth state on sign out
        console.log("AuthContext: User signed out, clearing state");
        if (mounted) {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        }
        return;
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log("Setting user from auth state change:", session.user.id);
        if (mounted) setUser(session.user);
        
        if (session.user.id) {
          try {
            const profile = await getOrCreateProfile(session.user.id);
            
            if (mounted) {
              if (profile) {
                console.log("Setting user profile from auth state change:", profile);
                setUserProfile(profile);
              } else {
                console.error("Failed to get or create profile after auth state change");
              }
              setLoading(false);
            }
          } catch (profileError) {
            console.error("Error in profile fetching during auth change:", profileError);
            if (mounted) setLoading(false);
          }
        } else {
          if (mounted) setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [loadCount, getOrCreateProfile]);

  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setUserProfile(null);
      
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account.",
      });
      
      window.location.href = '/login';
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Error",
        description: "There was a problem signing out.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Determine user roles
  const isAdmin = userProfile?.role === "admin";
  const isBranchManager = userProfile?.role === "branch_manager";
  const branchId = userProfile?.branch_id || null;

  const value = {
    user,
    userProfile,
    loading,
    isAdmin,
    isBranchManager,
    branchId,
    logout,
    forceReload,
  };

  console.log("AuthContext: Current state", { 
    userId: user?.id, 
    userProfileId: userProfile?.id,
    loading, 
    isAdmin, 
    isBranchManager 
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
