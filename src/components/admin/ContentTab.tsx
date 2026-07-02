import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2, RotateCcw } from "lucide-react";
import {
  adminListSiteContent,
  adminUpsertSiteContent,
  adminDeleteSiteContent,
  type SiteContentRow,
  type JsonValue,
} from "@/lib/admin/site-content.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { t } from "@/i18n";

type KnownKey = keyof (typeof t)["admin"]["content"]["knownKeys"];

const KEY_HINTS: Record<
  string,
  { fields: string[]; template: JsonValue }
> = {
  hero: {
    fields: [
      "businessName",
      "businessNameSuffix",
      "tagline",
      "subtitle",
      "cta",
    ],
    template: {
      businessName: "",
      businessNameSuffix: "",
      tagline: "",
      subtitle: "",
      cta: "Randevu Al",
    },
  },
  about: {
    fields: ["title", "subtitle", "paragraphs (string[])"],
    template: { title: "", subtitle: "", paragraphs: [""] },
  },
  team: {
    fields: ["members: [{ name, role, image }]"],
    template: { members: [{ name: "", role: "", image: "" }] },
  },
  testimonials: {
    fields: ["items: [{ name, text, rating (1-5) }]"],
    template: { items: [{ name: "", text: "", rating: 5 }] },
  },
  contact: {
    fields: [
      "phone",
      "whatsapp",
      "whatsappMessage",
      "whatsappLabel",
      "email",
      "address",
      "mapEmbed",
    ],
    template: {
      phone: "",
      whatsapp: "",
      whatsappMessage: "",
      whatsappLabel: "",
      email: "",
      address: "",
      mapEmbed: "",
    },
  },
  social: {
    fields: ["instagram", "facebook", "tiktok"],
    template: { instagram: "", facebook: "", tiktok: "" },
  },
};

function prettyJson(v: JsonValue): string {
  return JSON.stringify(v ?? {}, null, 2);
}

export function ContentTab() {
  const tc = t.admin.content;
  const tCommon = t.admin.common;
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["admin", "site-content", "tr"],
    queryFn: () => adminListSiteContent({ data: { language: "tr" } }),
    staleTime: 30_000,
  });

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("{\n  \n}");

  const rowsByKey = useMemo(() => {
    const m = new Map<string, SiteContentRow>();
    for (const r of listQuery.data ?? []) m.set(r.key, r);
    return m;
  }, [listQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (input: { key: string; value: JsonValue }) =>
      adminUpsertSiteContent({
        data: { language: "tr", key: input.key, value: input.value },
      }),
    onSuccess: (_row, vars) => {
      toast.success(tc.toastSaved);
      setDrafts((d) => {
        const next = { ...d };
        delete next[vars.key];
        return next;
      });
      qc.invalidateQueries({ queryKey: ["admin", "site-content"] });
      qc.invalidateQueries({ queryKey: ["public-site-data"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : tCommon.error),
  });

  const deleteMutation = useMutation({
    mutationFn: async (key: string) =>
      adminDeleteSiteContent({ data: { language: "tr", key } }),
    onSuccess: (_r, key) => {
      toast.success(tc.toastDeleted);
      setDrafts((d) => {
        const next = { ...d };
        delete next[key];
        return next;
      });
      qc.invalidateQueries({ queryKey: ["admin", "site-content"] });
      qc.invalidateQueries({ queryKey: ["public-site-data"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : tCommon.error),
  });

  const handleSave = (key: string, currentValue: JsonValue) => {
    const raw = drafts[key] ?? prettyJson(currentValue);
    let parsed: JsonValue;
    try {
      parsed = JSON.parse(raw) as JsonValue;
    } catch {
      toast.error(tc.invalidJson);
      return;
    }
    saveMutation.mutate({ key, value: parsed });
  };

  const handleCreate = () => {
    const key = newKey.trim();
    if (!key || !/^[a-z][a-z0-9_]*$/.test(key)) {
      toast.error(tCommon.error);
      return;
    }
    let parsed: JsonValue;
    try {
      parsed = JSON.parse(newValue) as JsonValue;
    } catch {
      toast.error(tc.invalidJson);
      return;
    }
    saveMutation.mutate(
      { key, value: parsed },
      {
        onSuccess: () => {
          setAddOpen(false);
          setNewKey("");
          setNewValue("{\n  \n}");
        },
      },
    );
  };

  const startWithTemplate = (key: string) => {
    setNewKey(key);
    const hint = KEY_HINTS[key];
    setNewValue(prettyJson(hint?.template ?? {}));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-2xl leading-tight">{tc.title}</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            {tc.subtitle}
          </p>
        </div>
        <Button
          onClick={() => {
            setNewKey("");
            setNewValue("{\n  \n}");
            setAddOpen(true);
          }}
          className="rounded-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          {tc.addNew}
        </Button>
      </div>

      {listQuery.isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {tCommon.loading}
        </div>
      ) : listQuery.isError ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
          {tCommon.error}
        </div>
      ) : (listQuery.data ?? []).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card p-10 text-center text-muted-foreground">
          {tCommon.empty}
        </div>
      ) : (
        <div className="space-y-4">
          {(listQuery.data ?? []).map((row) => {
            const draft = drafts[row.key];
            const isDirty = draft !== undefined && draft !== prettyJson(row.value);
            const hint = KEY_HINTS[row.key];
            const knownLabel =
              tc.knownKeys[row.key as KnownKey] ?? undefined;
            return (
              <div
                key={row.id}
                className="rounded-2xl border border-border/60 bg-card p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm bg-secondary px-2 py-0.5 rounded">
                        {row.key}
                      </code>
                      {isDirty && (
                        <span className="text-xs text-primary">●</span>
                      )}
                    </div>
                    {knownLabel && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {knownLabel}
                      </p>
                    )}
                    {hint && (
                      <p className="text-[11px] text-muted-foreground/80 mt-1">
                        <span className="font-medium">{tc.shapeHint}:</span>{" "}
                        {hint.fields.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {isDirty && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setDrafts((d) => {
                            const n = { ...d };
                            delete n[row.key];
                            return n;
                          })
                        }
                      >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        {tc.reset}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!confirm(tc.confirmDelete)) return;
                        deleteMutation.mutate(row.key);
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      {tCommon.delete}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSave(row.key, row.value)}
                      disabled={!isDirty || saveMutation.isPending}
                    >
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                      {saveMutation.isPending ? tCommon.saving : tCommon.save}
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={draft ?? prettyJson(row.value)}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [row.key]: e.target.value }))
                  }
                  spellCheck={false}
                  className="font-mono text-xs min-h-[220px] leading-relaxed"
                />
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{tc.addNew}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-key">{tc.keyLabel}</Label>
              <Input
                id="new-key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder={tc.newKeyPlaceholder}
                className="mt-1.5"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.keys(KEY_HINTS).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => startWithTemplate(k)}
                    className="text-[11px] rounded-full border border-border px-2 py-0.5 hover:bg-accent transition"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="new-value">{tc.valueLabel}</Label>
              <Textarea
                id="new-value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                spellCheck={false}
                placeholder={tc.newValuePlaceholder}
                className="mt-1.5 font-mono text-xs min-h-[240px] leading-relaxed"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              {tCommon.cancel}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? tCommon.saving : tCommon.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
