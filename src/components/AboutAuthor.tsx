import React from 'react';

type AuthorProfile = {
  name: string;
  bio: string;
  role?: string;
  imageUrl?: string;
};

type AboutAuthorProps = {
  author?: AuthorProfile;
};

// Default Tiny Steps author bio
const DEFAULT_AUTHOR: AuthorProfile = {
  name: 'Priya',
  role: 'Tiny Steps Founder',
  bio: 'With 10+ years of experience in early childhood English education, Priya founded Tiny Steps Learning to help children ages 3–12 master phonics, grammar, and speaking with confidence. Every lesson is designed around proven learning science.',
};

export const AboutAuthor: React.FC<AboutAuthorProps> = ({ author = DEFAULT_AUTHOR }) => {
  return (
    <section className="mt-12 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {author.imageUrl && (
          <img
            src={author.imageUrl}
            alt={author.name}
            className="h-16 w-16 rounded-full object-cover"
          />
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            About the Author
          </h3>
          <p className="mt-1 text-sm font-medium text-primary-600">
            {author.role || 'Tiny Steps'}
          </p>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
            {author.bio}
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutAuthor;
