import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type Role =
  | "innovator"
  | "developer"
  | "investor"
  | "admin"
  | "founder";

export const FOUNDER_EMAILS = [
  "esakkimuthu01447@gmail.com",
  "founderofwaytodream@gmail.com",
];

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  approvalStatus: "pending" | "approved" | "rejected";
}
export function dashboardPathFor(role: Role): string {
  switch (role) {
    case "founder":
      return "/founder/approvals";

    case "admin":
      return "/admin";

    case "developer":
      return "/developer";

    case "investor":
      return "/investor";

    case "innovator":
    default:
      return "/innovator";
  }
}


async function loadUser(
  userId: string,
  email: string | undefined
): Promise<SessionUser | null> {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase
     .from("profiles")
     .select("full_name, email, approval_status")
     .eq("id", userId)
     .maybeSingle(),

    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId),
  ]);

  const userEmail = (
  email ??
  profile?.email ??
  ""
).trim().toLowerCase();

  // Founder emails always get Founder role
  const isFounder = FOUNDER_EMAILS.includes(userEmail);

  const rolesList = (roles ?? []).map(
    (r) => r.role as Role
  );

 const role: Role =
  isFounder
    ? "founder"
    : rolesList.includes("admin")
      ? "admin"
      : rolesList.includes("developer")
        ? "developer"
        : rolesList.includes("investor")
          ? "investor"
          : rolesList.includes("innovator")
            ? "innovator"
            : "innovator";

console.log("AUTH EMAIL:", userEmail);
console.log("DATABASE ROLES:", rolesList);
console.log("FINAL ROLE:", role);

  return {
  id: userId,
  email: userEmail,
  name:
    profile?.full_name ??
    (userEmail.split("@")[0] || "User"),
  role,
  approvalStatus:
    profile?.approval_status ?? "pending",
};
}

export function useAuth(options?: {
  redirectIfUnauthed?: boolean;
  requireRole?: Role;
}) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const handleSession = async (session: any) => {
      if (!mounted) return;

      if (!session) {
        setUser(null);
        setLoading(false);

        if (options?.redirectIfUnauthed) {
          navigate({ to: "/auth" });
        }

        return;
      }

      const u = await loadUser(
        session.user.id,
        session.user.email
      );

      if (!mounted || !u) return;

      setUser(u);
      setLoading(false);

     const isFounder = FOUNDER_EMAILS.includes(
  u.email.trim().toLowerCase()
);

if (isFounder) {
  if (window.location.pathname === "/auth") {
    navigate({
      to: "/founder/approvals",
    });
  }

  return;
}

      // Normal users must be approved.
      // Innovators can enter directly without approval.
 if (
  u.role !== "innovator" &&
  u.approvalStatus !== "approved"
) {
  navigate({ to: "/pending" });
  return;
}

      // Role protection.
      if (
        options?.requireRole &&
        u.role !== options.requireRole &&
        u.role !== "admin"
      ) {
        navigate({
          to: dashboardPathFor(u.role),
        });
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setTimeout(() => {
          handleSession(session);
        }, 0);
      }
    );

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        handleSession(session);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return {
    user,
    loading,
  };
}

export async function signOut() {
  await supabase.auth.signOut();
}
