import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ImageOff, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import {
  isWebpEncodeSupported,
  uploadGalleryImage,
} from "@/lib/gallery-upload";
import {
  adminDeleteGallery,
  adminListGallery,
  adminToggleGallery,
  adminUpsertGallery,
  type GalleryRow,
} from "@/lib/admin/gallery.functions";
import { t } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  url: string;
  alt: string;
  sort_order: number;
  is_active: boolean;
};

const emptyForm = (nextOrder: number): FormState => ({
  language: "tr",
  url: "",
  alt: "",
  sort_order: nextOrder,
  is_active: true,
});

export function GalleryTab() {
  const qc = useQueryClient();
  const tt = t.admin.gallery;
  const tc = t.admin.common;
  const list = useServerFn(adminListGallery);
  const upsert = useServerFn(adminUpsertGallery);
  const toggle = useServerFn(adminToggleGallery);
  const del = useServerFn(adminDeleteGallery);

  const query = useQuery({
    queryKey: ["admin", "gallery", "tr"],
    queryFn: () => list({ data: { language: "tr" } }),
  });

  const [editing, setEditing] = useState<FormState | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "gallery"] });
    qc.invalidateQueries({ queryKey: ["public-site-data"] });
  };

  const upsertMut = useMutation({
    mutationFn: (f: FormState) => upsert({ data: f }),
    onSuccess: (_r, f) => {
      toast.success(f.id ? tt.toastUpdated : tt.toastCreated);
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {query.data!.map((row) => (
            <GalleryCard
              key={row.id}
              row={row}
              onEdit={() =>
                setEditing({
                  id: row.id,
                  language: row.language,
                  url: row.url,
                  alt: row.alt,
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

      <GalleryEditor
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
              {query.data?.find((r) => r.id === deletingId)?.alt ||
                query.data?.find((r) => r.id === deletingId)?.url}
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

function GalleryCard({
  row,
  onEdit,
  onDelete,
  onToggle,
  busy,
}: {
  row: GalleryRow;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (v: boolean) => void;
  busy: boolean;
}) {
  const tc = t.admin.common;
  const [failed, setFailed] = useState(false);
  return (
    <div className="rounded-xl border border-border/60 bg-background/50 overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3] bg-muted flex items-center justify-center">
        {failed ? (
          <div className="flex flex-col items-center gap-1 text-muted-foreground text-xs">
            <ImageOff size={20} />
            {t.admin.gallery.previewFailed}
          </div>
        ) : (
          <img
            src={row.url}
            alt={row.alt}
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
            loading="lazy"
          />
        )}
        {!row.is_active && (
          <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wider rounded-full bg-background/90 px-2 py-0.5 text-muted-foreground border border-border">
            {tc.inactive}
          </span>
        )}
        <span className="absolute top-2 right-2 text-[10px] rounded-full bg-background/90 px-2 py-0.5 border border-border">
          #{row.sort_order}
        </span>
      </div>
      <div className="p-3 flex items-center gap-2">
        <p className="text-xs text-muted-foreground flex-1 truncate">
          {row.alt || row.url}
        </p>
        <Switch
          checked={row.is_active}
          onCheckedChange={onToggle}
          disabled={busy}
          aria-label={tc.active}
        />
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

function GalleryEditor({
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
  const tt = t.admin.gallery;
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
  let urlOk = false;
  try {
    if (form.url) {
      const u = new URL(form.url);
      urlOk = u.protocol === "http:" || u.protocol === "https:";
    }
  } catch {
    urlOk = false;
  }
  const canSave = urlOk;

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
            <Label htmlFor="gal-url">{tt.fields.url}</Label>
            <Input
              id="gal-url"
              type="url"
              value={form.url}
              onChange={(e) => patch({ url: e.target.value })}
              placeholder="https://…/photo.jpg"
              required
            />
            <p className="text-xs text-muted-foreground">{tt.fields.urlHint}</p>
          </div>
          {urlOk && (
            <div className="rounded-lg overflow-hidden border border-border/60 bg-muted aspect-[4/3]">
              <img
                src={form.url}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="gal-alt">{tt.fields.alt}</Label>
            <Input
              id="gal-alt"
              value={form.alt}
              onChange={(e) => patch({ alt: e.target.value })}
              placeholder="Salon iç mekân"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gal-order">{tt.fields.sortOrder}</Label>
            <Input
              id="gal-order"
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) =>
                patch({ sort_order: Number(e.target.value) || 0 })
              }
            />
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => patch({ is_active: v })}
            />
            {tt.fields.isActive}
          </label>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={pending}
            >
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
