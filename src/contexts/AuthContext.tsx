
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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isAdmin: false,
  isBranchManager: false,
  branchId: null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log("AuthContext: Initializing");
    let isActive = true; // Track if component is mounted
    
    // Add a shorter timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading && isActive) {
        console.log("AuthContext: Loading timeout reached, forcing loading state to false");
        setLoading(false);
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
        
        // Fetch the user profile
        try {
          const profile = await fetchUserProfile(session.user.id);
          if (isActive && profile) {
            setUserProfile(profile);
          }
        } catch (error) {
          console.error("Failed to fetch user profile during initialization:", error);
        } finally {
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
        try {
          const profile = await fetchUserProfile(session.user.id);
          if (isActive && profile) {
            setUserProfile(profile);
          }
        } catch (error) {
          console.error("Failed to fetch user profile after auth state change:", error);
        } finally {
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
      subscription.unsubscribe();
      clearTimeout(loadingTimeout); // Clear the timeout on cleanup
    };
  }, []);

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    console.log("AuthContext: Attempting to fetch user profile for", userId);
    let retries = 3;
    
    while (retries > 0) {
      try {
        // First, ensure the user_profiles table exists
        const { error: createTableError } = await supabase.rpc('create_user_profiles_if_not_exists');
        if (createTableError) {
          console.error("Error creating table:", createTableError);
        }
        
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.log("Profile fetch error:", error.message, error.code);
          // If there's no profile, create a default one
          if (error.code === 'PGRST116') {
            console.log("No profile found, creating default admin profile");
            // Create a default admin profile if none exists
            const { data: newProfile, error: createError } = await supabase
              .from("user_profiles")
              .insert([{ id: userId, role: "admin" }])
              .select()
              .single();
              
            if (createError) {
              console.error("Error creating profile:", createError);
              throw createError;
            }
            console.log("New profile created:", newProfile);
            setUserProfile(newProfile);
            return newProfile;
          } else {
            throw error;
          }
        } else {
          console.log("AuthContext: User profile fetched", data);
          setUserProfile(data);
          return data;
        }
      } catch (error) {
        console.error(`Error fetching user profile (retries left: ${retries}):`, error);
        retries--;
        
        // If this is the last retry, set loading to false
        if (retries === 0) {
          toast({
            title: "Error fetching profile",
            description: "Could not load your user profile. Please try logging in again.",
            variant: "destructive",
          });
          setUserProfile(null);
          return null;
        } else {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    return null;
  };

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
