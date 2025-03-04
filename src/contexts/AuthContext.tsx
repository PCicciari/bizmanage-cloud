
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/types/database.types";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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
    
    const initializeAuth = async () => {
      try {
        // Check if there's an active session
        const { data: { session } } = await supabase.auth.getSession();
        console.log("AuthContext: Session check", { session });
        
        if (!session) {
          // No session, we're done
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }
        
        // We have a session, set the user
        setUser(session.user);
        
        // Fetch the user profile
        await fetchUserProfile(session.user.id);
      } catch (error) {
        console.error("AuthContext: Error during initialization", error);
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("AuthContext: Auth state changed", { event, session });
      
      if (event === 'SIGNED_OUT') {
        // Clear all auth state on sign out
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }
      
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("AuthContext: Fetching user profile", { userId });
      
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
            throw createError;
          }
          setUserProfile(newProfile);
        } else {
          throw error;
        }
      } else {
        console.log("AuthContext: User profile fetched", { data });
        setUserProfile(data);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast({
        title: "Error fetching profile",
        description: "Could not load your user profile. Please try logging in again.",
        variant: "destructive",
      });
      // Sign out the user since there's an issue with their profile
      await supabase.auth.signOut();
      setUserProfile(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true); // Show loading state during logout
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear user and userProfile state to trigger the redirect to login screen
      setUser(null);
      setUserProfile(null);
      
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account.",
      });
      
      // The redirect to the login page will happen automatically thanks to the ProtectedRoute in App.tsx
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

  console.log("AuthContext: Current state", value);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
