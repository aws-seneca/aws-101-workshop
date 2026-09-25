"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { DatabaseIcon, DownloadIcon, FileTextIcon, PlusIcon, TriangleAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddSignupDialog } from "@/components/add-signup-dialog"
import { BrandLogo } from "@/components/brand-logo"
import { SignupsTable } from "@/components/signups-table"
import { addSignup, deleteSignups } from "@/app/actions"
import { downloadCsv } from "@/lib/csv"

const UNDO_SECONDS = 5

// signups arrive from the server; after every add or delete the server sends
// a fresh list. Deletes wait UNDO_SECONDS before they are sent.
export function AdminView({ signups: serverSignups, storageLabel, error }) {
  const pending = useRef(new Set())
  const seen = useRef(new Set(serverSignups.map((s) => s.id)))
  const [hidden, setHidden] = useState(() => new Set())
  const [newId, setNewId] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Highlight a row that appeared since the last server update.
  useEffect(() => {
    const fresh = serverSignups.find((s) => !seen.current.has(s.id))
    seen.current = new Set(serverSignups.map((s) => s.id))
    if (fresh) setNewId(fresh.id)
  }, [serverSignups])

  const signups = serverSignups.filter((s) => !hidden.has(s.id))

  async function add(name, email) {
    const result = await addSignup(name, email)
    if (result.error) toast.error(result.error)
    if (result.ok) toast.success(`${name.trim()} added`)
    return result
  }

  function remove(items) {
    const ids = items.map((s) => s.id)
    ids.forEach((id) => pending.current.add(id))
    setHidden((h) => new Set([...h, ...ids]))
    let settled = false
    const restore = () => setHidden((h) => new Set([...h].filter((id) => !ids.includes(id))))
    const commit = async () => {
      if (settled) return
      settled = true
      ids.forEach((id) => pending.current.delete(id))
      const result = await deleteSignups(ids)
      if (result.error) {
        restore()
        toast.error(result.error)
      }
    }
    toast(items.length === 1 ? `${items[0].name} deleted` : `${items.length} sign-ups deleted`, {
      duration: UNDO_SECONDS * 1000,
      action: {
        label: "Undo",
        onClick: () => {
          settled = true
          ids.forEach((id) => pending.current.delete(id))
          restore()
        },
      },
      onAutoClose: commit,
      onDismiss: commit,
    })
  }

  const StorageIcon = storageLabel === "Local JSON" ? FileTextIcon : DatabaseIcon

  return (
    <>
      <header className="sticky top-0 z-20 border-b bg-card/95 supports-[backdrop-filter]:bg-card/75 supports-[backdrop-filter]:backdrop-blur-xl reduce-transparency:bg-card reduce-transparency:backdrop-blur-none">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
          <BrandLogo compact />
          <nav aria-label="Main" className="hidden gap-1 sm:flex">
            <a href="/admin" aria-current="page" className="rounded-md px-2.5 py-1.5 text-sm font-medium hover:bg-muted">Sign-ups</a>
            <a href="/" className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Waitlist page</a>
          </nav>
          <span className="ml-auto inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-medium whitespace-nowrap text-secondary-foreground" title="Where sign-ups are stored">
            <span aria-hidden className={error ? "size-2 rounded-full bg-destructive" : "size-2 rounded-full bg-emerald-500"} />
            <StorageIcon className="size-3.5" aria-hidden />
            {storageLabel}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13px] text-muted-foreground">AWS 101: Core Services Workshop, October 7, 2026</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Sign-ups</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 px-3" disabled={signups.length === 0}
              onClick={() => downloadCsv(signups, `aws-101-signups-${new Date().toISOString().slice(0, 10)}.csv`)}>
              <DownloadIcon data-icon="inline-start" /> Export CSV
            </Button>
            <AddSignupDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={add} />
          </div>
        </div>

        {error && (
          <div role="alert" className="mt-6 flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            <TriangleAlertIcon className="size-4.5 shrink-0" aria-hidden />
            {error}
          </div>
        )}

        <div className="mt-6">
          <SignupsTable
            signups={signups}
            loading={false}
            newId={newId}
            onDelete={remove}
            emptyAction={
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <PlusIcon data-icon="inline-start" /> Add sign-up
              </Button>
            }
          />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          No login on this page: it is a workshop app. Use test data, and limit the security group to your own IP.
        </p>
      </main>
    </>
  )
}
