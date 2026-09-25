"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRightIcon, CalendarDaysIcon, CheckIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addSignup } from "@/app/actions"
import { springs } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { BrandLogo } from "@/components/brand-logo"
import { SiteFooter } from "@/components/site-footer"

const EVENT_DATE = new Date(2026, 9, 7) // Wednesday, October 7, 2026 (local time)

// Page sections fade in one after another, from a light blur.
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } }
const rise = {
  hidden: { opacity: 0, y: 8, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: springs.move },
}

// summary comes from the server: { count, recentInitials }. No names or emails
// ever reach this public page.
export function Waitlist({ summary }) {
  const [joined, setJoined] = useState(null)

  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
        <BrandLogo />
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <a href="/admin">Organizers</a>
        </Button>
      </header>

      <main className="flex-1 px-6 pt-14 pb-20 sm:pt-20">
        <motion.div variants={stagger} initial="hidden" animate="show" className="mx-auto flex w-full max-w-xl flex-col items-center text-center">
          <motion.p variants={rise} className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
            <CalendarDaysIcon className="size-3.5" aria-hidden />
            Wednesday, October 7, 2026
            <DaysAway />
          </motion.p>

          <motion.h1 variants={rise} className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            AWS 101: Core Services Workshop
          </motion.h1>

          <motion.p variants={rise} className="mt-4 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">
            A hands-on session with the AWS Student Builder Group at Seneca. Launch a server on EC2, connect it to a
            database on RDS, and leave with something running.
          </motion.p>

          <motion.div variants={rise} className="mt-9 w-full">
            <AnimatePresence mode="wait" initial={false}>
              {joined ? (
                <Joined key="joined" person={joined} onReset={() => setJoined(null)} />
              ) : (
                <JoinForm
                  key="form"
                  onJoined={setJoined}
                />
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div variants={rise} className="mt-8 min-h-8">
            <SocialProof summary={summary} />
          </motion.div>
        </motion.div>
        <Photos />
      </main>

      <SiteFooter />
    </div>
  )
}

function DaysAway() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((EVENT_DATE - today) / 86_400_000)
  if (days < 0) return null
  return (
    <>
      <span aria-hidden className="h-3 w-px bg-border" />
      <span className="text-foreground tabular-nums">{days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days away`}</span>
    </>
  )
}

function JoinForm({ onJoined }) {
  const [values, setValues] = useState({ name: "", email: "" })
  const [errors, setErrors] = useState({})
  const [failure, setFailure] = useState("")
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setFailure("")
    try {
      const result = await addSignup(values.name, values.email)
      if (result.error) throw new Error(result.error)
      if (result.errors) {
        setErrors(result.errors)
        document.getElementById(`join-${Object.keys(result.errors)[0]}`)?.focus()
        return
      }
      onJoined({ name: values.name.trim(), email: values.email.trim() })
    } catch (error) {
      setFailure(error.message || "Could not reach the app. Check that it is still running.")
    } finally {
      setSaving(false)
    }
  }

  const update = (field) => (event) => {
    setValues((v) => ({ ...v, [field]: event.target.value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const fieldError = errors.name || errors.email || failure

  return (
    <motion.form
      onSubmit={submit}
      noValidate
      initial={{ opacity: 0, filter: "blur(6px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, filter: "blur(6px)", transition: { duration: 0.15 } }}
      className="mx-auto w-full max-w-lg"
    >
      <div className="flex flex-col gap-2 rounded-xl border bg-card p-2 shadow-sm sm:flex-row sm:items-center sm:rounded-full sm:p-1.5">
        <label htmlFor="join-name" className="sr-only">Full name</label>
        <Input
          id="join-name"
          autoComplete="name"
          placeholder="Full name"
          maxLength={100}
          value={values.name}
          onChange={update("name")}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={fieldError ? "join-error" : undefined}
          className="h-10 border-0 bg-transparent px-3.5 shadow-none focus-visible:ring-0 dark:bg-transparent sm:flex-1"
        />
        <span aria-hidden className="mx-3 h-px bg-border sm:mx-0 sm:h-6 sm:w-px" />
        <label htmlFor="join-email" className="sr-only">Email</label>
        <Input
          id="join-email"
          type="email"
          autoComplete="email"
          placeholder="Email"
          maxLength={200}
          value={values.email}
          onChange={update("email")}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={fieldError ? "join-error" : undefined}
          className="h-10 border-0 bg-transparent px-3.5 shadow-none focus-visible:ring-0 dark:bg-transparent sm:flex-[1.3]"
        />
        <motion.div whileTap={{ scale: 0.97 }} transition={springs.press} className="sm:shrink-0">
          <Button type="submit" disabled={saving} className="h-10 w-full rounded-lg px-5 font-medium sm:rounded-full">
            {saving ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
            {saving ? "Joining" : "Join the waitlist"}
            {!saving && <ArrowRightIcon data-icon="inline-end" aria-hidden />}
          </Button>
        </motion.div>
      </div>
      <p id="join-error" role={fieldError ? "alert" : undefined} className={cn("mt-3 min-h-5 text-[13px]", fieldError ? "text-destructive" : "text-muted-foreground")}>
        {fieldError || "Just your name and email."}
      </p>
    </motion.form>
  )
}

function Joined({ person, onReset }) {
  const firstName = person.name.split(/\s+/)[0]
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, scale: 0.98, filter: "blur(6px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, filter: "blur(6px)", transition: { duration: 0.15 } }}
      className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 rounded-xl border bg-card px-6 py-6 shadow-sm"
    >
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...springs.fling, delay: 0.08 }}
        className="grid size-9 place-items-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
      >
        <CheckIcon className="size-4.5" strokeWidth={2.5} aria-hidden />
      </motion.span>
      <div>
        <p className="font-medium">You're on the list, {firstName}.</p>
        <p className="mt-1 text-sm text-muted-foreground">Your spot is saved under {person.email}.</p>
      </div>
      <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
        Add someone else
      </Button>
    </motion.div>
  )
}

function SocialProof({ summary }) {
  if (!summary) return null
  const { count, recentInitials } = summary
  return (
    <div className="flex items-center justify-center gap-3" aria-live="polite">
      {count > 0 && (
        <div className="flex -space-x-2">
          <AnimatePresence initial={false}>
            {recentInitials.map((letters, i) => (
              <motion.span
                key={`${count}-${i}`}
                layout
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                aria-hidden
                className="grid size-7 place-items-center rounded-full border-2 border-background bg-secondary text-[10px] font-semibold text-secondary-foreground"
              >
                {letters}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      )}
      <span className="text-[13px] text-muted-foreground">
        {count === 0 ? "Be the first to join." : count === 1 ? "1 person has joined" : `${count} people have joined`}
      </span>
    </div>
  )
}

// Stock photos from Unsplash (credited in README.md), served from this app.
const PHOTOS = [
  { src: "/images/team-laptops.webp", alt: "Students working together on laptops around a table" },
  { src: "/images/pair-coding.webp", alt: "Two students focused on their screens during a lab session" },
  { src: "/images/server-cables.webp", alt: "Server racks with network cables in a data center" },
]

function Photos() {
  return (
    <motion.ul
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.move, delay: 0.35 }}
      className="mx-auto mt-16 grid w-full max-w-5xl grid-cols-2 gap-3 sm:mt-20 sm:grid-cols-3 sm:gap-4"
    >
      {PHOTOS.map((photo, i) => (
        <li key={photo.src} className={cn("overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/5", i === 2 && "hidden sm:block")}>
          <img
            src={photo.src}
            alt={photo.alt}
            width={960}
            height={720}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] size-full object-cover"
          />
        </li>
      ))}
    </motion.ul>
  )
}
