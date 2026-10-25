# Phonics ages 7–9 — unpublished content-design briefs

**Status:** CONTENT DESIGN ONLY · Not approved for publication, routing, prerendering, sitemap discovery or indexation.  
**Context:** TSSA-SCQ Phase 6, next-wave development pilot ages 3 and 6. The live approved age owner family is ages 3–6 only after the pilot is separately merged and deployed.  
**Decision owner:** Curriculum / educational quality and SEO / canonical ownership teams.  
**Review before coding:** Evidence of distinct non-branded search intent and substantial, skill-specific value. Never publish a near-identical age-swap landing page.

## Shared quality principles

- An older child needing Phonics support is not necessarily a beginner. Assess letter–sound links, decoding of new words, phoneme segmentation, spelling, fluent text reading and comprehension as relevant; age is **not** a course placement rule.
- Use age-respectful text, activities and illustrations. Avoid toddler-style framing, deficit labels, or assuming a child at this age has a disability.
- The teaching stage is chosen after assessment; do not promise a standard number of lessons, guaranteed fluency, AI-guided home practice or automatic recordings.
- A new page must explicitly explain what `/phonics`, existing course-level routes, broad English age pages and the `/blog/why-child-knows-letter-sounds-but-cannot-read-words` owner do *not* answer. If no distinct problem is established, link to existing pages instead.
- Do not write FAQ schema as a means of promising Google rich results; structure content for parent readability. Provide one verified self-canonical and sitemap entry only after publishing approval.

## Age 7: Reading accuracy and spelling transfer

**Candidate intent (unverified):** "phonics classes for 7 year olds"; "seven year old can read simple words but struggles with spelling".  
**Search owner boundary:** Phonics support for a *seven-year-old child who decodes some words but inconsistently transfers sounds to spelling or connected reading*. Do not duplicate the existing beginner Phonics stage, general reading programme or grammar age content.

**Possible H1 (draft only):** "Phonics Support for 7-Year-Olds: Accurate Reading and Spelling"  
**Parent concern examples:** The child reads a familiar word but changes the vowel when it appears in a new sentence; spells a known word inconsistently; skips an unfamiliar grapheme instead of decoding it.  
**Educational assessment:** Accuracy for unfamiliar one-syllable decodable words; segmentation into graphemes for spelling; recognising previously taught consonant digraphs and vowel teams; error patterns in controlled connected text.  
**Meaningfully distinct activity:** Present two words sharing an already taught grapheme, then ask the child to explain the sound–spelling link and spell an unfamiliar decodable third word. Record where transfer breaks down; never use invented "magic tricks" or time-to-fluency claims.  
**Progress signals:** Fewer sound–grapheme substitutions, stronger spelling transfer to new words, and more reliable reading of suitable connected text.  
**Parent FAQ design:** "Why can my seven-year-old read words aloud but misspell the same pattern?" / "Should we return to basic Phonics?" / "How do we distinguish decoding accuracy from reading comprehension?"  
**Stage links (after assessment only):** Foundations for insecure blending; Early Phonics for secure blending but fragile advanced patterns; Reading programme where decoding is already secure.  
**Do not publish until:** distinct, corroborated search demand or parent-support evidence; curriculum-reviewed example bank; differentiated copy; no cannibalization with reading/spelling pages.

## Age 8: Longer words and independent decoding

**Candidate intent (unverified):** "phonics help for 8 year old struggling to read longer words"; "phonics classes for older children".  
**Search owner boundary:** Age-respectful Phonics for an *eight-year-old* who can read short words but has trouble applying taught syllable or vowel patterns to longer unfamiliar words. Do not equate slow reading speed with a lack of phonics understanding.

**Possible H1 (draft only):** "Phonics for 8-Year-Olds: Decoding Longer Words"  
**Parent concern examples:** The child recognises familiar one-syllable words but guesses at two-syllable words; loses a vowel sound when a word becomes longer; can decode slowly but struggles to keep meaning in mind.  
**Educational assessment:** One-syllable decoding accuracy first; consonant blends and taught vowel patterns; syllable boundary awareness; flexible but systematic decoding of appropriate longer words; comprehension of short passages separately.  
**Meaningfully distinct activity:** Contrast a familiar one-syllable word with a carefully selected two-syllable decodable word (based on sounds the child already knows), visibly mark meaningful chunks, blend them and explain the result. Avoid presenting a universal syllabification rule or unverified "fix".  
**Progress signals:** Reads previously unseen longer decodable words more accurately, retains vowel information, and notices when decoded word does not fit the sentence meaning.  
**Parent FAQ design:** "Is my eight-year-old too old for phonics?" / "How are longer words taught without guessing?" / "What if accuracy is good but reading remains slow?"  
**Stage links (after assessment only):** Advanced Phonics, Foundations/Early Phonics if relevant gaps, Reading Fluency where appropriate.  
**Do not publish until:** clear differentiation from `/courses/phonics-advanced` and `/blog/phonics-multisyllabic`; educator-signed examples and parent evidence.

## Age 9: Targeted reading and spelling support for older learners

**Candidate intent (unverified):** "phonics for 9 year old struggling reader"; "help my nine year old with decoding and spelling".  
**Search owner boundary:** A nine-year-old's *specific, persistent decoding/spelling weaknesses* despite exposure to age-grade reading; not a generic remedial-education page or a clinical reading-disorder diagnosis.

**Possible H1 (draft only):** "Phonics Support for 9-Year-Olds: Find the Missing Skill"  
**Parent concern examples:** The child understands a story when read aloud but finds printed unfamiliar words difficult; reads known words successfully but guesses longer unfamiliar words; avoids reading aloud because of repeated decoding mistakes.  
**Educational assessment:** Separate oral-language comprehension from printed word reading; check decoding of unfamiliar words, spelling patterns, longer-word segmentation, contextual reading and confidence, and identify whether referral for additional professional evaluation may be appropriate.  
**Meaningfully distinct activity:** Invite the child to read unfamiliar age-respectful words selected from already taught patterns, explain the chosen sound/grapheme strategy, then read a short decodable excerpt. Contrast the reading challenge with oral comprehension; do not label or diagnose.  
**Progress signals:** Independent decoding of unfamiliar words within the taught scope, confidence using explicit strategies, and improved application in short, meaningful texts.  
**Parent FAQ design:** "Is Phonics still helpful at nine?" / "What if comprehension is strong but decoding is not?" / "When should parents seek a qualified reading assessment?"  
**Stage links (after assessment only):** Appropriate Phonics stage, Reading Fluency/Comprehension support, and parent guidance as needed.  
**Do not publish until:** proof this is a distinct user need not fully met by an older-struggling-reader or skills-gap hub; review avoids diagnosis/guarantee claims; parent-appropriate sensitivity check.

## Content readiness gate for ages 7–9

1. **Demand and ownership:** Search Console page/query evidence plus at least one parent-intent qualitative source; no synthetic demand claim. Search intent must differ enough from `/phonics` and existing age-4/5 and course-level owners.
2. **Curriculum:** Standalone human-approved examples, class approach, assessment criteria, realistic progress measures and parent action, all tied to genuine child skill levels.
3. **Publication scope:** Do **not** add ages 7–9 to `phonicsAgeProgrammeRegistry.js`, `routes.tsx`, `publicRouteManifest.js`, `routeSeoRegistry.js`, sitemap files, structured data, or public navigation until explicitly approved.
4. **Safety and truthfulness:** No fixed advancement timelines, unsupported provider claims, clinical diagnosis, generic age-based labels, or compulsory milestones.
5. **Engineering:** When approved, expand a finite publication registry, prune duplicate copy, enforce route and canonical integrity and measure individual page usefulness after release.

**Exit decision:** These are editorial briefs only. The present PR must not cause any public `/phonics/age-[7-9]` route to exist or any such URL to enter the machine-readable directory.
