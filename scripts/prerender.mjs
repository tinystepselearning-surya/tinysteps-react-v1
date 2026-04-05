#!/usr/bin/env node
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { chromium } from "playwright";
import { ROUTE_SEO_REGISTRY as ROUTE_SEO_CONFIG } from "../src/lib/routeSeoRegistry.js";
import { PARENT_HELP_ROUTES, STATIC_MARKETING_ROUTES, uniqueRoutes } from "./seo-route-inventory.mjs";

const DIST = path.resolve(process.cwd(), "dist");
const PORT = process.env.PRERENDER_PORT ? Number(process.env.PRERENDER_PORT) : 4173;
const HOST = `http://127.0.0.1:${PORT}`;
const DEFAULT_INDEXABLE_ROBOTS =
  'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

const COURSE_SOURCE = path.resolve(process.cwd(), "src", "content", "courses.ts");
const BLOG_SOURCE = path.resolve(process.cwd(), "src", "content", "blog.ts");
const BLOG_MDX_DIR = path.resolve(process.cwd(), "src", "content", "blog");

// Fallback blog posts (used only if auto-discovery finds 0)
const BLOG_FALLBACK_ROUTES = [
  "/blog/week-1-phonics-satpin-launch",
  "/blog/week-2-phonics-blending-club",
];

async function extractSlugsFromFile(filePath) {
  try {
    const src = await fs.readFile(filePath, "utf8");
    const regex = /slug\s*:\s*['"`]([^'"`]+)['"`]/g;
    const slugs = [];
    let match;
    while ((match = regex.exec(src))) slugs.push(match[1]);
    return [...new Set(slugs)];
  } catch {
    return [];
  }
}

async function extractMdxSlugsFromDir(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    return files
      .filter((file) => file.endsWith(".mdx"))
      .map((file) => file.replace(/\.mdx$/, ""));
  } catch {
    return [];
  }
}

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

async function waitForServer(url, timeout = 90000) {
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

/**
 * Inject SEO metadata into HTML <head> for the given route.
 * Modifies <title>, <meta name="description">, <link rel="canonical">, and <meta name="robots">.
 * @param html The full HTML string
 * @param route The pathname (e.g. "/pricing")
 * @returns Modified HTML with correct SEO metadata
 */
function injectSeoMetadata(html, route) {
  const config = ROUTE_SEO_CONFIG[route];
  if (!config) {
    // No config for this route; return HTML as-is
    return html;
  }

  const canonicalUrl = config.canonicalPath === '/' 
    ? 'https://tinystepslearning.com/' 
    : `https://tinystepslearning.com${config.canonicalPath}`;
  const ogImageUrl = config.ogImage
    ? (config.ogImage.startsWith('http') ? config.ogImage : `https://tinystepslearning.com${config.ogImage}`)
    : 'https://tinystepslearning.com/og-default.jpg';
  const ogType = config.ogType || 'website';

  let result = html;

  // Inject/replace <title>
  const titleTag = `<title>${escapeHtml(config.title)}</title>`;
  result = result.replace(/<title>.*?<\/title>/i, titleTag) || result.replace('</head>', `${titleTag}</head>`);

  // Inject/replace <meta name="description">
  const descMeta = `<meta name="description" content="${escapeHtml(config.description)}">`;
  result = result.replace(/<meta name="description"[^>]*>/i, descMeta) || result.replace('</head>', `${descMeta}</head>`);

  // Inject/replace optional <meta name="keywords">
  if (config.keywords) {
    const keywordsMeta = `<meta name="keywords" content="${escapeHtml(config.keywords)}">`;
    result = result.replace(/<meta name="keywords"[^>]*>/i, keywordsMeta) || result.replace('</head>', `${keywordsMeta}</head>`);
  } else {
    result = result.replace(/<meta name="keywords"[^>]*>\s*/i, '');
  }

  // Remove invalid locale alternates until the site has real locale-variant URLs.
  result = result.replace(/\s*<link rel="alternate"[^>]*hreflang="[^"]+"[^>]*>/gi, '');

  // Inject/replace <link rel="canonical">
  const canonicalLink = `<link rel="canonical" href="${canonicalUrl}">`;
  result = result.replace(/<link rel="canonical"[^>]*>/i, canonicalLink) || result.replace('</head>', `${canonicalLink}</head>`);

  // Inject/replace <meta name="robots">
  const robotsContent = config.robots || DEFAULT_INDEXABLE_ROBOTS;
  const robotsMeta = `<meta name="robots" content="${robotsContent}">`;
  result = result.replace(/<meta name="robots"[^>]*>/i, robotsMeta) || result.replace('</head>', `${robotsMeta}</head>`);
  const googlebotMeta = `<meta name="googlebot" content="${robotsContent}">`;
  const bingbotMeta = `<meta name="bingbot" content="${robotsContent}">`;
  result = result.replace(/<meta name="googlebot"[^>]*>/i, googlebotMeta) || result.replace('</head>', `${googlebotMeta}</head>`);
  result = result.replace(/<meta name="bingbot"[^>]*>/i, bingbotMeta) || result.replace('</head>', `${bingbotMeta}</head>`);
  const authorMeta = `<meta name="author" content="Tiny Steps Learning">`;
  result = result.replace(/<meta name="author"[^>]*>/i, authorMeta) || result.replace('</head>', `${authorMeta}</head>`);

  // Inject/replace OpenGraph + Twitter share metadata for messaging previews
  const ogTitleMeta = `<meta property="og:title" content="${escapeHtml(config.title)}">`;
  const ogDescriptionMeta = `<meta property="og:description" content="${escapeHtml(config.description)}">`;
  const ogUrlMeta = `<meta property="og:url" content="${canonicalUrl}">`;
  const ogTypeMeta = `<meta property="og:type" content="${ogType}">`;
  const ogSiteNameMeta = `<meta property="og:site_name" content="Tiny Steps Learning">`;
  const ogLocaleMeta = `<meta property="og:locale" content="en_IN">`;
  const ogImageMeta = `<meta property="og:image" content="${ogImageUrl}">`;
  const ogImageSecureMeta = `<meta property="og:image:secure_url" content="${ogImageUrl}">`;
  const ogImageAltMeta = `<meta property="og:image:alt" content="Tiny Steps Learning - Online English classes for kids">`;
  const twitterCardMeta = `<meta name="twitter:card" content="summary_large_image">`;
  const twitterTitleMeta = `<meta name="twitter:title" content="${escapeHtml(config.title)}">`;
  const twitterDescriptionMeta = `<meta name="twitter:description" content="${escapeHtml(config.description)}">`;
  const twitterUrlMeta = `<meta name="twitter:url" content="${canonicalUrl}">`;
  const twitterImageMeta = `<meta name="twitter:image" content="${ogImageUrl}">`;
  const twitterImageAltMeta = `<meta name="twitter:image:alt" content="Tiny Steps Learning - Online English classes for kids">`;

  result = result.replace(/<meta property="og:title"[^>]*>/i, ogTitleMeta) || result.replace('</head>', `${ogTitleMeta}</head>`);
  result = result.replace(/<meta property="og:description"[^>]*>/i, ogDescriptionMeta) || result.replace('</head>', `${ogDescriptionMeta}</head>`);
  result = result.replace(/<meta property="og:url"[^>]*>/i, ogUrlMeta) || result.replace('</head>', `${ogUrlMeta}</head>`);
  result = result.replace(/<meta property="og:type"[^>]*>/i, ogTypeMeta) || result.replace('</head>', `${ogTypeMeta}</head>`);
  result = result.replace(/<meta property="og:site_name"[^>]*>/i, ogSiteNameMeta) || result.replace('</head>', `${ogSiteNameMeta}</head>`);
  result = result.replace(/<meta property="og:locale"[^>]*>/i, ogLocaleMeta) || result.replace('</head>', `${ogLocaleMeta}</head>`);
  result = result.replace(/<meta property="og:image"[^>]*>/i, ogImageMeta) || result.replace('</head>', `${ogImageMeta}</head>`);
  result = result.replace(/<meta property="og:image:secure_url"[^>]*>/i, ogImageSecureMeta) || result.replace('</head>', `${ogImageSecureMeta}</head>`);
  result = result.replace(/<meta property="og:image:alt"[^>]*>/i, ogImageAltMeta) || result.replace('</head>', `${ogImageAltMeta}</head>`);
  result = result.replace(/<meta name="twitter:card"[^>]*>/i, twitterCardMeta) || result.replace('</head>', `${twitterCardMeta}</head>`);
  result = result.replace(/<meta name="twitter:title"[^>]*>/i, twitterTitleMeta) || result.replace('</head>', `${twitterTitleMeta}</head>`);
  result = result.replace(/<meta name="twitter:description"[^>]*>/i, twitterDescriptionMeta) || result.replace('</head>', `${twitterDescriptionMeta}</head>`);
  result = result.replace(/<meta name="twitter:url"[^>]*>/i, twitterUrlMeta) || result.replace('</head>', `${twitterUrlMeta}</head>`);
  result = result.replace(/<meta name="twitter:image"[^>]*>/i, twitterImageMeta) || result.replace('</head>', `${twitterImageMeta}</head>`);
  result = result.replace(/<meta name="twitter:image:alt"[^>]*>/i, twitterImageAltMeta) || result.replace('</head>', `${twitterImageAltMeta}</head>`);

  return result;
}

/**
 * Escape HTML special characters for safe injection into HTML attributes.
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

async function writeRouteHtml(route, html) {
  // Strip browser-runtime preload/script artifacts that bloat critical head payload.
  const sanitizedHtml = html
    .replace(/<link rel="modulepreload"[^>]*>/gi, "")
    .replace(/<script[^>]*src="https:\/\/www\.googletagmanager\.com\/gtag\/js[^"]*"[^>]*><\/script>/gi, "");

  // Inject SEO metadata before writing
  const seoInjectedHtml = injectSeoMetadata(sanitizedHtml, route);

  if (route === "/") {
    const outFile = path.join(DIST, "index.html");
    await fs.writeFile(outFile, seoInjectedHtml, "utf8");
    console.log("Wrote", outFile);
    return;
  }

  const outDir = path.join(DIST, route.replace(/^\//, ""));
  await fs.mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, "index.html");
  await fs.writeFile(outFile, seoInjectedHtml, "utf8");
  console.log("Wrote", outFile);
}

/**
 * Render a single route with retry logic and content validation.
 * @param page Playwright page instance
 * @param route The route path (e.g. "/phonics")
 * @param maxRetries Maximum number of retry attempts
 * @returns Promise that resolves when route is successfully rendered
 */
async function renderRouteWithRetry(page, route, maxRetries = 2) {
  const url = `${HOST}${route}`;
  const navigationStrategy =
    route === "/class-samples"
      ? { waitUntil: "domcontentloaded", timeout: 60000 }
      : { waitUntil: "networkidle", timeout: 60000 };
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Prerendering ${url}${attempt > 1 ? ` (attempt ${attempt}/${maxRetries})` : ''}`);
      
      await page.goto(url, navigationStrategy);

      // Prefer a hydrated root, but fall back to meaningful markup for long-form routes that
      // occasionally miss the innerText threshold before Playwright's readiness timeout.
      let readinessError = null;
      try {
        await page.waitForFunction(
          () => {
            const root = document.getElementById('root');
            if (!root) return false;
            const textLength = root.innerText?.length || 0;
            const hasHeading = root.querySelector('h1, h2') !== null;
            return textLength > 200 || hasHeading;
          },
          { timeout: 10000 }
        );
      } catch (error) {
        readinessError = error;
      }

      const html = await page.content();

      if (readinessError) {
        const hasMeaningfulMarkup =
          html.length > 1500 && /<(main|article|h1|h2)\b/i.test(html);
        if (!hasMeaningfulMarkup) {
          throw readinessError;
        }
        console.warn(
          `[prerender] Falling back to HTML-structure readiness for ${route}: ${readinessError.message}`
        );
      }
      
      // Validate HTML has meaningful content
      if (html.length < 1000) {
        throw new Error(`HTML too short (${html.length} bytes) - likely empty shell`);
      }
      
      await writeRouteHtml(route, html);
      return; // Success - exit retry loop
      
    } catch (err) {
      if (attempt === maxRetries) {
        console.error(`❌ FAILED to prerender ${route} after ${maxRetries} attempts:`);
        console.error(err.message);
        throw new Error(`Prerender failed for route: ${route}`);
      }
      console.warn(`Retry ${attempt}/${maxRetries} for ${route} failed: ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000)); // Wait 2s before retry
    }
  }
}

async function prerender() {
  const proc = startPreview();

  try {
    const baseUrl = `${HOST}/`;
    console.log("Waiting for server at", baseUrl);
    await waitForServer(baseUrl, 90000);

    let browser;
    try {
      browser = await chromium.launch();
      const page = await browser.newPage();
      const courseSlugs = await extractSlugsFromFile(COURSE_SOURCE);
      const seedRoutes = uniqueRoutes([
        ...STATIC_MARKETING_ROUTES,
        ...PARENT_HELP_ROUTES,
        ...courseSlugs.map((slug) => `/courses/${slug}`),
      ]);

      // ✅ Auto-discover all blog post routes from /blog (AEO/SEO)
      let discoveredBlogRoutes = [];
      try {
        discoveredBlogRoutes = await discoverBlogRoutes(page);
      } catch (e) {
        console.warn("[prerender] Blog discovery failed; will fall back to fixed slugs.");
      }

      const blogSourceSlugs = await extractSlugsFromFile(BLOG_SOURCE);
      const mdxSourceSlugs = await extractMdxSlugsFromDir(BLOG_MDX_DIR);
      const sourceBlogRoutes = uniqueRoutes([
        ...blogSourceSlugs.map((slug) => `/blog/${slug}`),
        ...mdxSourceSlugs.map((slug) => `/blog/${slug}`),
      ]);

      let blogRoutes = uniqueRoutes([...sourceBlogRoutes, ...discoveredBlogRoutes]);

      if (blogRoutes.length === 0) {
        blogRoutes = BLOG_FALLBACK_ROUTES;
        console.warn(`[prerender] Using fallback blog routes (${blogRoutes.length})`);
      } else {
        console.log(
          `[prerender] Blog routes from source/discovery: ${blogRoutes.length} (source: ${sourceBlogRoutes.length}, discovered: ${discoveredBlogRoutes.length})`
        );
      }

      // Safety limit (avoid accidental runaway)
      const MAX_BLOG_ROUTES = 200;
      if (blogRoutes.length > MAX_BLOG_ROUTES) {
        blogRoutes = blogRoutes.slice(0, MAX_BLOG_ROUTES);
        console.warn(`[prerender] Truncated blog routes to ${MAX_BLOG_ROUTES}`);
      }

      const ROUTES = Array.from(new Set([...seedRoutes, ...blogRoutes]));

      console.log(`\n🚀 Prerendering ${ROUTES.length} routes...\n`);

      // Prerender all routes with retry logic
      let successCount = 0;
      let failCount = 0;
      const failedRoutes = [];

      for (const route of ROUTES) {
        try {
          await renderRouteWithRetry(page, route);
          successCount++;
        } catch (err) {
          failCount++;
          failedRoutes.push(route);
          console.error(`Skipping ${route} due to error: ${err.message}`);
        }
      }

      await browser.close();

      // Print summary
      console.log(`\n✅ Prerender Summary:`);
      console.log(`   ✓ Success: ${successCount}/${ROUTES.length} routes`);
      if (failCount > 0) {
        console.log(`   ✗ Failed: ${failCount} routes`);
        console.log(`   Failed routes:`, failedRoutes.join(', '));
      }

      // Exit with error if any critical route failed
      if (failCount > 0) {
        throw new Error(`${failCount} route(s) failed to prerender`);
      }

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
