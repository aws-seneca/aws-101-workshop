"use server"

// The app's only write operations. Next.js runs these on the server when a
// form or button calls them, so there is no separate API to maintain.

import { revalidatePath } from "next/cache"
import { storage } from "@/lib/storage"

function validate(name, email) {
  const errors = {}
  if (!name) errors.name = "Enter a name."
  else if (name.length > 100) errors.name = "Keep the name under 100 characters."
  if (!email) errors.email = "Enter an email address."
  else if (email.length > 200) errors.email = "Keep the email under 200 characters."
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter an email address like alex@example.com."
  return errors
}

export async function addSignup(name, email) {
  name = String(name ?? "").trim()
  email = String(email ?? "").trim()
  const errors = validate(name, email)
  if (Object.keys(errors).length > 0) return { errors }
  try {
    await storage().add(name, email)
  } catch (err) {
    console.error(err)
    return { error: "Could not save the sign-up. Check the terminal running the app." }
  }
  revalidatePath("/")
  revalidatePath("/admin")
  return { ok: true }
}

export async function deleteSignups(ids) {
  try {
    for (const id of ids) await storage().remove(String(id))
  } catch (err) {
    console.error(err)
    return { error: "Could not delete. Check the terminal running the app." }
  }
  revalidatePath("/")
  revalidatePath("/admin")
  return { ok: true }
}
