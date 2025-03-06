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
        if (session?.user?.id) {
          try {
            // Force create profile table if it doesn't exist
            await supabase.rpc('create_user_profiles_if_not_exists');
            
            // Check if profile exists first
            const { data: existingProfile, error: checkError } = await supabase
              .from("user_profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();
            
            if (checkError && checkError.code !== 'PGRST116') {
              // Real error, not just "no rows returned"
              console.error("Error checking profile:", checkError);
              throw checkError;
            }
            
            // If no profile exists, create a default admin one
            if (!existingProfile) {
              console.log("No profile found, creating default admin profile");
              const { data: newProfile, error: createError } = await supabase
                .from("user_profiles")
                .insert([{ id: session.user.id, role: "admin" }])
                .select()
                .single();
                
              if (createError) {
                console.error("Error creating profile:", createError);
                throw createError;
              }
              
              if (isActive) {
                console.log("New profile created:", newProfile);
                setUserProfile(newProfile);
                setLoading(false);
              }
            } else {
              // Profile exists
              if (isActive) {
                console.log("Existing profile found:", existingProfile);
                setUserProfile(existingProfile);
                setLoading(false);
              }
            }
          } catch (error) {
            console.error("Profile processing error:", error);
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
            // Force create profile table if it doesn't exist
            await supabase.rpc('create_user_profiles_if_not_exists');
            
            // Check if profile exists
            const { data: existingProfile, error: checkError } = await supabase
              .from("user_profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();
            
            if (checkError && checkError.code !== 'PGRST116') {
              // Real error, not just "no rows returned"
              console.error("Error checking profile:", checkError);
              throw checkError;
            }
            
            // If no profile exists, create a default admin one
            if (!existingProfile) {
              console.log("No profile found after auth change, creating default");
              const { data: newProfile, error: createError } = await supabase
                .from("user_profiles")
                .insert([{ id: session.user.id, role: "admin" }])
                .select()
                .single();
                
              if (createError) {
                console.error("Error creating profile after auth change:", createError);
                throw createError;
              }
              
              if (isActive) {
                console.log("New profile created after auth change:", newProfile);
                setUserProfile(newProfile);
                setLoading(false);
              }
            } else {
              // Profile exists
              if (isActive) {
                console.log("Existing profile found after auth change:", existingProfile);
                setUserProfile(existingProfile);
                setLoading(false);
              }
            }
          } catch (error) {
            console.error("Profile processing error after auth change:", error);
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
      subscription.unsubscribe();
      clearTimeout(loadingTimeout); // Clear the timeout on cleanup
    };
  }, []);

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
