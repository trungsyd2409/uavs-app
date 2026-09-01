import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();
  const profile = db
    .prepare("SELECT onboarding_complete FROM profiles WHERE user_id = ?")
    .get(session.userId) as { onboarding_complete: number } | undefined;

  if (!profile?.onboarding_complete) redirect("/onboarding");

  return (
    <div className="app-shell">
      <TopBar name={session.name} />
      <div className="scroll-area">{children}</div>
      <BottomNav />
    </div>
  );
}
