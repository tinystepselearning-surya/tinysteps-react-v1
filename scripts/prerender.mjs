#!/usr/bin/env node
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { chromium } from "playwright";

const DIST = path.resolve(process.cwd(), "dist");
const PORT = process.env.PRERENDER_PORT ? Number(process.env.PRERENDER_PORT) : 4173;
const HOST = `http://127.0.0.1:${PORT}`;

// Keep these as your "always prerender" routes
const SEED_ROUTES = [
  "/",
  "/courses",
  "/curriculum",
  "/phonics",
  "/blog",
  "/faq",
  // Parents hub + help pages
  "/parents",
  "/parents/getting-started",
  "/parents/choosing-course",
  "/parents/scheduling",
  "/parents/payments",
  "/parents/tracking-progress",
  "/parents/helping-with-homework",
  "/parents/phonics-mission",
  "/parents/reading-at-home",
  "/parents/speech-confidence",
  "/parents/common-mistakes",
];

// Fallback blog posts (used only if auto-discovery finds 0)
const BLOG_FALLBACK_ROUTES = [
  "/blog/week-1-phonics-satpin-launch",
  "/blog/week-2-phonics-blending-club",
];

function startPreview() {
  const bin = path.resolve(process.cwd(), "node_modules", ".bin", "vite");
  const args = ["preview", "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"];
  console.log("Starting vite preview:", bin, args.join(" "));
  const proc = spawn(bin, args, {
    stdio: ["ignore", "inherit", "inherit"],
    shell: process.platform === "win32",
  });
  return proc;
}

async function waitForServer(url, timeout = 45000) {
  const start = Date.now();
  const alt = url.replace("127.0.0.1", "localhost");
  let attempt = 0;

  while (Date.now() - start < timeout) {
    attempt++;
    for (const u of [url, alt]) {
      try {
        const res = await fetch(u, { method: "GET" });
        if (res && (res.status === 200 || res.status === 204 || res.status === 301 || res.status === 302)) {
          console.log("Server responded at", u);
          return true;
        }
      } catch (e) {
        // ignore
      }
    }
    await new Promise((r) => setTimeout(r, attempt > 6 ? 1000 : 500));
  }
  throw new Error("Server did not start in time: " + url + " (waited " + timeout + "ms)");
}

function normalizePath(href) {
  if (!href) return null;
  // only handle site-relative links
  if (!href.startsWith("/")) return null;
  const clean = href.split("#")[0].split("?")[0];
  return clean;
}

function toBlogPostRoute(href) {
  const p = normalizePath(href);
  if (!p) return null;
  if (!p.startsWith("/blog/")) return null;

  // Must be exactly /blog/<slug> (no extra segments)
  const parts = p.split("/").filter(Boolean); // ["blog", "<slug>"]
  if (parts.length !== 2) return null;

  const slug = parts[1];
  if (!slug) return null;

  return `/blog/${slug}`;
}

async function discoverBlogRoutes(page) {
  const blogUrl = `${HOST}/blog`;
  console.log("[prerender] Discovering blog slugs from", blogUrl);

  await page.goto(blogUrl, { waitUntil: "networkidle" });

  // Try to ensure blog links render (best-effort)
  try {
    await page.waitForSelector('a[href^="/blog/"]', { timeout: 6000 });
  } catch {
    // ignore
  }

  // Best-effort scroll to load any lazy content
  for (let i = 0; i < 6; i++) {
    const prev = await page.evaluate(() => document.body.scrollHeight);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const next = await page.evaluate(() => document.body.scrollHeight);
    if (next === prev) break;
  }
  await page.evaluate(() => window.scrollTo(0, 0));

  const hrefs = await page.$$eval("a", (els) =>
    els
      .map((a) => a.getAttribute("href"))
      .filter(Boolean)
  );

  const routes = new Set();
  for (const href of hrefs) {
    const r = toBlogPostRoute(href);
    if (r) routes.add(r);
  }

  const list = Array.from(routes);
  console.log(`[prerender] Found ${list.length} blog post route(s) on /blog`);
  return list;
}

async function writeRouteHtml(route, html) {
  if (route === "/") {
    const outFile = path.join(DIST, "index.html");
    await fs.writeFile(outFile, html, "utf8");
    console.log("Wrote", outFile);
    return;
  }

  const outDir = path.join(DIST, route.replace(/^\//, ""));
  await fs.mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, "index.html");
  await fs.writeFile(outFile, html, "utf8");
  console.log("Wrote", outFile);
}

async function prerender() {
  const proc = startPreview();

  try {
    const baseUrl = `${HOST}/`;
    console.log("Waiting for server at", baseUrl);
    await waitForServer(baseUrl, 45000);

    let browser;
    try {
      browser = await chromium.launch();
      const page = await browser.newPage();

      // ✅ Auto-discover all blog post routes from /blog (AEO/SEO)
      let blogRoutes = [];
      try {
        blogRoutes = await discoverBlogRoutes(page);
      } catch (e) {
        console.warn("[prerender] Blog discovery failed; will fall back to fixed slugs.");
      }

      if (blogRoutes.length === 0) {
        blogRoutes = BLOG_FALLBACK_ROUTES;
        console.warn(`[prerender] Using fallback blog routes (${blogRoutes.length})`);
      }

      // Safety limit (avoid accidental runaway)
      const MAX_BLOG_ROUTES = 200;
      if (blogRoutes.length > MAX_BLOG_ROUTES) {
        blogRoutes = blogRoutes.slice(0, MAX_BLOG_ROUTES);
        console.warn(`[prerender] Truncated blog routes to ${MAX_BLOG_ROUTES}`);
      }

      const ROUTES = Array.from(new Set([...SEED_ROUTES, ...blogRoutes]));

      // Prerender all routes
      for (const route of ROUTES) {
        const url = `${HOST}${route}`;
        console.log("Prerendering", url);
        await page.goto(url, { waitUntil: "networkidle" });
        const html = await page.content();
        await writeRouteHtml(route, html);
      }

      await browser.close();
    } catch (launchErr) {
      console.error("Prerender failed with error:");
      console.error(launchErr && launchErr.stack ? launchErr.stack : launchErr);
      console.error(
        "Tip: run `npx playwright install --with-deps chromium` in CI to ensure Playwright browsers are available."
      );
      throw launchErr;
    }
  } finally {
    try {
      proc.kill();
    } catch (e) {
      // ignore
    }
  }
}

prerender().catch((err) => {
  console.error(err);
  process.exit(1);
});
