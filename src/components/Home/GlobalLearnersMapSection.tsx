import React, { useEffect, useMemo, useState } from "react";

type RollupCountry = {
  countryCode: string;
  countryName: string;
  activeStudents: number;
  familyCount?: number;
};

type RollupPayload = {
  totalActiveCountries: number;
  totalActiveStudentsWithCountry: number;
  countries: RollupCountry[];
  updatedAt: string;
  source: string;
};

type CountryPoint = {
  x: number;
  y: number;
};

type LoadState = "loading" | "loaded" | "fallback";

const JSON_OBJECT_PATH = "public-stats/global-learners.json";
const DEFAULT_STORAGE_BUCKET = "tinysteps-react-v1.firebasestorage.app";
const COUNTRY_POINTS: Record<string, CountryPoint> = {
  US: { x: 23.8, y: 47.0 },
  GB: { x: 48.2, y: 39.5 },
  IE: { x: 46.7, y: 40.0 },
  HR: { x: 51.3, y: 44.7 },
  AE: { x: 58.5, y: 54.5 },
  OM: { x: 60.0, y: 57.0 },
  PK: { x: 62.0, y: 53.8 },
  IN: { x: 65.2, y: 58.4 },
  SG: { x: 70.0, y: 65.8 },
  AU: { x: 78.5, y: 76.5 },
};
const COUNTRY_NAME_FALLBACK: Record<string, string> = {
  IN: "India",
  AE: "UAE",
  AU: "Australia",
  US: "USA",
  GB: "UK",
  HR: "Croatia",
  IE: "Ireland",
  OM: "Oman",
  PK: "Pakistan",
  SG: "Singapore",
};
function normalizeBucket(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/^gs:\/\//, "").replace(/\/+$/, "");
}

function getGlobalLearnersJsonUrl(configuredBucket: unknown): string {
  const bucket = normalizeBucket(configuredBucket) || DEFAULT_STORAGE_BUCKET;
  const dailyCacheKey = new Date().toISOString().slice(0, 10);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(JSON_OBJECT_PATH)}?alt=media&v=${dailyCacheKey}`;
}

function normalizeCountry(entry: unknown): RollupCountry | null {
  if (!entry || typeof entry !== "object") return null;
  const raw = entry as Partial<RollupCountry>;
  const code = typeof raw.countryCode === "string" ? raw.countryCode.trim().toUpperCase() : "";
  if (!/^[A-Z]{2}$/.test(code)) return null;
  const name = typeof raw.countryName === "string" ? raw.countryName.trim() : "";
  const fallbackName = COUNTRY_NAME_FALLBACK[code] || code;
  const numericCount = typeof raw.activeStudents === "number" && Number.isFinite(raw.activeStudents)
    ? raw.activeStudents
    : typeof raw.familyCount === "number" && Number.isFinite(raw.familyCount)
      ? raw.familyCount
      : 0;
  const activeStudents = Math.max(0, Math.floor(numericCount));
  return { countryCode: code, countryName: name || fallbackName, activeStudents, familyCount: activeStudents };
}

function normalizePayload(raw: unknown): RollupPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Partial<RollupPayload>;
  const normalizedCountries = Array.isArray(input.countries)
    ? input.countries.map(normalizeCountry).filter((item): item is RollupCountry => Boolean(item))
    : [];

  const totalActiveCountries = typeof input.totalActiveCountries === "number"
    ? Math.max(0, Math.floor(input.totalActiveCountries))
    : normalizedCountries.length;
  const totalActiveStudentsWithCountry = typeof input.totalActiveStudentsWithCountry === "number"
    ? Math.max(0, Math.floor(input.totalActiveStudentsWithCountry))
    : normalizedCountries.reduce((sum, row) => sum + row.activeStudents, 0);

  return {
    totalActiveCountries,
    totalActiveStudentsWithCountry,
    countries: normalizedCountries,
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : "",
    source: typeof input.source === "string" ? input.source : "",
  };
}

export default function GlobalLearnersMapSection() {
  const isDev = import.meta.env.DEV;
  const [payload, setPayload] = useState<RollupPayload | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  // This public rollup is intentionally fetched through the Storage REST URL.
  // Do not initialize the Firebase SDK on a marketing page just to read a
  // non-sensitive, cacheable JSON object.
  const jsonUrl = useMemo(() => getGlobalLearnersJsonUrl(DEFAULT_STORAGE_BUCKET), []);

  useEffect(() => {
    if (isDev) {
      console.info("[GlobalLearnersMap] url", jsonUrl);
    }
    const controller = new AbortController();
    setLoadState("loading");

    const run = async () => {
      try {
        const response = await fetch(jsonUrl, {
          method: "GET",
          signal: controller.signal,
        });
        if (isDev) {
          console.info("[GlobalLearnersMap] status", response.status);
        }
        if (!response.ok) {
          setPayload(null);
          setLoadState("fallback");
          return;
        }
        const rawText = await response.text();
        if (!rawText.trim()) {
          setPayload(null);
          setLoadState("fallback");
          return;
        }
        const data = JSON.parse(rawText) as unknown;
        const normalized = normalizePayload(data);
        if (!normalized) {
          setPayload(null);
          setLoadState("fallback");
          return;
        }
        const normalizedCountries = normalized.countries;
        if (isDev) {
          console.info("[GlobalLearnersMap] normalized countries", normalizedCountries);
        }
        if (normalizedCountries.length === 0) {
          setPayload(null);
          setLoadState("fallback");
          return;
        }
        const safeTotalActiveCountries =
          normalized.totalActiveCountries >= normalizedCountries.length && normalized.totalActiveCountries > 0
            ? normalized.totalActiveCountries
            : normalizedCountries.length;
        setPayload({
          ...normalized,
          totalActiveCountries: safeTotalActiveCountries,
        });
        setLoadState("loaded");
      } catch {
        setPayload(null);
        setLoadState("fallback");
      }
    };

    run();
    return () => controller.abort();
  }, [jsonUrl, isDev]);

  const countries = loadState === "loaded" && payload?.countries?.length ? payload.countries : [];
  const totalCountries = loadState === "loaded" && payload
    ? (payload.totalActiveCountries > 0 ? payload.totalActiveCountries : payload.countries.length)
    : 0;
  const countriesLabel = totalCountries === 1 ? "country" : "countries";

  const pinnedCountries = countries.filter((country) =>
    Boolean(COUNTRY_POINTS[country.countryCode]),
  );
  const sortedCountries = useMemo(() => {
    const mapped: RollupCountry[] = [];
    const unmapped: RollupCountry[] = [];

    for (const country of countries) {
      if (COUNTRY_POINTS[country.countryCode]) {
        mapped.push(country);
      } else {
        unmapped.push(country);
      }
    }

    mapped.sort((a, b) => {
      const aX = COUNTRY_POINTS[a.countryCode].x;
      const bX = COUNTRY_POINTS[b.countryCode].x;
      if (aX !== bX) return aX - bX;
      return a.countryName.localeCompare(b.countryName);
    });
    unmapped.sort((a, b) => a.countryName.localeCompare(b.countryName));
    return [...mapped, ...unmapped];
  }, [countries]);

  return (
    <section className="px-4 py-6 sm:px-6 sm:py-8" data-map-state={loadState}>
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-[#fffaf4] via-white to-[#ecf7ff] p-4 shadow-[0_22px_56px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-amber-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-sky-200/35 blur-3xl" />

          <div className="relative">
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Tiny Steps Learners Around the World</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 sm:text-base">
              Children learn phonics, grammar, reading, sentence formation, and confident communication with Tiny Steps from wherever they are.
            </p>
            <p className="mt-1.5 text-sm font-medium text-slate-600">
              A growing online learning community for families across countries.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {loadState === "loaded"
                ? `Learning community across ${Math.max(totalCountries, 1)} ${countriesLabel}`
                : loadState === "fallback"
                  ? "Learning community growing across regions"
                  : "Learning community across countries"}
            </p>
          </div>

          <div className="relative mt-4 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-3 sm:p-4">
            <div className="w-full">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#edf5ff] to-[#f7fbff]">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-30 w-8 bg-gradient-to-r from-[#f3f8ff] to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-30 w-8 bg-gradient-to-l from-[#f3f8ff] to-transparent" />
                <div className="cursor-grab overflow-x-auto overflow-y-hidden active:cursor-grabbing">
                  <div className="relative flex h-[220px] w-full items-center sm:h-[280px] lg:h-[340px]">
                    <div
                      className="relative w-[150%] shrink-0 sm:w-[135%] lg:w-[115%]"
                      style={{ aspectRatio: "1365 / 768" }}
                    >
                      <img
                        src="/maps/world-map.webp"
                        alt=""
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="absolute inset-0 h-full w-full object-contain"
                      />

                      <div className="pointer-events-none absolute inset-0 z-20">
                        {pinnedCountries.map((country) => {
                          const point = COUNTRY_POINTS[country.countryCode];

                          return (
                            <div
                              key={country.countryCode}
                              className="absolute z-30 -translate-x-1/2 -translate-y-full"
                              style={{ left: `${point.x}%`, top: `${point.y}%` }}
                            >
                              <span className="relative block h-3.5 w-3.5 rounded-full bg-[#ff8f3f] shadow-[0_0_0_3px_rgba(255,143,63,0.24),0_2px_8px_rgba(15,23,42,0.28)] md:h-5 md:w-5">
                                <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white md:h-2 md:w-2" />
                                <span className="absolute inset-0 hidden rounded-full border border-orange-300/70 md:block md:motion-safe:animate-ping" />
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5 pb-1 sm:gap-2">
              {sortedCountries.map((country) => (
                <span
                  key={country.countryCode}
                  className="rounded-full border border-white bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700 shadow-sm sm:px-3 sm:py-1 sm:text-sm"
                >
                  {country.countryName}
                </span>
              ))}
            </div>

            {loadState === "fallback" ? (
              <p className="mt-3 text-sm text-slate-500">
                Tiny Steps is growing with families across regions.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
