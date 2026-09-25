import { AdminView } from "@/components/admin-view"
import { storage, storageLabel } from "@/lib/storage"

export const dynamic = "force-dynamic"
export const metadata = { title: "Sign-ups · AWS 101 Workshop" }

export default async function AdminPage() {
  let signups = []
  let error = null
  try {
    signups = await storage().list()
  } catch (err) {
    console.error("Could not read sign-ups:", err.message)
    error = "Could not read sign-ups. Check the terminal running the app."
  }
  return <AdminView signups={signups} storageLabel={storageLabel()} error={error} />
}
