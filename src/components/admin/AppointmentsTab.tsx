import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  CalendarDays,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import {
  APPOINTMENT_STATUSES,
  adminDeleteAppointment,
  adminListAppointments,
  adminUpdateAppointmentStatus,
  type AppointmentRow,
  type AppointmentStatus,
} from "@/lib/admin/appointments.functions";
import { t } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type StatusFilter = AppointmentStatus | "all";

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  confirmed: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

export function AppointmentsTab() {
  const qc = useQueryClient();
  const ta = t.admin.appointments;
  const tc = t.admin.common;

  const listFn = useServerFn(adminListAppointments);
  const updateFn = useServerFn(adminUpdateAppointmentStatus);
  const deleteFn = useServerFn(adminDeleteAppointment);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<AppointmentRow | null>(
    null,
  );

  const queryKey = ["admin", "appointments", statusFilter, search] as const;
  const list = useQuery({
    queryKey,
    queryFn: () =>
      listFn({
        data: {
          status: statusFilter === "all" ? undefined : statusFilter,
          search: search.trim() || undefined,
        },
      }),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin", "appointments"] });

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; status: AppointmentStatus }) =>
      updateFn({ data: vars }),
    onSuccess: () => {
      toast.success(ta.toastStatusUpdated);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : tc.error),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success(ta.toastDeleted);
      setConfirmDelete(null);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : tc.error),
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: list.data?.length ?? 0 };
    for (const s of APPOINTMENT_STATUSES) c[s] = 0;
    for (const r of list.data ?? []) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [list.data]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-card border border-border/60 p-6 md:p-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl mb-1">{ta.title}</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {ta.subtitle}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => list.refetch()}
            disabled={list.isFetching}
            className="gap-2 self-start md:self-end"
          >
            <RefreshCw
              size={14}
              className={cn(list.isFetching && "animate-spin")}
            />
            {ta.refresh}
          </Button>
        </header>

        <div className="flex flex-wrap items-end gap-3 mb-5">
          <div className="grid gap-1 min-w-[220px] flex-1">
            <Label htmlFor="appt-search" className="text-xs">
              {ta.searchLabel}
            </Label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="appt-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={ta.searchPlaceholder}
                className="h-9 pl-9"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {(["all", ...APPOINTMENT_STATUSES] as StatusFilter[]).map((s) => {
            const active = statusFilter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                {ta.status[s]}
                <span className="rounded-full bg-background px-1.5 text-[10px] tabular-nums">
                  {counts[s] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {list.isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" size={16} /> {tc.loading}
          </div>
        ) : list.isError ? (
          <p className="text-sm text-destructive">{tc.error}</p>
        ) : (list.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">
            {tc.empty}
          </p>
        ) : (
          <div className="rounded-xl border border-border/60 bg-background/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ta.columns.when}</TableHead>
                  <TableHead>{ta.columns.customer}</TableHead>
                  <TableHead>{ta.columns.service}</TableHead>
                  <TableHead className="w-[160px]">
                    {ta.columns.status}
                  </TableHead>
                  <TableHead className="w-[60px] text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(list.data ?? []).map((r) => (
                  <AppointmentRowView
                    key={r.id}
                    row={r}
                    onStatusChange={(status) =>
                      updateMut.mutate({ id: r.id, status })
                    }
                    onDelete={() => setConfirmDelete(r)}
                    busy={
                      updateMut.isPending &&
                      (updateMut.variables?.id ?? "") === r.id
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tc.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete
                ? `${confirmDelete.name} — ${confirmDelete.date} ${confirmDelete.time.slice(0, 5)}`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>
              {tc.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmDelete && deleteMut.mutate(confirmDelete.id)
              }
              disabled={deleteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMut.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> {tc.saving}
                </>
              ) : (
                tc.delete
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AppointmentRowView({
  row,
  onStatusChange,
  onDelete,
  busy,
}: {
  row: AppointmentRow;
  onStatusChange: (s: AppointmentStatus) => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const ta = t.admin.appointments;
  const status = (APPOINTMENT_STATUSES as readonly string[]).includes(row.status)
    ? (row.status as AppointmentStatus)
    : "pending";

  return (
    <TableRow>
      <TableCell className="align-top">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CalendarDays size={14} className="text-primary" />
          {row.date}
        </div>
        <div className="text-xs text-muted-foreground mt-1 tabular-nums">
          {row.time.slice(0, 5)}
        </div>
      </TableCell>
      <TableCell className="align-top">
        <div className="text-sm font-medium">{row.name}</div>
        <div className="text-xs text-muted-foreground mt-1 flex flex-col gap-0.5">
          <a
            href={`tel:${row.phone}`}
            className="inline-flex items-center gap-1.5 hover:text-primary"
          >
            <Phone size={11} /> {row.phone}
          </a>
          {row.email && (
            <a
              href={`mailto:${row.email}`}
              className="inline-flex items-center gap-1.5 hover:text-primary"
            >
              <Mail size={11} /> {row.email}
            </a>
          )}
        </div>
      </TableCell>
      <TableCell className="align-top">
        <div className="text-sm">{row.service}</div>
        {row.note && (
          <div className="text-xs text-muted-foreground mt-1 max-w-xs whitespace-pre-wrap">
            {row.note}
          </div>
        )}
      </TableCell>
      <TableCell className="align-top">
        <Select
          value={status}
          onValueChange={(v) => onStatusChange(v as AppointmentStatus)}
          disabled={busy}
        >
          <SelectTrigger
            className={cn(
              "h-8 rounded-full border text-xs font-medium",
              STATUS_STYLES[status],
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APPOINTMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {ta.status[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="align-top text-right">
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
          aria-label="delete"
        >
          <Trash2 size={14} />
        </button>
      </TableCell>
    </TableRow>
  );
}
