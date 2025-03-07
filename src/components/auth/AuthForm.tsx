
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "branch_manager">("branch_manager");
  const [branchCode, setBranchCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { forceReload } = useAuth();

  const createUserProfile = async (userId: string, role: "admin" | "branch_manager", branchCode?: string) => {
    try {
      console.log("Creating user profile:", { userId, role, branchCode });
      
      // Make sure user_profiles table exists
      try {
        await supabase.rpc('create_user_profiles_if_not_exists');
      } catch (error) {
        console.log("Error calling create_user_profiles_if_not_exists RPC (may not exist):", error);
        // Continue anyway as the table might already exist
      }

      if (branchCode && role === "branch_manager") {
        const { data: branchExists, error: branchError } = await supabase
          .from("branches")
          .select("branch_code")
          .eq("branch_code", branchCode)
          .single();

        if (branchError || !branchExists) {
          throw new Error("Invalid branch code. Please check and try again.");
        }
      }

      // First check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();
        
      if (existingProfile) {
        console.log("Profile already exists, not creating a new one");
        return existingProfile;
      }

      // If we get here, we need to create a new profile
      const { data: newProfile, error: profileError } = await supabase
        .from("user_profiles")
        .insert([
          {
            id: userId,
            role,
            ...(role === "branch_manager" ? { branch_id: branchCode } : {}),
          },
        ])
        .select()
        .single();

      if (profileError) {
        console.error("Error creating profile:", profileError);
        throw profileError;
      }
      
      console.log("User profile created successfully:", newProfile);
      return newProfile;
    } catch (error: any) {
      console.error("Error creating user profile:", error);
      throw new Error(error.message || "Failed to create user profile. Please contact support.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return; // Prevent multiple submissions
    
    setLoading(true);

    try {
      if (isLogin) {
        console.log("Attempting to sign in with email:", email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        console.log("Sign in successful:", data);
        
        if (data.user) {
          try {
            // Ensure profile is created or fetched
            await createUserProfile(data.user.id, "admin");
            console.log("Profile verified/created after login");
            
            // Trigger a refresh in the auth context
            forceReload();
            
            toast({
              title: "Welcome back!",
              description: "You have successfully signed in.",
            });
            
            // Navigate to dashboard
            window.location.href = '/';
          } catch (profileError) {
            console.error("Profile verification error:", profileError);
            toast({
              title: "Error",
              description: "There was a problem with your profile. Please try again.",
              variant: "destructive",
            });
            setLoading(false);
          }
        }
      } else {
        console.log("Attempting to sign up with email:", email);
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;
        console.log("Sign up successful:", authData);

        if (!authData.user) {
          throw new Error("Failed to create user account.");
        }

        await createUserProfile(
          authData.user.id, 
          role, 
          role === "branch_manager" ? branchCode : undefined
        );

        // Trigger a refresh in the auth context
        forceReload();

        toast({
          title: "Account created!",
          description: "Please check your email to confirm your account.",
        });
        
        if (!authData.session) {
          toast({
            title: "Verification needed",
            description: "Please check your email to verify your account before logging in.",
          });
          setLoading(false);
        } else {
          // Navigate to dashboard
          window.location.href = '/';
        }
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred during authentication",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Card className="w-[400px] animate-fadeIn">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-center">
          {isLogin ? "Welcome Back" : "Create Account"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              disabled={loading}
              required
            />
          </div>
          {!isLogin && (
            <div className="space-y-4">
              <div>
                <Label>Select Role</Label>
                <RadioGroup
                  value={role}
                  onValueChange={(value: "admin" | "branch_manager") =>
                    setRole(value)
                  }
                  className="flex flex-col space-y-2 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="admin" id="admin" />
                    <Label htmlFor="admin">Admin</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="branch_manager" id="branch_manager" />
                    <Label htmlFor="branch_manager">Branch Manager</Label>
                  </div>
                </RadioGroup>
              </div>
              {role === "branch_manager" && (
                <div className="space-y-2">
                  <Label>Branch Code</Label>
                  <Input
                    placeholder="Enter Branch Code (e.g., NYC01)"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    disabled={loading}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Enter the branch code provided by your administrator
                  </p>
                </div>
              )}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <div className="flex items-center justify-center w-full">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                <span>Please wait...</span>
              </div>
            ) : isLogin ? "Sign In" : "Sign Up"}
          </Button>
          <p className="text-center text-sm text-gray-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 text-primary hover:underline"
              disabled={loading}
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
