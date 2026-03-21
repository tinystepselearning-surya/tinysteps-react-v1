import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Card } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { useToast } from "@components/hooks/use-toast";
import { db } from "../../../lib/firebaseConfig";

type ParentOption = {
  id: string;
  name: string;
  email: string;
};

type ParentClassRecording = {
  id: string;
  parentId?: string;
  parentName?: string;
  parentEmail?: string;
  folderName?: string;
  folderUrl?: string;
  sourceType?: string;
  createdAt?: any;
  updatedAt?: any;
};

const isValidRecordingUrl = (value: string) => /^https?:\/\/\S+/i.test(value.trim());

const detectSourceType = (value: string): string => {
  const url = value.toLowerCase();
  if (url.includes("sharepoint.com")) return "sharepoint";
  if (url.includes("onedrive.live.com") || url.includes("1drv.ms")) return "onedrive";
  return "external";
};

const formatTimestamp = (value: any): string => {
  if (!value) return "—";
  try {
    if (typeof value?.toDate === "function") {
      return value.toDate().toLocaleString("en-IN");
    }
    if (typeof value?.seconds === "number") {
      return new Date(value.seconds * 1000).toLocaleString("en-IN");
    }
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) return direct.toLocaleString("en-IN");
    return "—";
  } catch {
    return "—";
  }
};

export default function ClassRecordingsManagement() {
  const { toast } = useToast();

  const [parentSearch, setParentSearch] = useState("");
  const [selectedParentId, setSelectedParentId] = useState("");
  const [folderName, setFolderName] = useState("");
  const [folderUrl, setFolderUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const parentsQuery = useQuery({
    queryKey: ["admin-parent-recording-parents"],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<ParentOption[]> => {
      const snap = await getDocs(collection(db, "users"));
      return snap.docs
        .map((docSnap) => {
          const data = docSnap.data() as any;
          const role = String(data?.role || "").toLowerCase().trim();
          if (role !== "parent") return null;
          const email = String(data?.email || "").trim();
          const name = String(
            data?.displayName || data?.name || data?.fullName || email || "Parent"
          ).trim();
          return {
            id: docSnap.id,
            name: name || "Parent",
            email,
          } as ParentOption;
        })
        .filter((item): item is ParentOption => Boolean(item))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  });

  const recordingsQuery = useQuery({
    queryKey: ["admin-parent-class-recordings"],
    staleTime: 0,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<ParentClassRecording[]> => {
      const recordingsRef = query(
        collection(db, "parentClassRecordings"),
        orderBy("createdAt", "desc"),
        limit(300)
      );
      const snap = await getDocs(recordingsRef);
      return snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as any),
      }));
    },
  });

  const filteredParents = useMemo(() => {
    const list = parentsQuery.data ?? [];
    const term = parentSearch.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (parent) =>
        parent.name.toLowerCase().includes(term) ||
        parent.email.toLowerCase().includes(term)
    );
  }, [parentSearch, parentsQuery.data]);

  const selectedParent = useMemo(() => {
    const list = parentsQuery.data ?? [];
    return list.find((parent) => parent.id === selectedParentId) ?? null;
  }, [parentsQuery.data, selectedParentId]);

  const handleAddRecording = async () => {
    if (!selectedParent) {
      toast({
        title: "Parent required",
        description: "Select a parent before adding the folder.",
        variant: "destructive",
      });
      return;
    }

    const normalizedFolderName = folderName.trim();
    if (!normalizedFolderName) {
      toast({
        title: "Folder name required",
        description: "Enter a folder name to identify this parent folder.",
        variant: "destructive",
      });
      return;
    }

    const url = folderUrl.trim();
    if (!isValidRecordingUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Enter a valid OneDrive or SharePoint folder link.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        parentId: selectedParent.id,
        parentName: selectedParent.name,
        parentEmail: selectedParent.email,
        folderName: normalizedFolderName,
        folderUrl: url,
        sourceType: detectSourceType(url),
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "parentClassRecordings", editingId), payload);
      } else {
        await addDoc(collection(db, "parentClassRecordings"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      setEditingId(null);
      setFolderName("");
      setFolderUrl("");
      await recordingsQuery.refetch();

      toast({
        title: editingId ? "Folder updated" : "Folder added",
        description: `Class recording folder is now mapped for ${selectedParent.name}.`,
      });
    } catch (error: any) {
      console.error("Failed to save class recording folder:", error);
      toast({
        title: "Failed to save folder",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRecording = (recording: ParentClassRecording) => {
    setEditingId(recording.id);
    setSelectedParentId(String(recording.parentId || ""));
    setFolderName(String(recording.folderName || "Class Recordings"));
    setFolderUrl(String(recording.folderUrl || ""));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFolderName("");
    setFolderUrl("");
  };

  const handleDeleteRecording = async (recordingId: string) => {
    const confirmed = window.confirm("Delete this class recording folder?");
    if (!confirmed) return;

    setDeletingId(recordingId);
    try {
      await deleteDoc(doc(db, "parentClassRecordings", recordingId));
      await recordingsQuery.refetch();
      toast({
        title: "Folder deleted",
      });
    } catch (error: any) {
      console.error("Failed to delete class recording folder:", error);
      toast({
        title: "Failed to delete folder",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Parent Class Recording Folders</h2>
          <p className="text-sm text-slate-600">
            Map one OneDrive or SharePoint folder per parent so recordings appear in parent dashboard.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_1.6fr_auto]">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Parent Search
            </label>
            <Input
              value={parentSearch}
              onChange={(event) => setParentSearch(event.target.value)}
              placeholder="Search parent name or email"
            />
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedParentId}
              onChange={(event) => setSelectedParentId(event.target.value)}
            >
              <option value="">Select parent</option>
              {filteredParents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name} {parent.email ? `(${parent.email})` : ""}
                </option>
              ))}
            </select>
            {parentsQuery.isLoading && (
              <p className="text-xs text-slate-500">Loading parent list...</p>
            )}
            {!parentsQuery.isLoading && filteredParents.length === 0 && (
              <p className="text-xs text-amber-700">No parents found for this search.</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Folder Name
            </label>
            <Input
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              placeholder="e.g., Shivay Singh Recordings"
            />
            <p className="text-xs text-slate-500">
              Parent-facing label shown in Class Recordings tab.
            </p>
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Folder URL
            </label>
            <Input
              value={folderUrl}
              onChange={(event) => setFolderUrl(event.target.value)}
              placeholder="https://onedrive.live.com/... or https://...sharepoint.com/..."
            />
            <p className="text-xs text-slate-500">
              Paste the parent's OneDrive or SharePoint folder link.
            </p>
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleAddRecording}
              disabled={isSaving}
              className="w-full lg:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {editingId ? "Update Folder" : "Add Folder"}
                </>
              )}
            </Button>
          </div>
          {editingId && (
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Assigned Folders</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {recordingsQuery.isLoading ? (
            <div className="px-4 py-6 text-sm text-slate-600">Loading folders...</div>
          ) : (recordingsQuery.data ?? []).length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-600">
              No folders added yet.
            </div>
          ) : (
            (recordingsQuery.data ?? []).map((recording) => (
              <div
                key={recording.id}
                className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-start md:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {recording.parentName || "Parent"}
                    {recording.parentEmail ? (
                      <span className="ml-2 font-normal text-slate-500">
                        ({recording.parentEmail})
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    {recording.folderName || "Class Recordings"}
                  </p>
                  <a
                    href={String(recording.folderUrl || "")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block break-all text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    {recording.folderUrl}
                  </a>
                  <p className="text-xs text-slate-500">
                    Updated: {formatTimestamp(recording.updatedAt || recording.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRecording(recording)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(String(recording.folderUrl || ""), "_blank")}
                  >
                    Open
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deletingId === recording.id}
                    onClick={() => handleDeleteRecording(recording.id)}
                  >
                    {deletingId === recording.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
