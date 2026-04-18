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

const BASE_FALLBACK_TESTIMONIALS: Testimonial[] = [
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

type SeedCourseConfig = {
  tag: 'phonics' | 'grammar' | 'speaking';
  secondaryTags: string[];
  attendedCourses: string[];
  templates: string[];
};

const SEEDED_PARENT_NAMES = [
  'Aarthi', 'Aditya', 'Aishwarya', 'Akash', 'Ananya', 'Anirudh', 'Ankita', 'Arjun', 'Asha', 'Bhavna',
  'Charan', 'Deepa', 'Divya', 'Gauri', 'Harini', 'Ishita', 'Jaya', 'Kavya', 'Keerthi', 'Kiran',
  'Lakshmi', 'Madhavi', 'Manasa', 'Megha', 'Nandini', 'Naveen', 'Neha', 'Nikita', 'Pallavi', 'Pooja',
  'Pranav', 'Priya', 'Rahul', 'Rajesh', 'Rashmi', 'Ritika', 'Sai', 'Sanjana', 'Shreya', 'Shruti',
  'Smita', 'Sneha', 'Sonia', 'Sowmya', 'Sujatha', 'Suman', 'Swathi', 'Tanvi', 'Tejas', 'Uday',
  'Vaibhav', 'Varsha', 'Vidya', 'Vignesh', 'Vikram', 'Yamini',
];

const SEEDED_CITIES = [
  'Hyderabad', 'Bengaluru', 'Chennai', 'Pune', 'Mumbai', 'Delhi', 'Noida', 'Gurugram',
  'Ahmedabad', 'Kolkata', 'Jaipur', 'Coimbatore', 'Vijayawada', 'Visakhapatnam', 'Mysuru',
];

const COURSE_SEED_CONFIG: SeedCourseConfig[] = [
  {
    tag: 'phonics',
    secondaryTags: ['phonics-foundation', 'early-phonics', 'advanced-phonics', 'phonics-brush-up'],
    attendedCourses: ['Phonics Foundations', 'Early Phonics', 'Advanced Phonics'],
    templates: [
      'Blending and decoding became noticeably smoother after the first few weeks.',
      'My child now reads unfamiliar words with much less hesitation.',
      'Pronunciation corrections were clear and easy to practice at home.',
      'The class pace was calm and my child stayed engaged throughout.',
      'Homework routines became shorter because concepts were taught clearly.',
    ],
  },
  {
    tag: 'grammar',
    secondaryTags: ['basic-grammar', 'advanced-grammar'],
    attendedCourses: ['Basic Grammar', 'Advanced Grammar'],
    templates: [
      'Sentence construction became much more accurate in school assignments.',
      'The teacher explained grammar rules in a way my child could retain.',
      'Writing confidence improved because corrections were specific and practical.',
      'Weekly worksheets were manageable and reinforced class concepts well.',
      'We saw fewer repeated mistakes in daily writing within a month.',
    ],
  },
  {
    tag: 'speaking',
    secondaryTags: ['basic-public-speaking', 'advanced-public-speaking'],
    attendedCourses: ['Public Speaking (Basic)', 'Public Speaking (Advanced)'],
    templates: [
      'Stage confidence improved and my child now volunteers to speak in class.',
      'Voice clarity and pace improved with regular speaking drills.',
      'Presentation structure is much stronger after these sessions.',
      'The feedback on eye contact and pauses was very actionable.',
      'My child now prepares and delivers short speeches independently.',
    ],
  },
];

const REVIEW_OUTCOMES = [
  'Teacher feedback was timely and specific.',
  'Progress updates helped us support practice at home.',
  'The class environment stayed encouraging and focused.',
  'The improvement was visible in school participation.',
  'Attendance stayed consistent because sessions were engaging.',
];

const RATING_PATTERN = [5, 5, 5, 4, 5, 5, 4, 5, 5, 5, 4, 5];
const PAGE_TAG_BUCKETS = [
  ['testimonials', 'courses'],
  ['testimonials', 'why-tiny-steps'],
  ['testimonials', 'class-samples'],
  ['testimonials', 'home'],
];

function buildGeneratedFallbackTestimonials(
  totalCount: number,
  options?: { startIndex?: number; forcedCourseTag?: 'phonics' | 'grammar' | 'speaking' },
): Testimonial[] {
  const safeCount = Math.max(0, totalCount);
  const items: Testimonial[] = [];
  const baseTimeMs = Date.UTC(2026, 3, 1, 8, 0, 0);
  const startIndex = Math.max(0, options?.startIndex || 0);
  const forcedCourse = options?.forcedCourseTag
    ? COURSE_SEED_CONFIG.find((item) => item.tag === options.forcedCourseTag) || null
    : null;

  for (let localIndex = 0; localIndex < safeCount; localIndex += 1) {
    const index = startIndex + localIndex;
    const course = forcedCourse || COURSE_SEED_CONFIG[index % COURSE_SEED_CONFIG.length];
    const courseName = course.attendedCourses[index % course.attendedCourses.length];
    const template = course.templates[index % course.templates.length];
    const outcome = REVIEW_OUTCOMES[(index * 3) % REVIEW_OUTCOMES.length];
    const parentName = `${SEEDED_PARENT_NAMES[index % SEEDED_PARENT_NAMES.length]} ${String.fromCharCode(65 + (index % 26))}.`;
    const city = SEEDED_CITIES[(index * 2) % SEEDED_CITIES.length];
    const childAge = 5 + (index % 9);
    const rating = RATING_PATTERN[index % RATING_PATTERN.length];
    const courseTag = course.secondaryTags[index % course.secondaryTags.length];
    const pageTags = PAGE_TAG_BUCKETS[index % PAGE_TAG_BUCKETS.length];
    const timestamp = new Date(baseTimeMs - index * 6 * 60 * 60 * 1000).toISOString();

    items.push({
      id: `seeded-testimonial-${index + 1}`,
      status: 'approved',
      isFeatured: false,
      source: 'imported',
      reviewerType: 'parent',
      parentName,
      childAge,
      city,
      reviewText: `${template} ${outcome}`,
      rating,
      consentToPublishName: true,
      consentToPublishChildName: false,
      courseTags: [course.tag, courseTag],
      pageTags,
      classFormat: index % 2 === 0 ? '1:1' : 'small_group',
      attendedCourse: courseName,
      createdAt: timestamp,
      updatedAt: timestamp,
      approvedAt: timestamp,
    });
  }

  return items;
}

const FALLBACK_TESTIMONIAL_TARGET = 250;
const GENERATED_FALLBACK_TESTIMONIALS = buildGeneratedFallbackTestimonials(
  Math.max(0, FALLBACK_TESTIMONIAL_TARGET - BASE_FALLBACK_TESTIMONIALS.length),
);
const EXTRA_PHONICS_FALLBACK_COUNT = 50;
const EXTRA_PHONICS_FALLBACK_TESTIMONIALS = buildGeneratedFallbackTestimonials(
  EXTRA_PHONICS_FALLBACK_COUNT,
  {
    startIndex: GENERATED_FALLBACK_TESTIMONIALS.length,
    forcedCourseTag: 'phonics',
  },
);

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  ...BASE_FALLBACK_TESTIMONIALS,
  ...GENERATED_FALLBACK_TESTIMONIALS,
  ...EXTRA_PHONICS_FALLBACK_TESTIMONIALS,
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
