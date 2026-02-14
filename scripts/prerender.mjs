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
  "/phonics",
  "/courses",
  "/curriculum",
  "/pricing",
  "/faq",
  "/contact",
  "/blog",
  "/best-online-phonics-classes-india",
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
 * SEO Registry matching src/lib/seo.ts ROUTE_SEO_REGISTRY
 * Maps route pathname to SEO metadata for build-time injection into HTML <head>
 */
const ROUTE_SEO_CONFIG = {
  '/': {
    title: 'Tiny Steps Learning | 1:1 Online English Classes for Kids',
    description: 'Premium 1:1 online English classes for ages 3–12. IB-aligned phonics, grammar and public speaking with kind live mentors, AI-guided practice, and simple weekly progress updates for parents. Book a free assessment class.',
    canonicalPath: '/',
    robots: 'index, follow',
  },
  '/courses': {
    title: 'English Courses for Kids | Tiny Steps Learning',
    description: 'Browse our range of 1:1 online English courses for kids ages 3–12. Phonics, grammar, public speaking, and more. Customized to each child\'s pace and learning style.',
    canonicalPath: '/courses',
    robots: 'index, follow',
  },
  '/curriculum': {
    title: 'IB-Aligned English Curriculum | Tiny Steps Learning',
    description: 'Explore our comprehensive, IB-aligned English curriculum for young learners. Phonics mastery, grammar fundamentals, and communication skills—all designed by education experts.',
    canonicalPath: '/curriculum',
    robots: 'index, follow',
  },
  '/phonics': {
    title: 'Online Phonics Classes for Kids | Tiny Steps Learning',
    description: 'Personalized 1:1 online phonics classes for kids ages 3–6. Master letter sounds, blending, and early reading with expert live mentors and AI practice games.',
    canonicalPath: '/phonics',
    robots: 'index, follow',
  },
  '/grammar': {
    title: 'English Grammar Classes for Kids | Tiny Steps Learning',
    description: 'Transform your child\'s grammar confidence. 1:1 online grammar classes for kids ages 6–12, covering parts of speech, sentence structure, and more.',
    canonicalPath: '/grammar',
    robots: 'index, follow',
  },
  '/speaking': {
    title: 'Public Speaking & Communication Classes for Kids | Tiny Steps Learning',
    description: 'Build communication confidence. 1:1 online public speaking classes for kids ages 6–12. Presentation skills, fluency, and confident self-expression.',
    canonicalPath: '/speaking',
    robots: 'index, follow',
  },
  '/blog': {
    title: 'Blog | Tiny Steps Learning',
    description: 'Read expert articles on English language learning, teaching strategies, and child development. Tips for parents and educators.',
    canonicalPath: '/blog',
    robots: 'index, follow',
  },
  '/pricing': {
    title: 'Pricing & Plans | Tiny Steps Learning',
    description: 'Affordable, transparent pricing for 1:1 online English classes. Choose the plan that fits your family. No hidden fees.',
    canonicalPath: '/pricing',
    robots: 'index, follow',
  },
  '/contact': {
    title: 'Contact Us | Tiny Steps Learning',
    description: 'Have questions? Get in touch with our team. We\'re here to help you find the perfect English class for your child.',
    canonicalPath: '/contact',
    robots: 'index, follow',
  },
  '/why-tiny-steps': {
    title: 'Why Choose Tiny Steps Learning | Online English Classes for Kids',
    description: 'Discover why thousands of families trust Tiny Steps Learning. Expert mentors, personalized learning, proven results.',
    canonicalPath: '/why-tiny-steps',
    robots: 'index, follow',
  },
  '/faq': {
    title: 'Frequently Asked Questions | Tiny Steps Learning',
    description: 'Find answers to common questions about our 1:1 online English classes, curriculum, scheduling, pricing, and more.',
    canonicalPath: '/faq',
    robots: 'index, follow',
  },
  '/for-schools': {
    title: 'English Program for Schools | Tiny Steps Learning',
    description: 'Tiny Steps Learning partners with schools to deliver high-quality, personalized English instruction for groups or individuals.',
    canonicalPath: '/for-schools',
    robots: 'index, follow',
  },
  '/parents': {
    title: 'Parents Hub | Tiny Steps Learning',
    description: 'Resources and guides for parents. Learn how to support your child\'s English learning journey at home.',
    canonicalPath: '/parents',
    robots: 'index, follow',
  },
  '/parents/getting-started': {
    title: 'Getting Started Guide | Parents Hub | Tiny Steps Learning',
    description: 'A step-by-step guide for parents to get started with Tiny Steps Learning. Enrollment, first class, and what to expect.',
    canonicalPath: '/parents/getting-started',
    robots: 'index, follow',
  },
  '/parents/choosing-course': {
    title: 'Choosing the Right Course for Your Child | Parents Hub | Tiny Steps Learning',
    description: 'How to choose the best English course for your child\'s age, level, and learning goals.',
    canonicalPath: '/parents/choosing-course',
    robots: 'index, follow',
  },
  '/parents/scheduling': {
    title: 'Scheduling Classes | Parents Hub | Tiny Steps Learning',
    description: 'Tips for scheduling and managing your child\'s online English classes with flexibility and consistency.',
    canonicalPath: '/parents/scheduling',
    robots: 'index, follow',
  },
  '/parents/payments': {
    title: 'Payments & Invoicing | Parents Hub | Tiny Steps Learning',
    description: 'Learn about our flexible payment options, billing cycles, and invoicing for English classes.',
    canonicalPath: '/parents/payments',
    robots: 'index, follow',
  },
  '/parents/tracking-progress': {
    title: 'Tracking Your Child\'s Progress | Parents Hub | Tiny Steps Learning',
    description: 'Understand how Tiny Steps Learning helps you track your child\'s English learning progress and celebrate milestones.',
    canonicalPath: '/parents/tracking-progress',
    robots: 'index, follow',
  },
  '/parents/helping-with-homework': {
    title: 'Helping with Homework | Parents Hub | Tiny Steps Learning',
    description: 'Tips and strategies for parents to support their child\'s English practice and homework between classes.',
    canonicalPath: '/parents/helping-with-homework',
    robots: 'index, follow',
  },
  '/parents/phonics-mission': {
    title: 'Phonics Mission Guide | Parents Hub | Tiny Steps Learning',
    description: 'A parent\'s guide to the Phonics Mission program. How to help your child master phonics through engaging practice.',
    canonicalPath: '/parents/phonics-mission',
    robots: 'index, follow',
  },
  '/parents/reading-at-home': {
    title: 'Reading at Home | Parents Hub | Tiny Steps Learning',
    description: 'Strategies for parents to encourage reading at home and support your child\'s literacy development.',
    canonicalPath: '/parents/reading-at-home',
    robots: 'index, follow',
  },
  '/parents/speech-confidence': {
    title: 'Building Speech Confidence | Parents Hub | Tiny Steps Learning',
    description: 'How to help your shy child build confidence in speaking English. Tips from our expert mentors.',
    canonicalPath: '/parents/speech-confidence',
    robots: 'index, follow',
  },
  '/parents/common-mistakes': {
    title: 'Common Learning Mistakes | Parents Hub | Tiny Steps Learning',
    description: 'Avoid common pitfalls in English learning. Expert advice from Tiny Steps Learning mentors.',
    canonicalPath: '/parents/common-mistakes',
    robots: 'index, follow',
  },
  '/summer-english-camp-2026': {
    title: 'Summer English Camp 2026 | Tiny Steps Learning',
    description: 'Join our immersive Summer English Camp 2026. Dynamic group sessions, games, and creative projects for kids ages 6–12.',
    canonicalPath: '/summer-english-camp-2026',
    robots: 'index, follow',
  },
  '/online-phonics-reading-classes': {
    title: 'Online Phonics & Reading Classes for Kids | Tiny Steps Learning',
    description: 'Specialized 1:1 online phonics and reading classes. Master early literacy with expert guidance and interactive practice.',
    canonicalPath: '/online-phonics-reading-classes',
    robots: 'index, follow',
  },
  '/english-grammar-writing-classes': {
    title: 'English Grammar & Writing Classes for Kids | Tiny Steps Learning',
    description: 'Improve grammar and writing skills with 1:1 online classes. For kids ages 7–12. Clear explanations, practical exercises, and feedback.',
    canonicalPath: '/english-grammar-writing-classes',
    robots: 'index, follow',
  },
  '/public-speaking-communication-kids': {
    title: 'Public Speaking & Communication Classes for Kids | Tiny Steps Learning',
    description: 'Build speaking confidence and communication skills. 1:1 online classes for kids ages 7–12. Presentations, fluency, and self-expression.',
    canonicalPath: '/public-speaking-communication-kids',
    robots: 'index, follow',
  },
};

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

  let result = html;

  // Inject/replace <title>
  const titleTag = `<title>${escapeHtml(config.title)}</title>`;
  result = result.replace(/<title>.*?<\/title>/i, titleTag) || result.replace('</head>', `${titleTag}</head>`);

  // Inject/replace <meta name="description">
  const descMeta = `<meta name="description" content="${escapeHtml(config.description)}">`;
  result = result.replace(/<meta name="description"[^>]*>/i, descMeta) || result.replace('</head>', `${descMeta}</head>`);

  // Inject/replace <link rel="canonical">
  const canonicalLink = `<link rel="canonical" href="${canonicalUrl}">`;
  result = result.replace(/<link rel="canonical"[^>]*>/i, canonicalLink) || result.replace('</head>', `${canonicalLink}</head>`);

  // Inject/replace <meta name="robots">
  const robotsMeta = `<meta name="robots" content="${config.robots}">`;
  result = result.replace(/<meta name="robots"[^>]*>/i, robotsMeta) || result.replace('</head>', `${robotsMeta}</head>`);

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
  // Inject SEO metadata before writing
  const seoInjectedHtml = injectSeoMetadata(html, route);

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
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Prerendering ${url}${attempt > 1 ? ` (attempt ${attempt}/${maxRetries})` : ''}`);
      
      await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
      
      // Wait for React content to be meaningful (not just meta tags)
      // Check that #root has substantial text content (>200 chars) or main heading exists
      await page.waitForFunction(
        () => {
          const root = document.getElementById('root');
          if (!root) return false;
          const textLength = root.innerText?.length || 0;
          const hasHeading = root.querySelector('h1, h2') !== null;
          return textLength > 200 || hasHeading;
        },
        { timeout: 30000 }
      );
      
      const html = await page.content();
      
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
