import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck, LogOut, Clock, XCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { signOut, useAuth, dashboardPathFor } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/pending")({
  head: () => ({
    meta: [{ title: "Awaiting Approval — Way To Dream" }],
  }),
  component: PendingPage,
});

function PendingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth({ redirectIfUnauthed: true, allowPending: true });
  const [reason, setReason] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const redirected = useRef(false);

  const goToDashboard = () => {
    if (redirected.current || !user) return;
    redirected.current = true;
    setApproved(true);
    setTimeout(() => navigate({ to: dashboardPathFor(user.role) }), 2000);
  };

  useEffect(() => {
  if (!user) return;

  // Innovators can access the dashboard without approval.
  if (user.role === "innovator") {
    navigate({ to: dashboardPathFor(user.role) });
    return;
  }
    if (user.approvalStatus === "rejected") {
      supabase.from("profiles").select("rejection_reason").eq("id", user.id).maybeSingle()
        .then(({ data }) => setReason(data?.rejection_reason ?? null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Detect approval without a manual refresh (realtime + polling + tab focus).
  useEffect(() => {
    if (!user || user.approvalStatus === "approved") return;

    const check = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("approval_status")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.approval_status === "approved") {
        // Refresh the auth session so the new status is picked up everywhere.
        await supabase.auth.refreshSession();
        goToDashboard();
      }
    };

    const channel = supabase
      .channel(`profile-approval-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        () => { check(); },
      )
      .subscribe();

    const interval = window.setInterval(check, 5000);
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const logout = async () => {
    await signOut();
    toast.success("Logged out");
    navigate({ to: "/auth" });
  };

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const rejected = user.approvalStatus === "rejected";

  if (approved) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-background via-background to-accent/30 px-4 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-lg sm:p-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-bold sm:text-2xl">Your account has been approved. Redirecting...</h1>
          <Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-background via-background to-accent/30 px-4 sm:px-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-center shadow-lg sm:p-8">
        <div className="flex justify-center"><Logo size={40} to="" /></div>
        <div className="mx-auto mt-6 grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
          {rejected ? <XCircle className="h-7 w-7 text-destructive" /> : <Clock className="h-7 w-7" />}
        </div>
        <h1 className="mt-4 text-xl font-bold sm:text-2xl">
          {rejected ? "Account not approved" : "Account under verification"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {rejected
            ? "Your registration was not approved by the Founder. Please contact support if you believe this is a mistake."
            : "Your account is under verification. Please wait for Founder approval before accessing the platform."}
        </p>
        {rejected && reason && (
          <p className="mt-3 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">Reason: {reason}</p>
        )}

        <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4 text-left text-sm">
          <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{user.name}</span></div>
          <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{user.email}</span></div>
          <div><span className="text-muted-foreground">Requested role:</span> <span className="font-medium capitalize">{user.role}</span></div>
          <div className="mt-1 text-xs uppercase tracking-wide">
            <span className="text-muted-foreground">Status: </span>
            <span className={rejected ? "text-destructive font-semibold" : "text-primary font-semibold"}>
              {user.approvalStatus}
            </span>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" /> Protected by platform NDA
        </div>
        <Button variant="outline" onClick={logout} className="mt-6 gap-2">
          <LogOut className="h-4 w-4" /> Log out
        </Button>
      </div>
    </div>
  );
}
