/**
 * Public, editorially reviewed video evidence for the existing Speaking owner.
 * Source: Tiny Steps admin "Instant Storytelling Activity" entry and owner
 * YouTube Studio screenshot (26 October 2026): Public, Premiered 9 April 2026.
 * The owner reported that the child's parents were informed and approved public
 * use; no stored written/digital consent artifact was provided. Avoid other clips
 * until their own public-use scope has been checked.
 *
 * This is deliberately a ONE-video manifest, not an export of the public Firestore
 * gallery. Changes to this entry require fresh owner review and source validation.
 */
export type PublicSpeakingVideoEvidence = {
  title: string;
  description: string;
  videoId: string;
  publicationDate: string;
  duration: string;
  durationLabel: string;
  category: string;
  ageBand: string;
};

export const PUBLIC_SPEAKING_VIDEO_EVIDENCE: Readonly<PublicSpeakingVideoEvidence> = Object.freeze({
  title: 'Instant Storytelling Activity',
  description:
    'In this class, the child was given an instant topic and confidently created and presented a story. This activity builds thinking, structure, and speaking confidence.',
  videoId: 'H-xTpL6tKWU',
  publicationDate: '2026-04-09',
  duration: 'PT1M45S',
  durationLabel: '1 min 45 sec',
  category: 'Communication',
  ageBand: '4–6 years',
});

export function publicSpeakingVideoUrls(videoId = PUBLIC_SPEAKING_VIDEO_EVIDENCE.videoId) {
  return {
    watch: `https://www.youtube.com/watch?v=${videoId}`,
    embed: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

export function createPublicSpeakingVideoObject(
  canonicalUrl: string,
  video = PUBLIC_SPEAKING_VIDEO_EVIDENCE,
) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(video.videoId)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(video.publicationDate)) return null;
  const date = new Date(`${video.publicationDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== video.publicationDate) return null;
  if (!video.title.trim() || !video.description.trim()) return null;
  const urls = publicSpeakingVideoUrls(video.videoId);
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': `${canonicalUrl}#real-class-sample-video`,
    name: video.title,
    description: video.description,
    thumbnailUrl: urls.thumbnail,
    uploadDate: video.publicationDate,
    duration: video.duration,
    embedUrl: urls.embed,
    url: urls.watch,
  };
}
