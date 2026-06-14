import { Instagram, Facebook } from "lucide-react";
import { siteConfig } from "@/config/site.config";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-14">
      <div className="container-narrow grid md:grid-cols-3 gap-10">
        <div>
          <p className="font-display text-2xl">
            {siteConfig.businessName}
            <span className="text-primary">.</span>{" "}
            <span className="text-background/60 text-base">{siteConfig.businessNameSuffix}</span>
          </p>
          <p className="mt-3 text-sm text-background/70 max-w-xs">{siteConfig.heroSubtitle}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-background/50 mb-3">İletişim</p>
          <ul className="space-y-1.5 text-sm text-background/85">
            <li>{siteConfig.contact.address}</li>
            <li>{siteConfig.contact.phone}</li>
            <li>{siteConfig.contact.email}</li>
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-background/50 mb-3">Takip Edin</p>
          <div className="flex gap-3">
            {[
              { href: siteConfig.social.instagram, Icon: Instagram, label: "Instagram" },
              { href: siteConfig.social.facebook, Icon: Facebook, label: "Facebook" },
            ].map(({ href, Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="h-10 w-10 rounded-full border border-background/20 inline-flex items-center justify-center hover:bg-primary hover:border-primary transition"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="container-narrow mt-10 pt-6 border-t border-background/10 text-xs text-background/50 flex flex-wrap justify-between gap-2">
        <span>© {new Date().getFullYear()} {siteConfig.businessName} {siteConfig.businessNameSuffix}. Tüm hakları saklıdır.</span>
        <span>Tasarım & geliştirme şablonu</span>
      </div>
    </footer>
  );
}
