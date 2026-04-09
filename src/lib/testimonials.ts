import { addDoc, collection, getDocs, limit, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from './firebaseConfig';

export type TestimonialStatus = 'pending' | 'approved' | 'rejected';
export type TestimonialSource = 'public_form' | 'admin_added' | 'imported';
export type TestimonialReviewerType = 'parent' | 'public' | 'student' | 'teacher';
export type TestimonialClassFormat = '1:1' | 'small_group';

export type Testimonial = {
  id: string;
  status: TestimonialStatus;
  isFeatured: boolean;
  source: TestimonialSource;
  reviewerType: TestimonialReviewerType;
  parentName: string;
  childName?: string;
  childAge?: number;
  city?: string;
  reviewText: string;
  publishedText?: string;
  rating?: number;
  consentToPublishName: boolean;
  consentToPublishChildName: boolean;
  courseTags: string[];
  pageTags: string[];
  classFormat?: TestimonialClassFormat;
  attendedCourse?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  approvedAt?: unknown;
  approvedBy?: string;
  editedAt?: unknown;
  editedBy?: string;
  editReason?: string;
};

export type TestimonialsQueryOptions = {
  pageTag?: string;
  courseTag?: string;
  featuredOnly?: boolean;
  limit?: number;
};

export type TestimonialAggregate = {
  ratingCount: number;
  averageRating: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type PublicTestimonialSubmissionInput = {
  parentName: string;
  childName?: string;
  childAge?: number;
  city?: string;
  reviewText: string;
  rating?: number;
  consentToPublish: boolean;
  courseTag?: string;
  pageTag?: string;
  attendedCourse?: string;
  classFormat?: TestimonialClassFormat;
};

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: 'seeded-home-1',
    status: 'approved',
    isFeatured: true,
    source: 'admin_added',
    reviewerType: 'parent',
    parentName: 'Priya S.',
    childAge: 6,
    city: 'Bengaluru',
    reviewText:
      'Her reading confidence improved quickly. The classes felt warm, structured, and easy for us to follow at home.',
    rating: 5,
    consentToPublishName: true,
    consentToPublishChildName: false,
    courseTags: ['phonics', 'phonics-foundation'],
    pageTags: ['home', 'why-tiny-steps'],
    classFormat: '1:1',
    attendedCourse: 'Phonics Foundations',
    createdAt: '2026-02-05T08:00:00.000Z',
    updatedAt: '2026-02-05T08:00:00.000Z',
    approvedAt: '2026-02-05T08:00:00.000Z',
  },
  {
    id: 'seeded-home-2',
    status: 'approved',
    isFeatured: true,
    source: 'admin_added',
    reviewerType: 'parent',
    parentName: 'Ananya R.',
    childAge: 9,
    city: 'Hyderabad',
    reviewText:
      'Grammar classes made sentence writing much clearer. We could see steady progress in school work within a month.',
    rating: 5,
    consentToPublishName: true,
    consentToPublishChildName: false,
    courseTags: ['grammar', 'basic-grammar'],
    pageTags: ['home', 'why-tiny-steps'],
    classFormat: 'small_group',
    attendedCourse: 'Basic Grammar',
    createdAt: '2026-02-07T08:00:00.000Z',
    updatedAt: '2026-02-07T08:00:00.000Z',
    approvedAt: '2026-02-07T08:00:00.000Z',
  },
  {
    id: 'seeded-home-3',
    status: 'approved',
    isFeatured: true,
    source: 'admin_added',
    reviewerType: 'parent',
    parentName: 'Karthik M.',
    childAge: 10,
    city: 'Pune',
    reviewText:
      'My son was shy before joining. Speaking sessions gave him structure and confidence to present in school.',
    rating: 5,
    consentToPublishName: true,
    consentToPublishChildName: false,
    courseTags: ['speaking', 'basic-public-speaking'],
    pageTags: ['home', 'why-tiny-steps', 'class-samples'],
    classFormat: '1:1',
    attendedCourse: 'Public Speaking (Basic)',
    createdAt: '2026-02-09T08:00:00.000Z',
    updatedAt: '2026-02-09T08:00:00.000Z',
    approvedAt: '2026-02-09T08:00:00.000Z',
  },
  {
    id: 'seeded-samples-1',
    status: 'approved',
    isFeatured: false,
    source: 'admin_added',
    reviewerType: 'parent',
    parentName: 'Neha T.',
    childAge: 7,
    city: 'Mumbai',
    reviewText:
      'Class quality was exactly what we saw in the sample videos: calm pacing, clear corrections, and good teacher attention.',
    rating: 5,
    consentToPublishName: true,
    consentToPublishChildName: false,
    courseTags: ['phonics', 'phonics-brush-up'],
    pageTags: ['class-samples'],
    classFormat: 'small_group',
    attendedCourse: 'Early Phonics',
    createdAt: '2026-02-11T08:00:00.000Z',
    updatedAt: '2026-02-11T08:00:00.000Z',
    approvedAt: '2026-02-11T08:00:00.000Z',
  },
  {
    id: 'seeded-course-phonics',
    status: 'approved',
    isFeatured: false,
    source: 'admin_added',
    reviewerType: 'parent',
    parentName: 'Rohan P.',
    childAge: 5,
    city: 'Chennai',
    reviewText:
      'Phonics Foundations gave my daughter a strong start with sounds and blending. Homework support was practical and short.',
    rating: 5,
    consentToPublishName: true,
    consentToPublishChildName: false,
    courseTags: ['phonics', 'phonics-foundation'],
    pageTags: ['courses'],
    classFormat: '1:1',
    attendedCourse: 'Phonics Foundations',
    createdAt: '2026-02-12T08:00:00.000Z',
    updatedAt: '2026-02-12T08:00:00.000Z',
    approvedAt: '2026-02-12T08:00:00.000Z',
  },
  {
    id: 'seeded-course-grammar',
    status: 'approved',
    isFeatured: false,
    source: 'admin_added',
    reviewerType: 'parent',
    parentName: 'Sowmya K.',
    childAge: 11,
    city: 'Delhi',
    reviewText:
      'Advanced grammar lessons improved writing accuracy and confidence. Feedback after each class was clear and useful.',
    rating: 5,
    consentToPublishName: true,
    consentToPublishChildName: false,
    courseTags: ['grammar', 'advanced-grammar'],
    pageTags: ['courses', 'why-tiny-steps'],
    classFormat: 'small_group',
    attendedCourse: 'Advanced Grammar',
    createdAt: '2026-02-13T08:00:00.000Z',
    updatedAt: '2026-02-13T08:00:00.000Z',
    approvedAt: '2026-02-13T08:00:00.000Z',
  },
  {
    id: 'seeded-course-speaking',
    status: 'approved',
    isFeatured: false,
    source: 'admin_added',
    reviewerType: 'parent',
    parentName: 'Meera V.',
    childAge: 8,
    city: 'Ahmedabad',
    reviewText:
      'The speaking track helped with voice clarity and stage confidence. Teachers were patient and gave actionable tips.',
    rating: 5,
    consentToPublishName: true,
    consentToPublishChildName: false,
    courseTags: ['speaking', 'advanced-public-speaking'],
    pageTags: ['courses', 'class-samples'],
    classFormat: '1:1',
    attendedCourse: 'Public Speaking (Advanced)',
    createdAt: '2026-02-14T08:00:00.000Z',
    updatedAt: '2026-02-14T08:00:00.000Z',
    approvedAt: '2026-02-14T08:00:00.000Z',
  },
];

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const asStringOrUndefined = (value: unknown): string | undefined => {
  const s = asString(value);
  return s || undefined;
};
const asNumberOrUndefined = (value: unknown): number | undefined => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};
const asBoolean = (value: unknown): boolean => value === true;
const asTags = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((v) => asString(v).toLowerCase()).filter(Boolean) : [];

const normalizeTag = (tag?: string): string => asString(tag).toLowerCase();
const PUBLIC_SUBMISSION_COURSE_TAGS = new Set<string>(['phonics', 'grammar', 'speaking']);
const PUBLIC_SUBMISSION_PAGE_TAGS = new Set<string>(['home', 'why-tiny-steps', 'class-samples', 'courses']);

const timestampToMillis = (value: unknown): number => {
  if (!value) return 0;
  if (typeof value === 'string' || typeof value === 'number') {
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : 0;
  }
  if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    try {
      return Number((value as { toMillis: () => number }).toMillis()) || 0;
    } catch {
      return 0;
    }
  }
  return 0;
};

const sortTestimonials = (items: Testimonial[]): Testimonial[] =>
  items.sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    const aTs = timestampToMillis(a.approvedAt) || timestampToMillis(a.updatedAt) || timestampToMillis(a.createdAt);
    const bTs = timestampToMillis(b.approvedAt) || timestampToMillis(b.updatedAt) || timestampToMillis(b.createdAt);
    return bTs - aTs;
  });

const withFilters = (items: Testimonial[], options: TestimonialsQueryOptions): Testimonial[] => {
  const pageTag = normalizeTag(options.pageTag);
  const courseTags = getCourseTagCandidates(options.courseTag);

  return items.filter((item) => {
    if (item.status !== 'approved') return false;
    if (options.featuredOnly && !item.isFeatured) return false;
    if (pageTag && !item.pageTags.includes(pageTag)) return false;
    if (courseTags.length && !courseTags.some((tag) => item.courseTags.includes(tag))) return false;
    return true;
  });
};

function toTestimonial(id: string, data: any): Testimonial {
  const rating = asNumberOrUndefined(data?.rating);

  return {
    id,
    status: (asString(data?.status) as TestimonialStatus) || 'pending',
    isFeatured: asBoolean(data?.isFeatured),
    source: (asString(data?.source) as TestimonialSource) || 'public_form',
    reviewerType: (asString(data?.reviewerType) as TestimonialReviewerType) || 'parent',
    parentName: asString(data?.parentName),
    childName: asStringOrUndefined(data?.childName),
    childAge: asNumberOrUndefined(data?.childAge),
    city: asStringOrUndefined(data?.city),
    reviewText: asString(data?.reviewText),
    publishedText: asStringOrUndefined(data?.publishedText),
    rating: rating && rating >= 1 && rating <= 5 ? rating : undefined,
    consentToPublishName: asBoolean(data?.consentToPublishName),
    consentToPublishChildName: asBoolean(data?.consentToPublishChildName),
    courseTags: asTags(data?.courseTags),
    pageTags: asTags(data?.pageTags),
    classFormat: asString(data?.classFormat) === 'small_group' ? 'small_group' : asString(data?.classFormat) === '1:1' ? '1:1' : undefined,
    attendedCourse: asStringOrUndefined(data?.attendedCourse),
    createdAt: data?.createdAt,
    updatedAt: data?.updatedAt,
    approvedAt: data?.approvedAt,
    approvedBy: asStringOrUndefined(data?.approvedBy),
    editedAt: data?.editedAt,
    editedBy: asStringOrUndefined(data?.editedBy),
    editReason: asStringOrUndefined(data?.editReason),
  };
}

export function getCourseTagCandidates(courseTag?: string): string[] {
  const tag = normalizeTag(courseTag);
  if (!tag) return [];
  const set = new Set<string>([tag]);
  if (tag.includes('phonic')) set.add('phonics');
  if (tag.includes('grammar')) set.add('grammar');
  if (tag.includes('speaking') || tag.includes('public-speaking') || tag.includes('communication')) set.add('speaking');
  return Array.from(set);
}

export function getCourseTagFromSlug(slug?: string): string | undefined {
  const normalized = normalizeTag(slug);
  return normalized || undefined;
}

export function getFallbackTestimonials(options: TestimonialsQueryOptions = {}): Testimonial[] {
  const filtered = withFilters([...FALLBACK_TESTIMONIALS], options);
  const sorted = sortTestimonials(filtered);
  const max = options.limit && options.limit > 0 ? options.limit : 6;
  return sorted.slice(0, max);
}

export function computeTestimonialAggregate(items: Testimonial[]): TestimonialAggregate {
  const breakdown: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  let sum = 0;
  let count = 0;

  for (const item of items) {
    const rating = Number(item.rating);
    if (!Number.isFinite(rating)) continue;
    const rounded = Math.round(rating);
    if (rounded < 1 || rounded > 5) continue;
    breakdown[rounded as 1 | 2 | 3 | 4 | 5] += 1;
    sum += rounded;
    count += 1;
  }

  return {
    ratingCount: count,
    averageRating: count ? Number((sum / count).toFixed(1)) : 0,
    breakdown,
  };
}

export async function fetchApprovedTestimonialsCatalog(max = 500): Promise<Testimonial[]> {
  const ref = query(
    collection(db, 'testimonials'),
    where('status', '==', 'approved'),
    limit(Math.max(1, max)),
  );
  const snapshot = await getDocs(ref);
  const mapped = snapshot.docs
    .map((entry) => toTestimonial(entry.id, entry.data()))
    .filter((entry) => entry.publishedText || entry.reviewText || typeof entry.rating === 'number');
  return sortTestimonials(mapped);
}

export function filterApprovedTestimonialsByCourse(items: Testimonial[], courseTag?: string): Testimonial[] {
  const tags = getCourseTagCandidates(courseTag);
  if (!tags.length) return items;
  return items.filter((item) => tags.some((tag) => item.courseTags.includes(tag)));
}

export async function fetchApprovedTestimonials(options: TestimonialsQueryOptions = {}): Promise<Testimonial[]> {
  const requestedLimit = options.limit && options.limit > 0 ? options.limit : 6;
  const sampleWindow = Math.max(24, requestedLimit * 8);
  const ref = query(
    collection(db, 'testimonials'),
    where('status', '==', 'approved'),
    limit(sampleWindow),
  );
  const snapshot = await getDocs(ref);
  const mapped = snapshot.docs
    .map((entry) => toTestimonial(entry.id, entry.data()))
    .filter((entry) => entry.publishedText || entry.reviewText || typeof entry.rating === 'number');
  const filtered = withFilters(mapped, options);
  return sortTestimonials(filtered).slice(0, requestedLimit);
}

export async function submitPublicTestimonial(input: PublicTestimonialSubmissionInput): Promise<void> {
  const parentName = asString(input.parentName);
  const reviewText = asString(input.reviewText);
  const childName = asStringOrUndefined(input.childName);
  const city = asStringOrUndefined(input.city);
  const attendedCourse = asStringOrUndefined(input.attendedCourse);
  const courseTag = normalizeTag(input.courseTag);
  const pageTag = normalizeTag(input.pageTag);
  const childAge = asNumberOrUndefined(input.childAge);
  const rawRating = asNumberOrUndefined(input.rating);
  const rating = rawRating && rawRating >= 1 && rawRating <= 5 ? Math.round(rawRating) : undefined;

  const courseTags = getCourseTagCandidates(courseTag).filter((tag) => PUBLIC_SUBMISSION_COURSE_TAGS.has(tag));
  const pageTags = pageTag && PUBLIC_SUBMISSION_PAGE_TAGS.has(pageTag) ? [pageTag] : [];

  if (parentName.length < 2) throw new Error('Please enter a valid parent name.');
  if (!rating) throw new Error('Please select a star rating.');
  if (!input.consentToPublish) throw new Error('Please provide consent before submitting.');

  const payload: Record<string, unknown> = {
    status: 'pending',
    isFeatured: false,
    source: 'public_form',
    reviewerType: 'parent',
    parentName,
    rating,
    consentToPublishName: true,
    consentToPublishChildName: false,
    courseTags,
    pageTags,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (childName) payload.childName = childName;
  if (typeof childAge === 'number' && childAge >= 2 && childAge <= 18) payload.childAge = Math.round(childAge);
  if (city) payload.city = city;
  if (reviewText) payload.reviewText = reviewText;
  if (attendedCourse) payload.attendedCourse = attendedCourse;
  if (input.classFormat === '1:1' || input.classFormat === 'small_group') payload.classFormat = input.classFormat;

  await addDoc(collection(db, 'testimonials'), payload);
}
