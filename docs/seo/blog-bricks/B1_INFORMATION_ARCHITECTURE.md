# Blog SEO Program — B1 Information Architecture

**Brick:** B1 — Content architecture & audience taxonomy  
**Frozen baseline:** `main@6ba6b988c0203e0641eb149bc18b9e6962f79cd7`  
**Branch:** `seo/blog-b01-information-architecture`  
**Redirect/canonical changes:** None

## Decision

The source editorial categories remain intact for compatibility, but every normalized blog post now receives two additional discovery fields:

- `audience`: `Parent` or `Schools & Research`
- `discoveryCategory`: `Phonics`, `Grammar`, `Speaking & Communication`, `Parent Guides`, or `Schools & Research`

This gives the UI a clean read model without prematurely rewriting URLs or article categories.

## Why this fixes the architecture problem

The current `/blog` experience calls itself a parent desk while newest-first Research posts can be institutional CBSE/NCF/teacher-training content. Category alone is not enough because the Research category also contains parent-facing authority content.

B1 therefore uses an explicit institutional slug set rather than assuming every Research article is for schools.

## Parent discovery lanes

- Phonics
- Grammar
- Speaking & Communication
- Parent Guides

`Public Speaking` and `English Communication` remain distinct source categories but share one parent-facing discovery lane. This removes the weak one-article English Communication shelf without destroying the underlying article taxonomy.

## Schools & Research lane

The following reviewed institutional pieces are routed to `Schools & Research` discovery metadata:

1. CBSE phonics curriculum vs systematic phonics programme
2. Does CBSE include phonics / NCF foundational literacy
3. How schools can assess decoding vs memorisation
4. International phonics benchmarks for Indian schools
5. Phonics scope and sequence for CBSE schools
6. Phonics teacher training for schools implementation
7. Systematic and cumulative phonics for schools
8. Why letter sounds are not enough to read

Parent-facing Research pieces such as `phonics-for-parents-guide` and `science-of-phonics-learning` remain in the parent discovery model.

## Scope boundary

B1 establishes the data architecture only. It deliberately does not redesign the `/blog` visuals or sticky filter; that presentation work belongs to B5. This prevents information-architecture decisions and visual refactoring from being mixed into one review branch.

## Validation

A focused unit test locks:

- school research classification;
- parent-facing Research classification;
- merged Speaking & Communication discovery;
- the reviewed institutional set.

## Completion gate

- [x] Parent and institutional audiences are separately represented in the content read model.
- [x] English Communication no longer requires its own discovery shelf.
- [x] Source categories/URLs are not destructively rewritten.
- [x] No redirects/canonicals are changed.
- [x] B5 can consume the new discovery fields during final integration.
