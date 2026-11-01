# Team page — founder plus teachers (photo-first publication)

Decision: Founder and Teachers are the only two people-facing layers. Teacher training, class-quality reviews, curriculum and academic support are **process descriptions**, not extra staff tiers. This replaces the earlier multi-tier teacher-photo layout proposed in draft PR #814; do not merge that older structure unchanged.

## Images to upload

Use the existing GitHub folder **\`public/team/\`**. These images are public once published; upload only portraits with each person's permission to show their name and photograph.

| Who | Filename | Preferred resolution | Crop | WebP target |
| --- | --- | --- | --- | --- |
| Founder | \`Founder.webp\` | **1200 × 1500 px** | 4:5 portrait, centred upper face | ideally ≤ 300 KB |
| Every teacher | \`First Last.webp\` (e.g. \`Nashra Khan.webp\`) | **960 × 1200 px** | 4:5 portrait, similar backgrounds | ideally 80–200 KB |

- Use **exactly** \`Founder.webp\` (capital F); the original public founder image is used until that file is uploaded. This filename **never** becomes a teacher card. The founder's published **name and academic profile** remain unchanged.
- For teacher names, use the actual preferred public name: \`Ayesha Farooq.webp\`, \`Javeria-Ahmed.webp\` or \`Nashra_Khan.webp\`. Dashes and underscores become spaces. Only the **name** appears beneath each portrait—no individual title, degree, experience or claimed certification.
- Use consistent background, lighting, camera distance and head/shoulders placement. Keep the face in the upper half to work both as a portrait and in founder square crops. Do not include logos, certificates, contact details or children.
- The teacher gallery title is **Early Years & Primary English Educators**. It is a broad teaching focus, **not** an IB Primary Years Programme (PYP) certification or school affiliation. The collective copy says the educators are graduates based on the owner's confirmation, but makes **no individual credential claim**.
- The website build scans \`public/team/\` for valid \`.webp\` files (no HR or private Firestore sync) and embeds a deterministic list of public image URLs. Add/remove images via a Git commit and deployment. During local \`npm run dev\`, restart the Vite server after adding files; a production build reads the folder automatically.
- A public filename (and displayed name) is not identity verification. Ensure the name/image pairing is correct and publication approval exists before uploading.
- Avoid publishing duplicate names, fake placeholder portraits, non-WebP images and filenames such as \`teacher-01.webp\`.

## Teaching standards

The Team page describes teacher review, structured lesson preparation, selected-lesson/recording academic audits, professional expectations, feedback and coaching. This is an **internal educational quality process**, not an external accreditation badge, a guarantee that all lessons are audited, or a claim that all teachers hold IB PYP certificates.

## Safe release and review

Run the photo-manifest Node test, TypeScript, build/prerender, route/canonical and mobile tests. Check the generated \`dist/team/index.html\` and uploaded image paths. Existing marketing course pages, canonical URLs, prices and Firestore are unchanged. Draft PR #814 has unrelated pending scope and must be reconciled rather than merged wholesale.
