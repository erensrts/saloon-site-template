import { createServerFileRoute } from "@tanstack/react-start/server";
import { siteConfig } from "@/config/site.config";

/**
 * Public sitemap. Only the marketing home page is listed; /admin and /auth
 * are intentionally excluded (also disallowed in robots.txt).
 */
export const ServerRoute = createServerFileRoute("/sitemap.xml").methods({
  GET: () => {
    const base = siteConfig.seo.siteUrl.replace(/\/+$/, "");
    const lastmod = new Date().toISOString().slice(0, 10);

    const urls = [
      { loc: `${base}/`, changefreq: "weekly", priority: "1.0" },
    ];

    const body =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls
        .map(
          (u) =>
            `  <url>\n` +
            `    <loc>${u.loc}</loc>\n` +
            `    <lastmod>${lastmod}</lastmod>\n` +
            `    <changefreq>${u.changefreq}</changefreq>\n` +
            `    <priority>${u.priority}</priority>\n` +
            `  </url>`,
        )
        .join("\n") +
      `\n</urlset>\n`;

    return new Response(body, {
      status: 200,
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    });
  },
});
