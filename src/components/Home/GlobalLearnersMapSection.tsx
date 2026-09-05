import React, { useEffect, useMemo, useState } from "react";
import {
  getCountryCoverageMetadata,
  getCountryMapPoint,
  type CountryMapPoint,
} from "../../lib/countryCoverage";

type RollupCountry = {
  countryCode: string;
  countryName: string;
  familyCount: number;
  activeStudents?: number;
};

type RollupPayload = {
  totalCountriesServed: number;
  totalFamiliesWithCountry: number;
  countries: RollupCountry[];
  updatedAt: string;
  source: string;
  coverageDefinition?: string;
  schedule?: string;
  totalActiveCountries?: number;
  totalActiveStudentsWithCountry?: number;
};

type LoadState = "loading" | "loaded" | "fallback";

type PinnedCountry = {
  country: RollupCountry;
  point: CountryMapPoint;
};

const JSON_OBJECT_PATH = "public-stats/global-learners.json";
const DEFAULT_STORAGE_BUCKET = "tinysteps-react-v1.firebasestorage.app";
const ROLLUP_STALE_AFTER_MS = 48 * 60 * 60 * 1000;

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

  const metadata = getCountryCoverageMetadata(code);
  const name = typeof raw.countryName === "string" ? raw.countryName.trim() : "";
  const numericCount = typeof raw.familyCount === "number" && Number.isFinite(raw.familyCount)
    ? raw.familyCount
    : typeof raw.activeStudents === "number" && Number.isFinite(raw.activeStudents)
      ? raw.activeStudents
      : 0;
  const familyCount = Math.max(0, Math.floor(numericCount));

  return {
    countryCode: code,
    countryName: name || metadata?.name || code,
    familyCount,
    activeStudents: familyCount,
  };
}

function normalizePayload(raw: unknown): RollupPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Partial<RollupPayload>;
  const normalizedCountries = Array.isArray(input.countries)
    ? input.countries.map(normalizeCountry).filter((item): item is RollupCountry => Boolean(item))
    : [];

  const legacyTotalCountries = typeof input.totalActiveCountries === "number"
    ? Math.max(0, Math.floor(input.totalActiveCountries))
    : 0;
  const totalCountriesServed = typeof input.totalCountriesServed === "number"
    ? Math.max(0, Math.floor(input.totalCountriesServed))
    : legacyTotalCountries || normalizedCountries.length;

  const legacyFamilyTotal = typeof input.totalActiveStudentsWithCountry === "number"
    ? Math.max(0, Math.floor(input.totalActiveStudentsWithCountry))
    : 0;
  const totalFamiliesWithCountry = typeof input.totalFamiliesWithCountry === "number"
    ? Math.max(0, Math.floor(input.totalFamiliesWithCountry))
    : legacyFamilyTotal || normalizedCountries.reduce((sum, row) => sum + row.familyCount, 0);

  return {
    totalCountriesServed,
    totalFamiliesWithCountry,
    countries: normalizedCountries,
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : "",
    source: typeof input.source === "string" ? input.source : "",
    coverageDefinition: typeof input.coverageDefinition === "string" ? input.coverageDefinition : undefined,
    schedule: typeof input.schedule === "string" ? input.schedule : undefined,
    totalActiveCountries: legacyTotalCountries || totalCountriesServed,
    totalActiveStudentsWithCountry: legacyFamilyTotal || totalFamiliesWithCountry,
  };
}

function getRollupFreshness(updatedAt: string): "fresh" | "stale" | "unknown" {
  if (!updatedAt) return "unknown";
  const timestamp = Date.parse(updatedAt);
  if (!Number.isFinite(timestamp)) return "unknown";
  return Date.now() - timestamp <= ROLLUP_STALE_AFTER_MS ? "fresh" : "stale";
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
        if (!normalized || normalized.countries.length === 0) {
          setPayload(null);
          setLoadState("fallback");
          return;
        }

        const safeTotalCountries =
          normalized.totalCountriesServed >= normalized.countries.length && normalized.totalCountriesServed > 0
            ? normalized.totalCountriesServed
            : normalized.countries.length;
        const safePayload = {
          ...normalized,
          totalCountriesServed: safeTotalCountries,
        };
        setPayload(safePayload);
        setLoadState("loaded");

        if (isDev) {
          console.info("[GlobalLearnersMap] normalized countries", safePayload.countries);
          console.info("[GlobalLearnersMap] updatedAt", safePayload.updatedAt);
          if (getRollupFreshness(safePayload.updatedAt) === "stale") {
            console.warn("[GlobalLearnersMap] rollup is older than 48 hours", safePayload.updatedAt);
          }
        }
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
    ? (payload.totalCountriesServed > 0 ? payload.totalCountriesServed : payload.countries.length)
    : 0;
  const countriesLabel = totalCountries === 1 ? "country" : "countries";
  const freshness = payload ? getRollupFreshness(payload.updatedAt) : "unknown";

  const pinnedCountries = useMemo<PinnedCountry[]>(() => {
    return countries
      .map((country) => {
        const point = getCountryMapPoint(country.countryCode);
        return point ? { country, point } : null;
      })
      .filter((item): item is PinnedCountry => Boolean(item));
  }, [countries]);

  const sortedCountries = useMemo(() => {
    return [...countries].sort((a, b) => {
      const aPoint = getCountryMapPoint(a.countryCode);
      const bPoint = getCountryMapPoint(b.countryCode);
      if (aPoint && bPoint && aPoint.x !== bPoint.x) return aPoint.x - bPoint.x;
      if (aPoint && !bPoint) return -1;
      if (!aPoint && bPoint) return 1;
      return a.countryName.localeCompare(b.countryName);
    });
  }, [countries]);

  return (
    <section
      className="px-4 py-6 sm:px-6 sm:py-8"
      data-map-state={loadState}
      data-rollup-freshness={freshness}
      data-rollup-updated-at={payload?.updatedAt || ""}
    >
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-[#fffaf4] via-white to-[#ecf7ff] p-4 shadow-[0_22px_56px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-amber-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-sky-200/35 blur-3xl" />

          <div className="relative">
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Tiny Steps Learners Around the World</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 sm:text-base">
              Children have learned phonics, grammar, reading, sentence formation, and confident communication with Tiny Steps from around the world.
            </p>
            <p className="mt-1.5 text-sm font-medium text-slate-600">
              Our global learning community includes families learning with Tiny Steps today and families who have completed their courses.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {loadState === "loaded"
                ? `Tiny Steps has served families across ${Math.max(totalCountries, 1)} ${countriesLabel}`
                : loadState === "fallback"
                  ? "Tiny Steps has served families across regions"
                  : "Tiny Steps serves families across countries"}
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

                      <div
                        className="pointer-events-none absolute inset-0 z-20"
                        aria-hidden="true"
                      >
                        {pinnedCountries.map(({ country, point }) => (
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
                        ))}
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

            {loadState === "loaded" ? (
              <p className="mt-3 text-xs text-slate-500">Country coverage is refreshed daily.</p>
            ) : null}

            {loadState === "fallback" ? (
              <p className="mt-3 text-sm text-slate-500">
                Tiny Steps has served families across regions.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
