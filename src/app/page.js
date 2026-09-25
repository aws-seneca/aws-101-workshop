import { Waitlist } from "@/components/waitlist"
import { storage } from "@/lib/storage"
import { initials } from "@/lib/format"

// Always read fresh data, never a cached build-time copy.
export const dynamic = "force-dynamic"

export default async function WaitlistPage() {
  let signups = []
  try {
    signups = await storage().list()
  } catch (err) {
    console.error("Could not read sign-ups:", err.message)
  }
  const summary = { count: signups.length, recentInitials: signups.slice(0, 4).map((s) => initials(s.name)) }
  return <Waitlist summary={summary} />
}
