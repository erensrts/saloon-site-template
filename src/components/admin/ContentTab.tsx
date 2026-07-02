import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ImageOff,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import {
  adminListSiteContent,
  adminUpsertSiteContent,
  type JsonValue,
  type SiteContentRow,
} from "@/lib/admin/site-content.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/i18n";
import { siteConfig } from "@/config/site.config";
import {
  isWebpEncodeSupported,
  uploadGalleryImage,
} from "@/lib/gallery-upload";
import { cn } from "@/lib/utils";

// ---------- Shapes ----------
type HeroValue = {
  businessName: string;
  businessNameSuffix: string;
  tagline: string;
  subtitle: string;
  cta: string;
};
type AboutValue = {
  title: string;
  subtitle: string;
  paragraphs: string[];
};
type TeamMember = { name: string; role: string; image: string };
type TeamValue = { members: TeamMember[] };
type TestimonialItem = { name: string; text: string; rating: number };
type TestimonialsValue = { items: TestimonialItem[] };
type ContactValue = {
  phone: string;
  whatsapp: string;
  whatsappMessage: string;
  whatsappLabel: string;
  email: string;
  address: string;
  mapEmbed: string;
};
type SocialValue = {
  instagram: string;
  facebook: string;
  tiktok: string;
};

// ---------- Defaults (from bundled config) ----------
const defaults = {
  hero: {
    businessName: siteConfig.businessName,
    businessNameSuffix: siteConfig.businessNameSuffix,
    tagline: siteConfig.tagline,
    subtitle: siteConfig.heroSubtitle,
    cta: siteConfig.heroCta,
  } satisfies HeroValue,
  about: {
    title: siteConfig.about.title,
    subtitle: siteConfig.about.subtitle,
    paragraphs: [...siteConfig.about.paragraphs],
  } satisfies AboutValue,
  team: {
    members: siteConfig.team.map((m) => ({
      name: m.name,
      role: m.role,
      image: typeof m.image === "string" ? m.image : "",
    })),
  } satisfies TeamValue,
  testimonials: {
    items: siteConfig.testimonials.map((it) => ({
      name: it.name,
      text: it.text,
      rating: it.rating,
    })),
  } satisfies TestimonialsValue,
  contact: {
    phone: siteConfig.contact.phone,
    whatsapp: siteConfig.contact.whatsapp,
    whatsappMessage: siteConfig.contact.whatsappMessage,
    whatsappLabel: siteConfig.contact.whatsappLabel,
    email: siteConfig.contact.email,
    address: siteConfig.contact.address,
    mapEmbed: siteConfig.contact.mapEmbed,
  } satisfies ContactValue,
  social: {
    instagram: siteConfig.social.instagram,
    facebook: siteConfig.social.facebook,
    tiktok: siteConfig.social.tiktok,
  } satisfies SocialValue,
};

// ---------- Utilities ----------
function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function s(v: unknown, fb = ""): string {
  return typeof v === "string" ? v : fb;
}
function n(v: unknown, fb: number): number {
  return typeof v === "number" && !Number.isNaN(v) ? v : fb;
}
function toJson<T>(v: T): JsonValue {
  return JSON.parse(JSON.stringify(v)) as JsonValue;
}
function eq(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
function parseHero(v: JsonValue | undefined): HeroValue {
  const o = isObj(v) ? v : {};
  return {
    businessName: s(o.businessName, defaults.hero.businessName),
    businessNameSuffix: s(
      o.businessNameSuffix,
      defaults.hero.businessNameSuffix,
    ),
    tagline: s(o.tagline, defaults.hero.tagline),
    subtitle: s(o.subtitle, defaults.hero.subtitle),
    cta: s(o.cta, defaults.hero.cta),
  };
}
function parseAbout(v: JsonValue | undefined): AboutValue {
  const o = isObj(v) ? v : {};
  const p = Array.isArray(o.paragraphs)
    ? o.paragraphs.map((x) => s(x, "")).filter((x) => x.length > 0)
    : [...defaults.about.paragraphs];
  return {
    title: s(o.title, defaults.about.title),
    subtitle: s(o.subtitle, defaults.about.subtitle),
    paragraphs: p.length ? p : [""],
  };
}
function parseTeam(v: JsonValue | undefined): TeamValue {
  const o = isObj(v) ? v : {};
  const arr = Array.isArray(o.members) ? o.members : [];
  const members: TeamMember[] = [];
  for (const raw of arr) {
    if (!isObj(raw)) continue;
    members.push({
      name: s(raw.name),
      role: s(raw.role),
      image: s(raw.image),
    });
  }
  return { members: members.length ? members : [...defaults.team.members] };
}
function parseTestimonials(v: JsonValue | undefined): TestimonialsValue {
  const o = isObj(v) ? v : {};
  const arr = Array.isArray(o.items) ? o.items : [];
  const items: TestimonialItem[] = [];
  for (const raw of arr) {
    if (!isObj(raw)) continue;
    items.push({
      name: s(raw.name),
      text: s(raw.text),
      rating: Math.max(1, Math.min(5, Math.round(n(raw.rating, 5)))),
    });
  }
  return {
    items: items.length ? items : [...defaults.testimonials.items],
  };
}
function parseContact(v: JsonValue | undefined): ContactValue {
  const o = isObj(v) ? v : {};
  return {
    phone: s(o.phone, defaults.contact.phone),
    whatsapp: s(o.whatsapp, defaults.contact.whatsapp),
    whatsappMessage: s(o.whatsappMessage, defaults.contact.whatsappMessage),
    whatsappLabel: s(o.whatsappLabel, defaults.contact.whatsappLabel),
    email: s(o.email, defaults.contact.email),
    address: s(o.address, defaults.contact.address),
    mapEmbed: s(o.mapEmbed, defaults.contact.mapEmbed),
  };
}
function parseSocial(v: JsonValue | undefined): SocialValue {
  const o = isObj(v) ? v : {};
  return {
    instagram: s(o.instagram, defaults.social.instagram),
    facebook: s(o.facebook, defaults.social.facebook),
    tiktok: s(o.tiktok, defaults.social.tiktok),
  };
}

/** Extract iframe src from either raw iframe HTML or a bare URL. */
function normalizeMapEmbed(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const iframeMatch = trimmed.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  const candidate = iframeMatch ? iframeMatch[1] : trimmed;
  try {
    const u = new URL(candidate);
    if (u.protocol !== "https:") return null;
    if (!/(^|\.)google\.[^/]+$/i.test(u.hostname)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

function isValidHttpsUrl(v: string): boolean {
  if (!v) return true; // empty allowed
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

// ---------- Component ----------
export function ContentTab() {
  const tc = t.admin.content;
  const tCommon = t.admin.common;
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["admin", "site-content", "tr"],
    queryFn: () => adminListSiteContent({ data: { language: "tr" } }),
    staleTime: 30_000,
  });

  const rowsByKey = useMemo(() => {
    const m = new Map<string, SiteContentRow>();
    for (const r of listQuery.data ?? []) m.set(r.key, r);
    return m;
  }, [listQuery.data]);

  const upsertMut = useMutation({
    mutationFn: async (input: { key: string; value: JsonValue }) =>
      adminUpsertSiteContent({
        data: { language: "tr", key: input.key, value: input.value },
      }),
    onSuccess: () => {
      toast.success(tc.toastSaved);
      qc.invalidateQueries({ queryKey: ["admin", "site-content"] });
      qc.invalidateQueries({ queryKey: ["public-site-data"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : tCommon.error),
  });

  if (listQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {tCommon.loading}
      </div>
    );
  }
  if (listQuery.isError) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
        {tCommon.error}
      </div>
    );
  }

  const savingKey = upsertMut.isPending
    ? upsertMut.variables?.key
    : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl leading-tight">{tc.title}</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          {tc.subtitle}
        </p>
      </div>

      <HeroSection
        row={rowsByKey.get("hero")}
        saving={savingKey === "hero"}
        onSave={(v) => upsertMut.mutate({ key: "hero", value: toJson(v) })}
      />
      <AboutSection
        row={rowsByKey.get("about")}
        saving={savingKey === "about"}
        onSave={(v) => upsertMut.mutate({ key: "about", value: toJson(v) })}
      />
      <TeamSection
        row={rowsByKey.get("team")}
        saving={savingKey === "team"}
        onSave={(v) => upsertMut.mutate({ key: "team", value: toJson(v) })}
      />
      <TestimonialsSection
        row={rowsByKey.get("testimonials")}
        saving={savingKey === "testimonials"}
        onSave={(v) =>
          upsertMut.mutate({ key: "testimonials", value: toJson(v) })
        }
      />
      <ContactSection
        row={rowsByKey.get("contact")}
        saving={savingKey === "contact"}
        onSave={(v) => upsertMut.mutate({ key: "contact", value: toJson(v) })}
      />
      <SocialSection
        row={rowsByKey.get("social")}
        saving={savingKey === "social"}
        onSave={(v) => upsertMut.mutate({ key: "social", value: toJson(v) })}
      />
    </div>
  );
}

// ---------- Section shell ----------
function SectionShell({
  title,
  dirty,
  saving,
  onReset,
  onSave,
  canSave = true,
  children,
}: {
  title: string;
  dirty: boolean;
  saving: boolean;
  onReset: () => void;
  onSave: () => void;
  canSave?: boolean;
  children: React.ReactNode;
}) {
  const tc = t.admin.content;
  const tCommon = t.admin.common;
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg">{title}</h3>
          {dirty && (
            <span className="text-[11px] rounded-full bg-primary/10 text-primary px-2 py-0.5">
              {tc.unsaved}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              {tc.resetSection}
            </Button>
          )}
          <Button
            size="sm"
            onClick={onSave}
            disabled={!dirty || saving || !canSave}
          >
            {saving ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                {tCommon.saving}
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {tc.saveSection}
              </>
            )}
          </Button>
        </div>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

// ---------- Hero ----------
function HeroSection({
  row,
  saving,
  onSave,
}: {
  row: SiteContentRow | undefined;
  saving: boolean;
  onSave: (v: HeroValue) => void;
}) {
  const tc = t.admin.content;
  const base = useMemo(() => parseHero(row?.value), [row]);
  const [form, setForm] = useState<HeroValue>(base);
  useEffect(() => setForm(base), [base]);
  const dirty = !eq(form, base);
  const patch = (p: Partial<HeroValue>) => setForm((f) => ({ ...f, ...p }));

  return (
    <SectionShell
      title={tc.sections.hero}
      dirty={dirty}
      saving={saving}
      onReset={() => setForm(base)}
      onSave={() => onSave(form)}
    >
      <Field label={tc.hero.businessName}>
        <Input
          value={form.businessName}
          onChange={(e) => patch({ businessName: e.target.value })}
        />
      </Field>
      <Field label={tc.hero.businessNameSuffix}>
        <Input
          value={form.businessNameSuffix}
          onChange={(e) => patch({ businessNameSuffix: e.target.value })}
        />
      </Field>
      <Field label={tc.hero.tagline}>
        <Input
          value={form.tagline}
          onChange={(e) => patch({ tagline: e.target.value })}
        />
      </Field>
      <Field label={tc.hero.subtitle}>
        <Textarea
          rows={3}
          value={form.subtitle}
          onChange={(e) => patch({ subtitle: e.target.value })}
        />
      </Field>
      <Field label={tc.hero.cta}>
        <Input
          value={form.cta}
          onChange={(e) => patch({ cta: e.target.value })}
        />
      </Field>
    </SectionShell>
  );
}

// ---------- About ----------
function AboutSection({
  row,
  saving,
  onSave,
}: {
  row: SiteContentRow | undefined;
  saving: boolean;
  onSave: (v: AboutValue) => void;
}) {
  const tc = t.admin.content;
  const base = useMemo(() => parseAbout(row?.value), [row]);
  const [form, setForm] = useState<AboutValue>(base);
  useEffect(() => setForm(base), [base]);
  const dirty = !eq(form, base);

  const setPara = (i: number, val: string) =>
    setForm((f) => ({
      ...f,
      paragraphs: f.paragraphs.map((p, idx) => (idx === i ? val : p)),
    }));
  const addPara = () =>
    setForm((f) => ({ ...f, paragraphs: [...f.paragraphs, ""] }));
  const removePara = (i: number) =>
    setForm((f) => ({
      ...f,
      paragraphs: f.paragraphs.filter((_, idx) => idx !== i),
    }));

  return (
    <SectionShell
      title={tc.sections.about}
      dirty={dirty}
      saving={saving}
      onReset={() => setForm(base)}
      onSave={() => {
        const clean = {
          ...form,
          paragraphs: form.paragraphs.map((p) => p.trim()).filter(Boolean),
        };
        onSave(clean);
      }}
    >
      <Field label={tc.about.heading}>
        <Input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </Field>
      <Field label={tc.about.subheading}>
        <Input
          value={form.subtitle}
          onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
        />
      </Field>
      <div className="space-y-2">
        <Label>{tc.about.paragraphs}</Label>
        {form.paragraphs.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {tc.about.emptyParagraphs}
          </p>
        ) : (
          <div className="space-y-3">
            {form.paragraphs.map((p, i) => (
              <div key={i} className="flex items-start gap-2">
                <Textarea
                  rows={3}
                  value={p}
                  onChange={(e) => setPara(i, e.target.value)}
                  placeholder={tc.about.paragraphPlaceholder}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removePara(i)}
                  aria-label={tc.about.removeParagraph}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPara}
          className="rounded-full"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {tc.about.addParagraph}
        </Button>
      </div>
    </SectionShell>
  );
}

// ---------- Team ----------
function TeamSection({
  row,
  saving,
  onSave,
}: {
  row: SiteContentRow | undefined;
  saving: boolean;
  onSave: (v: TeamValue) => void;
}) {
  const tc = t.admin.content;
  const base = useMemo(() => parseTeam(row?.value), [row]);
  const [form, setForm] = useState<TeamValue>(base);
  useEffect(() => setForm(base), [base]);
  const dirty = !eq(form, base);

  const setMember = (i: number, p: Partial<TeamMember>) =>
    setForm((f) => ({
      ...f,
      members: f.members.map((m, idx) => (idx === i ? { ...m, ...p } : m)),
    }));
  const addMember = () =>
    setForm((f) => ({
      ...f,
      members: [...f.members, { name: "", role: "", image: "" }],
    }));
  const removeMember = (i: number) =>
    setForm((f) => ({
      ...f,
      members: f.members.filter((_, idx) => idx !== i),
    }));

  return (
    <SectionShell
      title={tc.sections.team}
      dirty={dirty}
      saving={saving}
      onReset={() => setForm(base)}
      onSave={() => onSave(form)}
    >
      {form.members.length === 0 && (
        <p className="text-xs text-muted-foreground">{tc.team.empty}</p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {form.members.map((m, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <PhotoUploader
                value={m.image}
                onChange={(url) => setMember(i, { image: url })}
              />
              <div className="flex-1 space-y-2">
                <Field label={tc.team.name}>
                  <Input
                    value={m.name}
                    onChange={(e) => setMember(i, { name: e.target.value })}
                  />
                </Field>
                <Field label={tc.team.role}>
                  <Input
                    value={m.role}
                    onChange={(e) => setMember(i, { role: e.target.value })}
                  />
                </Field>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => removeMember(i)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                {tc.team.removeMember}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addMember}
        className="rounded-full"
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        {tc.team.addMember}
      </Button>
    </SectionShell>
  );
}

// ---------- Testimonials ----------
function TestimonialsSection({
  row,
  saving,
  onSave,
}: {
  row: SiteContentRow | undefined;
  saving: boolean;
  onSave: (v: TestimonialsValue) => void;
}) {
  const tc = t.admin.content;
  const base = useMemo(() => parseTestimonials(row?.value), [row]);
  const [form, setForm] = useState<TestimonialsValue>(base);
  useEffect(() => setForm(base), [base]);
  const dirty = !eq(form, base);

  const setItem = (i: number, p: Partial<TestimonialItem>) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, idx) => (idx === i ? { ...it, ...p } : it)),
    }));
  const addItem = () =>
    setForm((f) => ({
      ...f,
      items: [...f.items, { name: "", text: "", rating: 5 }],
    }));
  const removeItem = (i: number) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  return (
    <SectionShell
      title={tc.sections.testimonials}
      dirty={dirty}
      saving={saving}
      onReset={() => setForm(base)}
      onSave={() => onSave(form)}
    >
      {form.items.length === 0 && (
        <p className="text-xs text-muted-foreground">
          {tc.testimonials.empty}
        </p>
      )}
      <div className="space-y-3">
        {form.items.map((it, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-3"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <Field label={tc.testimonials.customerName}>
                <Input
                  value={it.name}
                  onChange={(e) => setItem(i, { name: e.target.value })}
                />
              </Field>
              <Field label={tc.testimonials.rating}>
                <StarPicker
                  value={it.rating}
                  onChange={(r) => setItem(i, { rating: r })}
                />
              </Field>
            </div>
            <Field label={tc.testimonials.text}>
              <Textarea
                rows={3}
                value={it.text}
                onChange={(e) => setItem(i, { text: e.target.value })}
              />
            </Field>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => removeItem(i)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                {tc.testimonials.removeItem}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
        className="rounded-full"
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        {tc.testimonials.addItem}
      </Button>
    </SectionShell>
  );
}

// ---------- Contact ----------
function ContactSection({
  row,
  saving,
  onSave,
}: {
  row: SiteContentRow | undefined;
  saving: boolean;
  onSave: (v: ContactValue) => void;
}) {
  const tc = t.admin.content;
  const base = useMemo(() => parseContact(row?.value), [row]);
  const [form, setForm] = useState<ContactValue>(base);
  const [mapDraft, setMapDraft] = useState(base.mapEmbed);
  useEffect(() => {
    setForm(base);
    setMapDraft(base.mapEmbed);
  }, [base]);
  const patch = (p: Partial<ContactValue>) => setForm((f) => ({ ...f, ...p }));

  const normalized = normalizeMapEmbed(mapDraft);
  const mapValid = normalized !== null;
  const effectiveForm: ContactValue = {
    ...form,
    mapEmbed: normalized ?? form.mapEmbed,
  };
  const dirty = !eq(effectiveForm, base);

  return (
    <SectionShell
      title={tc.sections.contact}
      dirty={dirty}
      saving={saving}
      onReset={() => {
        setForm(base);
        setMapDraft(base.mapEmbed);
      }}
      onSave={() => {
        if (!mapValid) return;
        onSave(effectiveForm);
      }}
      canSave={mapValid}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={tc.contact.phone}>
          <Input
            value={form.phone}
            onChange={(e) => patch({ phone: e.target.value })}
          />
        </Field>
        <Field label={tc.contact.whatsapp}>
          <Input
            value={form.whatsapp}
            onChange={(e) => patch({ whatsapp: e.target.value })}
          />
        </Field>
        <Field label={tc.contact.whatsappMessage}>
          <Input
            value={form.whatsappMessage}
            onChange={(e) => patch({ whatsappMessage: e.target.value })}
          />
        </Field>
        <Field label={tc.contact.whatsappLabel}>
          <Input
            value={form.whatsappLabel}
            onChange={(e) => patch({ whatsappLabel: e.target.value })}
          />
        </Field>
        <Field label={tc.contact.email}>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => patch({ email: e.target.value })}
          />
        </Field>
        <Field label={tc.contact.address}>
          <Input
            value={form.address}
            onChange={(e) => patch({ address: e.target.value })}
          />
        </Field>
      </div>
      <div className="space-y-2">
        <Label>{tc.contact.mapEmbed}</Label>
        <Textarea
          rows={3}
          value={mapDraft}
          onChange={(e) => setMapDraft(e.target.value)}
          placeholder={tc.contact.mapEmbedPlaceholder}
          spellCheck={false}
          className={cn("font-mono text-xs", !mapValid && "border-destructive")}
        />
        <p className="text-xs text-muted-foreground">
          {tc.contact.mapEmbedHint}
        </p>
        {!mapValid && (
          <p className="text-xs text-destructive">{tc.contact.mapInvalid}</p>
        )}
        {mapValid && normalized && (
          <div className="rounded-lg overflow-hidden border border-border/60 aspect-video bg-muted">
            <iframe
              title="map-preview"
              src={normalized}
              className="w-full h-full"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </SectionShell>
  );
}

// ---------- Social ----------
function SocialSection({
  row,
  saving,
  onSave,
}: {
  row: SiteContentRow | undefined;
  saving: boolean;
  onSave: (v: SocialValue) => void;
}) {
  const tc = t.admin.content;
  const base = useMemo(() => parseSocial(row?.value), [row]);
  const [form, setForm] = useState<SocialValue>(base);
  useEffect(() => setForm(base), [base]);
  const dirty = !eq(form, base);
  const patch = (p: Partial<SocialValue>) => setForm((f) => ({ ...f, ...p }));

  const errors = {
    instagram: !isValidHttpsUrl(form.instagram),
    facebook: !isValidHttpsUrl(form.facebook),
    tiktok: !isValidHttpsUrl(form.tiktok),
  };
  const anyError = errors.instagram || errors.facebook || errors.tiktok;

  return (
    <SectionShell
      title={tc.sections.social}
      dirty={dirty}
      saving={saving}
      onReset={() => setForm(base)}
      onSave={() => onSave(form)}
      canSave={!anyError}
    >
      {(["instagram", "facebook", "tiktok"] as const).map((k) => (
        <div key={k} className="space-y-1">
          <Label>{tc.social[k]}</Label>
          <Input
            type="url"
            value={form[k]}
            onChange={(e) => patch({ [k]: e.target.value } as Partial<SocialValue>)}
            placeholder="https://…"
            className={cn(errors[k] && "border-destructive")}
          />
          {errors[k] && (
            <p className="text-xs text-destructive">{tc.social.urlInvalid}</p>
          )}
        </div>
      ))}
    </SectionShell>
  );
}

// ---------- Small helpers ----------
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value;
  return (
    <div
      className="flex items-center gap-1"
      onMouseLeave={() => setHover(null)}
      role="radiogroup"
      aria-label="rating"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange(i)}
          aria-label={`${i}`}
          className="p-0.5 cursor-pointer"
        >
          <Star
            className={cn(
              "h-6 w-6 transition-colors",
              i <= active
                ? "fill-primary text-primary"
                : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
      <span className="ml-2 text-xs text-muted-foreground">{value}/5</span>
    </div>
  );
}

function PhotoUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const tc = t.admin.content;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [webpSupported] = useState(() =>
    typeof document !== "undefined" ? isWebpEncodeSupported() : true,
  );

  useEffect(() => setFailed(false), [value]);

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t.admin.gallery.toastUnsupportedFile);
      return;
    }
    setUploading(true);
    try {
      const res = await uploadGalleryImage(file);
      onChange(res.publicUrl);
      toast.success(t.admin.gallery.toastUploaded);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "file_too_large")
        toast.error(t.admin.gallery.toastFileTooLarge);
      else if (msg === "unsupported_file_type")
        toast.error(t.admin.gallery.toastUnsupportedFile);
      else
        toast.error(
          `${t.admin.gallery.toastUploadFailed}: ${msg || t.admin.common.error}`,
        );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 w-28 shrink-0">
      <div className="relative h-24 w-24 rounded-full overflow-hidden bg-muted border border-border/60 flex items-center justify-center">
        {value && !failed ? (
          <img
            src={value}
            alt={tc.imagePreviewAlt}
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <ImageOff className="h-5 w-5 text-muted-foreground/60" />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="animate-spin h-3.5 w-3.5" />
            {t.admin.content.team.photoUploading}
          </>
        ) : (
          <>
            <Upload className="h-3.5 w-3.5" />
            {value
              ? t.admin.content.team.replacePhoto
              : t.admin.content.team.uploadPhoto}
          </>
        )}
      </Button>
      {!webpSupported && (
        <p className="text-[10px] text-amber-600 text-center leading-tight">
          {t.admin.gallery.fields.webpFallback}
        </p>
      )}
    </div>
  );
}
