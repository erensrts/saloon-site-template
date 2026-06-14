import { siteConfig } from "@/config/site.config";

export function Hero() {
  const fullName = `${siteConfig.businessName} ${siteConfig.businessNameSuffix}`.trim();
  const isLongName = fullName.length > 25;

  return (
    <section id="top" className="relative isolate min-h-[92vh] flex items-center overflow-hidden">
      <img
        src={siteConfig.heroImage}
        alt={siteConfig.businessName}
        width={1920}
        height={1080}
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/30 via-background/40 to-background/85" />

      <div className="container-narrow py-16 md:py-24 lg:py-28">
        <div className="max-w-3xl fade-up">
          <p className="font-display italic text-primary text-lg md:text-xl mb-4">
            {siteConfig.tagline}
          </p>
          <h1
            className="font-display font-medium text-foreground"
            style={{
              fontSize: isLongName
                ? "clamp(1.75rem, 4.2vw, 3.25rem)"
                : "clamp(2.25rem, 5.5vw, 4.5rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
            }}
          >
            {siteConfig.businessName}{" "}
            <span className="text-primary">{siteConfig.businessNameSuffix}</span>
          </h1>
          <p className="mt-6 max-w-xl text-base md:text-lg text-foreground/75">
            {siteConfig.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#booking"
              className="inline-flex items-center rounded-full bg-primary px-7 py-3.5 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
            >
              {siteConfig.heroCta}
            </a>
            <a
              href="#services"
              className="inline-flex items-center rounded-full border border-foreground/20 bg-background/60 backdrop-blur px-7 py-3.5 text-base font-medium text-foreground hover:bg-background transition"
            >
              Hizmetlerimiz
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
