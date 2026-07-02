import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarDays, Loader2, RefreshCw, Trash2, Wand2 } from "lucide-react";
import {
  adminBulkGenerateSlots,
  adminDeleteFreeSlotsInRange,
  adminDeleteSlot,
  adminListSlots,
  type SlotRow,
} from "@/lib/admin/slots.functions";
import { t } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";

function todayIso(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5, 6]; // Mon-Sat

export function SlotsTab() {
  const qc = useQueryClient();
  const ts = t.admin.slots;
  const tc = t.admin.common;

  const listFn = useServerFn(adminListSlots);
  const bulkFn = useServerFn(adminBulkGenerateSlots);
  const delFn = useServerFn(adminDeleteSlot);
  const delRangeFn = useServerFn(adminDeleteFreeSlotsInRange);

  // Generator form
  const [genFrom, setGenFrom] = useState(() => todayIso());
  const [genTo, setGenTo] = useState(() => todayIso(13));
  const [weekdays, setWeekdays] = useState<number[]>(DEFAULT_WEEKDAYS);
  const [timesText, setTimesText] = useState("10:00, 11:30, 13:00, 15:00, 17:00");

  // List filter
  const [listFrom, setListFrom] = useState(() => todayIso());
  const [listTo, setListTo] = useState(() => todayIso(13));
  const [confirmDeleteRange, setConfirmDeleteRange] = useState(false);

  const list = useQuery({
    queryKey: ["admin", "slots", listFrom, listTo],
    queryFn: () => listFn({ data: { from: listFrom, to: listTo } }),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin", "slots"] });

  const parsedTimes = useMemo(
    () =>
      timesText
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
    [timesText],
  );

  const bulkMut = useMutation({
    mutationFn: () =>
      bulkFn({
        data: {
          from: genFrom,
          to: genTo,
          weekdays,
          times: parsedTimes,
        },
      }),
    onSuccess: (r) => {
      toast.success(ts.toastGenerated(r.inserted, r.skipped));
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : tc.error),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success(ts.toastDeleted);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : tc.error),
  });

  const delRangeMut = useMutation({
    mutationFn: () =>
      delRangeFn({ data: { from: listFrom, to: listTo } }),
    onSuccess: (r) => {
      toast.success(ts.toastRangeDeleted(r.deleted));
      setConfirmDeleteRange(false);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : tc.error),
  });

  const toggleWeekday = (w: number) =>
    setWeekdays((prev) =>
      prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w].sort(),
    );

  const canGenerate =
    parsedTimes.length > 0 && weekdays.length > 0 && genFrom && genTo;

  const grouped = useMemo(() => {
    const map = new Map<string, SlotRow[]>();
    for (const r of list.data ?? []) {
      const arr = map.get(r.date) ?? [];
      arr.push(r);
      map.set(r.date, arr);
    }
    return Array.from(map.entries());
  }, [list.data]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-card border border-border/60 p-6 md:p-8">
        <header className="mb-6">
          <h2 className="font-display text-2xl mb-1">{ts.title}</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">{ts.subtitle}</p>
        </header>

        <div className="rounded-xl border border-border/60 bg-background/40 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wand2 size={16} className="text-primary" />
            <h3 className="font-medium">{ts.generator.title}</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="grid gap-2">
              <Label htmlFor="gen-from">{ts.generator.from}</Label>
              <Input
                id="gen-from"
                type="date"
                value={genFrom}
                onChange={(e) => setGenFrom(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gen-to">{ts.generator.to}</Label>
              <Input
                id="gen-to"
                type="date"
                value={genTo}
                onChange={(e) => setGenTo(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-4">
            <Label className="mb-2 block">{ts.generator.weekdays}</Label>
            <div className="flex flex-wrap gap-2">
              {ts.weekdayShort.map((label, idx) => {
                const active = weekdays.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleWeekday(idx)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-accent",
                    )}
                  >
                    <Checkbox checked={active} className="pointer-events-none" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-2 mb-5">
            <Label htmlFor="gen-times">{ts.generator.times}</Label>
            <Input
              id="gen-times"
              value={timesText}
              onChange={(e) => setTimesText(e.target.value)}
              placeholder="10:00, 11:30, 14:00"
            />
            <p className="text-xs text-muted-foreground">{ts.generator.timesHint}</p>
            {parsedTimes.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {parsedTimes.length} × {ts.generator.times.toLowerCase()}
              </p>
            )}
          </div>

          <Button
            onClick={() => bulkMut.mutate()}
            disabled={!canGenerate || bulkMut.isPending}
            className="rounded-full"
          >
            {bulkMut.isPending ? (
              <>
                <Loader2 className="animate-spin" size={14} />{" "}
                {ts.generator.submitting}
              </>
            ) : (
              <>
                <Wand2 size={14} /> {ts.generator.submit}
              </>
            )}
          </Button>
        </div>
      </section>

      <section className="rounded-2xl bg-card border border-border/60 p-6 md:p-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-5">
          <div>
            <h3 className="font-display text-xl mb-1">{ts.list.title}</h3>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1">
              <Label htmlFor="list-from" className="text-xs">
                {ts.list.rangeFrom}
              </Label>
              <Input
                id="list-from"
                type="date"
                value={listFrom}
                onChange={(e) => setListFrom(e.target.value)}
                className="h-9 w-40"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="list-to" className="text-xs">
                {ts.list.rangeTo}
              </Label>
              <Input
                id="list-to"
                type="date"
                value={listTo}
                onChange={(e) => setListTo(e.target.value)}
                className="h-9 w-40"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => list.refetch()}
              disabled={list.isFetching}
              className="gap-2"
            >
              <RefreshCw
                size={14}
                className={cn(list.isFetching && "animate-spin")}
              />
              {ts.list.refresh}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeleteRange(true)}
              disabled={(list.data?.length ?? 0) === 0}
              className="text-destructive hover:text-destructive gap-2"
            >
              <Trash2 size={14} /> {ts.list.deleteRange}
            </Button>
          </div>
        </header>

        {list.isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" size={16} /> {tc.loading}
          </div>
        ) : list.isError ? (
          <p className="text-sm text-destructive">{tc.error}</p>
        ) : grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">
            {tc.empty}
          </p>
        ) : (
          <div className="space-y-4">
            {grouped.map(([date, rows]) => (
              <div
                key={date}
                className="rounded-xl border border-border/60 bg-background/40 p-4"
              >
                <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                  <CalendarDays size={14} className="text-primary" />
                  {date}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({rows.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rows.map((r) => (
                    <SlotPill
                      key={r.id}
                      row={r}
                      onDelete={() => delMut.mutate(r.id)}
                      busy={delMut.isPending && delMut.variables === r.id}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <AlertDialog
        open={confirmDeleteRange}
        onOpenChange={(o) => !o && setConfirmDeleteRange(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ts.confirmDeleteRange}</AlertDialogTitle>
            <AlertDialogDescription>
              {listFrom} → {listTo}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={delRangeMut.isPending}>
              {tc.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => delRangeMut.mutate()}
              disabled={delRangeMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {delRangeMut.isPending ? (
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

function SlotPill({
  row,
  onDelete,
  busy,
}: {
  row: SlotRow;
  onDelete: () => void;
  busy: boolean;
}) {
  const ts = t.admin.slots;
  const label = row.time.slice(0, 5);
  if (row.is_booked) {
    return (
      <span
        title={ts.list.booked}
        className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
      >
        {label}
        <span className="text-[10px] uppercase tracking-wider opacity-70">
          {ts.list.booked}
        </span>
      </span>
    );
  }
  return (
    <span className="group inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
      {label}
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        className="ml-1 rounded-full p-0.5 text-muted-foreground hover:text-destructive disabled:opacity-40"
        aria-label="delete"
      >
        {busy ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Trash2 size={12} />
        )}
      </button>
    </span>
  );
}
