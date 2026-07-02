import { Star, Quote } from "lucide-react";
import { t } from "@/i18n";
import { useSiteData } from "./SiteDataProvider";

export function Testimonials() {
  const site = useSiteData();
  return (
    <section id="testimonials" className="section-padding">
      <div className="container-narrow">
        <div className="max-w-2xl mb-12 md:mb-16">
          <p className="text-primary text-sm uppercase tracking-[0.2em] mb-3">{t.testimonials.eyebrow}</p>
          <h2 className="text-4xl md:text-5xl font-medium leading-tight">
            {t.testimonials.heading}
          </h2>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory -mx-5 px-5 md:mx-0 md:px-0 md:grid md:grid-cols-2 md:overflow-visible">
          {site.testimonials.map((item) => (
            <figure
              key={item.name}
              className="min-w-[85%] sm:min-w-[70%] md:min-w-0 snap-start rounded-2xl bg-card border border-border/60 p-7 flex flex-col"
            >
              <Quote className="text-primary/40 mb-3" size={28} />
              <blockquote className="text-foreground/85 leading-relaxed flex-1">
                "{item.text}"
              </blockquote>
              <figcaption className="mt-5 pt-5 border-t border-border/50 flex items-center justify-between">
                <span className="font-medium">{item.name}</span>
                <span className="flex gap-0.5 text-gold">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                  ))}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
