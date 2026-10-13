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
  <div className="flex h-full flex-col gap-4 p-4">

    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <div className="mx-auto h-16 w-16">
        <AvatarCircle size={64} />
      </div>

      <div className="mt-2 font-semibold">{user.name}</div>
      <div className="text-xs text-muted-foreground">
        {industry || "Industry not set"}
      </div>
    </div>

    <nav className="flex flex-col gap-1">
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
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-4 w-4" />
            {n.label}
          </button>
        );
      })}
    </nav>

    {/* Logout - Contact கீழே */}
    <Button
      variant="outline"
      className="gap-2"
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
        <SheetContent side="left" className="w-72 p-0">
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
    <h2 className="mb-6 text-2xl font-bold">
      Club Members and Leaders
    </h2>
    <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
      Club members and leaders page will be implemented in the next step.
    </div>
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
  <section>
    <h2 className="mb-6 text-2xl font-bold">Developers</h2>
    <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
      Developer profiles and collaboration requests will be implemented in the next step.
    </div>
  </section>
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
