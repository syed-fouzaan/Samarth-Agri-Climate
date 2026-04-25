import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const emailSchema = z.string().trim().email({ message: "Invalid email address" }).max(255);
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" }).max(128);
const nameSchema = z.string().trim().min(1, { message: "Name is required" }).max(100);

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(signInEmail);
      passwordSchema.parse(signInPassword);
    } catch (err: any) {
      toast({ title: "Invalid input", description: err.errors?.[0]?.message ?? "Check your input", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: signInEmail, password: signInPassword });
    setSubmitting(false);

    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      return;
    }
    navigate("/", { replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      nameSchema.parse(signUpName);
      emailSchema.parse(signUpEmail);
      passwordSchema.parse(signUpPassword);
    } catch (err: any) {
      toast({ title: "Invalid input", description: err.errors?.[0]?.message ?? "Check your input", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: signUpName },
      },
    });
    setSubmitting(false);

    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Account created", description: "Check your email to confirm your account, then sign in." });
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setSubmitting(false);
      toast({ title: "Google sign in failed", description: String(result.error), variant: "destructive" });
      return;
    }
    if (result.redirected) return; // browser will navigate
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-gradient-to-br from-primary to-primary/80 p-3 rounded-xl">
            <Leaf className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to Samarth</h1>
          <p className="text-sm text-muted-foreground">Sign in to access agricultural insights for India</p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
          disabled={submitting}
        >
          {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or with email</span>
          </div>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 mt-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" type="email" autoComplete="email" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input id="signin-password" type="password" autoComplete="current-password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Sign in
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Name</Label>
                <Input id="signup-name" value={signUpName} onChange={(e) => setSignUpName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" autoComplete="email" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" type="password" autoComplete="new-password" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Create account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
