import React from 'react';
import { useToast } from "@components/hooks/use-toast";
import { Toast } from "../../ui/toast";

interface ToastItem {
  id: string;
  title?: string; // Allow undefined for compatibility
  description?: string; // Allow undefined for compatibility
  action?: React.ReactNode;
  [key: string]: any;
}

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div>
      {toasts.map(function ({ id, title, description, action, ...props }: ToastItem) {
        return (
          <Toast
            key={id}
            title={title || ""}
            description={(description as string) || ""}
            action={action}
            {...props}
          />
        );
      })}
    </div>
  );
}
