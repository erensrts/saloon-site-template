import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Clock, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  adminDeleteWorkingHour,
  adminListWorkingHours,
  adminUpsertWorkingHour,
  type WorkingHourRow,
} from "@/lib/admin/working-hours.functions";
import { t } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type FormState = {
  id?: string;
  language: string;
  day_label: string;
  time_label: string;
  sort_order: number;
};

const emptyForm = (nextOrder: number): FormState => ({
  language: "tr",
  day_label: "",
  time_label: "",
  sort_order: nextOrder,
});

export function WorkingHoursTab() {
  const qc = useQueryClient();
  const list = useServerFn(adminListWorkingHours);
  const upsert = useServerFn(adminUpsertWorkingHour);
  const del = useServerFn(adminDeleteWorkingHour);
  const tt = t.admin.hours;
  const tc = t.admin.common;

  const query = useQuery({
    queryKey: ["admin", "working-hours", "tr"],
    queryFn: () => list({ data: { language: "tr" } }),
  });

  const [editing, setEditing] = useState<FormState | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "working-hours"] });
    qc.invalidateQueries({ queryKey: ["public-site-data"] });
  };

  const upsertMut = useMutation({
    mutationFn: (form: FormState) => upsert({ data: form }),
    onSuccess: (_r, form) => {
      toast.success(form.id ? tt.toastUpdated : tt.toastCreated);
      setEditing(null);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : tc.error),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success(tt.toastDeleted);
      setDeletingId(null);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : tc.error),
  });

  const nextOrder =
    (query.data?.reduce((m, r) => Math.max(m, r.sort_order), -1) ?? -1) + 1;

  return (
    <section className="rounded-2xl bg-card border border-border/60 p-6 md:p-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl mb-1">{tt.title}</h2>
          <p className="text-sm text-muted-foreground max-w-xl">{tt.subtitle}</p>
        </div>
        <Button
          onClick={() => setEditing(emptyForm(nextOrder))}
          className="rounded-full self-start sm:self-auto"
        >
          <Plus size={16} /> {tt.addNew}
        </Button>
      </header>

      {query.isLoading ? (
        <div className="flex items-center justify-center py-14 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" size={16} /> {tc.loading}
        </div>
      ) : query.isError ? (
        <p className="text-sm text-destructive">{tc.error}</p>
      ) : (query.data?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">{tc.empty}</p>
      ) : (
        <div className="grid gap-2">
          {query.data!.map((row) => (
            <HoursRow
              key={row.id}
              row={row}
              onEdit={() =>
                setEditing({
                  id: row.id,
                  language: row.language,
                  day_label: row.day_label,
                  time_label: row.time_label,
                  sort_order: row.sort_order,
                })
              }
              onDelete={() => setDeletingId(row.id)}
              busy={deleteMut.isPending && deleteMut.variables === row.id}
            />
          ))}
        </div>
      )}

      <HoursEditor
        open={editing !== null}
        form={editing}
        pending={upsertMut.isPending}
        onCancel={() => setEditing(null)}
        onChange={setEditing}
        onSubmit={(f) => upsertMut.mutate(f)}
      />

      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(o) => !o && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tc.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {query.data?.find((r) => r.id === deletingId)?.day_label}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMut.mutate(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tc.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function HoursRow({
  row,
  onEdit,
  onDelete,
  busy,
}: {
  row: WorkingHourRow;
  onEdit: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-background/50 p-4">
      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
        <Clock size={18} />
      </div>
      <div className="flex-1 min-w-0 grid sm:grid-cols-2 gap-1">
        <p className="font-medium truncate">{row.day_label}</p>
        <p className="text-sm text-muted-foreground truncate">{row.time_label}</p>
      </div>
      <span className="text-xs text-muted-foreground">#{row.sort_order}</span>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="icon" variant="ghost" onClick={onEdit} disabled={busy}>
          <Pencil size={16} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onDelete}
          disabled={busy}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
}

function HoursEditor({
  open,
  form,
  pending,
  onCancel,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: FormState | null;
  pending: boolean;
  onCancel: () => void;
  onChange: (f: FormState) => void;
  onSubmit: (f: FormState) => void;
}) {
  const tt = t.admin.hours;
  const tc = t.admin.common;
  if (!form) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
        <DialogContent />
      </Dialog>
    );
  }
  const patch = (p: Partial<FormState>) => onChange({ ...form, ...p });
  const isEdit = Boolean(form.id);
  const canSave =
    form.day_label.trim().length > 0 && form.time_label.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? tt.editTitle : tt.newTitle}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSave) onSubmit(form);
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="wh-day">{tt.fields.day}</Label>
            <Input
              id="wh-day"
              value={form.day_label}
              onChange={(e) => patch({ day_label: e.target.value })}
              placeholder="Pazartesi - Cuma"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="wh-time">{tt.fields.time}</Label>
            <Input
              id="wh-time"
              value={form.time_label}
              onChange={(e) => patch({ time_label: e.target.value })}
              placeholder="10:00 - 20:00"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="wh-order">{tt.fields.sortOrder}</Label>
            <Input
              id="wh-order"
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) => patch({ sort_order: Number(e.target.value) || 0 })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
              {tc.cancel}
            </Button>
            <Button type="submit" disabled={!canSave || pending}>
              {pending ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> {tc.saving}
                </>
              ) : (
                tc.save
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
