import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useGetProfile } from "@/generated/api";
import { UserRound } from "lucide-react";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const MyProfilePage = () => {
  const { data, isLoading } = useGetProfile();

  if (isLoading || !data?.data) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loading />
      </div>
    );
  }

  const profile = data.data;
  if (profile.$type !== "GetAssistantProfileResult") {
    return (
      <DashboardPageShell title="My Profile" description="Profile preview" icon={UserRound}>
        <p className="text-sm text-muted-foreground">This page is for assistants only.</p>
      </DashboardPageShell>
    );
  }

  const displayName = profile.fullName?.trim() || profile.email;

  return (
    <DashboardPageShell
      title="My Profile"
      description="Preview your name and photo. Only a teacher can update these."
      icon={UserRound}
      decorative
    >
      <div className="relative mx-auto max-w-lg overflow-hidden rounded-3xl border border-color2/15 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-emerald-500/15 blur-2xl"
        />
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <Avatar className="size-28 border-4 border-emerald-400/30 shadow-lg shadow-emerald-500/20">
            <AvatarImage src={profile.profilePicture ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-color2 text-2xl text-white">
              {initials(displayName) || "A"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{displayName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{profile.email}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">Assistant</Badge>
            {(profile.permissions ?? []).slice(0, 4).map((p) => (
              <Badge key={p} variant="outline" className="border-color2/20">
                {p}
              </Badge>
            ))}
            {(profile.permissions?.length ?? 0) > 4 && (
              <Badge variant="outline">+{(profile.permissions?.length ?? 0) - 4} more</Badge>
            )}
          </div>
          <p className="max-w-sm text-xs text-muted-foreground">
            Ask your teacher if you need your name or profile photo updated.
          </p>
        </div>
      </div>
    </DashboardPageShell>
  );
};

export default MyProfilePage;
