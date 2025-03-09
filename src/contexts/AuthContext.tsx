
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
  const createOrFetchProfile = async (userId: string) => {
    console.log(`Attempting to create or fetch profile for user ${userId}`);
    
    try {
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
            throw createError;
          }
          
          console.log("New profile created:", newProfile);
          return newProfile;
        } else {
          // Real error, not just "no rows returned"
          console.error("Error checking profile:", checkError);
          throw checkError;
        }
      }
      
      // If profile exists, return it
      console.log("Existing profile found:", existingProfile);
      return existingProfile;
    } catch (error) {
      console.error("Profile processing error:", error);
      throw error;
    }
  };

  useEffect(() => {
    console.log("AuthContext: Initializing (load count:", loadCount, ")");
    let isActive = true; // Track if component is mounted
    
    // Add a shorter timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading && isActive) {
        console.log("AuthContext: Loading timeout reached, forcing loading state to false");
        if (isActive) setLoading(false);
      }
    }, 5000); // 5 second timeout
    
    const initializeAuth = async () => {
      try {
        // Check if there's an active session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log("AuthContext: Session check", { session: session?.user?.id, error: sessionError?.message });
        
        if (sessionError) {
          console.error("Error retrieving session:", sessionError);
          if (isActive) setLoading(false);
          return;
        }
        
        if (!session) {
          // No session, we're done
          console.log("AuthContext: No session found, setting loading to false");
          if (isActive) {
            setUser(null);
            setUserProfile(null);
            setLoading(false);
          }
          return;
        }
        
        // We have a session, set the user
        if (isActive) setUser(session.user);
        
        // Fetch or create the user profile
        if (session?.user?.id) {
          try {
            const profile = await createOrFetchProfile(session.user.id);
            
            if (isActive) {
              setUserProfile(profile);
              console.log("User profile set successfully:", profile);
            }
          } catch (error) {
            console.error("Profile processing error:", error);
            toast({
              title: "Error",
              description: "Failed to load your profile. Please try again.",
              variant: "destructive",
            });
          } finally {
            if (isActive) setLoading(false);
          }
        } else {
          if (isActive) setLoading(false);
        }
      } catch (error) {
        console.error("AuthContext: Error during initialization", error);
        if (isActive) {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("AuthContext: Auth state changed", { event, session: session?.user?.id });
      
      if (event === 'SIGNED_OUT') {
        // Clear all auth state on sign out
        console.log("AuthContext: User signed out, clearing state");
        if (isActive) {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        }
        return;
      }
      
      if (session?.user) {
        if (isActive) setUser(session.user);
        
        if (session.user.id) {
          try {
            const profile = await createOrFetchProfile(session.user.id);
            
            if (isActive) {
              setUserProfile(profile);
              console.log("User profile updated after auth change:", profile);
            }
          } catch (error) {
            console.error("Profile processing error after auth change:", error);
            toast({
              title: "Error",
              description: "Failed to load your profile. Please try again.",
              variant: "destructive",
            });
          } finally {
            if (isActive) setLoading(false);
          }
        } else {
          if (isActive) setLoading(false);
        }
      } else {
        if (isActive) {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      isActive = false; // Mark component as unmounted
      subscription?.unsubscribe();
      clearTimeout(loadingTimeout); // Clear the timeout on cleanup
    };
  }, [loadCount]); // Add loadCount as a dependency to force re-initialization

  const logout = async () => {
    try {
      setLoading(true); // Show loading state during logout
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear user and userProfile state
      setUser(null);
      setUserProfile(null);
      
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account.",
      });
      
      // Force a page reload to clear any lingering state
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
    user: user?.id, 
    userProfile: userProfile?.id,
    loading, 
    isAdmin, 
    isBranchManager 
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
