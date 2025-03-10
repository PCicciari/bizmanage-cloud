
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

  // Function to force reload
  const forceReload = useCallback(() => {
    console.log("Force reload triggered");
    setLoading(true);
    setLoadCount(prev => prev + 1);
  }, []);

  // Function to fetch user profile
  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log(`Fetching profile for user ${userId}`);
      
      // Query for user profile
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          console.log("No profile found for user");
          return null;
        }
        console.error("Error fetching profile:", error);
        return null;
      }
      
      console.log("Profile fetched successfully:", profile);
      return profile;
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    console.log("AuthContext: Initializing (load count:", loadCount, ")");
    
    const initializeAuth = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error retrieving session:", sessionError);
          if (mounted) {
            setUser(null);
            setUserProfile(null);
            setLoading(false);
          }
          return;
        }
        
        if (!session) {
          // No session, update state and exit
          console.log("AuthContext: No session found");
          if (mounted) {
            setUser(null);
            setUserProfile(null);
            setLoading(false);
          }
          return;
        }
        
        // We have a session with a user
        console.log("Session found, user:", session.user.id);
        if (mounted) setUser(session.user);
        
        // Get the user's profile if we have a user ID
        if (session?.user?.id) {
          try {
            const profile = await fetchUserProfile(session.user.id);
            
            if (mounted) {
              setUserProfile(profile);
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

    // Initialize auth
    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("AuthContext: Auth state changed", { event, session: session?.user?.id });
      
      if (event === 'SIGNED_OUT') {
        // Clear state on sign out
        if (mounted) {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        }
        return;
      }
      
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        // Set user from session
        if (mounted) setUser(session.user);
        
        // Fetch profile for user
        if (session.user.id) {
          try {
            const profile = await fetchUserProfile(session.user.id);
            
            if (mounted) {
              setUserProfile(profile);
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

    // Cleanup
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [loadCount, fetchUserProfile]);

  // Logout function
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

  // Context value
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
