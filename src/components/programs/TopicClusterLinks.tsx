import React from 'react';
import { Link } from 'react-router-dom';

type TopicClusterLinksProps = {
  title: string;
  className?: string;
  links: Array<{
    label: string;
    href: string;
  }>;
};

const BALLOON_POP_LINK = {
  label: 'Play Tiny Steps Phonics Balloon Pop',
  href: '/free-balloon-pop-phonics-game-for-kids',
};

const PHONICS_PARENT_GUIDES = [
  { label: 'What Is Phonics? Parent Start-Here Guide', href: '/blog/what-is-phonics-for-kids' },
  { label: 'Child Knows ABC but Cannot Read', href: '/blog/child-knows-abc-but-cannot-read' },
  { label: 'How Kids Learn Blending', href: '/blog/how-kids-learn-blending' },
  { label: 'How Phonics Improves Spelling', href: '/blog/how-phonics-improves-spelling' },
  { label: 'What Age Should Phonics Start?', href: '/blog/what-age-to-start-phonics' },
  { label: 'Knows Letter Sounds but Cannot Read Words', href: '/blog/why-child-knows-letter-sounds-but-cannot-read-words' },
  { label: 'Sight Words or Phonics First?', href: '/blog/sight-words-or-phonics-first' },
  { label: 'Improve Reading Fluency', href: '/blog/how-to-improve-reading-fluency-in-children' },
] as const;

const MAX_PHONICS_RESOURCE_LINKS = 8;

export default function TopicClusterLinks({ title, links, className = '' }: TopicClusterLinksProps) {
  const isPhonicsResourceHub =
    title.toLowerCase().includes('phonics') &&
    links.some((link) => link.href === '/blog/satpin-phonics-guide');

  const existingHrefs = new Set(links.map((link) => link.href));
  const openSlots = Math.max(0, MAX_PHONICS_RESOURCE_LINKS - links.length);
  const curatedAdditions = isPhonicsResourceHub
    ? PHONICS_PARENT_GUIDES.filter((link) => !existingHrefs.has(link.href)).slice(0, openSlots)
    : [];
  const resourceLinks = isPhonicsResourceHub ? [...links, ...curatedAdditions] : links;
  const displayLinks =
    isPhonicsResourceHub && !resourceLinks.some((link) => link.href === BALLOON_POP_LINK.href)
      ? [...resourceLinks, BALLOON_POP_LINK]
      : resourceLinks;

  return (
    <section className={`mx-auto max-w-4xl px-6 py-6 ${className}`}>
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <h2 className="text-center text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Choose the guide that matches the question you have now. You do not need to read every resource before taking the next step.
        </p>

        <div className="mt-6 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {displayLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-50 hover:text-primary-800"
            >
              <span>•</span>
              <span className="underline underline-offset-2">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
