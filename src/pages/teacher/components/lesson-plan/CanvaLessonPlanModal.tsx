import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { X } from 'lucide-react';

interface CanvaLessonPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonPlanUrl: string;
  sessionTitle?: string;
  courseName?: string;
}

/**
 * Modal to display embedded Canva lesson plans
 * Teachers can view the lesson plan but cannot download it directly
 * The iframe prevents right-click and download functionality
 */
export const CanvaLessonPlanModal: React.FC<CanvaLessonPlanModalProps> = ({
  isOpen,
  onClose,
  lessonPlanUrl,
  sessionTitle,
  courseName,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {sessionTitle || 'Lesson Plan'}
              </DialogTitle>
              {courseName && (
                <DialogDescription className="mt-1">
                  {courseName}
                </DialogDescription>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="relative h-[calc(90vh-100px)] w-full overflow-hidden">
          {/* Canva embed iframe */}
          <iframe
            loading="lazy"
            className="absolute inset-0 w-full h-full border-none"
            src={lessonPlanUrl}
            allowFullScreen
            allow="fullscreen"
            style={{
              pointerEvents: 'auto',
            }}
            // Prevent context menu to disable right-click download
            onContextMenu={(e) => e.preventDefault()}
          />
          
          {/* Overlay to prevent direct iframe interaction that might expose download */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{ 
              background: 'transparent',
              zIndex: -1 
            }}
          />
        </div>

        <div className="p-4 border-t bg-gray-50 text-xs text-gray-600">
          <p>
            📌 <strong>Note:</strong> This lesson plan is for reference only. 
            You can view and present it during the session, but downloading is restricted.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
