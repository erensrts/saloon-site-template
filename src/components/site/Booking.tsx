import { useState } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { siteConfig } from "@/config/site.config";

const bookingSchema = z.object({
  name: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalı").max(100),
  phone: z
    .string()
    .trim()
    .min(7, "Geçerli bir telefon girin")
    .max(25)
    .regex(/^[+\d\s()-]+$/, "Geçerli bir telefon girin"),
  email: z
    .string()
    .trim()
    .max(255)
    .email("Geçerli bir e-posta girin")
    .optional()
    .or(z.literal("")),
  service: z.string().min(1, "Bir hizmet seçin"),
  date: z.string().min(1, "Tarih seçin"),
  time: z.string().min(1, "Saat seçin"),
  note: z.string().max(500).optional().or(z.literal("")),
});

function formatDateTR(iso: string): string {
  // iso: "YYYY-MM-DD"
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return iso;
  }
}

function formatTimeTR(hhmm: string): string {
  // Native time input already gives "HH:mm"
  return hhmm;
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
      const first = parsed.error.issues[0]?.message ?? "Lütfen formu kontrol edin";
      toast.error(first);
      return;
    }

    setSubmitting(true);
    const v = parsed.data;

    const lines = [
      "Merhaba, randevu talebim var:",
      "",
      `Ad Soyad: ${v.name}`,
      `Telefon: ${v.phone}`,
      ...(v.email ? [`E-posta: ${v.email}`] : []),
      `Hizmet: ${v.service}`,
      `Tarih: ${formatDateTR(v.date)}`,
      `Saat: ${formatTimeTR(v.time)}`,
      ...(v.note ? [`Not: ${v.note}`] : []),
    ];
    const message = lines.join("\n");
    const url = `https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Randevu talebiniz WhatsApp üzerinden iletiliyor…");
    formEl.reset();
    setSubmitting(false);
  };

  return (
    <section id="booking" className="section-padding bg-secondary/40">
      <div className="container-narrow">
        <div className="max-w-2xl mb-12 md:mb-16">
          <p className="text-primary text-sm uppercase tracking-[0.2em] mb-3">Randevu</p>
          <h2 className="text-4xl md:text-5xl font-medium leading-tight">
            Sizi aramızda görmek isteriz
          </h2>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <form
            onSubmit={onSubmit}
            className="lg:col-span-3 rounded-2xl bg-card border border-border/60 p-6 md:p-8 space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Ad Soyad" name="name" type="text" required />
              <Field label="Telefon" name="phone" type="tel" required />
            </div>
            <Field label="E-posta" name="email" type="email" />
            <div>
              <label className="block text-sm font-medium mb-1.5">Hizmet</label>
              <select
                name="service"
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Bir hizmet seçin…</option>
                {siteConfig.services.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Tarih" name="date" type="date" required />
              <Field label="Saat" name="time" type="time" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Not (isteğe bağlı)</label>
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
              {submitting ? "Yönlendiriliyor…" : "WhatsApp ile Randevu Talep Et"}
            </button>
          </form>

          {/* Info */}
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-2xl bg-card border border-border/60 p-6 space-y-4">
              <InfoRow icon={<MapPin size={18} />} title="Adres" content={siteConfig.contact.address} />
              <InfoRow icon={<Phone size={18} />} title="Telefon" content={siteConfig.contact.phone} />
              <InfoRow icon={<Mail size={18} />} title="E-posta" content={siteConfig.contact.email} />
              <div className="flex gap-3 pt-2">
                <div className="text-primary mt-0.5"><Clock size={18} /></div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                    Çalışma Saatleri
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
                title="Konumumuz"
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
