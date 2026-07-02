import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  adminDeleteService,
  adminListServices,
  adminToggleService,
  adminUpsertService,
  type ServiceRow,
} from "@/lib/admin/services.functions";
import { t } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  icon: string;
  name: string;
  description: string;
  price: string;
  sort_order: number;
  is_active: boolean;
};

const emptyForm = (): FormState => ({
  language: "tr",
  icon: "Sparkles",
  name: "",
  description: "",
  price: "",
  sort_order: 0,
  is_active: true,
});

export function ServicesTab() {
  const qc = useQueryClient();
  const list = useServerFn(adminListServices);
  const upsert = useServerFn(adminUpsertService);
  const del = useServerFn(adminDeleteService);
  const toggle = useServerFn(adminToggleService);
  const tt = t.admin.services;
  const tc = t.admin.common;

  const query = useQuery({
    queryKey: ["admin", "services", "tr"],
    queryFn: () => list({ data: { language: "tr" } }),
  });

  const [editing, setEditing] = useState<FormState | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "services"] });
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

  const toggleMut = useMutation({
    mutationFn: (v: { id: string; is_active: boolean }) => toggle({ data: v }),
    onSuccess: () => {
      toast.success(tt.toastToggled);
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

  return (
    <section className="rounded-2xl bg-card border border-border/60 p-6 md:p-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl mb-1">{tt.title}</h2>
          <p className="text-sm text-muted-foreground max-w-xl">{tt.subtitle}</p>
        </div>
        <Button
          onClick={() => setEditing(emptyForm())}
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
        <div className="grid gap-3">
          {query.data!.map((row) => (
            <ServiceRowCard
              key={row.id}
              row={row}
              onEdit={() =>
                setEditing({
                  id: row.id,
                  language: row.language,
                  icon: row.icon,
                  name: row.name,
                  description: row.description,
                  price: row.price,
                  sort_order: row.sort_order,
                  is_active: row.is_active,
                })
              }
              onDelete={() => setDeletingId(row.id)}
              onToggle={(v) => toggleMut.mutate({ id: row.id, is_active: v })}
              busy={
                (toggleMut.isPending && toggleMut.variables?.id === row.id) ||
                (deleteMut.isPending && deleteMut.variables === row.id)
              }
            />
          ))}
        </div>
      )}

      <ServiceEditor
        open={editing !== null}
        form={editing}
        pending={upsertMut.isPending}
        onCancel={() => setEditing(null)}
        onChange={setEditing}
        onSubmit={(form) => upsertMut.mutate(form)}
      />

      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(o) => !o && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tc.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {tt.title} — {query.data?.find((r) => r.id === deletingId)?.name}
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

function ServiceRowCard({
  row,
  onEdit,
  onDelete,
  onToggle,
  busy,
}: {
  row: ServiceRow;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (v: boolean) => void;
  busy: boolean;
}) {
  const Icon =
    (Icons as unknown as Record<string, LucideIcon>)[row.icon] ?? Icons.Sparkles;
  const tc = t.admin.common;
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border/60 bg-background/50 p-4">
      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-medium truncate">{row.name}</h3>
          <span className="text-xs text-muted-foreground">
            #{row.sort_order}
          </span>
          {!row.is_active && (
            <span className="text-[10px] uppercase tracking-wider rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
              {tc.inactive}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
          {row.description || "—"}
        </p>
        <p className="text-xs text-primary mt-1">{row.price || "—"}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-2 pr-2 border-r border-border/60">
          <Switch
            checked={row.is_active}
            onCheckedChange={onToggle}
            disabled={busy}
            aria-label={tc.active}
          />
        </div>
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

function ServiceEditor({
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
  const tt = t.admin.services;
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
  const canSave = form.name.trim().length > 0 && form.icon.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-lg">
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
            <Label htmlFor="svc-name">{tt.fields.name}</Label>
            <Input
              id="svc-name"
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="svc-desc">{tt.fields.description}</Label>
            <Textarea
              id="svc-desc"
              rows={3}
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="svc-price">{tt.fields.price}</Label>
              <Input
                id="svc-price"
                value={form.price}
                onChange={(e) => patch({ price: e.target.value })}
                placeholder="₺500'den başlar"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="svc-order">{tt.fields.sortOrder}</Label>
              <Input
                id="svc-order"
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) =>
                  patch({ sort_order: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="svc-icon">{tt.fields.icon}</Label>
            <Input
              id="svc-icon"
              value={form.icon}
              onChange={(e) => patch({ icon: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">{tt.fields.iconHint}</p>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => patch({ is_active: v })}
            />
            {tt.fields.isActive}
          </label>
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
