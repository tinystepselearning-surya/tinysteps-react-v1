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
export declare function useLegacyPage(options: LegacyOptions): LegacyState;
export {};
//# sourceMappingURL=useLegacyPage.d.ts.map