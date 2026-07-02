import { useState } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { t, intlLocale } from "@/i18n";
import { useSiteData } from "./SiteDataProvider";

const v = t.booking.validation;
const bookingSchema = z.object({
  name: z.string().trim().min(2, v.name).max(100),
  phone: z
    .string()
    .trim()
    .min(7, v.phone)
    .max(25)
    .regex(/^[+\d\s()-]+$/, v.phone),
  email: z
    .string()
    .trim()
    .max(255)
    .email(v.email)
    .optional()
    .or(z.literal("")),
  service: z.string().min(1, v.service),
  date: z.string().min(1, v.date),
  time: z.string().min(1, v.time),
  note: z.string().max(500).optional().or(z.literal("")),
});

function formatDateLocalized(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  try {
    return new Intl.DateTimeFormat(intlLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return iso;
  }
}

export function Booking() {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);

    const raw = {
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
      service: String(fd.get("service") ?? ""),
      date: String(fd.get("date") ?? ""),
      time: String(fd.get("time") ?? ""),
      note: String(fd.get("note") ?? ""),
    };

    const parsed = bookingSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? t.booking.validation.generic;
      toast.error(first);
      return;
    }

    setSubmitting(true);
    const val = parsed.data;
    const wa = t.booking.waMessage;

    const lines = [
      wa.intro,
      "",
      `${wa.name}: ${val.name}`,
      `${wa.phone}: ${val.phone}`,
      ...(val.email ? [`${wa.email}: ${val.email}`] : []),
      `${wa.service}: ${val.service}`,
      `${wa.date}: ${formatDateLocalized(val.date)}`,
      `${wa.time}: ${val.time}`,
      ...(val.note ? [`${wa.note}: ${val.note}`] : []),
    ];
    const message = lines.join("\n");
    const url = `https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank", "noopener,noreferrer");
    toast.success(t.booking.toastSuccess);
    formEl.reset();
    setSubmitting(false);
  };

  const f = t.booking.fields;

  return (
    <section id="booking" className="section-padding bg-secondary/40">
      <div className="container-narrow">
        <div className="max-w-2xl mb-12 md:mb-16">
          <p className="text-primary text-sm uppercase tracking-[0.2em] mb-3">{t.booking.eyebrow}</p>
          <h2 className="text-4xl md:text-5xl font-medium leading-tight">
            {t.booking.heading}
          </h2>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <form
            onSubmit={onSubmit}
            className="lg:col-span-3 rounded-2xl bg-card border border-border/60 p-6 md:p-8 space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={f.name} name="name" type="text" required />
              <Field label={f.phone} name="phone" type="tel" required />
            </div>
            <Field label={f.email} name="email" type="email" />
            <div>
              <label className="block text-sm font-medium mb-1.5">{f.service}</label>
              <select
                name="service"
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">{f.servicePlaceholder}</option>
                {siteConfig.services.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={f.date} name="date" type="date" required />
              <Field label={f.time} name="time" type="time" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{f.note}</label>
              <textarea
                name="note"
                rows={3}
                maxLength={500}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-primary py-3.5 font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60"
            >
              {submitting ? t.booking.submitting : t.booking.submit}
            </button>
          </form>

          {/* Info */}
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-2xl bg-card border border-border/60 p-6 space-y-4">
              <InfoRow icon={<MapPin size={18} />} title={t.booking.info.address} content={siteConfig.contact.address} />
              <InfoRow icon={<Phone size={18} />} title={t.booking.info.phone} content={siteConfig.contact.phone} />
              <InfoRow icon={<Mail size={18} />} title={t.booking.info.email} content={siteConfig.contact.email} />
              <div className="flex gap-3 pt-2">
                <div className="text-primary mt-0.5"><Clock size={18} /></div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                    {t.booking.info.hours}
                  </p>
                  <ul className="text-sm space-y-1">
                    {siteConfig.contact.hours.map((h) => (
                      <li key={h.day} className="flex justify-between gap-3">
                        <span className="text-foreground/80">{h.day}</span>
                        <span className="font-medium">{h.time}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="aspect-square overflow-hidden rounded-2xl border border-border/60">
              <iframe
                src={siteConfig.contact.mapEmbed}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={t.booking.mapTitle}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}

function InfoRow({
  icon,
  title,
  content,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="text-primary mt-0.5">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">{title}</p>
        <p className="text-sm text-foreground/90">{content}</p>
      </div>
    </div>
  );
}
