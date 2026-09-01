import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export default async function RootPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();
  const profile = db
    .prepare("SELECT onboarding_complete FROM profiles WHERE user_id = ?")
    .get(session.userId) as { onboarding_complete: number } | undefined;

  redirect(profile?.onboarding_complete ? "/home" : "/onboarding");
}
