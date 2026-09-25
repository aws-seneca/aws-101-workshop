import { BrandMark } from "@/components/brand-logo"

const LINKS = [
  {
    title: "Club",
    items: [
      { label: "Website", href: "https://awsseneca.com" },
      { label: "All links", href: "https://linktr.ee/awsseneca" },
    ],
  },
  {
    title: "Community",
    items: [
      { label: "Meetup", href: "https://www.meetup.com/aws-sbg-at-seneca-polytechnic-newnham-campus/" },
      { label: "LinkedIn", href: "https://www.linkedin.com/company/aws-student-builder-seneca-poly/" },
      { label: "GitHub", href: "https://github.com/aws-seneca" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t bg-card/50">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-10 px-6 py-12 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="col-span-2 max-w-xs sm:col-span-1">
          <div className="flex items-center gap-2.5">
            <BrandMark className="size-5" />
            <span className="text-sm font-semibold tracking-tight">AWS Student Builder Group</span>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            A student-run cloud community at Seneca Polytechnic, Newnham Campus, Toronto.
          </p>
        </div>
        {LINKS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="text-[13px] font-medium">{group.title}</h2>
            <ul className="mt-3 grid gap-2">
              {group.items.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t">
        <div className="mx-auto flex w-full max-w-5xl flex-col justify-between gap-2 px-6 py-5 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} AWS Student Builder Group at Seneca Polytechnic</span>
          <a href="/admin" className="transition-colors hover:text-foreground">Organizer view</a>
        </div>
      </div>
    </footer>
  )
}
