import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  Menu,
  LogOut,
  Loader2,
  Mail,
  Award,
  MessageSquare,
  User,
  Camera,
  FolderKanban,
  Plus,
  FileText,
  Crown,
  Star,
  Trophy,
  Users,
  CalendarDays,
  HandCoins,
  Code2,
  UserPlus,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { signOut, useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { usePlan } from "@/lib/premium";
import { PremiumBadge, FeaturedBadge, PriorityBadge } from "@/components/PremiumBadge";

const DIRECTORS = [
  {
    name: "L. Karthikeyan",
    roll: "Board of Director",
    img: "/certs/karthikeyan.png",
  },
  {
    name: "S. Maha Lakshmi",
    roll: "Board of Director",
    img: "/certs/mahalakshmi.png",
  },
  {
    name: "S. Surya",
    roll: "Board of Director",
    img: "/certs/surya.jpeg",
  },
  {
    name: "P. Periyanayagam",
    roll: "Board of Director",
    img: "/certs/periyanayagam.jpeg",
  },
  {
    name: "B. Umaiya Pandi",
    roll: "Technical Director",
    img: "/certs/umaiya.jpeg",
  },
];




const APPLY_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSc91HEo9eq0iPOU3t9RtKxksarjovfJVdGGai1dMC2z92kvEA/viewform?usp=header";



const FOUNDERS = [
  {
    name: "K. EsakkiMuthu",
    roll: "Founder",
    img: "/certs/esakkimuthu.jpeg",
  },
  {
    name: "L. Mareeswaran",
    roll: "Co-Founder",
    img: "/certs/mareeswaran.jpeg",
  },
];

const CONTACTS = [
  { title: "Founder", email: "founder@waytodream.sbs" },
  { title: "Founder", email: "founderofwaytodream@gmail.com" },
  { title: "Co-Founder", email: "cofounderwaytodream@gmail.com" },
  { title: "Customer Service", email: "careofwaytodream@gmail.com" },
];

type Section =
  | "profile"
  | "projects"
  | "leaderboard"
  | "funders"
  | "developers"
  | "club"
  | "competitions"
  | "events"
  | "feedback"
  | "contact";

type ProjectRow = {
  id: string;
  name: string;
  industry: string | null;
  funding_needed: string | null;
  status: string;
  owner_id: string;
  is_priority: boolean;
  is_featured: boolean;
  created_at: string;
};

type ClubLeader = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  college: string;
  department: string;
  created_at: string;
};

type ClubMember = {
  id: string;
  leader_id: string;
  full_name: string;
  email: string;
  college: string;
  department: string;
  created_at: string;
};


export function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth({ redirectIfUnauthed: true });
  const { isPremium } = usePlan(user?.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAd, setShowAd] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("wtd_cert_popup_shown") !== "1";
  });
  useEffect(() => {
    if (!showAd && typeof window !== "undefined") {
      sessionStorage.setItem("wtd_cert_popup_shown", "1");
    }
  }, [showAd]);
  const [section, setSection] = useState<Section>("profile");
  const [industry, setIndustry] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [viewer, setViewer] = useState<{ src: string; name: string } | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [myAccessRequests, setMyAccessRequests] = useState<
  Record<string, string>
>({});
  const fileRef = useRef<HTMLInputElement>(null);
  
  const [clubLeaders, setClubLeaders] = useState<ClubLeader[]>([]);
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [clubLoading, setClubLoading] = useState(false);
  const [savingClub, setSavingClub] = useState(false);
  const [selectedLeader, setSelectedLeader] =
    useState<ClubLeader | null>(null);
  const [showLeaderForm, setShowLeaderForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);

  const [leaderName, setLeaderName] = useState("");
  const [leaderEmail, setLeaderEmail] = useState("");
  const [leaderCollege, setLeaderCollege] = useState("");
  const [leaderDepartment, setLeaderDepartment] = useState("");

  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberCollege, setMemberCollege] = useState("");
  const [memberDepartment, setMemberDepartment] = useState("");

  const isFounder =
    user?.role?.toLowerCase() === "founder" ||
    user?.role?.toLowerCase() === "admin";

  useEffect(() => {
    if (!user || section !== "club") return;

    let cancelled = false;

    const loadClubData = async () => {
      setClubLoading(true);

      try {
        const [leadersResult, membersResult] = await Promise.all([
          supabase
            .from("club_leaders")
            .select(
              "id,user_id,full_name,email,college,department,created_at"
            )
            .order("created_at", { ascending: false }),

          supabase
            .from("club_members")
            .select(
              "id,leader_id,full_name,email,college,department,created_at"
            )
            .order("created_at", { ascending: false }),
        ]);

        if (leadersResult.error) throw leadersResult.error;
        if (membersResult.error) throw membersResult.error;

        if (!cancelled) {
          setClubLeaders((leadersResult.data ?? []) as ClubLeader[]);
          setClubMembers((membersResult.data ?? []) as ClubMember[]);
        }
      } catch (error) {
        console.error("CLUB DATA LOAD ERROR:", error);
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Unable to load club data"
          );
        }
      } finally {
        if (!cancelled) setClubLoading(false);
      }
    };

    void loadClubData();

    return () => {
      cancelled = true;
    };
  }, [user?.id, section]);

  const addClubLeader = async () => {
    if (!isFounder) {
      toast.error("Only the founder can add club leaders.");
      return;
    }

    if (
      !leaderName.trim() ||
      !leaderEmail.trim() ||
      !leaderCollege.trim() ||
      !leaderDepartment.trim()
    ) {
      toast.error("Please fill in all leader details.");
      return;
    }

    setSavingClub(true);

    try {
      const { data, error } = await supabase
        .from("club_leaders")
        .insert({
          full_name: leaderName.trim(),
          email: leaderEmail.trim().toLowerCase(),
          college: leaderCollege.trim(),
          department: leaderDepartment.trim(),
        })
        .select(
          "id,user_id,full_name,email,college,department,created_at"
        )
        .single();

      if (error) throw error;

      setClubLeaders((current) => [data as ClubLeader, ...current]);
      setLeaderName("");
      setLeaderEmail("");
      setLeaderCollege("");
      setLeaderDepartment("");
      setShowLeaderForm(false);

      toast.success("Club leader added successfully.");
    } catch (error) {
      console.error("ADD CLUB LEADER ERROR:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to add club leader"
      );
    } finally {
      setSavingClub(false);
    }
  };
   const addClubMember = async () => {
  if (!user || !selectedLeader) {
    toast.error("Please select a club leader.");
    return;
  }

  // Verify the logged-in user's email using Supabase Auth
  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !authData.user?.email_confirmed_at) {
    toast.error("Please verify your email first.");
    return;
  }

  const loggedInEmail = authData.user.email
    ?.trim()
    .toLowerCase();

  const leaderEmail = selectedLeader.email
    .trim()
    .toLowerCase();

  if (!loggedInEmail || loggedInEmail !== leaderEmail) {
    toast.error("Your verified email is not a Club Leader email.");
    return;
  }

  // Keep your existing member validation and insert code below.


    if (
      !memberName.trim() ||
      !memberEmail.trim() ||
      !memberCollege.trim() ||
      !memberDepartment.trim()
    ) {
      toast.error("Please fill in all member details.");
      return;
    }

    setSavingClub(true);

    try {
      const { data, error } = await supabase
        .from("club_members")
        .insert({
          leader_id: selectedLeader.id,
          full_name: memberName.trim(),
          email: memberEmail.trim().toLowerCase(),
          college: memberCollege.trim(),
          department: memberDepartment.trim(),
        })
        .select(
          "id,leader_id,full_name,email,college,department,created_at"
        )
        .single();

      if (error) throw error;

      setClubMembers((current) => [data as ClubMember, ...current]);
      setMemberName("");
      setMemberEmail("");
      setMemberCollege("");
      setMemberDepartment("");
      setShowMemberForm(false);

      toast.success("Club member enrolled successfully.");
    } catch (error) {
      console.error("ADD CLUB MEMBER ERROR:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to add club member"
      );
    } finally {
      setSavingClub(false);
    }
  };


  useEffect(() => {
  if (!user || section !== "projects") return;

  const loadProjects = async () => {
    setProjectsLoading(true);

    try {
      let query = supabase
        .from("data")
        .select(
          "id,name,industry,funding_needed,status,owner_id,is_priority,created_at"
        )
        .order("is_priority", { ascending: false })
        .order("created_at", { ascending: false });

      // Innovator → only their own projects
      if (user.role === "innovator") {
        query = query.eq("owner_id", user.id);
      }

      const { data, error } = await query;

   console.log("DEVELOPER PROJECT DATA:", data);
   console.log("DEVELOPER PROJECT ERROR:", error);

if (error) {
  console.error("PROJECT FETCH ERROR:", error);
  throw error;
}

      const formattedProjects: ProjectRow[] = (data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        industry: p.industry,
        funding_needed: p.funding_needed,
        status: p.status,
        owner_id: p.owner_id,
        is_priority: p.is_priority ?? false,
        is_featured: false,
        created_at: p.created_at,
      }));

      setProjects(formattedProjects);
    } catch (error) {
      console.error("LOAD PROJECTS ERROR:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load projects"
      );
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  loadProjects();
}, [user, section]);
  useEffect(() => {
  if (!user || user.role !== "developer" || section !== "projects") {
    return;
  }

  const loadMyAccessRequests = async () => {
    const { data, error } = await supabase
      .from("project_access_requests")
      .select("project_id, status")
      .eq("developer_id", user.id);

    if (error) {
      console.error("MY ACCESS REQUESTS ERROR:", error);
      return;
    }

    const statusMap: Record<string, string> = {};

    (data ?? []).forEach((request) => {
      statusMap[String(request.project_id)] = request.status;
    });

    console.log("MY ACCESS STATUS:", statusMap);

    setMyAccessRequests(statusMap);
  };

  // Load immediately
  loadMyAccessRequests();

  // Check again every 3 seconds
  const interval = setInterval(() => {
    loadMyAccessRequests();
  }, 3000);

  return () => {
    clearInterval(interval);
  };
}, [user, section]);
useEffect(() => {
  if (!user || user.role !== "innovator" || section !== "projects") return;

  const loadAccessRequests = async () => {
    setRequestsLoading(true);

    try {
      const { data, error } = await supabase
        .from("project_access_requests")
        .select(`
          id,
          project_id,
          developer_id,
          status,
          created_at,
          data:project_id (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAccessRequests(data ?? []);
    } catch (error) {
      console.error("ACCESS REQUEST LOAD ERROR:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load access requests"
      );
    } finally {
      setRequestsLoading(false);
    }
  };

  loadAccessRequests();
}, [user, section]);
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("industry, avatar_url").eq("id", user.id).maybeSingle()
      .then(async ({ data }) => {
        setIndustry(data?.industry ?? "");
        const path = data?.avatar_url ?? null;
        setAvatarPath(path);
        if (path) {
          const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
          if (signed?.signedUrl) setAvatarUrl(signed.signedUrl);
        }
      });
  }, [user]);
  
useEffect(() => {
  if (!user || user.role?.toLowerCase() !== "developer") return;

  let cancelled = false;

  const checkProfile = async () => {
    const { data, error } = await supabase
      .from("developer_profiles")
      .select(
        "full_name, skills, experience_level, bio, github_url, portfolio_url"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (cancelled) return;

    if (error) {
      console.error("DEVELOPER PROFILE CHECK ERROR:", error);
      toast.error("Unable to check developer profile.");
      return;
    }

    const complete =
      !!data?.full_name?.trim() &&
      Array.isArray(data?.skills) &&
      data.skills.some((skill) => skill.trim().length > 0) &&
      !!data?.experience_level?.trim() &&
      !!data?.bio?.trim() &&
      !!data?.github_url?.trim() &&
      !!data?.portfolio_url?.trim();

    if (!complete) {
      setSection("developers");
    }
  };

  void checkProfile();

  return () => {
    cancelled = true;
  };
}, [user?.id, user?.role]);


  const logout = async () => {
    await signOut();
    toast.success("Logged out");
    navigate({ to: "/auth" });
  };

  const saveIndustry = async (val: string) => {
    setIndustry(val);
    if (!user) return;
    await supabase.from("profiles").update({ industry: val }).eq("id", user.id);
  };

  const onPickAvatar = () => fileRef.current?.click();

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please pick an image"); return; }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
      if (updErr) throw updErr;
      if (avatarPath) await supabase.storage.from("avatars").remove([avatarPath]);
      const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
      setAvatarPath(path);
      setAvatarUrl(signed?.signedUrl ?? null);
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  };
const updateAccessRequest = async (
  requestId: number,
  status: "approved" | "rejected"
) => {
  const { error } = await supabase
    .from("project_access_requests")
    .update({ status })
    .eq("id", requestId);

  if (error) {
    console.error("ACCESS REQUEST UPDATE ERROR:", error);
    toast.error(error.message);
    return;
  }

  setAccessRequests((current) =>
    current.map((request) =>
      request.id === requestId
        ? { ...request, status }
        : request
    )
  );

  toast.success(
    status === "approved"
      ? "Developer access approved!"
      : "Developer access rejected."
  );
};
  const submitFeedback = async () => {
    if (!feedback.trim() || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({ user_id: user.id, message: feedback.trim() });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setFeedback("");
    toast.success("Thanks for your feedback!");
  };

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const navItems: { id: Section; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },

  { id: "club", label: "Club Members and Leaders", icon: Users },
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "funders", label: "Funders", icon: HandCoins },
  { id: "competitions", label: "Competitions", icon: Award },
  { id: "developers", label: "Developers", icon: Code2 },

  { id: "feedback", label: "Feedback", icon: MessageSquare },
  { id: "contact", label: "Contact", icon: Mail },
];

  const AvatarCircle = ({ size = 64, clickable = false }: { size?: number; clickable?: boolean }) => (
    <button
      type="button"
      onClick={clickable ? onPickAvatar : undefined}
      disabled={!clickable || uploadingAvatar}
      className={`relative grid place-items-center overflow-hidden rounded-full bg-primary/10 text-primary font-bold ${clickable ? "cursor-pointer ring-2 ring-transparent hover:ring-primary/40" : ""}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-label={clickable ? "Change profile picture" : undefined}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
      ) : (
        <span>{user.name.charAt(0).toUpperCase()}</span>
      )}
      {clickable && (
        <span className="absolute inset-x-0 bottom-0 flex h-1/3 items-center justify-center bg-black/50 text-white">
          {uploadingAvatar ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
        </span>
      )}
    </button>
  );


const SidebarBody = (
  <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4">
    <div className="shrink-0 rounded-xl border border-border bg-card p-4 text-center">
      <div className="mx-auto h-16 w-16">
        <AvatarCircle size={64} />
      </div>
      <div className="mt-2 font-semibold">{user.name}</div>
      <div className="text-xs text-muted-foreground">
        {industry || "Industry not set"}
      </div>
    </div>

    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
      {navItems.map((n) => {
        const Icon = n.icon;
        const active = section === n.id;

        return (
          <button
            key={n.id}
            onClick={() => {
              setSection(n.id);
              setMenuOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {n.label}
          </button>
        );
      })}
    </nav>

    <Button
      variant="outline"
      className="w-full shrink-0 gap-2"
      onClick={logout}
    >
      <LogOut className="h-4 w-4" />
      Log out
    </Button>
  </div>
);


  return (
    <div className="min-h-screen bg-muted/30">
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatarChange} />

      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-20 items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
            <Logo size={40} showText={false} to="" />
            <div>
              <h1 className="text-lg font-bold leading-tight text-foreground sm:text-xl">
                Way To <span className="text-primary">Dream</span>
              </h1>
              <p className="text-[11px] tracking-wide text-muted-foreground sm:text-xs">
                Innovate · Inspire · Achieve
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPremium && <PremiumBadge className="hidden sm:inline-flex" />}
            {(user.role === "founder" || user.role === "admin") && (
              <Link to="/founder/approvals" className="hidden sm:inline-flex">
                <Button variant="outline" size="sm" className="gap-1">Approvals</Button>
              </Link>
            )}
            <Link to="/premium" className="hidden sm:inline-flex">
              <Button variant={isPremium ? "outline" : "default"} size="sm" className="gap-1">
                <Crown className="h-4 w-4" /> {isPremium ? "Premium" : "Upgrade"}
              </Button>
            </Link>
            <div className="hidden sm:block"><AvatarCircle size={36} /></div>
            <Button variant="ghost" size="sm" onClick={logout} className="hidden gap-2 sm:flex">
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </div>
        </div>
      </header>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="h-dvh w-72 overflow-hidden p-0">
          <SheetHeader className="border-b border-border p-4">
            <SheetTitle>
              <Logo size={32} />
            </SheetTitle>
          </SheetHeader>
          {SidebarBody}
        </SheetContent>
      </Sheet>

      <main className="container mx-auto px-4 py-8">
        {section === "profile" && (
          <section>
            <h2 className="mb-6 text-2xl font-bold">Profile</h2>
            <div className="max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <AvatarCircle size={80} clickable />
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-semibold">{user.name}</div>
                    {isPremium && <PremiumBadge />}
                  </div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="mt-1 text-xs capitalize text-primary">{user.role}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Plan: <span className="font-medium text-foreground">{isPremium ? "Premium" : "Free"}</span></div>
                  {industry && <div className="mt-1 text-xs text-muted-foreground">Industry: <span className="font-medium text-foreground">{industry}</span></div>}
                </div>
              </div>
              {!isPremium && (
                <Link to="/premium" className="mt-4 block">
                  <Button className="w-full gap-2"><Crown className="h-4 w-4" /> Upgrade to Premium</Button>
                </Link>
              )}
              <p className="mt-3 text-xs text-muted-foreground">Tap the photo to change your profile picture.</p>
              <div className="mt-6">
                <label className="mb-1 block text-sm font-medium">Industry</label>
                <Input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  onBlur={(e) => saveIndustry(e.target.value)}
                  placeholder="e.g. FinTech, AgriTech, Healthcare"
                />
              </div>
            </div>
          </section>
        )}

        {section === "projects" && (
          <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">{user.role === "innovator" ? "My projects" : "Projects"}</h2>
                <p className="text-sm text-muted-foreground">
                  {user.role === "innovator" ? "Manage your ideas, teams and investor requests" : "Browse public summaries. Request access for protected documents."}
                </p>
              </div>
              {user.role === "innovator" && (
                <Link to="/project/new"><Button className="gap-2"><Plus className="h-4 w-4" /> Upload new idea</Button></Link>
              )}
            </div>
            {user.role === "innovator" && (
  <section className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
    <div className="mb-4">
      <h3 className="text-lg font-semibold">
        Developer Access Requests
      </h3>

      <p className="text-sm text-muted-foreground">
        Review developers requesting access to your projects.
      </p>
    </div>

    {requestsLoading ? (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading requests...
      </div>
    ) : accessRequests.length === 0 ? (
      <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
        No developer access requests yet.
      </div>
    ) : (
      <div className="space-y-3">
        {accessRequests.map((request) => (
          <div
            key={request.id}
            className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="font-medium">
                {request.data?.name ?? "Project"}
              </div>

              <div className="mt-1 text-xs text-muted-foreground">
                Developer ID: {request.developer_id}
              </div>

              <div className="mt-1 text-xs">
                Status:{" "}
                <span className="font-semibold capitalize">
                  {request.status}
                </span>
              </div>
            </div>

            {request.status === "pending" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    updateAccessRequest(request.id, "approved")
                  }
                >
                  Approve
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    updateAccessRequest(request.id, "rejected")
                  }
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </section>
)}
            {projectsLoading ? (
              <div className="grid place-items-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                {user.role === "innovator" ? "No projects yet. Click \"Upload new idea\" to get started." : "No projects published yet."}
              </div>
            ) : (
              <>
                {(user.role === "admin" || user.role === "founder") && projects.some((p) => p.is_priority) && (
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-red-500">
                    <Star className="h-4 w-4" /> Priority Review Projects
                  </h3>
                )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                {projects.map((p) => (
  <div
    key={p.id}
    className={`group rounded-xl border bg-card p-5 shadow-sm transition hover:shadow-md ${
      p.is_featured
        ? "border-primary"
        : "border-border hover:border-primary"
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="font-semibold text-foreground group-hover:text-primary">
        {p.name}
      </div>

      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">
        {p.status}
      </span>
    </div>

    <div className="mt-2 flex flex-wrap gap-1">
      {p.is_priority && <PriorityBadge />}
      {p.is_featured && <FeaturedBadge />}
    </div>

    {p.industry && (
      <div className="mt-2 text-xs text-muted-foreground">
        {p.industry}
      </div>
    )}

    {p.funding_needed && (
      <div className="mt-3 text-sm">
        Funding goal:{" "}
        <span className="font-medium">{p.funding_needed}</span>
      </div>
    )}

    <div className="mt-4">
      {user.role === "developer" ? (
  myAccessRequests[String(p.id)] === "approved" ? (
    <Link
      to="/project/$id"
      params={{ id: p.id }}
      className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
    >
      <FileText className="mr-2 h-4 w-4" />
      Open Workspace
    </Link>
  ) : myAccessRequests[String(p.id)] === "pending" ? (
    <Button size="sm" variant="secondary" disabled>
      Request Pending
    </Button>
  ) : myAccessRequests[String(p.id)] === "rejected" ? (
    <Button size="sm" variant="destructive" disabled>
      Request Rejected
    </Button>
  ) : (
    <Button
      size="sm"
      onClick={async () => {
        const { error } = await supabase
          .from("project_access_requests")
          .insert({
            project_id: p.id,
            developer_id: user.id,
          });

        if (error) {
          console.error("ACCESS REQUEST ERROR:", error);
          toast.error(error.message);
          return;
        }

        setMyAccessRequests((current) => ({
          ...current,
          [String(p.id)]: "pending",
        }));

        toast.success("Access request sent successfully!");
      }}
    >
      Request Access
    </Button>
  )
) : (
        <Link
          to="/project/$id"
          params={{ id: p.id }}
          className="inline-flex items-center gap-1 text-xs text-primary"
        >
          <FileText className="h-3 w-3" />
          Open workspace →
        </Link>
      )}
    </div>
  </div>
))}
                
              </div>
              </>
            )}
          </section>
        )}

        {section === "leaderboard" && <Leaderboard />}
      
{section === "club" && (
  <section>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold">
          Club Leaders Directory
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse club leaders and view their enrolled members.
        </p>
      </div>

      {isFounder && (
        <Button
          className="gap-2"
          onClick={() => {
            setSelectedLeader(null);
            setShowLeaderForm((value) => !value);
          }}
        >
          <UserPlus className="h-4 w-4" />
          Add Club Leader
        </Button>
      )}
    </div>

    {isFounder && showLeaderForm && (
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-lg font-semibold">
          New Club Leader
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Leader full name"
            value={leaderName}
            onChange={(e) => setLeaderName(e.target.value)}
          />
          <Input
            type="email"
            placeholder="Leader email"
            value={leaderEmail}
            onChange={(e) => setLeaderEmail(e.target.value)}
          />
          <Input
            placeholder="College name"
            value={leaderCollege}
            onChange={(e) => setLeaderCollege(e.target.value)}
          />
          <Input
            placeholder="Department"
            value={leaderDepartment}
            onChange={(e) => setLeaderDepartment(e.target.value)}
          />
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={addClubLeader} disabled={savingClub}>
            {savingClub ? "Saving..." : "Save Club Leader"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowLeaderForm(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    )}

    {clubLoading ? (
      <div className="flex items-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading club leaders...
      </div>
    ) : (
      <>
        {clubLeaders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No club leaders added yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubLeaders.map((leader) => (
              <button
                type="button"
                key={leader.id}
                onClick={() => {
                  setSelectedLeader(leader);
                  setShowMemberForm(false);
                }}
                className={`rounded-xl border bg-card p-5 text-left transition hover:border-primary hover:shadow-md ${
                  selectedLeader?.id === leader.id
                    ? "border-primary ring-1 ring-primary"
                    : "border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <BadgeCheck className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold">{leader.full_name}</div>
                    <div className="break-all text-xs text-muted-foreground">
                      {leader.email}
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-sm">
                  <div>{leader.college}</div>
                  <div className="text-xs text-muted-foreground">
                    {leader.department}
                  </div>
                  <div className="mt-3 text-xs font-medium text-primary">
                    {clubMembers.filter(
                      (member) => member.leader_id === leader.id
                    ).length}{" "}
                    enrolled members · View profile →
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </>
    )}

    {selectedLeader && (
      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold">
              {selectedLeader.full_name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedLeader.college} · {selectedLeader.department}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedLeader.email}
            </p>
          </div>

          {user.email &&
  user.email.trim().toLowerCase() ===
    selectedLeader.email.trim().toLowerCase() && (
      <Button
        className="gap-2"
        onClick={async () => {
          const { data, error } = await supabase.auth.getUser();

          if (
            error ||
            !data.user?.email_confirmed_at ||
            data.user.email?.trim().toLowerCase() !==
              selectedLeader.email.trim().toLowerCase()
          ) {
            toast.error(
              "Please verify the Club Leader email before adding members."
            );
            return;
          }

          setShowMemberForm((value) => !value);
        }}
      >
        <UserPlus className="h-4 w-4" />
        Add Members
      </Button>
    )}

         {showMemberForm &&
  user.email?.trim().toLowerCase() ===
    selectedLeader.email.trim().toLowerCase() && (
            <div className="mt-5 rounded-lg border p-4">
              <h4 className="mb-3 font-semibold">Enroll a Member</h4>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="Member full name"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                />
                <Input
                  type="email"
                  placeholder="Member email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                />
                <Input
                  placeholder="College name"
                  value={memberCollege}
                  onChange={(e) => setMemberCollege(e.target.value)}
                />
                <Input
                  placeholder="Department"
                  value={memberDepartment}
                  onChange={(e) => setMemberDepartment(e.target.value)}
                />
              </div>

              <Button
                className="mt-4"
                onClick={addClubMember}
                disabled={savingClub}
              >
                {savingClub ? "Saving..." : "Enroll Member"}
              </Button>
            </div>
          )}

        <div className="mt-6">
          <h4 className="mb-3 font-semibold">
            Enrolled Club Members
          </h4>

          {clubMembers.filter(
            (member) => member.leader_id === selectedLeader.id
          ).length === 0 ? (
            <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
              No members enrolled under this leader yet.
            </p>
          ) : (
            <div className="space-y-3">
              {clubMembers
                .filter(
                  (member) => member.leader_id === selectedLeader.id
                )
                .map((member) => (
                  <div
                    key={member.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="font-medium">{member.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {member.email}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {member.college} · {member.department}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    )}
  </section>
)}


{section === "events" && (
  <section>
    <h2 className="mb-6 text-2xl font-bold">Events</h2>
    <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
      Events page will be implemented in the next step.
    </div>
  </section>
)}

{section === "funders" && (
  <section>
    <h2 className="mb-6 text-2xl font-bold">Funders</h2>
    <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
      Funders page will be implemented in the next step.
    </div>
  </section>
)}

{section === "competitions" && (
  <section>
    <h2 className="mb-6 text-2xl font-bold">Competitions</h2>
    <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
      Competitions page will be implemented in the next step.
    </div>
  </section>
)}

{section === "developers" && (
  <DevelopersSection
    currentUser={{
      id: user.id,
      name: user.name,
      role: user.role,
    }}
  />
)}
        {section === "directors" && <CertGrid title="Directors" items={DIRECTORS} onOpen={setViewer} />}
        {section === "founders" && <CertGrid title="Founders" items={FOUNDERS} onOpen={setViewer} />}

        {section === "feedback" && (
          <section className="max-w-2xl">
            <h2 className="mb-6 text-2xl font-bold">Feedback</h2>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <label className="mb-2 block text-sm font-medium">Share your thoughts</label>
              <Textarea rows={6} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Tell us what's working and what we can improve..." />
              <Button className="mt-4" onClick={submitFeedback} disabled={submitting || !feedback.trim()}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit feedback"}
              </Button>
            </div>
          </section>
        )}

        {section === "contact" && (
          <section className="max-w-xl">
            <h2 className="mb-6 text-2xl font-bold">Contact Details</h2>
            <div className="space-y-3">
              {CONTACTS.map((c) => (
                <a
                  key={c.email}
                  href={`mailto:${c.email}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-primary">{c.title}</div>
                    <div className="font-medium text-foreground">{c.email}</div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border bg-background py-6">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground md:flex-row">
          <Logo size={28} />
          <span>© {new Date().getFullYear()} Way To Dream · Innovate · Inspire · Achieve</span>
        </div>
      </footer>

      <Dialog open={showAd} onOpenChange={setShowAd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">APPLY FOR CERTIFICATE</DialogTitle>
            <DialogDescription className="text-base text-foreground/80">
              Applications are open now. Certificates will be issued after 30 days. Apply today.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setShowAd(false)}>Later</Button>
            <Button asChild>
              <a href={APPLY_FORM_URL} target="_blank" rel="noopener noreferrer" onClick={() => setShowAd(false)}>
                Apply Now
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Certificate viewer */}
      <Dialog open={!!viewer} onOpenChange={(o) => !o && setViewer(null)}>
        <DialogContent className="max-w-5xl p-2 sm:p-4">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{viewer?.name}</DialogTitle>
          </DialogHeader>
          {viewer && (
            <div className="overflow-auto">
              <img src={viewer.src} alt={viewer.name} className="mx-auto h-auto max-h-[80vh] w-full object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
        
type DeveloperProfileRow = {
  id: string;
  full_name: string | null;
  skills: string[];
  experience_level: string | null;
  bio: string | null;
  portfolio_url: string | null;
  github_url: string | null;
};

type CollaborationRow = {
  id: string;
  innovator_id: string;
  developer_id: string;
  project_id: number | null;
  message: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

type ChatMessageRow = {
  id: string;
  collaboration_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

function DevelopersSection({
  currentUser,
}: {
  currentUser: { id: string; name: string; role: string };
}) {
  const role = currentUser.role.toLowerCase();
  const isDeveloper = role === "developer";
  const isInnovator = role === "innovator";

  const [profiles, setProfiles] = useState<DeveloperProfileRow[]>([]);
  const [requests, setRequests] = useState<CollaborationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState(currentUser.name ?? "");
  const [skillsText, setSkillsText] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  const [activeChat, setActiveChat] =
    useState<CollaborationRow | null>(null);
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  useEffect(() => {
  if (!activeChat?.id) return;

  const channel = supabase
    .channel(`chat-${activeChat.id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `collaboration_id=eq.${activeChat.id}`,
      },
      (payload) => {
        const newMessage = payload.new as ChatMessageRow;

        setMessages((current) => {
          if (current.some((item) => item.id === newMessage.id)) {
            return current;
          }

          return [...current, newMessage];
        });
      }
    )
    .subscribe((status) => {
      console.log("Chat realtime status:", status);
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}, [activeChat?.id]);

  const loadData = async () => {
    setLoading(true);

    try {
      const { data: developerRows, error: developerError } =
        await supabase
          .from("developer_profiles")
          .select(
            "id,full_name,skills,experience_level,bio,portfolio_url,github_url"
          )
          .order("created_at", { ascending: false });

      if (developerError) throw developerError;

      const list = (developerRows ?? []) as DeveloperProfileRow[];
      setProfiles(list);

      const mine = list.find((item) => item.id === currentUser.id);

      if (mine) {
        setFullName(mine.full_name ?? currentUser.name ?? "");
        setSkillsText((mine.skills ?? []).join(", "));
        setExperience(mine.experience_level ?? "");
        setBio(mine.bio ?? "");
        setPortfolioUrl(mine.portfolio_url ?? "");
        setGithubUrl(mine.github_url ?? "");
      }

      const { data: requestRows, error: requestError } =
        await supabase
          .from("collaboration_requests")
          .select("*")
          .order("created_at", { ascending: false });

      if (requestError) throw requestError;

      setRequests((requestRows ?? []) as CollaborationRow[]);
    } catch (error) {
      console.error("DEVELOPER SECTION LOAD ERROR:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not load developer details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [currentUser.id]);
  useEffect(() => {
  if (!activeChat) return;

  const channel = supabase
    .channel(`collaboration-chat-${activeChat.id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `collaboration_id=eq.${activeChat.id}`,
      },
      (payload) => {
        const incoming = payload.new as ChatMessageRow;

        setMessages((current) => {
          if (current.some((message) => message.id === incoming.id)) {
            return current;
          }

          return [...current, incoming].sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );
        });
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}, [activeChat?.id]);

  
const saveDeveloperProfile = async () => {
  // First, declare skills before using it
  const skills = skillsText
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  // Validate all required fields
  if (
    !fullName.trim() ||
    skills.length === 0 ||
    !experience.trim() ||
    !bio.trim() ||
    !githubUrl.trim() ||
    !portfolioUrl.trim()
  ) {
    toast.error("Please complete all required profile fields.");
    return;
  }

  setSaving(true);

  try {
    const { error } = await supabase
      .from("developer_profiles")
      .upsert(
        {
          id: currentUser.id,
          full_name: fullName.trim(),
          skills,
          experience_level: experience.trim(),
          bio: bio.trim(),
          github_url: githubUrl.trim(),
          portfolio_url: portfolioUrl.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) throw error;

    toast.success("Developer profile saved.");
    await loadData();
  } catch (error) {
    console.error("SAVE DEVELOPER PROFILE ERROR:", error);
    toast.error(
      error instanceof Error
        ? error.message
        : "Could not save developer profile"
    );
  } finally {
    setSaving(false);
  }
};


  const sendCollaborationRequest = async (developerId: string) => {
    if (!isInnovator) {
      toast.error("Only innovators can send collaboration requests.");
      return;
    }

    if (developerId === currentUser.id) {
      toast.error("You cannot send a request to yourself.");
      return;
    }

    const alreadySent = requests.some(
      (request) =>
        request.innovator_id === currentUser.id &&
        request.developer_id === developerId
    );

    if (alreadySent) {
      toast.error("You have already sent a request to this developer.");
      return;
    }

    const { data, error } = await supabase
      .from("collaboration_requests")
      .insert({
        innovator_id: currentUser.id,
        developer_id: developerId,
        project_id: null,
        message: requestMessage.trim() || null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("COLLABORATION REQUEST ERROR:", error);
      toast.error(error.message);
      return;
    }

    setRequests((current) => [
      data as CollaborationRow,
      ...current,
    ]);
    setRequestMessage("");
    toast.success("Collaboration request sent.");
  };

  const respondToRequest = async (
    request: CollaborationRow,
    status: "accepted" | "rejected"
  ) => {
    if (request.developer_id !== currentUser.id || !isDeveloper) {
      toast.error("Only the requested developer can respond.");
      return;
    }

    const { error } = await supabase
      .from("collaboration_requests")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.id)
      .eq("developer_id", currentUser.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setRequests((current) =>
      current.map((item) =>
        item.id === request.id ? { ...item, status } : item
      )
    );

    if (status === "accepted") {
      toast.success("Request accepted. Private chat is now available.");
    } else {
      toast.success("Collaboration request rejected.");
    }
  };

  const openChat = async (request: CollaborationRow) => {
    if (
      request.status !== "accepted" ||
      (request.innovator_id !== currentUser.id &&
        request.developer_id !== currentUser.id)
    ) {
      toast.error("Chat is available only to accepted participants.");
      return;
    }

    setActiveChat(request);
    setChatLoading(true);

    const { data, error } = await supabase
      .from("messages")
      .select("id,collaboration_id,sender_id,message,created_at")
      .eq("collaboration_id", request.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("CHAT LOAD ERROR:", error);
      toast.error(error.message);
      setMessages([]);
    } else {
      setMessages((data ?? []) as ChatMessageRow[]);
    }

    setChatLoading(false);
  };

  const sendChatMessage = async () => {
    const message = chatText.trim();

    if (!message || !activeChat || sendingMessage) return;

    if (
      activeChat.status !== "accepted" ||
      (activeChat.innovator_id !== currentUser.id &&
        activeChat.developer_id !== currentUser.id)
    ) {
      toast.error("You do not have permission to send this message.");
      return;
    }

    setSendingMessage(true);

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          collaboration_id: activeChat.id,
          sender_id: currentUser.id,
          message,
        })
        .select("id,collaboration_id,sender_id,message,created_at")
        .single();

      if (error) throw error;

      setMessages((current) => [
        ...current,
        data as ChatMessageRow,
      ]);
      setChatText("");
    } catch (error) {
      console.error("SEND CHAT MESSAGE ERROR:", error);
      toast.error(
        error instanceof Error ? error.message : "Message could not be sent"
      );
    } finally {
      setSendingMessage(false);
    }
  };

  const myRequests = requests.filter(
    (request) => request.innovator_id === currentUser.id
  );

  const incomingRequests = requests.filter(
    (request) => request.developer_id === currentUser.id
  );

  const acceptedChats = requests.filter(
    (request) =>
      request.status === "accepted" &&
      (request.innovator_id === currentUser.id ||
        request.developer_id === currentUser.id)
  );

  const getDeveloperName = (id: string) =>
    profiles.find((profile) => profile.id === id)?.full_name ??
    "Developer";

  if (loading) {
    return (
      <div className="grid place-items-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Developers</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover developer skills and collaborate on ideas.
        </p>
      </div>

      {isDeveloper && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">
            My Developer Profile
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Full name
              </label>
              <Input
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Skills
              </label>
              <Input
                required
                value={skillsText}
                onChange={(event) => setSkillsText(event.target.value)}
                placeholder="Java, Python, React, SQL"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Separate skills with commas.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Experience level
              </label>
              <Input
                required
                value={experience}
                onChange={(event) => setExperience(event.target.value)}
                placeholder="Beginner, Intermediate, Experienced"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                GitHub URL
              </label>
              <Input
                required
                value={githubUrl}
                onChange={(event) => setGithubUrl(event.target.value)}
                placeholder="https://github.com/username"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Portfolio URL
              </label>
              <Input
                required
                value={portfolioUrl}
                onChange={(event) => setPortfolioUrl(event.target.value)}
                placeholder="https://your-portfolio.com"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                About me
              </label>
              <Textarea
                rows={4}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Describe your skills and the projects you can help build."
              />
            </div>
          </div>

          <Button
            className="mt-4"
            onClick={saveDeveloperProfile}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save Developer Profile
          </Button>
        </div>
      )}

      {isInnovator && (
        <div className="rounded-xl border border-border bg-card p-5">
          <label className="mb-2 block text-sm font-medium">
            Message to developers (optional)
          </label>
          <Textarea
            rows={3}
            value={requestMessage}
            onChange={(event) => setRequestMessage(event.target.value)}
            placeholder="Explain your idea and how you would like to collaborate."
          />
        </div>
      )}

      <div>
        <h3 className="mb-4 text-lg font-semibold">Available Developers</h3>

        {profiles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No developer profiles yet. Developers can add their details above.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <h4 className="text-lg font-semibold">
                  {profile.full_name || "Developer"}
                </h4>

                <p className="mt-1 text-sm text-muted-foreground">
                  {profile.experience_level || "Experience not specified"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(profile.skills ?? []).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {profile.bio && (
                  <p className="mt-3 whitespace-pre-wrap text-sm">
                    {profile.bio}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  {profile.github_url && (
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      GitHub
                    </a>
                  )}
                  {profile.portfolio_url && (
                    <a
                      href={profile.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      Portfolio
                    </a>
                  )}
                </div>

                {isInnovator &&
                  profile.id !== currentUser.id && (
                    <Button
                      className="mt-4"
                      onClick={() =>
                        sendCollaborationRequest(profile.id)
                      }
                      disabled={requests.some(
                        (request) =>
                          request.innovator_id === currentUser.id &&
                          request.developer_id === profile.id
                      )}
                    >
                      {requests.some(
                        (request) =>
                          request.innovator_id === currentUser.id &&
                          request.developer_id === profile.id
                      )
                        ? "Request Already Sent"
                        : "Request Collaboration"}
                    </Button>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isInnovator && (
        <div>
          <h3 className="mb-3 text-lg font-semibold">My Requests</h3>
          {myRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You have not sent any collaboration requests.
            </p>
          ) : (
            <div className="space-y-3">
              {myRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <div>
                    <p className="font-medium">
                      {getDeveloperName(request.developer_id)}
                    </p>
                    {request.message && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {request.message}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-medium capitalize">
                    {request.status}
                  </span>
                  {request.status === "accepted" && (
                    <Button
                      size="sm"
                      onClick={() => void openChat(request)}
                    >
                      Open Private Chat
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isDeveloper && (
        <div>
          <h3 className="mb-3 text-lg font-semibold">
            Incoming Collaboration Requests
          </h3>

          {incomingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You have no collaboration requests yet.
            </p>
          ) : (
            <div className="space-y-3">
              {incomingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <div>
                    <p className="font-medium">Innovator request</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Innovator ID: {request.innovator_id}
                    </p>
                    {request.message && (
                      <p className="mt-2 text-sm">{request.message}</p>
                    )}
                    <p className="mt-1 text-sm capitalize">
                      Status: {request.status}
                    </p>
                  </div>

                  {request.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          void respondToRequest(request, "accepted")
                        }
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          void respondToRequest(request, "rejected")
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  )}

                  {request.status === "accepted" && (
                    <Button
                      size="sm"
                      onClick={() => void openChat(request)}
                    >
                      Open Private Chat
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {acceptedChats.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold">Accepted Collaborations</h3>
          <div className="space-y-2">
            {acceptedChats.map((request) => (
              <div
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <span className="text-sm">
                  Private collaboration · {request.id.slice(0, 8)}
                </span>
                <Button size="sm" onClick={() => void openChat(request)}>
                  Open Chat
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeChat && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Private Chat</h3>
              <p className="text-xs text-muted-foreground">
                Only the two collaboration participants can access this chat.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveChat(null);
                setMessages([]);
              }}
            >
              Close Chat
            </Button>
          </div>

          <div className="mb-4 max-h-80 space-y-3 overflow-y-auto rounded-lg bg-muted/40 p-3">
            {chatLoading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            ) : messages.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No messages yet. Start the conversation.
              </p>
            ) : (
              messages.map((message) => {
                const mine = message.sender_id === currentUser.id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                        mine
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-card"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {message.message}
                      </p>
                      <p className="mt-1 text-[10px] opacity-70">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Textarea
              rows={2}
              value={chatText}
              onChange={(event) => setChatText(event.target.value)}
              placeholder="Type a message..."
            />
            <Button
              onClick={() => void sendChatMessage()}
              disabled={sendingMessage || !chatText.trim()}
            >
              {sendingMessage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Send"
              )}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}


function CertGrid({
  title,
  items,
  onOpen,
}: {
  title: string;
  items: { name: string; roll: string; img: string }[];
  onOpen: (v: { src: string; name: string }) => void;
}) {
  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold">{title}</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {items.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => onOpen({ src: c.img, name: c.name })}
            className="group overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <div className="aspect-[16/10] overflow-hidden bg-muted">
              <img src={c.img} alt={`${c.name} certificate`} className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
            </div>
            <div className="p-4 text-center">
              <div className="text-base font-bold text-foreground">{c.name}</div>
              <div className="mt-1 text-sm font-semibold text-primary">{c.roll}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">Click to view certificate</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

type LbRow = {
  owner_id: string;
  name: string;
  avatar_url: string | null;
  projects: number;
  total: number;
  avg: number;
  best: string;
};

function Leaderboard() {
  const [rows, setRows] = useState<LbRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: projects } = await supabase
      .from("data")
      .select("id,name,owner_id,ai_analysis")
      .not("ai_analysis", "is", null);
    const list = (projects ?? []) as Array<{ id: string; name: string; owner_id: string; ai_analysis: { market_potential?: number; innovation?: number; startup_readiness?: number } | null }>;

    const scoreOf = (a: { market_potential?: number; innovation?: number; startup_readiness?: number } | null) => {
      if (!a) return 0;
      const m = Number(a.market_potential ?? 0);
      const i = Number(a.innovation ?? 0);
      const s = Number(a.startup_readiness ?? 0);
      return Math.round((m + i + s) / 3);
    };

    const byOwner = new Map<string, { total: number; count: number; best: { name: string; score: number } }>();
    for (const p of list) {
      const s = scoreOf(p.ai_analysis);
      const cur = byOwner.get(p.owner_id) ?? { total: 0, count: 0, best: { name: p.name, score: -1 } };
      cur.total += s;
      cur.count += 1;
      if (s > cur.best.score) cur.best = { name: p.name, score: s };
      byOwner.set(p.owner_id, cur);
    }

    const ownerIds = [...byOwner.keys()];
    let profiles: Array<{ id: string; full_name: string | null; avatar_url: string | null }> = [];
    if (ownerIds.length) {
      const { data } = await supabase.from("profiles").select("id,full_name,avatar_url").in("id", ownerIds);
      profiles = (data ?? []) as typeof profiles;
    }
    const profMap = new Map(profiles.map((p) => [p.id, p]));

    const built: LbRow[] = ownerIds.map((id) => {
      const agg = byOwner.get(id)!;
      const prof = profMap.get(id);
      return {
        owner_id: id,
        name: prof?.full_name ?? "Innovator",
        avatar_url: prof?.avatar_url ?? null,
        projects: agg.count,
        total: agg.total,
        avg: Math.round(agg.total / agg.count),
        best: agg.best.name,
      };
    }).sort((a, b) => b.avg - a.avg || b.total - a.total);

    setRows(built);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("leaderboard-projects")
      .on("postgres_changes", { event: "*", schema: "public", table: "data" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return <div className="grid place-items-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <Trophy className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Innovator Leaderboard</h2>
          <p className="text-sm text-muted-foreground">Live ranking by AI analysis scores across all projects</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No AI-analyzed projects yet. Rankings will appear once projects receive analysis.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Innovator</th>
                <th className="px-4 py-3 text-left">Top Project</th>
                <th className="px-4 py-3 text-right">Projects</th>
                <th className="px-4 py-3 text-right">Avg Score</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const rank = i + 1;
                const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
                return (
                  <tr key={r.owner_id} className="border-t border-border">
                    <td className="px-4 py-3 font-semibold">
                      {medal ? <span className="text-lg">{medal}</span> : <span className="text-muted-foreground">{rank}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {r.avatar_url ? <img src={r.avatar_url} alt={r.name} className="h-full w-full object-cover" /> : r.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.best}</td>
                    <td className="px-4 py-3 text-right">{r.projects}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">{r.avg}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{r.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
