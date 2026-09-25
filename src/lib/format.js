export function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : date.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })
}

export function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
}
