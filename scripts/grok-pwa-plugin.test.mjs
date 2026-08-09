import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  acceptsHtml,
  appNameFromHost,
  createHeadInjector,
  injectGrokPwaHead,
  isDocumentPath,
  isInstallQuery,
  renderWebManifest,
  stripInstallParams,
} from "./grok-pwa-shared.mjs";
import { renderInstallPage } from "./grok-pwa-plugin.mjs";

const TEMPLATE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

test("detects the install query", () => {
  assert.equal(isInstallQuery("/?install=1&platform=ios"), true);
  assert.equal(isInstallQuery("/?install=true&platform=ios"), true);
  assert.equal(isInstallQuery("/?install=1&platform=android"), false);
  assert.equal(isInstallQuery("/?install=1"), false);
  assert.equal(isInstallQuery("/"), false);
});

test("document path gate", () => {
  assert.equal(isDocumentPath("/"), true);
  assert.equal(isDocumentPath("/app"), true);
  assert.equal(isDocumentPath("/api/auth"), false);
  assert.equal(isDocumentPath("/__grok/manifest.webmanifest"), false);
  assert.equal(isDocumentPath("/assets/x.js"), false);
});

test("acceptsHtml", () => {
  assert.equal(acceptsHtml("text/html"), true);
  assert.equal(acceptsHtml("*/*"), true);
  assert.equal(acceptsHtml(""), true);
  assert.equal(acceptsHtml("application/json"), false);
});

test("injects missing PWA head tags before </head>", () => {
  const html = injectGrokPwaHead("<html><head><title>t</title></head><body></body></html>");
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /apple-touch-icon/);
  assert.match(html, /theme-color/);
  assert.match(html, /#efece6/);
});

test("does not duplicate tags already present", () => {
  const withManifest =
    '<html><head><link rel="manifest" href="/__grok/manifest.webmanifest"></head></html>';
  const out = injectGrokPwaHead(withManifest);
  assert.equal((out.match(/manifest\.webmanifest/g) ?? []).length, 1);
});

test("createHeadInjector injects at head boundary", () => {
  const inj = createHeadInjector("Iron Mile");
  const a = inj.push("<html><head><title>x</title>");
  assert.equal(a.length, 0);
  const b = inj.push("</head><body>hi</body></html>");
  const joined = Buffer.concat(b).toString("utf8");
  assert.match(joined, /manifest\.webmanifest/);
  assert.match(joined, /Iron Mile/);
  assert.match(joined, /<body>hi<\/body>/);
});

test("strips install params from the app link", () => {
  assert.equal(stripInstallParams("/?install=1&platform=ios"), "/");
  assert.equal(stripInstallParams("/app?install=1&platform=ios&tab=2"), "/app?tab=2");
});

test("names the install page from host slug", () => {
  assert.equal(appNameFromHost("localhost:8080"), "Iron Mile");
  assert.equal(appNameFromHost("172.17.154.217:8080"), "Iron Mile");
  assert.equal(appNameFromHost("wild-race.grok.me"), "Wild Race");
  assert.equal(appNameFromHost("fysisktrening.vercel.app"), "Iron Mile");
});

test("rejects hosts that are not plain slugs", () => {
  assert.equal(appNameFromHost("<script>alert(1)</script>"), "Iron Mile");
  assert.equal(appNameFromHost('"><img src=x onerror=1>.grok.me'), "Iron Mile");
});

test("renders install page markup", () => {
  const html = renderInstallPage("wild-race.grok.me", "/?install=1&platform=ios");
  assert.match(html, /Add Wild Race to your/);
  assert.match(html, /\/__grok\/install\/styles\.css/);
  assert.match(html, /href="\/"/);
  assert.equal(html.includes("{{APP_NAME}}"), false);
  assert.equal(html.includes("{{APP_URL}}"), false);
});

test("escapes host-derived values in the install page", () => {
  const html = renderInstallPage("<script>alert(1)</script>", "/?install=1&platform=ios");
  assert.equal(html.includes("<script>alert(1)</script>"), false);
});

test("renders the manifest with the per-app name", () => {
  const manifest = JSON.parse(renderWebManifest("wild-race.grok.me"));
  assert.equal(manifest.name, "Wild Race");
  assert.equal(manifest.short_name, "Wild Race");
  assert.equal(manifest.theme_color, "#efece6");
  assert.equal(manifest.icons[0].src, "/icon-192.png");
  assert.ok(manifest.icons.some((i) => i.src === "/__grok/icon-180.png"));
});

// Tripwires: the deployed-app path only works if Nitro scans server/ — an
// accidental edit that drops serverDir or the middleware file would otherwise
// fail silently (published apps would just render the app for ?install=1).
test("vite config keeps the nitro serverDir wiring", () => {
  const viteConfig = readFileSync(join(TEMPLATE_ROOT, "vite.config.ts"), "utf8");
  assert.match(viteConfig, /serverDir:\s*"\.\/server"/);
  assert.match(viteConfig, /grokPwaPlugin\(\)/);
});

test("nitro middleware and its bundled assets exist", () => {
  const middleware = readFileSync(join(TEMPLATE_ROOT, "server/middleware/grok-pwa.ts"), "utf8");
  assert.match(middleware, /install-page\.html\?raw/);
  assert.match(middleware, /grok-pwa-shared/);
});
