# B13 — Curriculum Authority Map

## Public hierarchy

| Parent/search question | Primary owner | Supporting route |
| --- | --- | --- |
| What does the full Tiny Steps learning journey look like? | `/curriculum` | `/courses` |
| Which course should my child start with? | `/courses` | `/book-demo` |
| Does my child need phonics support and how does that program work? | `/phonics` | phonics course pages |
| Does my child need grammar/sentence-formation support? | `/grammar` | grammar course pages |
| Does my child need communication/public-speaking support? | `/speaking` | speaking course pages |
| What is taught lesson by lesson in this exact level? | canonical course detail | `/curriculum` + matching program page |

## Canonical detailed course owners

### Phonics

- `/courses/phonics-foundation` — Phonics Foundations
- `/courses/phonics-brush-up` — Early Phonics
- `/courses/phonics-advanced` — Advanced Phonics

### Grammar

- `/courses/grammar` — Beginner Grammar
- `/courses/grammar-mastery` — Advanced Grammar

### Speaking & Communication

- `/courses/public-speaking-foundations` — Public Speaking Foundations
- `/courses/public-speaking-excellence` — Public Speaking Excellence

Legacy/internal aliases continue to resolve through the existing public-course registry and are not made into additional owners.

## Instructional sequence exposed by the roadmap

### Phonics

1. Hear and identify the target sound.
2. Connect the sound to its written grapheme.
3. Blend sounds into words.
4. Decode words with less prompting.
5. Apply decoding in sentences and connected reading.

### Grammar

1. Notice the word/sentence pattern.
2. Build a complete sentence.
3. Apply the grammar rule in meaningful context.
4. Find and correct errors.
5. Expand accurate sentences into longer spoken/written responses.

### Speaking

1. Listen and form an idea.
2. Respond in a complete sentence.
3. Add detail, reason, sequence, or example.
4. Organise the response for the task.
5. Deliver, receive feedback, and reflect.

## Internal-link expectations

### `/curriculum`

Must link to:

- `/phonics`
- `/grammar`
- `/speaking`
- all seven canonical detailed course pages
- `/courses`
- `/book-demo`

### Program pages

Each core program page must link to `/curriculum` as the full-roadmap owner.

### Canonical course pages

Each course page must link to:

- `/curriculum`
- its matching program page
- `/book-demo`

`/courses` remains available as the course comparison sibling, but it does not replace the roadmap hierarchy.

## Claims boundary

Allowed:

- transferable English skills;
- support for children studying in different school environments;
- references to CBSE, ICSE, IB, Cambridge or other curricula when describing learner backgrounds;
- independently documented Tiny Steps instructional sequences.

Avoid unless separately documented:

- `IB-aligned`;
- `Cambridge-aligned`;
- `IB PYP-aligned`;
- formal affiliation/accreditation language;
- certification claims not actually held.

## B13 URL rule

**Zero new indexable URLs.**

B13 clarifies hierarchy and content ownership on existing routes only.
