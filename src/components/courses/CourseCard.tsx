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
  ibLens?: string[];
};

export const CourseCard: React.FC<CourseCardProps> = ({ icon, name, track, age, duration, frequency, level, overview, outcomes, price, reviews, slug, ibLens = [] }) => {
  const [open, setOpen] = useState(false);
  const tab = encodeURIComponent(track);
  const courseSlug = slug ? encodeURIComponent(slug) : '';
  const curriculumHref = courseSlug
    ? `/curriculum?tab=${tab}&course=${courseSlug}`
    : `/curriculum?tab=${tab}`;
  return (
    <div
      className={cn(
        'hover-highlight rounded-3xl border border-gray-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50 shadow-[0_10px_30px_rgba(2,6,23,0.06)] transition-all hover:shadow-2xl hover:-translate-y-1'
      )}
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
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* ✅ Don’t toggle the card when clicking the link */}
          {!slug ? (
            <Button
              size="sm"
              variant="outline"
              className="min-w-[150px] whitespace-nowrap"
              onClick={(e) => e.stopPropagation()}
            >
              View Curriculum
            </Button>
          ) : (
            <Link
              to={curriculumHref}
              onClick={(e) => e.stopPropagation()}
              className="mt-0 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              View Full Curriculum <span aria-hidden>→</span>
            </Link>
          )}

          <Button
            size="sm"
            className="min-w-[170px] whitespace-nowrap"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: hook your enroll flow here (WhatsApp / booking / checkout)
            }}
          >
            Enroll · {price}
          </Button>
        </div>
        {ibLens.length > 0 && (
          <div className="mt-3 text-xs text-gray-600">
            <div className="font-semibold text-gray-900">IB lens</div>
            <ul className="list-disc pl-4">
              {ibLens.slice(0, 2).map((lens) => (
                <li key={lens}>{lens}</li>
              ))}
            </ul>
          </div>
        )}
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
