# Tiny Steps Learning — faculty photo and profile publishing guide

Branch/PR: `fix/public-identity-pricing-teacher-trust-20261027` / #814
Status: **design and data slots ready; no unverified individuals auto-published.**

## File storage and required names

Upload approved images to **`public/images/team/`**, except the existing founder photo which is already at `public/priya-founder-tiny-steps-learning.webp`. The web URL is the file path without `public`.

| Level | Role / image | File to upload | Publication |
| --- | --- | --- | --- |
| 1 | Founder Priya | `public/priya-founder-tiny-steps-learning.webp` | Existing approved photo; do not replace automatically |
| 1 | Additional academic leadership person | `public/images/team/level1-academic-lead.webp` | After name/credentials/consent |
| 2 | Phonics & Reading trainer | `public/images/team/level2-trainer-phonics-reading.webp` | After name/credentials/consent |
| 2 | Grammar & Public Speaking trainer | `public/images/team/level2-trainer-grammar-speaking.webp` | After name/credentials/consent |
| 2 | Child Pedagogy & Learning Methods trainer | `public/images/team/level2-trainer-child-pedagogy.webp` | After name/credentials/consent |
| 2 | Teaching Techniques & Classroom Quality trainer (optional fourth) | `public/images/team/level2-trainer-teaching-quality.webp` | Only if confirmed as a distinct trainer |
| 3 | Teacher 01 | `public/images/team/level3-teacher-01.webp` | After approved profile |
| 3 | Teacher 02, 03, etc. | `public/images/team/level3-teacher-02.webp`, `level3-teacher-03.webp`, etc. | Continue numbering for each *unique person* regardless of number of specialisms |
| 4 | Academic quality / teacher-review photograph (optional) | `public/images/team/level4-academic-quality.webp` | Only when photographed people approve; no child private data |

**No fake names or empty profile cards:** The public arrays are empty until publication review; the Team page shows accurate programme and training information in the meantime.

## Profile details to provide per person

- Public display name and approved role / position.
- Verified educational qualifications (degree subject and granting institution if approved), with optional relevant teaching certifications **separately from** Tiny Steps internal training.
- Accurate teaching experience (years and roles, if verifiable) and subject specialisms.
- Associated approved image filename.
- Written permission to publish the name, portrait, experience, qualifications and role.
- If claiming internal certification: completion/assessment record, date, standard and authorised reviewer. Use `completed` or `assessed-and-certified` only when documentary evidence supports it.

## Entering profiles — current source of truth

Edit `src/pages/team/publicTeacherProfiles.ts`. There is **no public backend collection**, no new admin dashboard, and no automatic sync from authenticated teacher, user or HR records. This is deliberate for security and reliable copy review.

- `APPROVED_ACADEMIC_LEADERSHIP_PROFILES`: one additional academic leader, founder already presented separately.
- `APPROVED_PUBLIC_TRAINER_PROFILES`: three or four educators, depending on actual confirmed individuals. The four training areas do **not** assert four distinct trainers.
- `APPROVED_PUBLIC_TEACHER_PROFILES`: one record per unique teacher. Select `specialisms` from `phonics`, `grammar` and `public-speaking`. Multi-specialism teachers are discoverable under each appropriate course section.
- `APPROVED_ACADEMIC_QUALITY_PHOTOS`: optional photograph documenting academic review.

Sample (replace **all** sample fields with verified facts; do not copy this sample into production unchanged):

```ts
{
  id: 'teacher-01',
  publicName: '<approved name>',
  position: 'Phonics & Reading Educator',
  qualifications: ['<verified qualification>'],
  experienceSummary: '<verified experience summary>',
  photoPath: '/images/team/level3-teacher-01.webp',
  specialisms: ['phonics'],
  expertise: ['Blending', 'Decoding'],
  // Set only after verifying Tiny Steps' completed assessment:
  // internalTrainingStatus: 'assessed-and-certified',
  publicationApproved: true,
}
```

## Photo specification

- **Individual photos:** vertical 4:5 crop, ideally 800 × 1000 pixels, WebP, normally <= 200 KB.
- Natural, professional head-and-shoulders framing, consistent neutral/pastel backgrounds and lighting, no heavy filters or watermarks.
- **Level 4 photo:** horizontal 3:2 crop, ideally 1200 × 800 pixels, WebP, preferably <= 250 KB.
- Do not use children’s photographs, classrooms with identifiable children or private workplace records without specific approvals.
- Verify the actual uploaded file exists before adding a `photoPath`. Missing paths must not cause broken images on the published site.
- Preserve the founder portrait and current SEO identity identifiers unless a separately reviewed change is approved.

## Page links and anchors

| Course | Destination |
| --- | --- |
| /phonics and /group-phonics-classes-for-kids | /team#teachers-phonics |
| /grammar and /group-grammar-classes-for-kids | /team#teachers-grammar |
| /speaking and /group-public-speaking-classes-for-kids | /team#teachers-public-speaking |

The `FacultyTrustLink` component centralises these links. Every profile section exists even while the approved faculty roster is being populated. Neither course pages nor bios promise a particular teacher's availability.

## Release gate

1. Confirm the founder's currently published operating year, as required by PR #814.
2. Collect approved photos, names, credentials, positions, specialisms and public-display consent.
3. Populate only verified profiles, matching the exact filenames.
4. Run typecheck, relevant Vitest tests, build/prerender, rendered HTML/metadata checks and visual review for desktop/mobile.
5. Confirm that Teams, parent contact details, private educator and HR data are not exposed.
6. Keep PR #814 draft and unmerged until business review and checks pass.
