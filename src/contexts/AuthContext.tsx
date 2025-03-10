
import { createContext, useContext, useEffect, useState } from "react";
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

  const forceReload = () => {
    console.log("Force reload triggered");
    setLoadCount(prev => prev + 1);
  };

  // Function to create or fetch a user profile
  const createOrFetchProfile = async (userId: string): Promise<UserProfile | null> => {
    console.log(`Attempting to create or fetch profile for user ${userId}`);
    
    // First, check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (checkError) {
      if (checkError.code === 'PGRST116') {
        // No rows returned - need to create profile
        console.log("No profile found, creating default admin profile");
        const { data: newProfile, error: createError } = await supabase
          .from("user_profiles")
          .insert([{ 
            id: userId, 
            role: "admin",
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
          
        if (createError) {
          console.error("Error creating profile:", createError);
          return null;
        }
        
        console.log("New profile created:", newProfile);
        return newProfile;
      } else {
        // Real error, not just "no rows returned"
        console.error("Error checking profile:", checkError);
        return null;
      }
    }
    
    // If profile exists, return it
    console.log("Existing profile found:", existingProfile);
    return existingProfile;
  };

  useEffect(() => {
    console.log("AuthContext: Initializing (load count:", loadCount, ")");
    let mounted = true;
    
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
          console.log("AuthContext: No session found, setting loading to false");
          if (mounted) {
            setUser(null);
            setUserProfile(null);
            setLoading(false);
          }
          return;
        }
        
        // We have a session, set the user
        if (mounted) setUser(session.user);
        
        // Fetch or create the user profile
        if (session?.user?.id) {
          try {
            const profile = await createOrFetchProfile(session.user.id);
            
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
            console.error("Error in profile fetching:", profileError);
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
            const profile = await createOrFetchProfile(session.user.id);
            
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

    // Safety timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("AuthContext: Loading timeout reached, forcing loading state to false");
        setLoading(false);
      }
    }, 3000);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, [loadCount]);

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
