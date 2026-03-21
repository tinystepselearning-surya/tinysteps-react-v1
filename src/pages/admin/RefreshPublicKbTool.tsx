import React, { useMemo, useState } from "react";
import { Card } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../lib/firebaseConfig";
import { useToast } from "@components/hooks/use-toast";

const DEFAULT_PATHS_TEXT =
  "/\n/summer-camps\n/summer-camps/phonics-fast-track\n/summer-camps/grammar-fast-track\n/summer-camps/speaking-fast-track\n/pricing\n/courses\n/faq\n/how-it-works\n/why-tiny-steps\n/curriculum";

const RefreshPublicKbTool: React.FC = () => {
  const { toast } = useToast();

  const [pathsText, setPathsText] = useState(DEFAULT_PATHS_TEXT);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const paths = useMemo(() => {
    return pathsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [pathsText]);

  const handleRun = async () => {
    setRunning(true);
    setResult(null);

    try {
      const refreshFn = httpsCallable(functions, "refreshPublicKb");

      // ✅ Pass paths; your function will also work if you pass {} (defaults)
      const res = await refreshFn({ paths });

      setResult(res.data ?? null);

      const payload = (res.data as any) || {};
      toast({
        title: "KB refresh completed",
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
          "Failed to run indexer. If you see permission-denied, login as Admin.",
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
    <Card className="p-4">
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold">Refresh Public KB</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Fetches your public pages, chunks text, tokenizes it, and updates{" "}
            <code>public_kb_chunks</code> for Ask TinySteps retrieval.
          </p>
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Paths (one per line)
          </div>
          <textarea
            value={pathsText}
            onChange={(e) => setPathsText(e.target.value)}
            rows={7}
            className="mt-2 w-full rounded-lg border px-3 py-2 text-sm font-mono bg-white dark:bg-gray-900"
            placeholder={DEFAULT_PATHS_TEXT}
            disabled={running}
          />
          <div className="text-xs text-gray-500 mt-2">
            Keep it to 5–10 key pages (pricing, courses, faq, how-it-works).
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleRun} disabled={running} variant="default">
            {running ? "Running…" : "Run Now"}
          </Button>

          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            disabled={!result}
          >
            Copy Result
          </Button>
        </div>

        {result && (
          <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded overflow-auto max-h-56">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </Card>
  );
};

export default RefreshPublicKbTool;
