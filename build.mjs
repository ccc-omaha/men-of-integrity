// Builds findintegrity.com from content/*.json + src/ into dist/.
// Netlify runs this on every save from Pages CMS (see netlify.toml).
import fs from "node:fs";
import path from "node:path";
import nunjucks from "nunjucks";
import { icon, typeIcon } from "./src/icons.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const DIST = path.join(ROOT, "dist");
const PUBLIC = path.join(ROOT, "public");
const SITE = { url: "https://findintegrity.com" };

const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
const C = Object.fromEntries(
  ["settings", "top", "about", "pillars", "story", "steps", "meeting", "resources", "partners", "faq", "closing"]
    .map(n => [n, read(`content/${n}.json`)])
);

/* ---------- helpers ---------- */
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// Tiny inline formatting for staff: *italic*, **bold**, [link text](url) and line breaks
const md = t => esc(t)
  .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+|tel:[^)\s]+|sms:[^)\s]+|\/[^)\s]*|#[^)\s]*)\)/g, (_, txt, url) =>
    url.startsWith("http") ? `<a href="${url}" target="_blank" rel="noopener">${txt}</a>` : `<a href="${url}">${txt}</a>`)
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/\*([^*]+)\*/g, "<em>$1</em>")
  .replace(/\n/g, "<br>")
  .replace(/ ([^\s<>]{1,14})((?:<\/[a-z]+>)*)$/i, "&nbsp;$1$2");   // no orphaned last word
const jsonscript = v => JSON.stringify(v, null, 2).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
// Tab ids come from the first word of the category name: "Filters & Accountability" -> "filters"
const slug = t => String(t).toLowerCase().match(/[a-z0-9]+/)?.[0] || "tab";

/* ---------- derived values ---------- */
const M = C.meeting;
const digits = String(M.phone || "").replace(/\D/g, "");
const addrLines = String(M.address || "").split("\n").map(s => s.trim()).filter(Boolean);
const lastLine = addrLines[addrLines.length - 1] || "";
const addressShort = lastLine.split(",").slice(0, 2).map(s => s.trim()).join(", ");
const abs = p => !p ? "" : p.startsWith("http") ? p : SITE.url + (p.startsWith("/") ? p : "/" + p);

const plain = t => String(t ?? "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*+([^*]+)\*+/g, "$1").replace(/\n/g, " ");
// Parse "10825 Harney St, Omaha, NE 68154" into a postal address for Google
const [street = "", city = "", stateZip = ""] = lastLine.split(",").map(s => s.trim());
const [region = "", postalCode = ""] = stateZip.split(/\s+/);
const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: `${SITE.url}/`,
      name: "Men of Integrity",
      description: C.settings.seoDescription,
      inLanguage: "en-US",
    },
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#org`,
      name: "Men of Integrity",
      alternateName: "MOI",
      url: `${SITE.url}/`,
      logo: `${SITE.url}/icon-512.png`,
      description: C.settings.seoDescription,
      areaServed: { "@type": "City", name: "Omaha, Nebraska" },
      parentOrganization: { "@type": "Church", name: "Christ Community Church", url: "https://cccomaha.org" },
      location: {
        "@type": "Place",
        name: `${M.venue}, Christ Community Church`,
        address: { "@type": "PostalAddress", streetAddress: street, addressLocality: city, addressRegion: region, postalCode, addressCountry: "US" },
      },
      contactPoint: { "@type": "ContactPoint", contactType: "Group leader", name: M.contactName, telephone: `+1-${M.phone}` },
    },
    ...(C.faq.show && (C.faq.items || []).length ? [{
      "@type": "FAQPage",
      "@id": `${SITE.url}/#faq`,
      mainEntity: C.faq.items.map(f => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: plain(f.answer) } })),
    }] : []),
  ],
};

/* ---------- build ---------- */
fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(PUBLIC, DIST, { recursive: true });

const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(ROOT, "src")), { autoescape: true });
env.addFilter("md", t => new nunjucks.runtime.SafeString(md(t)));
env.addFilter("jsonscript", v => new nunjucks.runtime.SafeString(jsonscript(v)));
env.addFilter("file", f => new nunjucks.runtime.SafeString(fs.readFileSync(path.join(ROOT, "src", f), "utf8")));
env.addFilter("slug", slug);
env.addFilter("icon", (n, size) => new nunjucks.runtime.SafeString(icon(n, size)));
env.addFilter("typeicon", (t, size) => new nunjucks.runtime.SafeString(typeIcon(t, size)));
env.addFilter("pad", n => String(n).padStart(2, "0"));

const html = env.render("index.njk", {
  site: SITE, ...C, schema,
  smsHref: `sms:${digits}`,
  firstName: String(M.contactName || "").split(" ")[0],
  addressShort,
  shareImageAbs: abs(C.settings.shareImage),
  year: new Date().getFullYear(),
});
fs.writeFileSync(path.join(DIST, "index.html"), html);
fs.writeFileSync(path.join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE.url}/</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>\n</urlset>\n`);
console.log(`Built findintegrity.com: ${C.resources.categories.reduce((n, c) => n + (c.items || []).length, 0)} resources in ${C.resources.categories.length} tabs.`);
