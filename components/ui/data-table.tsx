"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, RefreshCw } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  showSearch?: boolean
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  onRefresh?: () => void
  isRefreshing?: boolean
  totalRecords?: number
  totalLabel?: string
  page?: number
  pageSize?: number
  pageCount?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  showSearch = true,
  searchPlaceholder = "Filtrele...",
  searchValue,
  onSearchChange,
  onRefresh,
  isRefreshing,
  totalRecords,
  totalLabel = "kayıt",
  page,
  pageSize,
  pageCount,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [internalFilter, setInternalFilter] = React.useState("")

  const isServerPagination = typeof onPageChange === "function"

  const effectiveFilter = searchValue !== undefined ? searchValue : internalFilter
  const handleFilterChange = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val)
      if (onPageChange) onPageChange(1)
    } else {
      setInternalFilter(val)
    }
  }

  const [clientPagination, setClientPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data,
    columns,
    manualPagination: isServerPagination,
    pageCount: isServerPagination ? (pageCount ?? Math.max(1, Math.ceil((totalRecords || 1) / (pageSize || 10)))) : undefined,
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: isServerPagination ? undefined : setClientPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: (val) => handleFilterChange(String(val)),
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter: onSearchChange ? "" : effectiveFilter,
      pagination: isServerPagination
        ? { pageIndex: (page || 1) - 1, pageSize: pageSize || 10 }
        : clientPagination,
    },
  })

  // Sadece filtre / arama değiştiğinde ilk sayfaya dön
  React.useEffect(() => {
    if (!isServerPagination) {
      setClientPagination((prev) => ({ ...prev, pageIndex: 0 }))
    }
  }, [effectiveFilter, isServerPagination])

  // Veri değiştiğinde (silme vb.) mevcut sayfayı koru, sadece sayfa sayısı azaldıysa son sayfaya clamp et
  React.useEffect(() => {
    if (!isServerPagination && data) {
      setClientPagination((prev) => {
        const maxPage = Math.max(0, Math.ceil(data.length / prev.pageSize) - 1)
        if (prev.pageIndex > maxPage) {
          return { ...prev, pageIndex: maxPage }
        }
        return prev
      })
    }
  }, [data, isServerPagination])

  const paginationState = isServerPagination
    ? { pageIndex: (page || 1) - 1, pageSize: pageSize || 10 }
    : (table.getState()?.pagination || clientPagination)

  const currentPage = isServerPagination ? (page || 1) : paginationState.pageIndex + 1
  const currentPageSize = isServerPagination ? (pageSize || 10) : paginationState.pageSize
  const calculatedPageCount = isServerPagination
    ? (pageCount ?? Math.max(1, Math.ceil((totalRecords || 1) / (pageSize || 10))))
    : (table.getPageCount() || 1)

  const canPrev = isServerPagination ? currentPage > 1 : table.getCanPreviousPage()
  const canNext = isServerPagination ? currentPage < calculatedPageCount : table.getCanNextPage()

  return (
    <div>
      <div className="flex items-center py-4 gap-2">
        {onRefresh && (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onRefresh} 
            title="Yenile"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        )}
        {showSearch && (
          <Input
            placeholder={searchPlaceholder}
            value={effectiveFilter}
            onChange={(event) => handleFilterChange(event.target.value)}
            className="max-w-sm"
          />
        )}
        {totalRecords !== undefined && (
          <span className="ml-auto text-sm text-muted-foreground">
            Toplam: <strong>{totalRecords}</strong> {totalLabel}
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" className={totalRecords !== undefined ? "ml-2" : "ml-auto"} />}>
            Sütunlar <ChevronDown className="ml-2 h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border h-[calc(100vh-320px)] overflow-auto relative">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isActions = header.column.id === "actions" || header.column.id === "action";
                  return (
                    <TableHead key={header.id} className={isActions ? "text-right pr-4" : ""}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isActions = cell.column.id === "actions" || cell.column.id === "action";
                    return (
                      <TableCell key={cell.id} className={isActions ? "text-right pr-4" : ""}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Sonuç bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">Sayfada göster:</p>
          <select
            className="h-8 w-[70px] rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
            value={currentPageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value)
              if (isServerPagination) {
                onPageSizeChange?.(newSize)
                onPageChange?.(1)
              } else {
                table.setPageSize(newSize)
              }
            }}
          >
            {[5, 10, 20, 30, 40, 50].map((s) => (
              <option key={s} value={s} className="text-foreground bg-background">
                {s}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            Sayfa {currentPage} / {calculatedPageCount}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isServerPagination) {
                  onPageChange?.(currentPage - 1)
                } else {
                  table.previousPage()
                }
              }}
              disabled={!canPrev}
            >
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isServerPagination) {
                  onPageChange?.(currentPage + 1)
                } else {
                  table.nextPage()
                }
              }}
              disabled={!canNext}
            >
              Sonraki
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}