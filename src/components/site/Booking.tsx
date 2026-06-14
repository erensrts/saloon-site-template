import { useState } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { toast } from "sonner";
import { siteConfig } from "@/config/site.config";

export function Booking() {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    // Şablon: gerçek bir backend bağlanana kadar simüle ediyoruz.
    setTimeout(() => {
      setSubmitting(false);
      (e.target as HTMLFormElement).reset();
      toast.success("Randevu talebiniz alındı! En kısa sürede sizi arayacağız.");
    }, 700);
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
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-primary py-3.5 font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60"
            >
              {submitting ? "Gönderiliyor…" : "Randevu Talep Et"}
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
