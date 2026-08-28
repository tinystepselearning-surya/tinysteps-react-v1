import React, { useMemo, useState } from "react";
import { Card } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../lib/firebaseConfig";
import { useToast } from "@components/hooks/use-toast";
import {
  ASK_TINY_STEPS_KNOWLEDGE_SOURCES,
  getAskTinyStepsKnowledgeSourceStats,
  getLegacyKbRefreshPaths,
  type AskTinyStepsAudience,
  type AskTinyStepsKnowledgeSource,
} from "../../config/askTinyStepsKnowledgeSources";

type AudienceFilter = "all" | AskTinyStepsAudience;

function statusLabel(source: AskTinyStepsKnowledgeSource) {
  if (!source.enabledForAI || source.retrievalPolicy === "disabled") return "Disabled";
  if (source.lifecycle === "archived") return "Archived";
  if (source.retrievalPolicy === "intent_only") return "Intent only";
  return "Active";
}

const RefreshPublicKbTool: React.FC = () => {
  const { toast } = useToast();
  const stats = useMemo(() => getAskTinyStepsKnowledgeSourceStats(), []);

  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedLegacyPaths, setSelectedLegacyPaths] = useState<string[]>(() =>
    getLegacyKbRefreshPaths()
  );
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const visibleSources = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ASK_TINY_STEPS_KNOWLEDGE_SOURCES.filter((source) => {
      const audienceMatches = audienceFilter === "all" || source.audience === audienceFilter;
      const queryMatches =
        !q ||
        source.title.toLowerCase().includes(q) ||
        source.path.toLowerCase().includes(q) ||
        source.tags.some((tag) => tag.toLowerCase().includes(q));
      return audienceMatches && queryMatches;
    });
  }, [audienceFilter, query]);

  const toggleLegacyPath = (path: string) => {
    setSelectedLegacyPaths((current) =>
      current.includes(path) ? current.filter((item) => item !== path) : [...current, path]
    );
  };

  const handleRun = async () => {
    if (selectedLegacyPaths.length === 0) {
      toast({
        title: "No legacy KB sources selected",
        description: "Select at least one source that exists in public/kb.json.",
        variant: "destructive",
      });
      return;
    }

    setRunning(true);
    setResult(null);

    try {
      const refreshFn = httpsCallable(functions, "refreshPublicKb");
      const res = await refreshFn({ paths: selectedLegacyPaths });
      setResult(res.data ?? null);

      const payload = (res.data as any) || {};
      toast({
        title: "Legacy KB refresh completed",
        description: `Indexed ${payload.pagesOk ?? payload.pagesSelected ?? 0} pages, ${
          payload.totalChunks ?? 0
        } chunks.`,
        variant: "default",
      });
    } catch (err: any) {
      console.error("[RefreshPublicKbTool] failed", err);
      toast({
        title: "Error",
        description:
          err?.message ||
          "Failed to refresh the legacy KB. If you see permission-denied, login as Admin.",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  const handleCopy = async () => {
    if (!result) {
      toast({ title: "No result", description: "No result to copy yet." });
      return;
    }
    try {
      await navigator.clipboard?.writeText(JSON.stringify(result, null, 2));
      toast({ title: "Copied", description: "Result copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard permission blocked." });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">Ask Tiny Steps Knowledge Sources</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  AI-2B registry of approved public sources. This is the control layer for the next
                  Gemini retrieval upgrade; it does not switch production retrieval by itself.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                {stats.enabled} AI-enabled sources
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            {[
              ["Total", stats.total],
              ["Parents", stats.parent],
              ["Schools", stats.schools],
              ["Legacy KB", stats.legacyKbAvailable],
              ["Archived", stats.archived],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg border p-3">
                <div className="text-xs text-gray-500">{label}</div>
                <div className="text-xl font-semibold">{value}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 md:flex-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:bg-gray-900"
              placeholder="Search source, path or topic…"
            />
            <select
              value={audienceFilter}
              onChange={(event) => setAudienceFilter(event.target.value as AudienceFilter)}
              className="rounded-lg border bg-white px-3 py-2 text-sm dark:bg-gray-900"
            >
              <option value="all">All audiences</option>
              <option value="parents">Parents</option>
              <option value="schools">Schools</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900">
                <tr>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Audience</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2">AI status</th>
                  <th className="px-3 py-2">Legacy KB</th>
                </tr>
              </thead>
              <tbody>
                {visibleSources.map((source) => (
                  <tr key={source.id} className="border-t align-top">
                    <td className="px-3 py-3">
                      <div className="font-medium">{source.title}</div>
                      <a
                        className="mt-1 block text-xs text-blue-600 hover:underline"
                        href={source.canonicalUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {source.path}
                      </a>
                      {source.note && (
                        <div className="mt-1 max-w-xl text-xs text-gray-500">{source.note}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 capitalize">{source.audience}</td>
                    <td className="px-3 py-3 capitalize">{source.category}</td>
                    <td className="px-3 py-3">P{source.priority}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium dark:bg-gray-800">
                        {statusLabel(source)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {source.legacyKbAvailable ? (
                        <label className="inline-flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={selectedLegacyPaths.includes(source.path)}
                            onChange={() => toggleLegacyPath(source.path)}
                            disabled={running}
                          />
                          Refresh
                        </label>
                      ) : (
                        <span className="text-xs text-gray-400">Not in kb.json</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-semibold">Legacy chunk refresh</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Compatibility tool only. The Cloud Function reads curated entries from
              <code className="mx-1">public/kb.json</code>, chunks/tokenizes them, and updates
              <code className="mx-1">public_kb_chunks</code>. The production Gemini assistant is
              not switched to this registry until AI-2C.
            </p>
          </div>

          <div className="text-xs text-gray-500">
            {selectedLegacyPaths.length} of {stats.legacyKbAvailable} legacy sources selected.
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleRun} disabled={running} variant="default">
              {running ? "Refreshing…" : "Refresh selected legacy sources"}
            </Button>
            <Button
              onClick={() => setSelectedLegacyPaths(getLegacyKbRefreshPaths())}
              variant="outline"
              size="sm"
              disabled={running}
            >
              Select all legacy sources
            </Button>
            <Button
              onClick={() => setSelectedLegacyPaths([])}
              variant="outline"
              size="sm"
              disabled={running}
            >
              Clear selection
            </Button>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              disabled={!result}
            >
              Copy result
            </Button>
          </div>

          {result && (
            <pre className="max-h-56 overflow-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-800">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RefreshPublicKbTool;
