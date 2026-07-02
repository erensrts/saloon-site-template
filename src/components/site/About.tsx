import { t } from "@/i18n";
import { useSiteData } from "./SiteDataProvider";

export function About() {
  const site = useSiteData();
  return (
    <section id="about" className="section-padding bg-secondary/40">
      <div className="container-narrow">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-primary text-sm uppercase tracking-[0.2em] mb-3">
              {site.about.title}
            </p>
            <h2 className="text-4xl md:text-5xl font-medium leading-tight mb-6">
              {site.about.subtitle}
            </h2>
            {site.about.paragraphs.map((p, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed mb-4 text-[15px]">
                {p}
              </p>
            ))}
          </div>
          <div className="order-1 lg:order-2 relative">
            <div className="aspect-[4/5] overflow-hidden rounded-3xl">
              <img
                src={site.about.image}
                alt={t.about.imageAlt}
                loading="lazy"
                width={1200}
                height={1200}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-2xl bg-primary -z-10 md:h-32 md:w-32" />
            <div className="absolute -top-4 -right-4 h-20 w-20 rounded-2xl bg-accent -z-10" />
          </div>
        </div>

        {/* Team */}
        <div className="mt-20 md:mt-28">
          <h3 className="font-display text-3xl md:text-4xl mb-10 text-center">{t.about.teamHeading}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {site.team.map((m) => (
              <div key={m.name} className="text-center group">
                <div className="aspect-square overflow-hidden rounded-3xl mb-4 bg-muted">
                  <img
                    src={m.image}
                    alt={m.name}
                    loading="lazy"
                    width={600}
                    height={600}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h4 className="font-display text-xl">{m.name}</h4>
                <p className="text-sm text-muted-foreground">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
