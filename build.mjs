// Builds findintegrity.com from content/*.json + src/ into dist/.
// Netlify runs this on every save from Pages CMS (see netlify.toml).
import fs from "node:fs";
import path from "node:path";
import nunjucks from "nunjucks";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const DIST = path.join(ROOT, "dist");
const PUBLIC = path.join(ROOT, "public");
const SITE = { url: "https://findintegrity.com" };

const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
const C = Object.fromEntries(
  ["settings", "top", "about", "pillars", "story", "steps", "meeting", "resources", "partners", "closing"]
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
  .replace(/\n/g, "<br>");
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

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Men of Integrity",
  url: SITE.url,
  description: C.settings.seoDescription,
  parentOrganization: { "@type": "Organization", name: "Christ Community Church", url: "https://cccomaha.org" },
  location: { "@type": "Place", name: `${M.venue}, Christ Community Church`, address: lastLine },
};

/* ---------- build ---------- */
fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(PUBLIC, DIST, { recursive: true });

const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(ROOT, "src")), { autoescape: true });
env.addFilter("md", t => new nunjucks.runtime.SafeString(md(t)));
env.addFilter("jsonscript", v => new nunjucks.runtime.SafeString(jsonscript(v)));
env.addFilter("file", f => new nunjucks.runtime.SafeString(fs.readFileSync(path.join(ROOT, "src", f), "utf8")));
env.addFilter("slug", slug);
env.addFilter("pad", n => String(n).padStart(2, "0"));

const html = env.render("index.njk", {
  site: SITE, ...C, orgSchema,
  smsHref: `sms:${digits}`,
  firstName: String(M.contactName || "").split(" ")[0],
  addressShort,
  shareImageAbs: abs(C.settings.shareImage),
  year: new Date().getFullYear(),
});
fs.writeFileSync(path.join(DIST, "index.html"), html);
console.log(`Built findintegrity.com: ${C.resources.categories.reduce((n, c) => n + (c.items || []).length, 0)} resources in ${C.resources.categories.length} tabs.`);
