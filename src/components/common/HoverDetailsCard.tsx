import React, { useState } from 'react';
import { cn } from '../lib/utils';

type HoverDetailsCardProps = {
  header: React.ReactNode;
  preview: React.ReactNode;
  details: React.ReactNode;
  className?: string;
};

export const HoverDetailsCard: React.FC<HoverDetailsCardProps> = ({ header, preview, details, className }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn('rounded-3xl bg-white shadow-lg ring-1 ring-slate-200 transition-all hover:shadow-2xl', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="p-6">
        <div className="mb-4 text-lg font-semibold text-gray-900">{header}</div>
        <div className="text-sm text-gray-700">{preview}</div>
      </div>
      <div className={cn('hover-details-body px-6 pb-6', open ? 'open' : '')}>
        <div className="text-sm text-gray-800">{details}</div>
      </div>
    </div>
  );
};

