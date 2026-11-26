import { isPublicAnalyticsPath } from './publicAnalyticsPathPolicy.js';

const SENSITIVE_KEYS = new Set([
  'birthdate', 'dateofbirth', 'dob', 'name', 'firstname', 'lastname',
  'parentname', 'childname', 'studentname', 'email', 'emailaddress', 'phone',
  'phonenumber', 'mobile', 'mobilenumber', 'whatsapp', 'whatsappnumber',
  'childage', 'mainconcern', 'urgency', 'interest', 'message', 'notes',
  'prompt', 'answer', 'searchterm', 'token', 'authtoken', 'authorization',
  'gclid', 'fbclid', 'msclkid', 'utmterm', 'utmcontent',
]);
const PATH_KEYS = new Set(['pagepath', 'page', 'sourcepath', 'landingpage', 'destinationpath', 'primarydestination', 'secondarydestination', 'destination']);

// Reviewed outbound field names, not a general-purpose transport for arbitrary data.
const APPROVED_KEYS = new Set(["ai_attempted","ai_result","analytics_scope","article_slug","assist_channel","assist_type","audience","audience_type","authority_cluster","booking_type","category","class_format_preference","commercial_intent","completed_sessions","context","conversion_family","cta_label","cta_location","cta_position","currency","decision_alignment","decision_kind","destination","destination_label","destination_path","device_class","diagnostic_id","diagnostic_number","error_fields","form_id","form_name","funnel_name","game_id","handoff_role","input_delay_ms","intent","intent_cluster","interaction_id","interaction_type","is_follow_up","item_id","item_type","landing_page","lead_channel","lead_referrer_domain","lead_type","lead_utm_campaign","lead_utm_medium","lead_utm_source","level","link_label","location","metric_name","metric_value_ms","model_lane","navigation_relation","network_effective_type","opened","owner_cluster_ids","owner_family","owner_priority","owner_roles","owner_stage","page","page_cluster","page_path","page_title","page_type","pair","placement","presentation_delay_ms","primary_action_kind","primary_destination","primary_source_id","processing_time_ms","program","prompt_length_bucket","prompt_strength","public_mode","publication_revision","publication_wave","query_length","question_id","request_type","resource_cluster","resource_cluster_label","resource_concept_id","resource_name","resource_revision","resource_subject","resource_surface","response_path","result_count","route_mode","route_reason","rule_class","save_data","schema_version","secondary_destination","section_id","sound","sound_group","source","sourcePath","source_context","source_count","source_ids","step","total_latency_ms","utm_campaign","utm_medium","utm_source","value","viewport_bucket","visitor_stage"]);
const COMMON_KEYS = ["analytics_scope","audience_type","visitor_stage","commercial_intent","page_cluster","page_type","program","page_path","page","sourcePath","landing_page"];
const ATTRIBUTION_KEYS = ["utm_source","utm_medium","utm_campaign","lead_utm_source","lead_utm_medium","lead_utm_campaign","lead_referrer_domain"];
const FORM_KEYS = ["form_name","form_id","source_context","source","funnel_name","class_format_preference","lead_channel","lead_type","value","currency","error_fields"];
const CTA_KEYS = ["cta_label","cta_location","destination_path","location","source_context","funnel_name"];
const CORE_EVENT_KEYS: Record<string, readonly string[]> = Object.freeze({
  page_view: COMMON_KEYS,
  generate_lead: [...COMMON_KEYS, ...ATTRIBUTION_KEYS, ...FORM_KEYS],
  demo_request_received: [...COMMON_KEYS, ...ATTRIBUTION_KEYS, 'request_type', 'funnel_name', 'source_context'],
  lead_form_view: [...COMMON_KEYS, ...ATTRIBUTION_KEYS, ...FORM_KEYS],
  lead_form_start: [...COMMON_KEYS, ...ATTRIBUTION_KEYS, ...FORM_KEYS],
  lead_form_submit: [...COMMON_KEYS, ...ATTRIBUTION_KEYS, ...FORM_KEYS],
  funnel_form_start: [...COMMON_KEYS, ...ATTRIBUTION_KEYS, ...FORM_KEYS],
  funnel_form_submit: [...COMMON_KEYS, ...ATTRIBUTION_KEYS, ...FORM_KEYS],
  form_error: [...COMMON_KEYS, ...ATTRIBUTION_KEYS, ...FORM_KEYS],
  book_assessment_click: [...COMMON_KEYS, ...ATTRIBUTION_KEYS, ...CTA_KEYS],
  whatsapp_click: [...COMMON_KEYS, ...ATTRIBUTION_KEYS, ...CTA_KEYS, ...FORM_KEYS],
  phone_click: [...COMMON_KEYS, ...ATTRIBUTION_KEYS, ...CTA_KEYS],
  email_click: [...COMMON_KEYS, ...ATTRIBUTION_KEYS, ...CTA_KEYS],
});

// Snapshot of the checked-in public sitemaps and explicit blog/course aliases.
// Unknown dynamic slugs are reduced to their public family, never exported verbatim.
// Keep this snapshot aligned with published content; unlisted pages retain family counts.
const KNOWN_DYNAMIC_PATHS = new Set([
  "/blog/are-phonics-apps-enough-for-kids",
  "/blog/back-to-school-english-confidence-plan",
  "/blog/benefits-of-phonics-for-kids",
  "/blog/can-child-improve-english-in-10-days",
  "/blog/cbse-phonics-curriculum-vs-systematic-phonics-programme",
  "/blog/child-gives-one-word-answers",
  "/blog/child-knows-abc-but-cannot-read",
  "/blog/child-knows-grammar-but-makes-mistakes",
  "/blog/child-reads-in-class-but-forgets-at-home",
  "/blog/child-understands-english-but-does-not-speak",
  "/blog/conversation-skills-for-kids",
  "/blog/cvc-words-explained-for-parents",
  "/blog/digraphs-and-tricky-words",
  "/blog/does-cbse-include-phonics-ncf-foundational-literacy",
  "/blog/grammar-assessment",
  "/blog/grammar-conjunctions",
  "/blog/grammar-creative-writing",
  "/blog/grammar-editing-camp",
  "/blog/grammar-nouns-to-paragraphs",
  "/blog/grammar-speaking-bridge",
  "/blog/grammar-subject-verb",
  "/blog/grammar-tenses",
  "/blog/how-children-recognise-words-automatically-after-phonics",
  "/blog/how-kids-learn-blending",
  "/blog/how-long-does-phonics-take",
  "/blog/how-phonics-builds-reading-confidence",
  "/blog/how-phonics-classes-help-kids-read",
  "/blog/how-phonics-grammar-and-communication-work-together",
  "/blog/how-phonics-improves-spelling",
  "/blog/how-schools-can-assess-decoding-not-memorisation",
  "/blog/how-to-engage-kids-in-english-learning-at-home",
  "/blog/how-to-improve-reading-fluency-in-children",
  "/blog/how-to-improve-sentence-formation-in-kids",
  "/blog/how-to-teach-paragraph-writing-to-kids",
  "/blog/how-to-teach-storytelling-to-kids",
  "/blog/how-vocabulary-supports-reading-comprehension",
  "/blog/international-phonics-benchmarks-for-indian-schools",
  "/blog/june-school-reopening-english-readiness-plan",
  "/blog/long-vowel-sounds-for-kids",
  "/blog/online-english-classes-for-kids-india",
  "/blog/online-phonics-classes-vs-school",
  "/blog/online-phonics-games",
  "/blog/phonics-activities-for-kids-at-home",
  "/blog/phonics-blending-activities",
  "/blog/phonics-blending-club",
  "/blog/phonics-comprehension",
  "/blog/phonics-diagnostics",
  "/blog/phonics-for-parents-guide",
  "/blog/phonics-games-for-letter-sounds",
  "/blog/phonics-long-vowels",
  "/blog/phonics-multisyllabic",
  "/blog/phonics-r-controlled",
  "/blog/phonics-rules-for-beginners",
  "/blog/phonics-satpin-launch",
  "/blog/phonics-scope-and-sequence-for-cbse-schools",
  "/blog/phonics-summer-plan",
  "/blog/phonics-teacher-training-for-schools-implementation",
  "/blog/phonics-tricky-words",
  "/blog/phonological-awareness-vs-phonemic-awareness-vs-phonics",
  "/blog/prevent-summer-slide-reading",
  "/blog/public-speaking-delivery-for-kids",
  "/blog/punctuation-and-capital-letters-for-kids",
  "/blog/r-controlled-vowels-explained",
  "/blog/satpin-phonics-guide",
  "/blog/science-of-phonics-learning",
  "/blog/screen-smart-summer-routine-for-kids",
  "/blog/sight-words-or-phonics-first",
  "/blog/speaking-competition-prep",
  "/blog/speaking-confidence-seeds",
  "/blog/speaking-debate-starters",
  "/blog/speaking-family-showcase",
  "/blog/speaking-structure",
  "/blog/speaking-video-feedback",
  "/blog/speaking-visual-aids",
  "/blog/synthetic-phonics-vs-traditional-reading",
  "/blog/systematic-cumulative-phonics-explained-for-schools",
  "/blog/week-1-phonics-satpin-launch",
  "/blog/week-12-speaking-confidence-seeds",
  "/blog/week-7-grammar-nouns-to-paragraphs",
  "/blog/what-age-to-start-phonics",
  "/blog/what-is-jolly-phonics-and-is-it-the-best-way-to-teach-reading",
  "/blog/what-is-phonics-for-kids",
  "/blog/why-child-knows-letter-sounds-but-cannot-read-words",
  "/blog/why-child-reads-words-but-does-not-understand-story",
  "/blog/why-letter-sounds-are-not-enough-to-read",
  "/blog/why-parents-choose-online-phonics",
  "/blog/why-public-speaking-is-important-for-kids",
  "/courses/advanced-grammar",
  "/courses/advanced-public-speaking",
  "/courses/basic-grammar",
  "/courses/basic-public-speaking",
  "/courses/grammar",
  "/courses/grammar-essentials",
  "/courses/grammar-mastery",
  "/courses/phonics",
  "/courses/phonics-advanced",
  "/courses/phonics-brush-up",
  "/courses/phonics-foundation",
  "/courses/phonics-foundations",
  "/courses/public-speaking",
  "/courses/public-speaking-excellence",
  "/courses/public-speaking-foundations",
  "/resources/phonics/ai-vowel-team-phonics",
  "/resources/phonics/ar-r-controlled-vowels-phonics",
  "/resources/phonics/au-aw-phonics",
  "/resources/phonics/ch-digraph-phonics",
  "/resources/phonics/ch-tch-spelling-phonics",
  "/resources/phonics/ck-rule-phonics",
  "/resources/phonics/consonant-le-phonics",
  "/resources/phonics/ea-vowel-team-phonics",
  "/resources/phonics/ee-vowel-team-phonics",
  "/resources/phonics/er-ir-ur-r-controlled-vowels-phonics",
  "/resources/phonics/floss-rule-phonics",
  "/resources/phonics/ie-vowel-team-phonics",
  "/resources/phonics/j-sound-spellings-phonics",
  "/resources/phonics/kn-silent-k-phonics",
  "/resources/phonics/magic-e-phonics",
  "/resources/phonics/ng-digraph-phonics",
  "/resources/phonics/oa-vowel-team-phonics",
  "/resources/phonics/oi-oy-phonics",
  "/resources/phonics/oo-sounds-phonics",
  "/resources/phonics/or-r-controlled-vowels-phonics",
  "/resources/phonics/ou-ow-phonics",
  "/resources/phonics/qu-sound-phonics",
  "/resources/phonics/rabbit-rule-phonics",
  "/resources/phonics/schwa-sound-for-kids-phonics",
  "/resources/phonics/sh-digraph-phonics",
  "/resources/phonics/shun-sound-family-phonics",
  "/resources/phonics/soft-c-hard-c-phonics",
  "/resources/phonics/soft-g-hard-g-phonics",
  "/resources/phonics/th-digraph-phonics",
  "/resources/phonics/ui-vowel-sound-phonics",
  "/resources/phonics/y-as-a-vowel-phonics"
]);
const DYNAMIC_PREFIXES = ["/blog/","/courses/","/resources/phonics/","/resources/grammar/","/resources/vocabulary/"];
const FREE_TEXT_KEYS = new Set(['page_title', 'error_message', 'interaction_target', 'resource_cluster_label']);

// DOM-derived labels can contain personal text. Emit a fixed taxonomy rather than raw text.
function safeLabel(value: string): string {
  const label = value.toLowerCase();
  if (/whatsapp/.test(label)) return 'whatsapp';
  if (/assessment|demo|trial/.test(label)) return 'assessment';
  if (/pricing|fees|price/.test(label)) return 'pricing';
  if (/curriculum/.test(label)) return 'curriculum';
  if (/phonics|grammar|speaking|reading|course|program/.test(label)) return 'programme';
  if (/contact|call|email/.test(label)) return 'contact';
  if (/resource|game|practice/.test(label)) return 'resource';
  return 'other';
}
const LABEL_KEYS = new Set(['cta_label', 'link_label', 'destination_label']);
const CAMPAIGN_KEYS = new Set(['utmsource', 'utmmedium', 'utmcampaign', 'leadutmsource', 'leadutmmedium', 'leadutmcampaign']);
const CAMPAIGN_QUERY_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const;
const CONTACT_VALUE = /(?:@|%40|(?:mailto|tel|javascript):|(?:\d[\s().+-]*){8,})/i;
const UNSAFE_URL_KEYS = new Set(['pagelocation', 'pagereferrer', 'linkurl', 'url', 'href', 'referrer', 'formdestination']);

function campaignLabel(value: string): boolean {
  return /^[a-z0-9_-]{1,64}$/i.test(value) && !CONTACT_VALUE.test(value);
}

function publicPath(value: string): string | undefined {
  const path = value.split(/[?#]/, 1)[0];
  if (!/^\/(?:[a-z0-9_-]+\/?)*$/i.test(path) || CONTACT_VALUE.test(path)) return undefined;
  const canonical = path.toLowerCase().replace(/\/+$/, '') || '/';
  if (!isPublicAnalyticsPath(canonical)) return undefined;
  const prefix = DYNAMIC_PREFIXES.find((entry) => canonical.startsWith(entry));
  if (prefix && !KNOWN_DYNAMIC_PATHS.has(canonical)) return prefix.slice(0, -1);
  return canonical;
}

export function analyticsPageContext(href: string, referrer: string) {
  const url = new URL(href);
  const page = new URL(publicPath(url.pathname) || '/', url.origin);
  for (const key of CAMPAIGN_QUERY_KEYS) {
    const value = url.searchParams.get(key);
    if (value && campaignLabel(value)) page.searchParams.set(key, value);
  }

  let safeReferrer = '';
  if (referrer) {
    try {
      const previous = new URL(referrer);
      if (previous.protocol === 'https:' || previous.protocol === 'http:') {
        safeReferrer = previous.origin === url.origin
          ? previous.origin + (publicPath(previous.pathname) || '/')
          : previous.origin + '/';
      }
    } catch {
      // Use an explicit empty referrer rather than letting the tag infer it.
    }
  }

  return { page_location: page.href, page_referrer: safeReferrer };
}

export function safeAnalyticsParameters(
  params: Record<string, unknown>,
  eventName?: string,
): Record<string, string | number | boolean> {
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    const eventKeys = eventName && Object.prototype.hasOwnProperty.call(CORE_EVENT_KEYS, eventName) ? CORE_EVENT_KEYS[eventName] : undefined;
    if (!APPROVED_KEYS.has(key) || FREE_TEXT_KEYS.has(key) || (eventKeys && !eventKeys.includes(key))) continue;
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (LABEL_KEYS.has(key)) {
      if (typeof value === 'string') safe[key] = safeLabel(value);
      continue;
    }
    if (key === 'article_slug') {
      if (typeof value === 'string' && KNOWN_DYNAMIC_PATHS.has('/blog/' + value)) safe[key] = value;
      continue;
    }
    if (
      SENSITIVE_KEYS.has(normalized) || UNSAFE_URL_KEYS.has(normalized) ||
      /^(?:(?:kid|child|student|parent|enrollment|submission|lead|user|actor|record|doc|document|phone|contact|session|class|payment|billing|invoice)(?:id|uid|identifier|number)|id|uid)$/.test(normalized)
    ) continue;

    if (PATH_KEYS.has(normalized)) {
      const path = typeof value === 'string'
        ? (['assessment-form', 'external:whatsapp', 'external:phone', 'external:email'].includes(value) ? value : publicPath(value))
        : undefined;
      if (path) safe[key] = path;
      continue;
    }

    if (CAMPAIGN_KEYS.has(normalized)) {
      if (typeof value === 'string' && campaignLabel(value)) safe[key] = value;
      continue;
    }

    if (typeof value === 'string' && !CONTACT_VALUE.test(value) && !/\?|https?:\/\/|%3f/i.test(value)) {
      safe[key] = value;
    } else if (typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) {
      safe[key] = value;
    }
  }
  return safe;
}
