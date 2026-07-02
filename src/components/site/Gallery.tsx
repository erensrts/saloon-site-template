import { t } from "@/i18n";
import { useSiteData } from "./SiteDataProvider";

export function Gallery() {
  const site = useSiteData();
  return (
    <section id="gallery" className="section-padding">
      <div className="container-narrow">
        <div className="max-w-2xl mb-12 md:mb-16">
          <p className="text-primary text-sm uppercase tracking-[0.2em] mb-3">{t.gallery.eyebrow}</p>
          <h2 className="text-4xl md:text-5xl font-medium leading-tight">
            {t.gallery.heading}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {site.gallery.map((src, i) => (
            <div
              key={i}
              className={`overflow-hidden rounded-2xl bg-muted ${
                i % 5 === 0 ? "row-span-2 aspect-[3/4] md:aspect-[3/5]" : "aspect-square"
              }`}
            >
              <img
                src={src}
                alt={t.gallery.imageAlt(i + 1)}
                loading="lazy"
                width={800}
                height={800}
                className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
