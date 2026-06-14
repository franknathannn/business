"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Zap, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

// The actual inner auth form component that reads search params
function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // States
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Environment Config Verification (Supabase safe dynamic readout)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock-supabase-url.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-anon-key";

  useEffect(() => {
    // Read search parameters for signup triggers or redirects
    const signupParam = searchParams.get("signup");
    if (signupParam === "true") {
      setIsSignUp(true);
    }
    
    const redirectTo = searchParams.get("redirect");
    if (redirectTo) {
      setRedirectPath(redirectTo);
    }
  }, [searchParams]);

  // Form Validation and submission simulation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    
    // Simulate Supabase API latency
    setTimeout(() => {
      setLoading(false);
      toast.success(isSignUp ? "Account created successfully!" : "Logged in successfully!");
      
      // Perform redirect logic
      if (redirectPath) {
        toast.info(`Redirecting you back to your tool: ${redirectPath.replace(/-/g, " ")}`);
        router.push(`/?tool=${redirectPath}`);
      } else {
        router.push("/dashboard");
      }
    }, 1500);
  };

  // Google Login OAuth representation
  const handleGoogleLogin = () => {
    setSsoLoading(true);
    
    // Mock Supabase OAuth call
    toast.info("Connecting to Google authentication...");
    
    setTimeout(() => {
      setSsoLoading(false);
      toast.success("Successfully authenticated with Google account!");
      
      if (redirectPath) {
        toast.info(`Redirecting you back to your tool: ${redirectPath.replace(/-/g, " ")}`);
        router.push(`/?tool=${redirectPath}`);
      } else {
        router.push("/dashboard");
      }
    }, 1200);
  };

  return (
    <div className="auth-form-wrapper">
      {/* Form Header */}
      <div className="auth-form-header">
        <h1 className="auth-form-title">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="auth-form-subtitle">
          {isSignUp 
            ? "Get started with 15 free generations every month." 
            : "Sign in to access your SellForge dashboard."}
        </p>
      </div>

      {/* Google Sign In */}
      <button 
        type="button" 
        onClick={handleGoogleLogin} 
        disabled={loading || ssoLoading}
        className="btn-google"
      >
        {ssoLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.44 0-6.228-2.788-6.228-6.228 0-3.44 2.788-6.228 6.228-6.228 1.494 0 2.857.527 3.935 1.397l3.102-3.101C18.995 2.121 15.82 1 12.24 1 5.866 1 .7 6.166.7 12.54s5.166 11.54 11.54 11.54c6.643 0 11.028-4.667 11.028-11.233 0-.756-.067-1.332-.206-1.562H12.24z"
            />
          </svg>
        )}
        <span>Continue with Google</span>
      </button>

      {/* Thin line divider */}
      <div className="auth-divider">or continue with email</div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isSignUp && (
          <div className="auth-input-group">
            <label className="auth-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="Sarah Jenkins"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input"
              disabled={loading || ssoLoading}
              required
            />
          </div>
        )}

        <div className="auth-input-group">
          <label className="auth-label" htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="sarah@mystore.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            disabled={loading || ssoLoading}
            required
          />
        </div>

        <div className="auth-input-group">
          <div className="auth-flex-row">
            <label className="auth-label" htmlFor="password">Password</label>
            {!isSignUp && (
              <a href="#" className="auth-link text-xs" onClick={(e) => { e.preventDefault(); toast.info("Password reset email sent (simulation)."); }}>
                Forgot password?
              </a>
            )}
          </div>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            disabled={loading || ssoLoading}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || ssoLoading}
          className="btn-auth-submit mt-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>{isSignUp ? "Create account" : "Log in"}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Bottom Switch Toggle */}
      <div className="auth-bottom-nav">
        {isSignUp ? (
          <span>
            Already have an account?{" "}
            <button 
              type="button" 
              onClick={() => setIsSignUp(false)} 
              className="auth-link bg-transparent border-none cursor-pointer p-0"
            >
              Log in
            </button>
          </span>
        ) : (
          <span>
            Don't have an account?{" "}
            <button 
              type="button" 
              onClick={() => setIsSignUp(true)} 
              className="auth-link bg-transparent border-none cursor-pointer p-0"
            >
              Sign up
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

// Main page exports wrapping inner form in Suspense
export default function AuthPage() {
  return (
    <div className="auth-container">
      {/* Left panel (Dark styling benefits) */}
      <div className="auth-left-panel">
        <div className="auth-left-glow"></div>
        
        {/* Brand Link */}
        <Link href="/" className="auth-brand-logo">
          <Zap className="w-6 h-6 text-purple-500 fill-purple-500" />
          <span>SellForge</span>
        </Link>

        {/* Feature listings */}
        <div className="auth-left-content">
          <h2 className="auth-left-title text-white font-bold leading-tight">
            Supercharge your e-commerce growth.
          </h2>
          <ul className="auth-left-list">
            <li className="auth-left-item">
              <CheckCircle2 className="auth-left-item-icon w-5 h-5" />
              <span>Write premium high-converting product descriptions in seconds.</span>
            </li>
            <li className="auth-left-item">
              <CheckCircle2 className="auth-left-item-icon w-5 h-5" />
              <span>Instantly design beautiful custom brand assets and store names.</span>
            </li>
            <li className="auth-left-item">
              <CheckCircle2 className="auth-left-item-icon w-5 h-5" />
              <span>Optimize Amazon and Etsy keywords to land on the front page.</span>
            </li>
            <li className="auth-left-item">
              <CheckCircle2 className="auth-left-item-icon w-5 h-5" />
              <span>Remove photo backgrounds in a single click for catalog perfection.</span>
            </li>
          </ul>
        </div>

        {/* Footer info */}
        <div className="auth-left-footer">
          <span>Trusted by 2,400+ online sellers globally.</span>
        </div>
      </div>

      {/* Right form panel (White styling contrast) */}
      <div className="auth-right-panel">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <span className="text-gray-500 text-sm">Loading authentications...</span>
          </div>
        }>
          <AuthForm />
        </Suspense>
      </div>
    </div>
  );
}
