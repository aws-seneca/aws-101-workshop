"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY = { name: "", email: "" }

export function AddSignupDialog({ open, onOpenChange, onSubmit }) {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function handleOpenChange(next) {
    if (!next) {
      setValues(EMPTY)
      setErrors({})
    }
    onOpenChange(next)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    const result = await onSubmit(values.name, values.email).finally(() => setSaving(false))
    if (result?.errors) {
      setErrors(result.errors)
      document.getElementById(`signup-${Object.keys(result.errors)[0]}`)?.focus()
    } else if (result?.ok) {
      handleOpenChange(false)
    }
  }

  function update(field) {
    return (event) => {
      setValues((v) => ({ ...v, [field]: event.target.value }))
      if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-9 px-3.5 font-semibold">
          <PlusIcon data-icon="inline-start" /> Add sign-up
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} noValidate className="grid gap-5">
          <DialogHeader>
            <DialogTitle>Add a sign-up</DialogTitle>
            <DialogDescription>They will appear at the top of the list.</DialogDescription>
          </DialogHeader>
          <Field id="name" label="Full name" error={errors.name}>
            <Input
              id="signup-name"
              autoComplete="off"
              placeholder="Alex Chen"
              maxLength={100}
              value={values.name}
              onChange={update("name")}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "signup-name-error" : undefined}
              className="h-10"
              autoFocus
            />
          </Field>
          <Field id="email" label="Email" error={errors.email}>
            <Input
              id="signup-email"
              type="email"
              autoComplete="off"
              placeholder="alex@example.com"
              maxLength={200}
              value={values.email}
              onChange={update("email")}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "signup-email-error" : undefined}
              className="h-10"
            />
          </Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-9">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving} className="h-9 min-w-24 font-semibold">
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ id, label, error, children }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={`signup-${id}`}>{label}</Label>
      {children}
      {error && (
        <p id={`signup-${id}-error`} className="text-[13px] text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
