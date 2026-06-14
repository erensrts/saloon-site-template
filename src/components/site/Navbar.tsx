import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import { cn } from "@/lib/utils";

const links = [
  { href: "#services", label: "Hizmetler" },
  { href: "#gallery", label: "Galeri" },
  { href: "#about", label: "Hakkımızda" },
  { href: "#testimonials", label: "Yorumlar" },
  { href: "#booking", label: "İletişim" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "bg-background/85 backdrop-blur-md shadow-sm"
          : "bg-transparent",
      )}
    >
      <nav className="container-narrow flex h-16 items-center justify-between md:h-20">
        <a href="#top" className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {siteConfig.businessName}
          <span className="text-primary">.</span>
        </a>

        <ul className="hidden md:flex items-center gap-8 text-sm">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-foreground/80 hover:text-primary transition-colors"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#booking"
          className="hidden md:inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition"
        >
          {siteConfig.heroCta}
        </a>

        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2 text-foreground"
          aria-label="Menüyü aç/kapat"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <ul className="container-narrow flex flex-col py-4 gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-foreground/80 hover:text-primary"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <a
                href="#booking"
                onClick={() => setOpen(false)}
                className="block w-full rounded-full bg-primary py-3 text-center font-medium text-primary-foreground"
              >
                {siteConfig.heroCta}
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
