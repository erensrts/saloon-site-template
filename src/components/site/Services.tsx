import * as Icons from "lucide-react";
import { t } from "@/i18n";
import { useSiteData } from "./SiteDataProvider";
import type { LucideIcon } from "lucide-react";

export function Services() {
  const site = useSiteData();
  return (
    <section id="services" className="section-padding bg-secondary/40">
      <div className="container-narrow">
        <div className="max-w-2xl mb-12 md:mb-16">
          <p className="text-primary text-sm uppercase tracking-[0.2em] mb-3">{t.services.eyebrow}</p>
          <h2 className="text-4xl md:text-5xl font-medium leading-tight">
            {t.services.heading}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {site.services.map((s) => {
            const Icon = (Icons as unknown as Record<string, LucideIcon>)[s.icon] ?? Icons.Sparkles;
            return (
              <article
                key={s.name}
                className="group rounded-2xl bg-card border border-border/60 p-7 hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary mb-5 group-hover:scale-110 transition-transform">
                  <Icon size={22} />
                </div>
                <h3 className="font-display text-2xl mb-2">{s.name}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                  {s.description}
                </p>
                <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {t.services.priceLabel}
                  </span>
                  <span className="font-medium text-primary">{s.price}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
