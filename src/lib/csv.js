// Download the given sign-ups as a CSV file.
export function downloadCsv(signups, filename) {
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`
  const rows = [["Name", "Email", "Signed up"], ...signups.map((s) => [s.name, s.email, s.created_at])]
  const blob = new Blob([rows.map((row) => row.map(escape).join(",")).join("\n")], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement("a"), { href: url, download: filename })
  link.click()
  URL.revokeObjectURL(url)
}
