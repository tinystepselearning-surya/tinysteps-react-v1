import PhonicsPage from './phonics';

const INTRO_COPY = "Tiny Steps Learning offers 1:1 online phonics classes for kids ages 3–12. We teach letter sounds, blending, and decodable reading—so children start reading real words with confidence.";

export default function PhonicsClassesForKidsPage() {
  return (
    <PhonicsPage
      seoOverrides={{
        title: 'Online Phonics Classes for Kids (Ages 3–12) | Tiny Steps Learning',
        description: '1:1 online phonics classes for kids ages 3–12. Letter sounds, blending, decodable reading, and weekly parent progress updates. Book a free assessment.',
        canonicalPath: '/phonics-classes-for-kids',
        breadcrumbName: 'Phonics Classes for Kids',
      }}
      heroTitleOverride="Online Phonics Classes for Kids"
      heroSubtitleOverride="1:1 online phonics classes for kids ages 3–12 with letter sounds, blending, and decodable reading."
      introCopy={INTRO_COPY}
    />
  );
}
