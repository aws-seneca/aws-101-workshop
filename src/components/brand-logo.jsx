import { cn } from "@/lib/utils"

// The AWS Student Builder Group chip mark, redrawn from brand/ on its 9 x 9 grid
// so it stays sharp at any size. [x, y, width, height] in grid units.
const CHIP = [
  [2, 0, 1, 1], [4, 0, 1, 1], [6, 0, 1, 1], [2, 1, 5, 1],
  [2, 7, 5, 1], [2, 8, 1, 1], [4, 8, 1, 1], [6, 8, 1, 1],
  [1, 2, 1, 5], [0, 2, 1, 1], [0, 4, 1, 1], [0, 6, 1, 1],
  [7, 2, 1, 5], [8, 2, 1, 1], [8, 4, 1, 1], [8, 6, 1, 1],
]

export function BrandMark({ className }) {
  return (
    <svg viewBox="0 0 9 9" className={cn("size-6 shrink-0", className)} aria-hidden shapeRendering="crispEdges">
      {CHIP.map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} fill="#AD5DFE" />
      ))}
    </svg>
  )
}

export function BrandLogo({ href = "/", className, compact = false }) {
  return (
    <a href={href} className={cn("flex items-center gap-2.5", className)} aria-label="AWS Student Builder Group">
      <BrandMark />
      <span className={cn("grid leading-none", compact && "hidden sm:grid")}>
        <span className="text-[13px] font-semibold tracking-tight">AWS Student Builder Group</span>
        <span className="mt-1 text-[11px] text-muted-foreground">Seneca Polytechnic</span>
      </span>
    </a>
  )
}
