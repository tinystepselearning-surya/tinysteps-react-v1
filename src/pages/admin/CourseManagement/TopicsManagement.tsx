import React, { useState } from 'react';
import { useTopics } from '../../../hooks/useData';
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { toast } from '@components/hooks/use-toast';
import { Edit, Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';

import { ArrowLeft } from 'lucide-react';

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

export default function TopicsManagement({ courseId, onBack }: TopicsManagementProps) {
  const { data: topics = [], isLoading, refetch } = useTopics(courseId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<any>(null);
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
      sequenceNumber: topics.length + 1,
      estimatedMinutes: 15,
      targetMastery: 80,
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Topic name is required', variant: 'destructive' });
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
      });

      toast({ title: 'Success', description: 'Topic created successfully' });
      setIsCreateOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create topic', variant: 'destructive' });
    }
  };

  const handleEdit = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Topic name is required', variant: 'destructive' });
      return;
    }

    try {
      await updateDoc(doc(db, 'curriculum', editingTopic.id), {
        ...formData,
      });

      toast({ title: 'Success', description: 'Topic updated successfully' });
      setEditingTopic(null);
      resetForm();
      refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update topic', variant: 'destructive' });
    }
  };

  const handleDelete = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;

    try {
      await deleteDoc(doc(db, 'curriculum', topicId));
      toast({ title: 'Success', description: 'Topic deleted successfully' });
      refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete topic', variant: 'destructive' });
    }
  };

  const handleMoveUp = async (topicId: string, currentIndex: number) => {
    if (currentIndex === 0) return;
    
    const topicToMove = topics[currentIndex];
    const topicAbove = topics[currentIndex - 1];
    
    try {
      await Promise.all([
        updateDoc(doc(db, 'curriculum', topicToMove.id), { sequenceNumber: currentIndex }),
        updateDoc(doc(db, 'curriculum', topicAbove.id), { sequenceNumber: currentIndex + 1 }),
      ]);
      refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to reorder topics', variant: 'destructive' });
    }
  };

  const handleMoveDown = async (topicId: string, currentIndex: number) => {
    if (currentIndex === topics.length - 1) return;
    
    const topicToMove = topics[currentIndex];
    const topicBelow = topics[currentIndex + 1];
    
    try {
      await Promise.all([
        updateDoc(doc(db, 'curriculum', topicToMove.id), { sequenceNumber: currentIndex + 2 }),
        updateDoc(doc(db, 'curriculum', topicBelow.id), { sequenceNumber: currentIndex + 1 }),
      ]);
      refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to reorder topics', variant: 'destructive' });
    }
  };

  const openEdit = (topic: any) => {
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
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
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
          {topics.map((topic, index) => (
            <TableRow key={topic.id}>
              <TableCell>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleMoveUp(topic.id, index)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleMoveDown(topic.id, index)}
                    disabled={index === topics.length - 1}
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
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(topic.id)}>
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
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Phoneme 'A'"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe what students will learn..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Sequence Number</label>
                <Input 
                  type="number"
                  value={formData.sequenceNumber} 
                  onChange={(e) => setFormData({...formData, sequenceNumber: parseInt(e.target.value) || 1})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Estimated Minutes</label>
                <Input 
                  type="number"
                  value={formData.estimatedMinutes} 
                  onChange={(e) => setFormData({...formData, estimatedMinutes: parseInt(e.target.value) || 15})}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Target Mastery (%)</label>
              <Input 
                type="number"
                value={formData.targetMastery} 
                onChange={(e) => setFormData({...formData, targetMastery: parseInt(e.target.value) || 80})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Topic</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Topic Dialog */}
      <Dialog open={!!editingTopic} onOpenChange={() => setEditingTopic(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Topic Name</label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Phoneme 'A'"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe what students will learn..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Sequence Number</label>
                <Input 
                  type="number"
                  value={formData.sequenceNumber} 
                  onChange={(e) => setFormData({...formData, sequenceNumber: parseInt(e.target.value) || 1})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Estimated Minutes</label>
                <Input 
                  type="number"
                  value={formData.estimatedMinutes} 
                  onChange={(e) => setFormData({...formData, estimatedMinutes: parseInt(e.target.value) || 15})}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Target Mastery (%)</label>
              <Input 
                type="number"
                value={formData.targetMastery} 
                onChange={(e) => setFormData({...formData, targetMastery: parseInt(e.target.value) || 80})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTopic(null)}>Cancel</Button>
            <Button onClick={handleEdit}>Update Topic</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}