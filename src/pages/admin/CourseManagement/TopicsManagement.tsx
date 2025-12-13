// TopicsManagement.tsx
import React, { useMemo, useState } from 'react';
import { useTopics } from '../../../hooks/useData';
import {
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';

import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { toast } from '@components/hooks/use-toast';

import { ArrowDown, ArrowLeft, ArrowUp, Edit, Plus, Trash2 } from 'lucide-react';

interface TopicsManagementProps {
  courseId: string;
  onBack: () => void;
}

interface TopicFormData {
  name: string;
  description: string;
  sequenceNumber: number;
  estimatedMinutes: number;
  targetMastery: number;
}

type Topic = {
  id: string; // must be required so doc() accepts it
  courseId?: string;
  name?: string;
  description?: string;
  sequenceNumber?: number;
  estimatedMinutes?: number;
  targetMastery?: number;
};

export default function TopicsManagement({ courseId, onBack }: TopicsManagementProps) {
  const { data: topicsRaw = [], isLoading, refetch } = useTopics(courseId);

  // Cast once so TS knows what a topic looks like
  const topics = useMemo(() => (topicsRaw ?? []) as Topic[], [topicsRaw]);

  // Always operate on a stable, sequence-sorted list
  const topicsSorted = useMemo(() => {
    return [...topics].sort(
      (a, b) => (a.sequenceNumber ?? 9999) - (b.sequenceNumber ?? 9999),
    );
  }, [topics]);

  const nextSequenceNumber = useMemo(() => {
    if (topics.length === 0) return 1;
    return Math.max(...topics.map((t) => t.sequenceNumber ?? 0)) + 1;
  }, [topics]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  const [formData, setFormData] = useState<TopicFormData>({
    name: '',
    description: '',
    sequenceNumber: 1,
    estimatedMinutes: 15,
    targetMastery: 80,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sequenceNumber: nextSequenceNumber,
      estimatedMinutes: 15,
      targetMastery: 80,
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Topic name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const topicRef = doc(collection(db, 'curriculum'));
      await setDoc(topicRef, {
        ...formData,
        courseId,
        practiceExercises: [],
        worksheets: [],
        games: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({ title: 'Success', description: 'Topic created successfully' });
      setIsCreateOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create topic',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Topic name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!editingTopic?.id) {
      toast({
        title: 'Error',
        description: 'Missing topic id',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateDoc(doc(db, 'curriculum', editingTopic.id), {
        ...formData,
        updatedAt: serverTimestamp(),
      });

      toast({ title: 'Success', description: 'Topic updated successfully' });
      setEditingTopic(null);
      resetForm();
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update topic',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;

    try {
      await deleteDoc(doc(db, 'curriculum', topicId));
      toast({ title: 'Success', description: 'Topic deleted successfully' });
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete topic',
        variant: 'destructive',
      });
    }
  };

  // Move topic at currentIndex up by swapping with previous topic (in sorted order)
  const handleMoveUp = async (_topicId: string, currentIndex: number) => {
    if (currentIndex === 0) return;

    const topicToMove = topicsSorted[currentIndex];
    const topicAbove = topicsSorted[currentIndex - 1];

    if (!topicToMove?.id || !topicAbove?.id) {
      toast({
        title: 'Error',
        description: 'Invalid topic id(s). Cannot reorder.',
        variant: 'destructive',
      });
      return;
    }

    const newIndexForMoved = currentIndex - 1;
    const newIndexForAbove = currentIndex;

    try {
      await Promise.all([
        updateDoc(doc(db, 'curriculum', topicToMove.id), {
          sequenceNumber: newIndexForMoved + 1, // 1-based
          updatedAt: serverTimestamp(),
        }),
        updateDoc(doc(db, 'curriculum', topicAbove.id), {
          sequenceNumber: newIndexForAbove + 1, // 1-based
          updatedAt: serverTimestamp(),
        }),
      ]);
      refetch();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to reorder topics',
        variant: 'destructive',
      });
    }
  };

  // Move topic at currentIndex down by swapping with next topic (in sorted order)
  const handleMoveDown = async (_topicId: string, currentIndex: number) => {
    if (currentIndex === topicsSorted.length - 1) return;

    const topicToMove = topicsSorted[currentIndex];
    const topicBelow = topicsSorted[currentIndex + 1];

    if (!topicToMove?.id || !topicBelow?.id) {
      toast({
        title: 'Error',
        description: 'Invalid topic id(s). Cannot reorder.',
        variant: 'destructive',
      });
      return;
    }

    const newIndexForMoved = currentIndex + 1;
    const newIndexForBelow = currentIndex;

    try {
      await Promise.all([
        updateDoc(doc(db, 'curriculum', topicToMove.id), {
          sequenceNumber: newIndexForMoved + 1, // 1-based
          updatedAt: serverTimestamp(),
        }),
        updateDoc(doc(db, 'curriculum', topicBelow.id), {
          sequenceNumber: newIndexForBelow + 1, // 1-based
          updatedAt: serverTimestamp(),
        }),
      ]);
      refetch();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to reorder topics',
        variant: 'destructive',
      });
    }
  };

  const openEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setFormData({
      name: topic.name || '',
      description: topic.description || '',
      sequenceNumber: topic.sequenceNumber || 1,
      estimatedMinutes: topic.estimatedMinutes || 15,
      targetMastery: topic.targetMastery || 80,
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading topics...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          <h3 className="text-lg font-medium">Topics Management</h3>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Topic
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Topic Name</TableHead>
            <TableHead>Sequence</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {topicsSorted.map((topic, index) => (
            <TableRow key={topic.id}>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMoveUp(topic.id, index)}
                    disabled={index === 0}
                    aria-label="Move topic up"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMoveDown(topic.id, index)}
                    disabled={index === topicsSorted.length - 1}
                    aria-label="Move topic down"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>

              <TableCell className="font-medium">{topic.name}</TableCell>
              <TableCell>{topic.sequenceNumber}</TableCell>

              <TableCell>
                <Badge variant="secondary">Active</Badge>
              </TableCell>

              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(topic)}>
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(topic.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Create Topic Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Topic</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Topic Name</label>
              <Input
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Phoneme 'A'"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe what students will learn..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Sequence Number</label>
                <Input
                  type="number"
                  value={formData.sequenceNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({
                      ...formData,
                      sequenceNumber: parseInt(e.target.value, 10) || 1,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Estimated Minutes</label>
                <Input
                  type="number"
                  value={formData.estimatedMinutes}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({
                      ...formData,
                      estimatedMinutes: parseInt(e.target.value, 10) || 15,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Target Mastery (%)</label>
              <Input
                type="number"
                value={formData.targetMastery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    targetMastery: parseInt(e.target.value, 10) || 80,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Topic</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Topic Dialog */}
      <Dialog
        open={!!editingTopic}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTopic(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Topic Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Phoneme 'A'"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what students will learn..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Sequence Number</label>
                <Input
                  type="number"
                  value={formData.sequenceNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sequenceNumber: parseInt(e.target.value, 10) || 1,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Estimated Minutes</label>
                <Input
                  type="number"
                  value={formData.estimatedMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedMinutes: parseInt(e.target.value, 10) || 15,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Target Mastery (%)</label>
              <Input
                type="number"
                value={formData.targetMastery}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetMastery: parseInt(e.target.value, 10) || 80,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingTopic(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit}>Update Topic</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
