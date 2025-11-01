const phonicsLevels = [
    {
        id: "phonics-foundations",
        title: "Foundations",
        summary: "Establish letter-sound fluency, handwriting comfort, and initial blending skills.",
        ageRange: "Ages 3–5",
        units: [
            {
                id: "phonics-letter-sound-system",
                title: "Core Letter–Sound System",
                summary: "Mastery of alphabet sounds, handwriting patterns, and consonant articulation.",
                skills: [
                    {
                        id: "phonics-a2z",
                        title: "Jolly Phonics order",
                        description: "Follow the Jolly Phonics sequence to introduce and articulate each new sound.",
                    },
                    { id: "phonics-short-vowels", title: "Short vowel sounds", description: "Differentiate and pronounce short a, e, i, o, u." },
                    { id: "phonics-consonant-intro", title: "Consonant sounds", description: "Introduce clear articulation of consonant sounds." },
                    { id: "phonics-letter-formation", title: "Letter formations", description: "Write upper and lower case letter forms legibly." },
                ],
            },
            {
                id: "phonics-cvc-blending",
                title: "CVC Blending & Segmenting",
                summary: "Blend and segment consonant-vowel-consonant words with confidence.",
                skills: [
                    { id: "phonics-at-family", title: "AT/AP/AN families", description: "Blend and decode AT, AP, AN word families." },
                    { id: "phonics-it-family", title: "IT/IN/IP families", description: "Blend and decode IT, IN, IP word families." },
                    { id: "phonics-ot-family", title: "OT/OP/OG families", description: "Blend and decode OT, OP, OG word families." },
                    { id: "phonics-et-family", title: "ET/EN/EG families", description: "Blend and decode ET, EN, EG word families." },
                    { id: "phonics-ug-family", title: "UG/UN/UB families", description: "Blend and decode UG, UN, UB word families." },
                    { id: "phonics-oral-blending", title: "Oral blending", description: "Blend orally segmented sounds to identify the word." },
                    { id: "phonics-phoneme-tapping", title: "Phoneme tapping", description: "Tap individual phonemes while segmenting CVC words." },
                    { id: "phonics-decode-cvc", title: "Decode 3-letter words", description: "Read simple CVC words independently." },
                ],
            },
        ],
    },
    {
        id: "phonics-developing",
        title: "Developing Fluency",
        summary: "Introduce blends, digraphs, and long vowel patterns to expand decoding.",
        ageRange: "Ages 5–7",
        units: [
            {
                id: "phonics-blends",
                title: "Consonant Blends",
                summary: "Blend two consonant sounds at the start or end of a word.",
                skills: [
                    { id: "phonics-beginning-blends", title: "Beginning blends", description: "Decode st, sp, sm, sn, sl, sk, dr, tr, br, cr, fr, gr, pr blends." },
                    { id: "phonics-ending-blends", title: "Ending blends", description: "Decode nd, nt, mp, lt, lk, ld, ft blends." },
                ],
            },
            {
                id: "phonics-digraphs",
                title: "Digraphs & Rules",
                summary: "Recognise two-letter teams that produce one sound and the rules that govern them.",
                skills: [
                    { id: "phonics-basic-digraphs", title: "Common digraphs", description: "Read ch, sh, th (voiced/unvoiced), wh, ck, ng, nk, tch." },
                    { id: "phonics-ck-rule", title: "CK Rule", description: "Apply the CK rule after a short vowel." },
                    { id: "phonics-tch-rule", title: "TCH Rule", description: "Apply tch after short vowels in one-syllable words." },
                    { id: "phonics-ct-rule", title: "C+T friends", description: "Notice ct patterns in words such as act, fact, project." },
                    { id: "phonics-big-words", title: "C loves big words", description: "Spot c acting as /s/ in longer words (e.g., interesting)." },
                ],
            },
            {
                id: "phonics-double-consonant",
                title: "Double Consonant Rules",
                summary: "Manage double consonants in reading and spelling.",
                skills: [
                    { id: "phonics-floss-rule", title: "Floss rule", description: "Double f, l, s, z at the end of short-vowel words." },
                    { id: "phonics-rabbit-rule", title: "Rabbit rule", description: "Double consonant in the middle of two-syllable words." },
                    { id: "phonics-monster-rule", title: "Monster rule", description: "Drop silent e when adding vowel endings." },
                ],
            },
            {
                id: "phonics-magic-e",
                title: "Magic E Patterns",
                summary: "Decode vowel-consonant-e words with long vowel sounds.",
                skills: [
                    { id: "phonics-magic-ae", title: "a_e pattern", description: "Read words like cake, make, same." },
                    { id: "phonics-magic-ee", title: "e_e pattern", description: "Read words like theme, these." },
                    { id: "phonics-magic-ie", title: "i_e pattern", description: "Read words like kite, time." },
                    { id: "phonics-magic-oe", title: "o_e pattern", description: "Read words like rope, home." },
                    { id: "phonics-magic-ue", title: "u_e pattern", description: "Read words like cube, tune." },
                ],
            },
        ],
    },
    {
        id: "phonics-mastery",
        title: "Mastery",
        summary: "Secure advanced vowel teams, syllable types, and flexible decoding strategies.",
        ageRange: "Ages 7–10",
        units: [
            {
                id: "phonics-vowel-teams",
                title: "Long Vowel Teams",
                summary: "Recognise alternate long vowel spellings and sounds.",
                skills: [
                    { id: "phonics-ai-ay", title: "ai/ay", description: "Read long a patterns in words like rain, play." },
                    { id: "phonics-ee-ea", title: "ee/ea", description: "Read long e patterns in words like tree, leaf." },
                    { id: "phonics-ie-igh", title: "ie/igh", description: "Read long i patterns in words like pie, light." },
                    { id: "phonics-oa-oe", title: "oa/oe", description: "Read long o patterns in words like boat, toe." },
                    { id: "phonics-ue-ui", title: "ue/ui", description: "Read long u patterns in words like blue, fruit." },
                    { id: "phonics-oo-sounds", title: "oo (2 sounds)", description: "Distinguish /oo/ in moon vs /ʊ/ in book." },
                ],
            },
            {
                id: "phonics-r-controlled",
                title: "R-controlled Vowels",
                summary: "Blend vowels followed by r with accuracy.",
                skills: [
                    { id: "phonics-r-controlled-set", title: "ar, er, ir, or, ur", description: "Decode and contrast r-controlled vowels." },
                ],
            },
            {
                id: "phonics-diphthongs",
                title: "Diphthongs & Alternate Sounds",
                summary: "Handle vowel teams with shifting sounds and schwa patterns.",
                skills: [
                    { id: "phonics-oi-oy", title: "oi/oy", description: "Read words like soil, toy." },
                    { id: "phonics-au-aw", title: "au/aw", description: "Read words like pause, paw." },
                    { id: "phonics-ou-ow", title: "ou/ow", description: "Read two patterns in words like cloud, snow." },
                    { id: "phonics-soft-vowels", title: "Alternate vowel sounds", description: "Identify soft vowel sounds in want, any, women, son, busy." },
                    { id: "phonics-three-j", title: "Three J sounds", description: "Use ge, gi, gy for /j/ sounds at word endings." },
                    { id: "phonics-silent-letters", title: "Silent letters", description: "Spot wr, kn, mb, gh, lk patterns." },
                    { id: "phonics-schwa", title: "Schwa", description: "Decode the unstressed vowel in about, open, lemon, pencil, circus." },
                    { id: "phonics-y-patterns", title: "Bossy Y variants", description: "Read y as long i/long e and tricky y in gym." },
                ],
            },
            {
                id: "phonics-syllables-spelling",
                title: "Syllables, Spelling & Fluency",
                summary: "Break down multisyllabic words and apply spelling conventions.",
                skills: [
                    { id: "phonics-syllable-types", title: "Syllable types", description: "Use VC/CV, magic-e, r-controlled, open syllables while decoding." },
                    { id: "phonics-suffix-rules", title: "Spelling patterns & suffixes", description: "Apply ed sounds, s vs es, ing/er/est, doubling rules." },
                    { id: "phonics-sight-words", title: "Tricky sight words", description: "Read irregular words (to, do, go, was, your, because, could, should)." },
                    { id: "phonics-comprehension", title: "Reading comprehension", description: "Sequence images, answer with evidence, and check understanding." },
                ],
            },
        ],
    },
];
const grammarLevels = [
    {
        id: "grammar-foundations",
        title: "Level 1 – Foundations",
        summary: "Build early grammar awareness through playful practice.",
        ageRange: "Ages 4–7",
        units: [
            {
                id: "grammar-basic-parts-of-speech",
                title: "Parts of Speech Essentials",
                summary: "Identify nouns, verbs, and adjectives in context.",
                skills: [
                    { id: "grammar-nouns", title: "Nouns", description: "Recognise people, places, and things in pictures and sentences." },
                    { id: "grammar-verbs", title: "Verbs", description: "Spot action words in stories." },
                    { id: "grammar-helping-verbs", title: "Helping verbs", description: "Use is, am, are with simple subjects." },
                    { id: "grammar-articles", title: "Articles", description: "Apply a/an/the correctly." },
                    { id: "grammar-prepositions", title: "Prepositions of place", description: "Use in, on, under, behind accurately." },
                    { id: "grammar-adjectives", title: "Adjectives", description: "Describe with colour, size, shape words." },
                ],
            },
            {
                id: "grammar-foundation-activities",
                title: "Foundational Activities",
                summary: "Reinforce concepts with multisensory practise.",
                skills: [
                    { id: "grammar-picture-labelling", title: "Picture labelling", description: "Label visuals with matched words." },
                    { id: "grammar-sorting-games", title: "Sorting games", description: "Group words into correct grammatical categories." },
                    { id: "grammar-lrws", title: "LRWS worksheets", description: "Complete listening, reading, writing, speaking loops per lesson." },
                ],
            },
        ],
    },
    {
        id: "grammar-skill-builders",
        title: "Level 2 – Skill Builders",
        summary: "Grow sentence control and introduce plural, tense, and conjunction concepts.",
        ageRange: "Ages 6–8",
        units: [
            {
                id: "grammar-structure",
                title: "Sentence Structure",
                summary: "Create complete sentences with correct agreement and punctuation.",
                skills: [
                    { id: "grammar-singular-plural", title: "Singular vs plural", description: "Change nouns using s/es endings." },
                    { id: "grammar-pronouns", title: "Pronouns", description: "Replace nouns with he, she, they, it appropriately." },
                    { id: "grammar-past-present", title: "Past & present verbs", description: "Use base and past forms for familiar verbs." },
                    { id: "grammar-conjunctions", title: "Conjunctions", description: "Link ideas with and, but, or, so." },
                    { id: "grammar-sentence-building", title: "Sentence building", description: "Arrange words into meaningful sentences." },
                    { id: "grammar-punctuation", title: "Punctuation basics", description: "Apply full stop, exclamation, question marks." },
                ],
            },
            {
                id: "grammar-skill-games",
                title: "Skill Games",
                summary: "Apply grammar in movement and collaborative formats.",
                skills: [
                    { id: "grammar-sentence-chains", title: "Sentence chains", description: "Build stories by adding grammatically correct sentences." },
                    { id: "grammar-adjective-spin", title: "Adjective spin wheel", description: "Upgrade sentences using new describing words." },
                ],
            },
        ],
    },
    {
        id: "grammar-fluency",
        title: "Level 3 – Fluency",
        summary: "Develop advanced grammar and vocabulary for confident writing.",
        ageRange: "Ages 8–10",
        units: [
            {
                id: "grammar-advanced-tenses",
                title: "Tense & Structure Mastery",
                summary: "Explore perfect tenses, adverbs, and complex sentence components.",
                skills: [
                    { id: "grammar-present-perfect", title: "Present perfect", description: "Use have/has + past participle accurately." },
                    { id: "grammar-past-perfect", title: "Past perfect", description: "Use had + past participle to order events." },
                    { id: "grammar-future-perfect", title: "Future perfect", description: "Use will have + past participle for future projections." },
                    { id: "grammar-adverbs", title: "Adverbs", description: "Employ adverbs of manner, time, place to add detail." },
                    { id: "grammar-irregular-verbs", title: "Irregular verbs", description: "Use non-standard past tense forms correctly." },
                    { id: "grammar-homophones", title: "Homophones", description: "Differentiate meaning and spelling of sound-alike pairs." },
                    { id: "grammar-compound-words", title: "Compound words", description: "Create compound words suited to context." },
                    { id: "grammar-prefix-suffix", title: "Prefix & suffix meanings", description: "Add affixes to alter meaning." },
                    { id: "grammar-objects", title: "Direct/indirect objects", description: "Identify object placement in sentences." },
                    { id: "grammar-contractions", title: "Contractions", description: "Form and expand contractions accurately." },
                ],
            },
            {
                id: "grammar-writing-mechanics",
                title: "Writing Mechanics",
                summary: "Fine-tune structure, dialogue, and sequencing for longer compositions.",
                skills: [
                    { id: "grammar-capitalization", title: "Capitalization rules", description: "Apply capital letters to names, beginnings, titles." },
                    { id: "grammar-dialogue", title: "Dialogue punctuation", description: "Punctuate speech with quotes and commas." },
                    { id: "grammar-paragraph", title: "Paragraph structure", description: "Organise ideas with topic and supporting sentences." },
                    { id: "grammar-story-sequencing", title: "Story sequencing", description: "Arrange narratives with logical flow." },
                ],
            },
            {
                id: "grammar-applied",
                title: "Applied Grammar",
                summary: "Practise functional grammar in editing and transformation tasks.",
                skills: [
                    { id: "grammar-error-correction", title: "Error correction", description: "Locate and correct grammar mistakes in text." },
                    { id: "grammar-transformation", title: "Sentence transformation", description: "Rewrite sentences using prompts or constraints." },
                    { id: "grammar-proofreading", title: "Proof-reading worksheets", description: "Review and improve writing samples." },
                ],
            },
        ],
    },
];
const speakingLevels = [
    {
        id: "speaking-foundation",
        title: "Level 1 – Foundation Communication",
        summary: "Introduce confident body language and social greetings.",
        ageRange: "Ages 5–6",
        units: [
            {
                id: "speaking-intros",
                title: "Introductions & Confidence",
                summary: "Cultivate basic presentation posture and voice.",
                skills: [
                    { id: "speaking-introduce", title: "Introduce yourself", description: "Share name, age, interests with clarity." },
                    { id: "speaking-greetings", title: "Greetings", description: "Use polite greetings in social situations." },
                    { id: "speaking-body-language", title: "Body language basics", description: "Stand tall, manage gestures, and maintain poise." },
                    { id: "speaking-eye-contact", title: "Eye contact & posture", description: "Engage the audience with eye contact and open posture." },
                    { id: "speaking-voice-projection", title: "Voice projection", description: "Project voice clearly in small-group presentations." },
                ],
            },
            {
                id: "speaking-confidence-games",
                title: "Confidence Games",
                summary: "Practise with playful routines and repeated exposure.",
                skills: [
                    { id: "speaking-hello-circle", title: "Hello circle", description: "Group introductions with affirmations." },
                    { id: "speaking-confidence-meter", title: "Confidence meter", description: "Self-rate comfort and set growth goals." },
                ],
            },
        ],
    },
    {
        id: "speaking-building",
        title: "Level 2 – Sentence Building",
        summary: "Strengthen sentence construction and descriptive language.",
        ageRange: "Ages 6–7",
        units: [
            {
                id: "speaking-sentence-labs",
                title: "Sentence Labs",
                summary: "Form varied and descriptive sentences to support free speaking.",
                skills: [
                    { id: "speaking-subject-verb", title: "Subject + verb", description: "Deliver complete sentences with correct subject-verb pairing." },
                    { id: "speaking-adjective-upgrade", title: "Adjective upgrades", description: "Inject descriptive words for impact." },
                    { id: "speaking-trend-words", title: "Trend vocabulary", description: "Use impactful words to add interest to speech." },
                    { id: "speaking-vocab-ladders", title: "Vocabulary ladders", description: "Climb from simple to advanced word choices." },
                ],
            },
            {
                id: "speaking-sentence-games",
                title: "Sentence Games",
                summary: "Practise building sentences collaboratively.",
                skills: [
                    { id: "speaking-sentence-dice", title: "Sentence dice", description: "Roll prompts to craft impromptu sentences." },
                    { id: "speaking-sentence-chains", title: "Sentence chains", description: "Extend stories with linked sentences." },
                ],
            },
        ],
    },
    {
        id: "speaking-picture-talk",
        title: "Level 3 – Picture Talk",
        summary: "Analyse visuals using descriptive language and structured responses.",
        ageRange: "Ages 6–8",
        units: [
            {
                id: "speaking-picture-observe",
                title: "Observe, Describe, Reason",
                summary: "Lead with sensory language and logical thinking.",
                skills: [
                    { id: "speaking-observe", title: "Observation", description: "Describe what is happening in an image." },
                    { id: "speaking-sensory", title: "Sensory vocabulary", description: "Use sight, sound, touch, taste, smell words." },
                    { id: "speaking-5w1h", title: "5Ws & 1H", description: "Structure responses with who, what, where, when, why, how." },
                ],
            },
        ],
    },
    {
        id: "speaking-storytelling",
        title: "Level 4 – Storytelling",
        summary: "Develop narrative thinking, characterisation, and pacing.",
        ageRange: "Ages 7–9",
        units: [
            {
                id: "speaking-story-arc",
                title: "Story Arc",
                summary: "Plan beginning, conflict, resolution, and lesson.",
                skills: [
                    { id: "speaking-story-structure", title: "Story structure", description: "Outline beginning, problem, attempt, solution, lesson." },
                    { id: "speaking-story-tools", title: "Story tools", description: "Use dice, wheel, and pocket templates to spark ideas." },
                    { id: "speaking-story-activities", title: "Story activities", description: "Practise buddy retell and 45–60 second formats." },
                ],
            },
        ],
    },
    {
        id: "speaking-visualisation",
        title: "Level 5 – Visualization",
        summary: "Strengthen imagination and descriptive power.",
        ageRange: "Ages 8–9",
        units: [
            {
                id: "speaking-visualise",
                title: "Imagery & Emotion",
                summary: "Describe places, actions, and feelings clearly.",
                skills: [
                    { id: "speaking-five-senses", title: "Five senses", description: "Layer sensory detail into descriptions." },
                    { id: "speaking-describe-places", title: "Describe places", description: "Paint vivid scenes for listeners." },
                    { id: "speaking-emotional-map", title: "Emotional mapping", description: "Track and describe feelings within a scenario." },
                ],
            },
        ],
    },
    {
        id: "speaking-speech-tools",
        title: "Level 6 – Speech Tools",
        summary: "Introduce advanced delivery techniques for control and impact.",
        ageRange: "Ages 9–10",
        units: [
            {
                id: "speaking-delivery-tools",
                title: "Delivery Tools",
                summary: "Use voice and body deliberately to engage audiences.",
                skills: [
                    { id: "speaking-tone", title: "Tone", description: "Shift tone to match mood." },
                    { id: "speaking-pause", title: "Pause", description: "Use pauses strategically for emphasis." },
                    { id: "speaking-pace", title: "Pace", description: "Control speech speed for clarity." },
                    { id: "speaking-emphasis", title: "Emphasis", description: "Stress key words to highlight ideas." },
                    { id: "speaking-gestures", title: "Gestures", description: "Coordinate gestures with content." },
                ],
            },
        ],
    },
    {
        id: "speaking-topic-talks",
        title: "Level 7 – Topic Talks",
        summary: "Practise creative prompts and structured responses.",
        ageRange: "Ages 9–10",
        units: [
            {
                id: "speaking-prompts",
                title: "Prompt Practice",
                summary: "Develop spontaneous speaking on imaginative scenarios.",
                skills: [
                    { id: "speaking-holiday", title: "If I invented a holiday", description: "Plan celebrations and rituals." },
                    { id: "speaking-toys", title: "If toys could talk", description: "Develop character perspectives." },
                    { id: "speaking-no-electricity", title: "Day without electricity", description: "Explain adaptation strategies." },
                    { id: "speaking-superpower", title: "Secret superpower", description: "Describe abilities and applications." },
                ],
            },
        ],
    },
    {
        id: "speaking-debate",
        title: "Level 8 – Debate Basics",
        summary: "Learn respectful argumentation and simple rebuttals.",
        ageRange: "Ages 10–11",
        units: [
            {
                id: "speaking-debate-skills",
                title: "Debate Skills",
                summary: "Frame opinions with support and listen actively.",
                skills: [
                    { id: "speaking-agree-disagree", title: "Agree/disagree politely", description: "Respond respectfully to opposing views." },
                    { id: "speaking-supporting-reasons", title: "Supporting reasons", description: "Provide two to three reasons per claim." },
                    { id: "speaking-rebuttal", title: "Simple rebuttal", description: "Counter points with evidence or logic." },
                ],
            },
        ],
    },
    {
        id: "speaking-presentation",
        title: "Level 9 – Presentation Skills",
        summary: "Deliver structured talks with strong openings and conclusions.",
        ageRange: "Ages 10–12",
        units: [
            {
                id: "speaking-presentations",
                title: "Presentation Craft",
                summary: "Organise content from hook to Q&A gracefully.",
                skills: [
                    { id: "speaking-openings", title: "Opening hooks", description: "Start with stories, questions, or facts." },
                    { id: "speaking-transitions", title: "Transitions", description: "Move between points smoothly." },
                    { id: "speaking-conclusions", title: "Conclusions", description: "Close with summary and call to action." },
                    { id: "speaking-questions", title: "Ask for questions", description: "Invite interaction and respond positively." },
                ],
            },
        ],
    },
    {
        id: "speaking-pronunciation",
        title: "Level 10 – Pronunciation Lab",
        summary: "Polish articulation and address common Indian English challenges.",
        ageRange: "Ages 10–12",
        units: [
            {
                id: "speaking-pronunciation-habits",
                title: "Daily Pronunciation Habits",
                summary: "Maintain clarity through consistent micro-practice.",
                skills: [
                    { id: "speaking-confusing-words", title: "Confusing words", description: "Practise five frequently confused words daily." },
                    { id: "speaking-tongue-twister", title: "Tongue twisters", description: "Attempt a fresh tongue twister each day." },
                ],
            },
            {
                id: "speaking-common-errors",
                title: "Common Error Clinic",
                summary: "Correct pronunciations of silent letter and vowel-heavy words.",
                skills: [
                    { id: "speaking-silent-letters", title: "Silent letters", description: "Pronounce knife, comb, honest, island correctly." },
                    { id: "speaking-vowel-pronunciation", title: "Vowel pronunciation", description: "Adjust vowel sounds for clarity in Indian English contexts." },
                ],
            },
        ],
    },
];
export const CURRICULUM = [
    {
        id: "phonics",
        title: "Phonics Curriculum",
        ageRange: "Ages 3–10",
        pathway: ["Foundations", "Developing Fluency", "Mastery"],
        focus: "Teach phonics systematically through one-to-one sessions that transition children from decoding basics to fluent, expressive reading.",
        deliveryNotes: [
            "Weekly diagnostic check-ins to map mastery bands.",
            "Leverage LRWS (Listening, Reading, Writing, Speaking) cycle in every lesson.",
            "Share evidence snapshots (worksheet, game score, oral recording) with parents via Learning Manager.",
        ],
        levels: phonicsLevels,
    },
    {
        id: "grammar",
        title: "Grammar & Writing Curriculum",
        ageRange: "Ages 4–10",
        pathway: ["Level 1 – Foundations", "Level 2 – Skill Builders", "Level 3 – Fluency"],
        focus: "Build precise grammar knowledge and writing stamina to elevate structured communication.",
        deliveryNotes: [
            "Keep sentence construction tactile with cards, spin wheels, and collaborative chains.",
            "Integrate applied grammar tasks weekly to boost editing confidence.",
            "Log every session’s mastery band, next action, and evidence for parent dashboards.",
        ],
        levels: grammarLevels,
    },
    {
        id: "speaking",
        title: "Public Speaking Curriculum",
        ageRange: "Ages 5–12",
        pathway: [
            "Foundation Communication",
            "Sentence Building",
            "Picture Talk",
            "Storytelling",
            "Visualization",
            "Speech Tools",
            "Topic Talks",
            "Debate Basics",
            "Presentation Skills",
            "Pronunciation Lab",
        ],
        focus: "Guide children from confident introductions to advanced presentation craft with creative, sensory-rich practice.",
        deliveryNotes: [
            "Each class follows LRWS with an emphasis on reflective speaking.",
            "Learning Managers relay teacher notes to parents—teachers focus on coaching.",
            "Record short clips periodically to showcase growth and inform feedback loops.",
        ],
        levels: speakingLevels,
    },
];
//# sourceMappingURL=curriculum.js.map