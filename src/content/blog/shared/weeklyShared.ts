import type { BlogPost, BlogBlock, WeeklyPlaybook } from '../types';

const WEEKLY_PARENT_GUIDE_BLOCKS: BlogBlock[] = [{
  type: 'h2',
  content: 'Parent guide: how to use this weekly plan in real life'
}, {
  type: 'p',
  content: 'Use this weekly post as a practical checklist, not a one-time read. Keep routines short, repeat the same target for 5-7 days, and track one visible win.'
}, {
  type: 'li',
  content: 'Choose one daily slot and keep it fixed (same time, same place).'
}, {
  type: 'li',
  content: 'Do 10-15 focused minutes only; stop while your child still feels successful.'
}, {
  type: 'li',
  content: 'Use one correction script: "Let us try slowly, then fast."'
}, {
  type: 'li',
  content: 'Send one weekly note to the teacher: what improved, what still needs support.'
}];

const WEEKLY_RESEARCH_BASIS_BLOCKS: BlogBlock[] = [{
  type: 'h2',
  content: 'Research basis: why this weekly plan works'
}, {
  type: 'p',
  content: 'This weekly structure reflects evidence-aligned classroom practice used in early literacy and communication instruction: explicit teaching, short retrieval cycles, and repeated guided practice with feedback.'
}, {
  type: 'li',
  content: 'Distributed practice beats cramming: short sessions across the week improve retention better than one long session.'
}, {
  type: 'li',
  content: 'Retrieval and correction loops build fluency: recall first, then immediate gentle correction, then one successful retry.'
}, {
  type: 'li',
  content: 'Clear success criteria improve motivation: children engage better when the goal is visible and achievable in one session.'
}];

const WEEKLY_TINY_STEPS_STANDARD_BLOCKS: BlogBlock[] = [{
  type: 'h2',
  content: 'Tiny Steps quality standard for this week'
}, {
  type: 'p',
  content: 'Every Tiny Steps weekly blog should give parents a usable routine, measurable progress signal, and practical fallback when the child gets stuck. Use this page as a field guide, not theory-only reading.'
}, {
  type: 'li',
  content: 'One concrete routine parents can run in 10-15 minutes.'
}, {
  type: 'li',
  content: 'One measurable checkpoint (accuracy, fluency, or confidence) by week-end.'
}, {
  type: 'li',
  content: 'One rescue strategy for low-motivation days so consistency does not break.'
}];

const WEEKLY_DEFAULT_FAQ: {
  question: string;
  answer: string;
}[] = [{
  question: 'How long should this weekly plan take each day?',
  answer: 'Keep it to 10-15 focused minutes. Consistency across 5-6 days is more effective than a single long session.'
}, {
  question: 'What if my child resists practice on school days?',
  answer: 'Use a 5-minute minimum routine and keep one easy success at the end. Resume the full 10-15 minute flow the next day.'
}, {
  question: 'How do I know if this week worked?',
  answer: 'Track one simple metric from Day 1 to Day 7: accuracy, fluency smoothness, or speaking confidence. Improvement on one metric is a valid week win.'
}];

const WEEKLY_REAL_WORLD_PLAYBOOKS: Record<string, WeeklyPlaybook> = {
  'week-1-phonics-satpin-launch': {
    heading: 'Real-world action plan: SATPIN without overwhelm',
    context: 'Do not start with heavy worksheets. Start with clear sound production, oral blending, and short decodable lines children can actually read.',
    routine: ['Day 1-2: Teach s, a, t with pure sounds. Ask for sound in under 2 seconds using flash cards.', 'Day 3-4: Add p, i, n and blend sat, pin, tap, tin with finger taps.', 'Day 5-7: Read 4 tiny lines like "Sam sat." and "Pat taps." Keep each session to 10 minutes.'],
    rescue: 'If your child says letter names instead of sounds, model once, ask for echo twice, then return to one simple blend. If frustration rises, switch to oral-only blending for 2 minutes.',
    outcomes: ['Child recalls all six SATPIN sounds quickly.', 'Child blends at least five CVC words without picture guessing.', 'Child reads one short decodable sentence with support.'],
    parentQuestions: ['My child forgets sounds the next day. Start every session with a 90-second sound review before new words.', 'My child mixes b and d. Delay these letters for now and return after sound confidence is stable.']
  },
  'week-2-phonics-blending-club': {
    heading: 'Real-world action plan: blending that works on school nights',
    context: 'Blending becomes automatic with short daily repetition. Use a fixed ladder from oral sounds to print to sentence.',
    routine: ['Start with 3 oral blends: c-a-t, m-a-p, s-i-t before opening a book.', 'Read a CVC ladder: sat -> sit -> sip -> tip -> tap and discuss the changed middle sound.', 'Finish with one decodable line: "The cat sat." "I tap the map."'],
    rescue: 'If your child guesses whole words, cover the word, reveal one sound at a time, and blend again slowly. Keep correction neutral and quick.',
    outcomes: ['Child blends 6-8 CVC words with less pausing.', 'Child notices vowel changes between similar words.', 'Child reads one short sentence by tracking each word left to right.'],
    parentQuestions: ['How long should blending practice be? Ten focused minutes daily beats one long weekend session.', 'Should I let my child skip hard words? No, help decode them once, then repeat for confidence.']
  },
  'week-3-phonics-tricky-words': {
    heading: 'Real-world action plan: teach tricky words without rote pressure',
    context: 'Use a "sound part + heart part" method so children understand what is decodable and what must be remembered.',
    routine: ['Pick 3 words only for the week: said, was, the. Circle the unusual letter part.', 'Read each tricky word in a tiny sentence: "He said hi." "It was fun." "The dog ran."', 'Play snap game with word cards for 2 minutes before bed.'],
    rescue: 'If a tricky word keeps failing, reduce to one word for two days. Use tracing in sand or air writing, then read it in a sentence.',
    outcomes: ['Child reads 2-3 target tricky words automatically.', 'Child can use at least one target word while reading a sentence.', 'Child can spell one target tricky word from memory.'],
    parentQuestions: ['How many tricky words per week? Usually 2-4 is enough for retention.', 'Should I test spelling daily? No, test lightly twice a week and prioritize reading use.']
  },
  'week-4-phonics-long-vowels': {
    heading: 'Real-world action plan: long vowels with clear contrasts',
    context: 'Parents get faster results when children compare short and long vowel pairs directly instead of learning patterns in isolation.',
    routine: ['Use pair cards: cap/cape, pin/pine, tub/tube. Read short first, then long.', 'Teach one pattern per day: a_e Monday, i_e Tuesday, o_e Wednesday, mixed review Thursday-Friday.', 'Write one sentence per day using a long vowel word: "I ride the bike."'],
    rescue: 'If child reads every vowel as short, exaggerate mouth shape and stretch the long sound once before blending the whole word.',
    outcomes: ['Child can read at least six long-vowel words with magic-e patterns.', 'Child can explain that final e is silent but changes the vowel.', 'Child can read mixed short and long vowel lines with fewer errors.'],
    parentQuestions: ['Do I teach all long vowel patterns in one week? No, one pattern at a time is more realistic.', 'My child says the final e. Remind: "Final e is quiet, vowel speaks."']
  },
  'week-5-phonics-r-controlled': {
    heading: 'Real-world action plan: bossy-r practice that sticks',
    context: 'R-controlled vowels are easier when grouped by sound families and revisited through sentence reading and dictation.',
    routine: ['Day 1-2: AR family (car, star, farm, park) with a 2-minute picture sort.', 'Day 3-4: OR family (fork, corn, storm, short) in quick read-and-point games.', 'Day 5-7: ER/IR/UR mixed set (her, bird, turn, fur) plus one dictation sentence daily.'],
    rescue: 'If your child collapses all r-vowels into one sound, split practice by family and avoid mixed lists for two days.',
    outcomes: ['Child correctly sorts words into AR, OR, and ER/IR/UR groups.', 'Child reads one sentence per r-controlled family.', 'Child spells at least four r-controlled words correctly in dictation.'],
    parentQuestions: ['Should I teach er/ir/ur separately first? Yes, but combine later because they sound similar.', 'My child reads car as cah. Model slowly: /c/ /ar/ and repeat in short phrases.']
  },
  'week-6-phonics-comprehension': {
    heading: 'Real-world action plan: connect decoding to understanding',
    context: 'Children must decode and comprehend together. Keep text decodable but always ask one meaning question after each line.',
    routine: ['Read 4-6 decodable sentences and ask one who/what question after each.', 'Use "retell in 10 words" challenge to keep recall simple.', 'End with one sentence drawing: child draws and labels the key event.'],
    rescue: 'If your child reads accurately but cannot answer, shorten text and ask questions immediately after each sentence, not at the end.',
    outcomes: ['Child answers who/what questions from short decodable text.', 'Child gives a simple beginning-middle-end retell for a tiny passage.', 'Child connects at least one decoded word to meaning in context.'],
    parentQuestions: ['Should comprehension wait until fluent reading? No, comprehension starts from first decodable texts.', 'What if my child answers in one word? Accept one word first, then model a full-sentence answer.']
  },
  'week-7-grammar-nouns-to-paragraphs': {
    heading: 'Real-world action plan: build grammar through sentence construction',
    context: 'Children need a visible ladder: naming word -> who + did what sentence -> one added detail -> sentence combining -> short paragraph. The routine works best when children say ideas first and write second.',
    routine: ['Day 1-2: Noun hunt plus verb charades, then build one who + did what sentence from a picture or daily-life scene.', 'Day 3-4: Add where/when details and combine two short sentences with and, because, or so.', 'Day 5-7: Use a 4-sentence frame: topic sentence, two details, closer. Draw first if writing still feels heavy.'],
    rescue: 'If your child freezes when writing, switch to oral storytelling, scribe one sentence, and ask for one gentle fix only: capital, full stop, or a stronger verb.',
    outcomes: ['Child builds a clear who + did what sentence with less prompting.', 'Child adds one useful detail without creating a run-on.', 'Child writes 3-4 linked sentences on one topic and reads them aloud with confidence.'],
    parentQuestions: ['Should grammar drills be separate from writing? No. Grammar transfers better when it is taught inside sentence building and short writing tasks.', 'My child can speak but cannot write. What should I do? Start with oral rehearsal, scribe one line, then move into copying or writing the next sentence.']
  },
  'week-8-grammar-tenses': {
    heading: 'Real-world action plan: tense control using daily life',
    context: 'Tenses are easiest when anchored to yesterday, today, and tomorrow events from the childs routine.',
    routine: ['Use 3 sticky notes daily: Yesterday I played. Today I play. Tomorrow I will play.', 'Practice 5 verb triples: eat/ate/will eat, go/went/will go, read/read/will read.', 'Do a 60-second evening recap in all three time forms.'],
    rescue: 'If your child mixes tense forms, reduce to one verb family at a time and repeat with gesture cues for past/present/future.',
    outcomes: ['Child chooses correct tense in short spoken and written lines.', 'Child writes one three-sentence timeline (past, present, future).', 'Child reduces random tense switching in paragraph tasks.'],
    parentQuestions: ['Do irregular verbs need separate practice? Yes, keep a small weekly list and recycle often.', 'Should I correct every tense error? Correct one pattern per day to avoid overload.']
  },
  'week-9-grammar-conjunctions': {
    heading: 'Real-world action plan: conjunctions for clearer ideas',
    context: 'Children overuse "and" unless parents explicitly model different conjunction jobs: addition, contrast, reason.',
    routine: ['Teach one connector per day with a hand signal: and (add), but (contrast), because (reason).', 'Run "sentence combine" drills: merge two short lines into one better line.', 'Do a dinner-table challenge: each person says one because sentence.'],
    rescue: 'If sentences become very long and confusing, go back to two short sentences and combine only once.',
    outcomes: ['Child uses and, but, because correctly in separate examples.', 'Child combines at least three sentence pairs without losing meaning.', 'Child starts explaining reasons in writing, not just listing facts.'],
    parentQuestions: ['Can I teach more connectors now? Add so and although only after and/but/because are stable.', 'My child forgets punctuation in long lines. Add comma practice only after idea clarity improves.']
  },
  'week-10-grammar-subject-verb': {
    heading: 'Real-world action plan: fix subject-verb agreement errors',
    context: 'Agreement improves when children hear and compare pairs aloud: "He runs" versus "They run".',
    routine: ['Read pair cards daily: He runs/They run, She has/They have, It is/They are.', 'Use action game: parent says subject, child says correct verb form while acting it.', 'Write 5 short lines using mixed singular and plural subjects.'],
    rescue: 'If errors persist, isolate one pattern per day (is/are or has/have) and postpone less common patterns.',
    outcomes: ['Child self-corrects common is/are and has/have mistakes.', 'Child writes mixed singular/plural sentence sets accurately.', 'Child reads own writing aloud and notices agreement issues.'],
    parentQuestions: ['Should I teach grammar terms first? No, pattern practice comes before terminology.', 'My child says correct form but writes wrong form. Add quick dictation after oral drills.']
  },
  'week-11-grammar-creative-writing': {
    heading: 'Real-world action plan: creative writing with support rails',
    context: 'Creativity grows faster when structure is provided. Use prompt + planning frame + short drafting window.',
    routine: ['Use one prompt card daily: who, where, problem, ending.', 'Draft in 8 minutes with a four-sentence frame, then edit one target only.', 'Read the piece aloud and ask the child to improve one line with a stronger verb.'],
    rescue: 'If your child says "I have no idea," offer two prompt choices and start with oral storytelling before writing.',
    outcomes: ['Child writes a coherent 4-6 sentence mini story.', 'Child adds at least one descriptive word and one dialogue or feeling line.', 'Child can edit one clear target (capital, punctuation, or verb choice).'],
    parentQuestions: ['Should spelling mistakes stop story flow? No, keep drafting and edit spelling later.', 'How do I avoid perfection pressure? Time-box writing and celebrate idea quality first.']
  },
  'week-12-speaking-confidence-seeds': {
    heading: 'Real-world action plan: build speaking confidence through safe repetition',
    context: 'Speaking confidence grows when children practise short, predictable talk steps with one calm listener before they face a bigger audience.',
    routine: ['Run a 10-15 minute routine: warm-up, 15-60 second spotlight, one voice tool game, praise plus one retry.', 'Use a bravery ladder: one word -> one sentence -> two sentences -> one trusted listener -> small group or voice note.', 'Let multilingual children plan ideas in a home language first, then shape one English sentence together.'],
    rescue: 'If your child avoids speaking, shrink the step first: whispering counts, audio-only is allowed, and one sentence is enough for a successful session.',
    outcomes: ['Child starts speaking faster and with less avoidance than on day one.', 'Child can give one complete sentence or short retell with more calm.', 'Child tolerates one gentle fix after speaking without shutting down.'],
    parentQuestions: ['Do memorized speeches help beginners? Usually no. Structured prompts and retell practice are safer than heavy memorisation at the start.', 'How many speaking sessions per week? Five or more short sessions are usually better than one long practice block.']
  },
  'week-13-speaking-structure': {
    heading: 'Real-world action plan: teach hook-body-close structure',
    context: 'Children sound confident when they know where to start, what to say next, and how to end.',
    routine: ['Use 3-card format: hook, two body points, close.', 'Practice one-minute talks on familiar topics using this structure daily.', 'Record once, replay once, and ask child to self-rate clarity from 1 to 3.'],
    rescue: 'If speech feels robotic, keep the structure but allow free wording instead of memorized sentences.',
    outcomes: ['Child uses opening, body, and closing in order.', 'Child includes two relevant supporting details.', 'Child ends with a complete closing line instead of trailing off.'],
    parentQuestions: ['Should I give full scripts? Give bullet points only, then let child phrase naturally.', 'My child rushes through the speech. Add pause marks between sections during rehearsal.']
  },
  'week-14-speaking-visual-aids': {
    heading: 'Real-world action plan: visual aids that support speech',
    context: 'Visuals should clarify one key idea, not distract. One prop or one slide is enough for beginners.',
    routine: ['Pick one object per talk (book, toy, chart) and explain why it matters.', 'Use "show, explain, connect" pattern: show item, explain detail, connect to message.', 'Practice pointing and looking back at audience, not only at the visual.'],
    rescue: 'If child depends on the prop too much, hide it for final 15 seconds and ask for verbal summary.',
    outcomes: ['Child uses one visual aid naturally during a short talk.', 'Child maintains audience eye contact between visual references.', 'Child explains the visual in clear, complete sentences.'],
    parentQuestions: ['Do slides help younger kids? Usually a physical object works better than slides for early speakers.', 'What if visual fails online? Teach a backup no-visual version of the same talk.']
  },
  'week-15-speaking-debate-starters': {
    heading: 'Real-world action plan: beginner debate without argument stress',
    context: 'Debate skills start with respectful disagreement and simple evidence, not competitive pressure.',
    routine: ['Use one child-friendly motion daily: homework time, screen limits, uniforms.', 'Teach CER mini-frame: claim, reason, example in 45-60 seconds.', 'Run role-swap rounds where child argues both sides once.'],
    rescue: 'If debates become emotional, pause and switch to sentence stems: "I think... because..." and "I understand... but..."',
    outcomes: ['Child states a clear position in one sentence.', 'Child supports opinion with at least one reason and example.', 'Child listens and responds politely to a different view.'],
    parentQuestions: ['Should I correct content opinions? Focus on reasoning quality and tone, not agreement.', 'My child repeats one point. Ask for one new reason before ending the round.']
  },
  'week-16-phonics-summer-plan': {
    heading: 'Real-world action plan: summer phonics without learning loss',
    context: 'A light, repeatable summer routine protects reading accuracy and confidence better than irregular intensive sessions.',
    routine: ['Follow 4-day cycle: sound review, blending, decodable reading, spelling dictation.', 'Use travel-friendly materials: 20 word cards, one notebook, one timer.', 'Keep a weekly scorecard: words read correctly, words spelled correctly, confidence level.'],
    rescue: 'If routine breaks during travel, run a 5-minute oral-only session in car or at bedtime and resume full practice next day.',
    outcomes: ['Child maintains reading level across holiday weeks.', 'Child retains core phonics patterns already taught.', 'Parent can identify exactly which pattern needs revision after breaks.'],
    parentQuestions: ['Can I skip practice on vacation? Skip occasionally, but keep at least 4 sessions per week.', 'What is minimum summer workload? Ten minutes daily or 40-50 minutes spread across the week.']
  },
  'week-17-grammar-assessment': {
    heading: 'Real-world action plan: low-stress grammar assessment at home',
    context: 'Assessment should guide next teaching steps, not label the child. Keep checks short and skill-specific.',
    routine: ['Run three 5-minute checks: sentence correction, tense usage, and punctuation application.', 'Mark with a simple rubric: green (secure), amber (needs practice), red (reteach).', 'Choose only two amber/red targets for next week to avoid overload.'],
    rescue: 'If child gets anxious, call it a "checkpoint game," allow oral answers first, then convert to writing.',
    outcomes: ['Parent gets a clear map of strengths and gaps.', 'Child understands one to two priority targets for next week.', 'Practice plan is based on evidence, not guesswork.'],
    parentQuestions: ['How often should I assess? Light weekly checks and a deeper check once every 4 weeks.', 'Should I compare siblings? No, compare each child to their own previous baseline.']
  },
  'week-18-speaking-video-feedback': {
    heading: 'Real-world action plan: use video feedback without pressure',
    context: 'Short recordings help children notice posture, voice, and pacing quickly when feedback stays specific and kind.',
    routine: ['Record 30-60 second talks on phone using one topic and one retake max.', 'Review with a 3-point checklist: voice clear, eye contact, full ending line.', 'Set one improvement target per recording and re-record after 24 hours.'],
    rescue: 'If child dislikes seeing themselves on video, play audio first, discuss positives, then show only first 10 seconds.',
    outcomes: ['Child identifies one personal speaking strength independently.', 'Child improves one measurable speaking behavior across two recordings.', 'Parent feedback becomes specific instead of general praise.'],
    parentQuestions: ['How many recordings per week? Two or three are enough for progress.', 'Should mistakes be edited out? No, raw recordings are useful for authentic self-review.']
  },
  'week-19-phonics-multisyllabic': {
    heading: 'Real-world action plan: multisyllabic decoding step by step',
    context: 'Long-word reading improves when children learn syllable chunking and stress patterns before speed.',
    routine: ['Teach clap-and-chunk with words like sunset, rabbit, picnic, market.', 'Mark syllable splits visually and blend chunks: sun-set, pic-nic, mar-ket.', 'Add one 2-3 syllable word to each decodable reading session.'],
    rescue: 'If child guesses long words, cover ending, decode first chunk, then reveal next chunk and blend.',
    outcomes: ['Child decodes familiar two-syllable words without panic.', 'Child uses chunking strategy independently on new words.', 'Child reads short passages with fewer breakdowns on longer words.'],
    parentQuestions: ['Should I teach syllable rules all at once? No, start with closed syllables and compound words first.', 'My child reads chunks but misses meaning. Ask for quick meaning check after decoding.']
  },
  'week-20-grammar-editing-camp': {
    heading: 'Real-world action plan: editing skills children can transfer to school writing',
    context: 'Editing should be a routine skill. Use one clear checklist so children know what to scan first.',
    routine: ['Use COPS order daily: Capitals, Organization, Punctuation, Spelling.', 'Edit one short paragraph together with colored pens for each error type.', 'Have child do final read-aloud to catch missing words or awkward phrasing.'],
    rescue: 'If editing feels overwhelming, cut paragraph length in half and fix only one category per pass.',
    outcomes: ['Child independently checks capitals and full stops first.', 'Child can find and fix at least three errors in a short paragraph.', 'Child begins submitting cleaner writing at school.'],
    parentQuestions: ['Is editing before drafting okay? No, draft first, edit second for smoother writing flow.', 'How do I stop over-correction? Limit parent corrections to one teachable pattern each day.']
  },
  'week-21-speaking-competition-prep': {
    heading: 'Real-world action plan: competition prep with calm confidence',
    context: 'Competition success comes from stable routines: script clarity, timed rehearsal, and confidence management.',
    routine: ['Break speech into sections and rehearse with timer in 45-second chunks.', 'Practice stage entry, pause, and opening line separately every day.', 'Run two mock rounds with family judging on clarity, structure, and confidence.'],
    rescue: 'If performance anxiety spikes, shorten speech by 20 percent, add breathing reset, and prioritize clean delivery over complexity.',
    outcomes: ['Child delivers full speech within time limit.', 'Child uses planned pauses and clear transitions.', 'Child handles one unexpected interruption and restarts calmly.'],
    parentQuestions: ['Should child memorize word for word? Use cue cards and section memory to reduce blanking risk.', 'How close to event should rehearsals stop? Do light rehearsal day before, no heavy drilling.']
  },
  'week-22-phonics-diagnostics': {
    heading: 'Real-world action plan: diagnostics that lead to targeted fixes',
    context: 'Diagnostics are useful only when they produce a specific reteach plan with measurable goals.',
    routine: ['Check 5 domains: sound recall, blending, decoding, spelling, and connected reading.', 'Log error patterns by type, such as vowel confusion or skipped blends.', 'Create 7-day reteach plan focused on top two error patterns only.'],
    rescue: 'If too many gaps appear, start with foundation errors first because advanced errors usually improve after base repair.',
    outcomes: ['Parent can name exact weak patterns, not just "reading is weak."', 'Child receives focused reteach tasks matched to real errors.', 'Progress can be rechecked after one week with clear metrics.'],
    parentQuestions: ['Should diagnostics be timed? Start untimed, then add light timing only after accuracy stabilizes.', 'Can I diagnose through homework only? No, include oral reading to catch hidden decoding issues.']
  },
  'week-23-grammar-speaking-bridge': {
    heading: 'Real-world action plan: turn grammar knowledge into spoken fluency',
    context: 'Children often know grammar in notebooks but not in speech. Bridge tasks make grammar usable in conversation.',
    routine: ['Take one written sentence and ask child to say it three ways: simple, expanded, and with reason.', 'Use daily retell task where child must include target grammar pattern.', 'Record a 45-second explanation and check for grammar target usage.'],
    rescue: 'If spoken grammar collapses under pressure, reduce speaking length and focus on one target form per talk.',
    outcomes: ['Child applies grammar targets during spontaneous speaking.', 'Child produces cleaner sentence forms in both speech and writing.', 'Parent sees transfer from worksheet accuracy to real communication.'],
    parentQuestions: ['Should spoken errors be corrected immediately? Correct after child finishes to preserve confidence.', 'How do I make transfer visible? Track one grammar target across writing and speaking samples weekly.']
  },
  'week-24-speaking-family-showcase': {
    heading: 'Real-world action plan: family showcase that feels safe and joyful',
    context: 'A predictable showcase routine helps children practice speaking for real audiences without fear.',
    routine: ['Plan 2-minute performances with one fixed order and one timekeeper.', 'Rehearse opening and closing lines on two separate days before event night.', 'After each child, give one specific appreciation and one optional next step.'],
    rescue: 'If a child refuses to perform, allow partner speaking with parent first, then invite solo attempt later.',
    outcomes: ['Child completes a short presentation for family audience.', 'Child experiences speaking as celebration, not correction.', 'Parent establishes monthly showcase rhythm with minimal setup.'],
    parentQuestions: ['Should guests give corrections? No, showcase night is for encouragement; coaching comes next day.', 'What if siblings compete for attention? Set clear turns and praise different strengths per child.']
  },
  'week-25-back-to-school-plan': {
    heading: 'Research-backed action plan: sustainable back-to-school reset',
    context: 'The target is measurable recovery, not cramming. Use short, consistent routines with visible metrics across phonics, grammar, and speaking.',
    routine: ['Run a 3-track week: decoding/reading, grammar/writing, and speaking; rotate these predictably across days.', 'Keep each session to 10-15 minutes, and record one data point (accuracy or confidence) per session.', 'Use end-of-week comparison to Day 0 baseline before increasing difficulty.'],
    rescue: 'If routines break due to school load, use 5-minute minimum sessions for 3 days, then return to full routine with the same baseline target.',
    outcomes: ['Child restarts school with stronger decoding confidence and lower task resistance.', 'Parent has a repeatable, low-friction routine that fits weekday constraints.', 'Teacher communication becomes evidence-based with clear progress notes.'],
    parentQuestions: ['Should I push harder in Week 1? No. Keep challenge moderate and prioritize consistency.', 'How do I verify progress? Compare Day 0 and Day 7 data on accuracy, fluency smoothness, and speaking organization.']
  },
  'week-26-screen-smart-summer-routine': {
    heading: 'Real-world action plan: reduce passive screens with a predictable summer rhythm',
    context: 'Parents get better cooperation when learning comes in short fixed blocks, followed by planned leisure screen time.',
    routine: ['Set one fixed 10-minute slot daily before passive screen use.', 'Run a simple flow: phonics warm-up, short reading, one grammar task, one speaking recap.', 'Use a visible tracker for 5 days each week and celebrate consistency, not perfection.'],
    rescue: 'If resistance is high, cut to a 5-minute minimum for two days, then return to the full 10-minute flow once cooperation improves.',
    outcomes: ['Child transitions to screen time with fewer daily arguments.', 'Child maintains reading and language practice during summer break.', 'Parent follows a repeatable routine without decision fatigue.'],
    parentQuestions: ['Should I ban all screens to reset habits? No, replace passive time gradually with structured active blocks.', 'What if both parents are busy? Keep one non-negotiable 10-minute learning touchpoint and protect it daily.']
  },
  'week-27-prevent-summer-slide-reading': {
    heading: 'Real-world action plan: stop summer slide with a 10-minute reading loop',
    context: 'Children hold reading gains when decoding and comprehension are revisited in short, consistent daily sessions.',
    routine: ['Do 2 minutes of phonics or word-pattern review before reading.', 'Read one short passage aloud and ask one meaning question immediately.', 'Close with a one-sentence write or 30-second spoken summary to reinforce transfer.'],
    rescue: 'If reading breaks down, reduce text level, reread easier lines for success, and rebuild difficulty gradually over 3-4 days.',
    outcomes: ['Child maintains reading fluency through April-June.', 'Child shows stronger decoding confidence on unfamiliar words.', 'Parent can spot progress early with a simple weekly check.'],
    parentQuestions: ['Is 10 minutes really enough? Yes, when done daily with a clear structure.', 'Should we do only reading in summer? No, include brief grammar and speaking transfer for stronger retention.']
  }
};

function buildWeeklyPlaybookBlocks(playbook: WeeklyPlaybook): BlogBlock[] {
  const routineBlocks = playbook.routine.map((content): BlogBlock => ({
    type: 'li',
    content
  }));
  const outcomeBlocks = playbook.outcomes.map((content): BlogBlock => ({
    type: 'li',
    content
  }));
  const questionBlocks = playbook.parentQuestions.map((content): BlogBlock => ({
    type: 'li',
    content
  }));
  return [{
    type: 'h2',
    content: playbook.heading
  }, {
    type: 'p',
    content: playbook.context
  }, {
    type: 'h3',
    content: '10-minute at-home routine (realistic for busy parents)'
  }, ...routineBlocks, {
    type: 'h3',
    content: 'If your child gets stuck'
  }, {
    type: 'p',
    content: playbook.rescue
  }, {
    type: 'h3',
    content: 'End-of-week success signs'
  }, ...outcomeBlocks, {
    type: 'h3',
    content: 'Parents also ask this week'
  }, ...questionBlocks];
}

function enrichWeekPost(post: BlogPost): BlogPost {
  if (!/^week-\d+-/.test(post.slug)) return post;
  let body = post.body;
  const hasGuide = body.some(b => b.type === 'h2' && b.content === 'Parent guide: how to use this weekly plan in real life');
  if (!hasGuide) {
    body = [...body, ...WEEKLY_PARENT_GUIDE_BLOCKS];
  }
  const hasResearchBasis = body.some(b => b.type === 'h2' && b.content === 'Research basis: why this weekly plan works');
  if (!hasResearchBasis) {
    body = [...body, ...WEEKLY_RESEARCH_BASIS_BLOCKS];
  }
  const hasTinyStepsStandard = body.some(b => b.type === 'h2' && b.content === 'Tiny Steps quality standard for this week');
  if (!hasTinyStepsStandard) {
    body = [...body, ...WEEKLY_TINY_STEPS_STANDARD_BLOCKS];
  }
  const playbook = WEEKLY_REAL_WORLD_PLAYBOOKS[post.slug];
  if (playbook) {
    const playbookBlocks = buildWeeklyPlaybookBlocks(playbook);
    const playbookHeading = playbookBlocks.find(b => b.type === 'h2')?.content;
    const hasPlaybook = !!playbookHeading && body.some(b => b.type === 'h2' && b.content === playbookHeading);
    if (!hasPlaybook) {
      body = [...body, ...playbookBlocks];
    }
  }
  return {
    ...post,
    faq: post.faq?.length ? post.faq : WEEKLY_DEFAULT_FAQ,
    body
  };
}

export { enrichWeekPost };
