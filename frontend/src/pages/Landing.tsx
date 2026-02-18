import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

function useLockBodyScroll(lock: boolean) {
  useEffect(() => {
    if (lock) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [lock]);
}
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Shield, Blocks, ArrowRight, BarChart3, Users, Lock } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, isAuthLoading, login, authError } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useLockBodyScroll(true);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate("/app", { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  const handleConnect = async () => {
    setIsLoggingIn(true);
    try {
      await login();
      navigate("/app", { replace: true });
    } catch {
      // authError set in context
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <Skeleton className="h-12 w-48 mx-auto bg-white/10" />
          <Skeleton className="h-6 w-72 mx-auto bg-white/10" />
          <Skeleton className="h-14 w-full bg-white/10 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/80">
          <div className="h-5 w-5 rounded-full border-2 border-flow border-t-transparent animate-spin" />
          <span>Entering dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-hero relative flex flex-col">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-flow" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-flow/15 rounded-full blur-3xl animate-flow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-success/10 rounded-full blur-3xl" />

      {/* Header */}
      <header className="relative z-10 shrink-0 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-flow flex items-center justify-center shadow-glow">
              <Blocks className="w-4 h-4 text-flow-foreground" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">eSihagBa</span>
              <span className="hidden sm:inline text-white/40 text-sm ml-2">City Budget Tracker</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/transparency"
              className="text-sm font-medium text-flow hover:text-flow/80 transition-colors"
            >
              Public Portal
            </Link>
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-flow animate-glow-pulse" />
              <span className="hidden sm:inline">Powered by Internet Computer</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 min-h-0 flex items-center justify-center px-4 sm:px-6 py-4">
        <div className="w-full max-w-5xl h-full max-h-[calc(100vh-140px)] grid lg:grid-cols-2 gap-6 lg:gap-10 items-center">
          {/* Left: Hero Text */}
          <div className="space-y-4 text-center lg:text-left">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-flow text-sm font-medium backdrop-blur-sm animate-slide-up">
                <Lock className="w-4 h-4" />
                <span>Decentralized & Transparent</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight animate-slide-up" style={{ animationDelay: '100ms' }}>
                Transparent City
                <span className="block text-gradient-flow">Budget Tracking</span>
              </h1>
              <p className="text-lg text-white/60 max-w-lg mx-auto lg:mx-0 animate-slide-up" style={{ animationDelay: '200ms' }}>
                Monitor public spending in real-time. Every transaction recorded immutably on the blockchain for complete accountability.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start animate-slide-up" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm backdrop-blur-sm">
                <BarChart3 className="w-4 h-4 text-accent" />
                <span>Real-time Analytics</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm backdrop-blur-sm">
                <Users className="w-4 h-4 text-success" />
                <span>Citizen Access</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm backdrop-blur-sm">
                <Shield className="w-4 h-4 text-flow" />
                <span>Immutable Records</span>
              </div>
            </div>
          </div>

          {/* Right: Login Card */}
          <div className="animate-slide-up flex justify-center" style={{ animationDelay: '400ms' }}>
            <div className="relative w-full max-w-lg">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-flow rounded-3xl blur-xl opacity-20" />
              
              {/* Card */}
              <div className="relative bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 p-8 space-y-5">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-gradient-flow flex items-center justify-center mx-auto shadow-glow">
                  <Wallet className="w-7 h-7 text-flow-foreground" />
                </div>

                {/* Title */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-white">Connect Your Identity</h2>
                  <p className="text-white/50 text-base">
                    Access the dashboard securely with Internet Identity. No passwords, no tracking.
                  </p>
                </div>

                {/* Security Notice */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-flow/5 border border-flow/20">
                  <Shield className="w-5 h-5 text-flow shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-white/80 font-medium">End-to-end secure</p>
                    <p className="text-white/40">Your private keys never leave your device. Full control, always.</p>
                  </div>
                </div>

                {/* Connect Button */}
                <Button
                  className="w-full h-14 text-base font-semibold rounded-xl bg-flow hover:bg-flow/90 text-flow-foreground shadow-glow transition-all hover:shadow-flow hover:scale-[1.02] active:scale-[0.98]"
                  size="lg"
                  onClick={handleConnect}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <div className="h-5 w-5 rounded-full border-2 border-flow-foreground/30 border-t-flow-foreground animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Connect with Internet Identity</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>

                {authError && (
                  <p className="text-sm text-destructive text-center bg-destructive/10 py-2 px-4 rounded-lg">
                    {authError}
                  </p>
                )}

                {/* Footer */}
                <p className="text-center text-white/30 text-xs">
                  By connecting, you agree to view public budget data transparently.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Stats Bar */}
      <div className="relative z-10 shrink-0 border-t border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-2">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-flow">100%</p>
              <p className="text-[10px] text-white/40">Transparent</p>
            </div>
            <div>
              <p className="text-lg font-bold text-accent">On-Chain</p>
              <p className="text-[10px] text-white/40">Data Storage</p>
            </div>
            <div>
              <p className="text-lg font-bold text-success">Immutable</p>
              <p className="text-[10px] text-white/40">Audit Trail</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
