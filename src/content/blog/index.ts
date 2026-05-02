import type { BlogPost, PhonicsSeoPost } from './types';
import { BLOG_PUBLICATION_DATES, BLOG_CATEGORY_OVERRIDES, DEFAULT_HERO_BY_CATEGORY } from './shared/defaults';
import { makePhonicsPost } from './shared/phonicsShared';
import { enrichWeekPost } from './shared/weeklyShared';

import phonics_cfg_best_online_phonics_classes_for_kids from './posts/phonics/best-online-phonics-classes-for-kids';
import phonics_cfg_how_phonics_classes_help_kids_read from './posts/phonics/how-phonics-classes-help-kids-read';
import phonics_cfg_child_knows_abc_but_cannot_read from './posts/phonics/child-knows-abc-but-cannot-read';
import phonics_cfg_benefits_of_phonics_for_kids from './posts/phonics/benefits-of-phonics-for-kids';
import phonics_cfg_what_age_to_start_phonics from './posts/phonics/what-age-to-start-phonics';
import phonics_cfg_how_to_choose_phonics_classes from './posts/phonics/how-to-choose-phonics-classes';
import phonics_cfg_synthetic_phonics_vs_traditional_reading from './posts/phonics/synthetic-phonics-vs-traditional-reading';
import phonics_cfg_online_phonics_classes_vs_school from './posts/phonics/online-phonics-classes-vs-school';
import phonics_cfg_how_long_does_phonics_take from './posts/phonics/how-long-does-phonics-take';
import phonics_cfg_what_is_phonics_for_kids from './posts/phonics/what-is-phonics-for-kids';
import phonics_cfg_how_phonics_builds_reading_confidence from './posts/phonics/how-phonics-builds-reading-confidence';
import phonics_cfg_phonics_rules_for_beginners from './posts/phonics/phonics-rules-for-beginners';
import phonics_cfg_how_phonics_improves_spelling from './posts/phonics/how-phonics-improves-spelling';
import phonics_cfg_science_of_phonics_learning from './posts/phonics/science-of-phonics-learning';
import phonics_cfg_phonics_activities_for_kids_at_home from './posts/phonics/phonics-activities-for-kids-at-home';
import phonics_cfg_phonics_games_for_letter_sounds from './posts/phonics/phonics-games-for-letter-sounds';
import phonics_cfg_phonics_blending_activities from './posts/phonics/phonics-blending-activities';
import phonics_cfg_cvc_words_explained_for_parents from './posts/phonics/cvc-words-explained-for-parents';
import phonics_cfg_online_phonics_games from './posts/phonics/online-phonics-games';
import phonics_cfg_satpin_phonics_guide from './posts/phonics/satpin-phonics-guide';
import phonics_cfg_how_kids_learn_blending from './posts/phonics/how-kids-learn-blending';
import phonics_cfg_digraphs_and_tricky_words from './posts/phonics/digraphs-and-tricky-words';
import phonics_cfg_long_vowel_sounds_for_kids from './posts/phonics/long-vowel-sounds-for-kids';
import phonics_cfg_r_controlled_vowels_explained from './posts/phonics/r-controlled-vowels-explained';
import phonics_cfg_why_parents_choose_online_phonics from './posts/phonics/why-parents-choose-online-phonics';
import phonics_cfg_how_tiny_steps_builds_reading_confidence from './posts/phonics/how-tiny-steps-builds-reading-confidence';
import post_week_1_phonics_satpin_launch from './posts/phonics/week-1-phonics-satpin-launch';
import post_week_2_phonics_blending_club from './posts/phonics/week-2-phonics-blending-club';
import post_online_english_classes_for_kids_india from './posts/parent-tips/online-english-classes-for-kids-india';
import post_best_phonics_classes_for_kids from './posts/phonics/best-phonics-classes-for-kids';
import post_week_3_phonics_tricky_words from './posts/phonics/week-3-phonics-tricky-words';
import post_week_4_phonics_long_vowels from './posts/phonics/week-4-phonics-long-vowels';
import post_week_5_phonics_r_controlled from './posts/phonics/week-5-phonics-r-controlled';
import post_week_6_phonics_comprehension from './posts/phonics/week-6-phonics-comprehension';
import post_week_7_grammar_nouns_to_paragraphs from './posts/grammar/week-7-grammar-nouns-to-paragraphs';
import post_week_8_grammar_tenses from './posts/grammar/week-8-grammar-tenses';
import post_week_9_grammar_conjunctions from './posts/grammar/week-9-grammar-conjunctions';
import post_week_10_grammar_subject_verb from './posts/grammar/week-10-grammar-subject-verb';
import post_week_11_grammar_creative_writing from './posts/grammar/week-11-grammar-creative-writing';
import post_week_12_speaking_confidence_seeds from './posts/public-speaking/week-12-speaking-confidence-seeds';
import post_week_13_speaking_structure from './posts/public-speaking/week-13-speaking-structure';
import post_week_14_speaking_visual_aids from './posts/public-speaking/week-14-speaking-visual-aids';
import post_week_15_speaking_debate_starters from './posts/public-speaking/week-15-speaking-debate-starters';
import post_week_16_phonics_summer_plan from './posts/phonics/week-16-phonics-summer-plan';
import post_week_17_grammar_assessment from './posts/grammar/week-17-grammar-assessment';
import post_week_18_speaking_video_feedback from './posts/public-speaking/week-18-speaking-video-feedback';
import post_week_19_phonics_multisyllabic from './posts/phonics/week-19-phonics-multisyllabic';
import post_week_20_grammar_editing_camp from './posts/grammar/week-20-grammar-editing-camp';
import post_week_21_speaking_competition_prep from './posts/public-speaking/week-21-speaking-competition-prep';
import post_week_22_phonics_diagnostics from './posts/phonics/week-22-phonics-diagnostics';
import post_week_23_grammar_speaking_bridge from './posts/grammar/week-23-grammar-speaking-bridge';
import post_week_24_speaking_family_showcase from './posts/public-speaking/week-24-speaking-family-showcase';
import post_week_25_back_to_school_plan from './posts/parent-tips/week-25-back-to-school-plan';
import post_week_26_screen_smart_summer_routine from './posts/parent-tips/week-26-screen-smart-summer-routine';
import post_can_child_master_english_in_10_days from './posts/parent-tips/can-child-master-english-in-10-days';
import post_child_knows_letter_sounds_but_cannot_read from './posts/parent-tips/child-knows-letter-sounds-but-cannot-read';
import post_can_child_improve_english_in_10_days from './posts/parent-tips/can-child-improve-english-in-10-days';
import post_are_phonics_apps_enough_for_kids from './posts/parent-tips/are-phonics-apps-enough-for-kids';
import post_sight_words_or_phonics_first from './posts/parent-tips/sight-words-or-phonics-first';
import post_child_reads_in_class_but_forgets_at_home from './posts/parent-tips/child-reads-in-class-but-forgets-at-home';
import post_child_knows_grammar_but_makes_mistakes from './posts/parent-tips/child-knows-grammar-but-makes-mistakes';
import post_child_gives_one_word_answers from './posts/parent-tips/child-gives-one-word-answers';
import post_child_understands_english_but_does_not_speak from './posts/parent-tips/child-understands-english-but-does-not-speak';
import post_child_reads_words_but_does_not_understand_story from './posts/parent-tips/child-reads-words-but-does-not-understand-story';
import post_week_27_prevent_summer_slide_reading from './posts/phonics/week-27-prevent-summer-slide-reading';
import custom_post_phonics_for_parents_guide from './posts/research/phonics-for-parents-guide';

const PHONICS_SEO_POSTS: PhonicsSeoPost[] = [
  phonics_cfg_best_online_phonics_classes_for_kids,
  phonics_cfg_how_phonics_classes_help_kids_read,
  phonics_cfg_child_knows_abc_but_cannot_read,
  phonics_cfg_benefits_of_phonics_for_kids,
  phonics_cfg_what_age_to_start_phonics,
  phonics_cfg_how_to_choose_phonics_classes,
  phonics_cfg_synthetic_phonics_vs_traditional_reading,
  phonics_cfg_online_phonics_classes_vs_school,
  phonics_cfg_how_long_does_phonics_take,
  phonics_cfg_what_is_phonics_for_kids,
  phonics_cfg_how_phonics_builds_reading_confidence,
  phonics_cfg_phonics_rules_for_beginners,
  phonics_cfg_how_phonics_improves_spelling,
  phonics_cfg_science_of_phonics_learning,
  phonics_cfg_phonics_activities_for_kids_at_home,
  phonics_cfg_phonics_games_for_letter_sounds,
  phonics_cfg_phonics_blending_activities,
  phonics_cfg_cvc_words_explained_for_parents,
  phonics_cfg_online_phonics_games,
  phonics_cfg_satpin_phonics_guide,
  phonics_cfg_how_kids_learn_blending,
  phonics_cfg_digraphs_and_tricky_words,
  phonics_cfg_long_vowel_sounds_for_kids,
  phonics_cfg_r_controlled_vowels_explained,
  phonics_cfg_why_parents_choose_online_phonics,
  phonics_cfg_how_tiny_steps_builds_reading_confidence,
];

const rawBlogPosts: BlogPost[] = [
  post_week_1_phonics_satpin_launch,
  post_week_2_phonics_blending_club,
  ...PHONICS_SEO_POSTS.map(makePhonicsPost),
  post_online_english_classes_for_kids_india,
  post_best_phonics_classes_for_kids,
  post_week_3_phonics_tricky_words,
  post_week_4_phonics_long_vowels,
  post_week_5_phonics_r_controlled,
  post_week_6_phonics_comprehension,
  post_week_7_grammar_nouns_to_paragraphs,
  post_week_8_grammar_tenses,
  post_week_9_grammar_conjunctions,
  post_week_10_grammar_subject_verb,
  post_week_11_grammar_creative_writing,
  post_week_12_speaking_confidence_seeds,
  post_week_13_speaking_structure,
  post_week_14_speaking_visual_aids,
  post_week_15_speaking_debate_starters,
  post_week_16_phonics_summer_plan,
  post_week_17_grammar_assessment,
  post_week_18_speaking_video_feedback,
  post_week_19_phonics_multisyllabic,
  post_week_20_grammar_editing_camp,
  post_week_21_speaking_competition_prep,
  post_week_22_phonics_diagnostics,
  post_week_23_grammar_speaking_bridge,
  post_week_24_speaking_family_showcase,
  post_week_25_back_to_school_plan,
  post_week_26_screen_smart_summer_routine,
  post_can_child_master_english_in_10_days,
  post_child_knows_letter_sounds_but_cannot_read,
  post_can_child_improve_english_in_10_days,
  post_are_phonics_apps_enough_for_kids,
  post_sight_words_or_phonics_first,
  post_child_reads_in_class_but_forgets_at_home,
  post_child_knows_grammar_but_makes_mistakes,
  post_child_gives_one_word_answers,
  post_child_understands_english_but_does_not_speak,
  post_child_reads_words_but_does_not_understand_story,
  post_week_27_prevent_summer_slide_reading,
];

const normalizedBlogPosts: BlogPost[] = rawBlogPosts.map((p) => ({
  ...enrichWeekPost(p),
  category: BLOG_CATEGORY_OVERRIDES[p.slug] ?? p.category,
  date: BLOG_PUBLICATION_DATES[p.slug] ?? p.date,
}));

const customBlogSurfacePosts: BlogPost[] = [
  custom_post_phonics_for_parents_guide,
];

export const blogPosts: BlogPost[] = [...customBlogSurfacePosts, ...normalizedBlogPosts]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .map((p) => ({
    ...p,
    hero: p.hero ?? DEFAULT_HERO_BY_CATEGORY[p.category],
  }));

const EXCERPT_MIN = 120;
const EXCERPT_MAX = 200;

function normalizeExcerpt(s: string) {
  return s.replace(/\s+/g, ' ').trim();
}

function checkBlogExcerpts(posts: BlogPost[]) {
  const rows = posts.map((p) => {
    const norm = normalizeExcerpt(p.excerpt);
    const len = norm.length;
    const ok = len >= EXCERPT_MIN && len <= EXCERPT_MAX;
    const changed = norm !== p.excerpt;

    return { ok, len, changed, slug: p.slug, title: p.title };
  });

  const bad = rows.filter((r) => !r.ok || r.changed);

  console.table(
    rows.map((r) => ({
      ok: r.ok ? '✅' : '❌',
      len: r.len,
      changed: r.changed ? '⚠️ trim' : '',
      slug: r.slug,
      title: r.title,
    }))
  );

  if (bad.length) {
    console.warn(
      '[blog] ' + bad.length + ' excerpt(s) need attention. Target ' + EXCERPT_MIN + '–' + EXCERPT_MAX + ' chars (after trimming).'
    );
  }
}

if (import.meta?.env?.DEV) {
  checkBlogExcerpts([...rawBlogPosts, ...customBlogSurfacePosts]);
}
