import { useEffect, useMemo, useRef, useState } from "react";

type LegacyScript = {
  src: string;
  type?: "module" | "text/javascript";
  defer?: boolean;
};

type LegacyOptions = {
  path: string;
  titleFallback?: string;
  styles?: string[];
  scripts?: LegacyScript[];
  transform?: (doc: Document) => void;
};

type LegacyState = {
  html: string;
  error: Error | null;
  loading: boolean;
};

const LEGACY_ATTR = "data-legacy-href";
const LEGACY_SCRIPT_ATTR = "data-legacy-script";

function ensureStyles(hrefs: string[]) {
  const created: HTMLLinkElement[] = [];

  hrefs.forEach((href) => {
    if (!href) return;
    const existing = document.head.querySelector<HTMLLinkElement>(`link[${LEGACY_ATTR}="${href}"]`);
    if (existing) {
      created.push(existing);
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute(LEGACY_ATTR, href);
    document.head.appendChild(link);
    created.push(link);
  });

  return () => {
    created.forEach((link) => {
      if (link.parentElement) {
        link.parentElement.removeChild(link);
      }
    });
  };
}

function ensureScripts(scripts: LegacyScript[]) {
  const created: HTMLScriptElement[] = [];
  scripts.forEach(({ src, type = "module", defer }) => {
    if (!src) return;
    const script = document.createElement("script");
    script.src = src;
    script.type = type;
    if (defer) {
      script.defer = true;
    }
    script.setAttribute(LEGACY_SCRIPT_ATTR, src);
    document.body.appendChild(script);
    created.push(script);
  });

  return () => {
    created.forEach((script) => {
      if (script.parentElement) {
        script.parentElement.removeChild(script);
      }
    });
  };
}

export function useLegacyPage(options: LegacyOptions): LegacyState {
  const { path, styles = [], scripts = [], titleFallback, transform } = options;
  const [state, setState] = useState<LegacyState>({ html: "", error: null, loading: true });
  const scriptsCleanupRef = useRef<() => void>(() => undefined);
  const bodyClassRef = useRef<string>("");
  const stylesKey = useMemo(() => styles.join("|"), [styles]);

  useEffect(() => {
    const cleanup = ensureStyles(styles);
    return () => {
      cleanup();
      scriptsCleanupRef.current?.();
      scriptsCleanupRef.current = () => undefined;
    };
  }, [stylesKey, styles]);

  useEffect(() => {
    if (!path) {
      setState({ html: "", error: null, loading: false });
      return () => {
        scriptsCleanupRef.current?.();
        scriptsCleanupRef.current = () => undefined;
      };
    }
    let cancelled = false;
    const controller = new AbortController();

    setState({ html: "", error: null, loading: true });

    fetch(path, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load legacy page: ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");
        if (transform) {
          transform(doc);
        }
        const body = doc.body?.innerHTML ?? text;
        bodyClassRef.current = doc.body?.className ?? "";
        const title = doc.title?.trim() || titleFallback;
        if (title) {
          document.title = title;
        }
        setState({ html: body, error: null, loading: false });
      })
      .catch((err) => {
        if (cancelled) return;
        bodyClassRef.current = "";
        setState({ html: "", error: err as Error, loading: false });
      });

    return () => {
      cancelled = true;
      controller.abort();
      scriptsCleanupRef.current?.();
      scriptsCleanupRef.current = () => undefined;
    };
  }, [path, titleFallback, transform]);

  useEffect(() => {
    if (!state.html || state.error) return;
    scriptsCleanupRef.current?.();
    scriptsCleanupRef.current = ensureScripts(scripts);
  }, [scripts, state.html, state.error]);

  useEffect(() => {
    if (!state.html || state.error) return;
    const classes = bodyClassRef.current
      .split(/\s+/)
      .map((cls) => cls.trim())
      .filter(Boolean);
    if (!classes.length) return;
    classes.forEach((cls) => document.body.classList.add(cls));
    return () => {
      classes.forEach((cls) => document.body.classList.remove(cls));
    };
  }, [state.html, state.error]);

  return state;
}
