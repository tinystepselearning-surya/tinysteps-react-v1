// @ts-nocheck
import React, { useState } from 'react';
import { cn } from '../lib/utils';
import Button from '../Button/Button';
import { Link } from 'react-router-dom';

type CourseCardProps = {
  icon: string;
  name: string;
  slug?: string;
  track: 'phonics' | 'grammar' | 'speaking';
  age: string;
  duration: string;
  frequency: string;
  level: string;
  overview: string[];
  outcomes: string[];
  price: string;
  reviews?: string;
};

export const CourseCard: React.FC<CourseCardProps> = ({ icon, name, track, age, duration, frequency, level, overview, outcomes, price, reviews }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn('card rounded-3xl bg-white shadow-lg ring-1 ring-slate-200 transition-transform hover:-translate-y-1 hover:shadow-2xl')}
      onClick={() => setOpen((v) => !v)}
    >
      <div className="p-6">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900"><span className="text-2xl">{icon}</span>{name}</div>
          <div className="text-sm text-gray-600">{duration}</div>
        </div>
        <div className="text-sm text-gray-700">{age} • {frequency} • Level: {level}</div>
        <div className="mt-3 text-sm text-gray-800">
          <div className="font-medium">Quick Overview:</div>
          <ul className="list-disc pl-5">
            {overview.map((o) => <li key={o}>{o}</li>)}
          </ul>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {slug ? (
            <Link to={`/courses/${slug}`} className="interactive-link text-primary-600 text-sm">View Full Curriculum →</Link>
          ) : (
            <Button size="sm" variant="outline">View Full Curriculum</Button>
          )}
          <Button size="sm">Enroll - {price}</Button>
        </div>
        {reviews && <div className="mt-3 text-xs text-gray-600">{reviews}</div>}
      </div>
      <div className={cn('hover-details-body px-6 pb-6', open ? 'open' : '')}>
        <div className="text-sm text-gray-900">
          <div className="font-medium">Learning Outcomes:</div>
          <ul className="list-disc pl-5">
            {outcomes.map((o) => <li key={o}>{o}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
};
