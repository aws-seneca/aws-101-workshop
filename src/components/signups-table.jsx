"use client"

import { useMemo, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { AnimatePresence, motion } from "motion/react"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  MoreHorizontalIcon,
  SearchIcon,
  Trash2Icon,
  UsersIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate, initials } from "@/lib/format"
import { cn } from "@/lib/utils"

// Organizer table. Pattern adapted from the 21st.dev "Data Table" (ephraimduncan/table-05),
// rebuilt on this app's shadcn components and wired to the sign-ups API.
export function SignupsTable({ signups, loading, newId, onDelete, emptyAction }) {
  const [globalFilter, setGlobalFilter] = useState("")
  const [sorting, setSorting] = useState([{ id: "created_at", desc: true }])
  const [rowSelection, setRowSelection] = useState({})

  const columns = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all on this page"
            checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.name}`}
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: ({ column }) => <SortHeader column={column}>Name</SortHeader>,
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
              {initials(row.original.name)}
            </span>
            <span className="grid min-w-0">
              <span className="truncate font-medium" title={row.original.name}>{row.original.name}</span>
              <span className="truncate text-xs text-muted-foreground sm:hidden">{row.original.email}</span>
            </span>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => <SortHeader column={column}>Email</SortHeader>,
        cell: ({ row }) => (
          <span className="block truncate text-muted-foreground" title={row.original.email}>{row.original.email}</span>
        ),
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => <SortHeader column={column}>Signed up</SortHeader>,
        sortingFn: (a, b) => new Date(a.original.created_at) - new Date(b.original.created_at),
        cell: ({ row }) => (
          <time dateTime={row.original.created_at} className="whitespace-nowrap text-muted-foreground tabular-nums">
            {formatDate(row.original.created_at)}
          </time>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => <RowActions signup={row.original} onDelete={onDelete} />,
      },
    ],
    [onDelete]
  )

  const table = useReactTable({
    data: signups,
    columns,
    getRowId: (row) => String(row.id),
    state: { globalFilter, sorting, rowSelection },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    autoResetPageIndex: false,
  })

  // Rows can disappear (deleted elsewhere); only count selections that still exist.
  const selected = table.getSelectedRowModel().rows.map((r) => r.original)
  const { pageIndex, pageSize } = table.getState().pagination
  const filteredCount = table.getFilteredRowModel().rows.length
  const pageCount = Math.max(table.getPageCount(), 1)
  if (pageIndex > 0 && pageIndex >= pageCount) queueMicrotask(() => table.setPageIndex(pageCount - 1))

  function deleteSelected() {
    onDelete(selected)
    setRowSelection({})
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="flex min-h-15 flex-wrap items-center gap-3 border-b px-4 py-3">
        <AnimatePresence mode="wait" initial={false}>
          {selected.length > 0 ? (
            <motion.div
              key="bulk"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="flex w-full items-center gap-3"
            >
              <span className="text-sm font-medium tabular-nums">{selected.length} selected</span>
              <Button variant="ghost" size="sm" onClick={() => setRowSelection({})} className="text-muted-foreground">
                Clear
              </Button>
              <Button variant="destructive" size="sm" className="ml-auto" onClick={deleteSelected}>
                <Trash2Icon data-icon="inline-start" /> Delete {selected.length}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="flex w-full items-center gap-3"
            >
              <div className="relative w-full max-w-xs">
                <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={globalFilter}
                  onChange={(e) => {
                    setGlobalFilter(e.target.value)
                    table.setPageIndex(0)
                  }}
                  placeholder="Search by name or email"
                  aria-label="Search sign-ups"
                  className="h-9 pl-9"
                />
              </div>
              <span className="ml-auto hidden text-[13px] text-muted-foreground tabular-nums sm:inline" aria-live="polite">
                {loading ? "Loading…" : globalFilter ? `${filteredCount} of ${signups.length}` : `${signups.length} total`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading ? (
        <LoadingRows />
      ) : signups.length === 0 ? (
        <Empty icon={UsersIcon} title="No sign-ups yet" body="People who join the waitlist will appear here." action={emptyAction} />
      ) : filteredCount === 0 ? (
        <Empty
          icon={SearchIcon}
          title="No matches"
          body={`Nothing matches “${globalFilter.trim()}”.`}
          action={
            <Button variant="outline" size="sm" onClick={() => setGlobalFilter("")}>
              <XIcon data-icon="inline-start" /> Clear search
            </Button>
          }
        />
      ) : (
        <>
          <Table className="table-fixed">
            <colgroup>
              <col className="w-12" />
              <col className="sm:w-[34%]" />
              <col className="hidden sm:table-column" />
              <col className="hidden w-44 md:table-column" />
              <col className="w-14" />
            </colgroup>
            <TableHeader className="bg-muted/60">
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id} className="hover:bg-transparent">
                  {group.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn("h-10 px-4 text-xs", header.column.id === "created_at" && "hidden md:table-cell", header.column.id === "email" && "hidden sm:table-cell")}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className={cn(String(row.id) === String(newId) && "animate-in fade-in bg-primary/5 duration-700")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn("h-14 px-4", cell.column.id === "created_at" && "hidden md:table-cell", cell.column.id === "email" && "hidden sm:table-cell", cell.column.id === "actions" && "text-right")}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <span>Rows per page</span>
              <Select value={String(pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
                <SelectTrigger size="sm" className="h-8 w-18" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-muted-foreground tabular-nums">
                {pageIndex * pageSize + 1}-{Math.min((pageIndex + 1) * pageSize, filteredCount)} of {filteredCount}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="icon-sm" aria-label="Previous page" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                  <ChevronLeftIcon />
                </Button>
                <Button variant="outline" size="icon-sm" aria-label="Next page" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SortHeader({ column, children }) {
  const sorted = column.getIsSorted()
  const Icon = sorted === "asc" ? ArrowUpIcon : sorted === "desc" ? ArrowDownIcon : ArrowUpDownIcon
  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className="-ml-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-medium hover:bg-muted hover:text-foreground"
      aria-label={`Sort by ${children}`}
    >
      {children}
      <Icon className={cn("size-3.5", !sorted && "opacity-40")} aria-hidden />
    </button>
  )
}

function RowActions({ signup, onDelete }) {
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(signup.email)
      toast.success("Email copied")
    } catch {
      toast.error("Could not copy. Select the email and copy it instead.")
    }
  }
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${signup.name}`} className="text-muted-foreground data-[state=open]:bg-muted">
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={copyEmail}>
          <CopyIcon /> Copy email
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete([signup])}>
          <Trash2Icon /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function LoadingRows() {
  return (
    <div aria-busy="true" aria-label="Loading sign-ups">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex h-14 items-center gap-4 border-b px-4 last:border-b-0">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="ml-auto h-3.5 w-48" />
        </div>
      ))}
    </div>
  )
}

function Empty({ icon: Icon, title, body, action }) {
  return (
    <div className="grid justify-items-center gap-1.5 px-6 py-16 text-center">
      <span className="mb-2 grid size-10 place-items-center rounded-full bg-secondary text-secondary-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <strong className="text-sm font-semibold">{title}</strong>
      <p className="max-w-xs text-[13px] text-muted-foreground">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
