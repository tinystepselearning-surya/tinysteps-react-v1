const MISSION_SHELL_PATH = "/kids/games/english-excellence";
const MISSION_CONTEXT_KEYS = ["eemReturn", "eemStage", "eemTile"] as const;

const isAllowedMissionReturn = (value: string) =>
  value.startsWith(MISSION_SHELL_PATH);

export const resolveMissionReturnPath = (searchParams: URLSearchParams): string => {
  const raw = searchParams.get("eemReturn");
  if (!raw) return MISSION_SHELL_PATH;
  const value = raw.trim();
  if (!value.startsWith("/")) return MISSION_SHELL_PATH;
  return isAllowedMissionReturn(value) ? value : MISSION_SHELL_PATH;
};

export const copyMissionContextParams = (
  source: URLSearchParams,
  target: URLSearchParams
) => {
  for (const key of MISSION_CONTEXT_KEYS) {
    const value = source.get(key);
    if (value && !target.has(key)) {
      target.set(key, value);
    }
  }
};

export const applyKidAndMissionContext = (
  target: URLSearchParams,
  source: URLSearchParams,
  kidId?: string
) => {
  if (kidId && !target.has("kidId")) {
    target.set("kidId", kidId);
  }
  copyMissionContextParams(source, target);
};

export const addKidIdToPath = (path: string, kidId?: string): string => {
  if (!kidId) return path;
  const url = new URL(path, "https://tinysteps.local");
  if (!url.searchParams.has("kidId")) {
    url.searchParams.set("kidId", kidId);
  }
  return `${url.pathname}${url.search}${url.hash}`;
};

export const buildMissionReturnHref = (
  searchParams: URLSearchParams,
  kidId?: string
): string => {
  const target = resolveMissionReturnPath(searchParams);
  const url = new URL(target, "https://tinysteps.local");
  if (kidId && !url.searchParams.has("kidId")) {
    url.searchParams.set("kidId", kidId);
  }
  copyMissionContextParams(searchParams, url.searchParams);
  return `${url.pathname}${url.search}${url.hash}`;
};
