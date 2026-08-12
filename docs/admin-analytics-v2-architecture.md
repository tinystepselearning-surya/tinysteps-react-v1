# Admin Analytics V2 Architecture

## Purpose

Admin Analytics is a management surface, not an operational work queue. Its job is to answer four questions quickly:

1. Are we growing?
2. Are we converting?
3. Are we collecting?
4. What requires management attention?

Operational actions remain in their dedicated workspaces (Leads & Enquiries, Parent Payments, Teacher Payments, Sessions, Attendance Corrections, etc.). Analytics provides the overview, diagnosis, and drill-down path.

## External design and analytics references

The V2 information architecture was benchmarked against current guidance and product patterns from:

- IBM Carbon Design System dashboard guidance: establish a strong hierarchy, show the current KPI state first, and use drill-down for deeper exploration.
- Microsoft Power BI dashboard design guidance: keep the dashboard clean and uncluttered, place the most important information first, avoid mixing incompatible time frames, and use overview tiles as a path into deeper reports.
- IBM Carbon data-table guidance: tables are for task-oriented detailed data; use predictable toolbars, sorting/filtering, and pagination rather than turning the executive overview into a spreadsheet.
- Amplitude funnel analytics guidance: a funnel should represent a defined ordered critical path; operational states that are not sequential milestones should not be presented as funnel stages.
- Moodle learning-analytics framing: distinguish descriptive reporting (what happened) from analytics that helps decision-makers understand what needs attention and what action to take next.
- WCAG 2.2 / WAI guidance: keyboard focus must remain visible and unobscured; controls, tables, charts, and status changes need accessible labels and non-colour-only meaning.

Reference URLs reviewed for this design:

- https://carbondesignsystem.com/data-visualization/dashboards/
- https://carbondesignsystem.com/components/data-table/usage/
- https://carbondesignsystem.com/components/data-table/accessibility/
- https://learn.microsoft.com/en-us/power-bi/create-reports/service-dashboards-design-tips
- https://amplitude.com/docs/analytics/charts/funnel-analysis/funnel-analysis-build
- https://amplitude.com/docs/analytics/charts/funnel-analysis/funnel-analysis-interpret
- https://docs.moodle.org/405/en/Reports_FAQ
- https://www.w3.org/TR/WCAG22/

## Information architecture

Analytics is divided into six management views.

### 1. Overview

The default view should fit the most important business state into a compact management surface:

- billed revenue
- collected payments
- collection rate
- balance due
- completed billed sessions
- lead-to-admission funnel summary
- management attention / exceptions
- concise route to the relevant drill-down

The Overview deliberately excludes large operational tables.

### 2. Growth & Admissions

- Lead Received -> Demo Created -> Demo Completed -> Enrolled
- stage conversion rates
- event trend
- source-level conversion
- demo workload snapshot

Primary funnel grain is **lead**. Demo workload is explicitly marked as **demo-record** grain.

### 3. Acquisition

- attribution coverage
- acquisition-channel performance
- first landing pages
- reached-demo and admitted rates

The selected reporting month is inherited from the Analytics header so managers do not have to reconcile a 30-day marketing number with a month-to-date funnel number on the same screen.

### 4. Finance

Separate actual performance from forecast:

**Actual**
- billed
- collected
- balance due
- collection rate
- completed billed sessions

**Forecast / planned**
- scheduled sessions
- remaining scheduled sessions
- full-month scheduled revenue
- projected teacher payout

Actual and forecast values must never be styled as if they are the same measurement.

### 5. Delivery

- student / enrollment footprint
- active-like vs past enrollments
- scheduled and remaining sessions
- data needed to understand delivery capacity

Inventory statistics such as total users and total courses are not executive KPIs and should not dominate the management overview.

### 6. Teachers

- teacher payout exposure
- session earnings
- demo earnings
- net session economics
- detailed teacher earnings table

The detailed table belongs here at full width rather than occupying half of the executive dashboard.

## Reporting-period contract

The management header owns the selected month.

For a selected month:

- Finance uses that exact `monthKey`.
- Funnel cohort starts on the first day of the selected month.
- For the current month, funnel/acquisition end at the current IST date so future zero days are not charted.
- For a past month, funnel/acquisition use the full calendar month.
- Marketing attribution uses the same start and end boundaries as the management funnel.
- Business timezone is `Asia/Kolkata`.

Live operational demo workload is intentionally independent of the historical cohort and is explicitly labelled live / demo-record grain.

## Metric-grain contract

Every metric must have an explicit grain.

| Metric family | Grain |
|---|---|
| Lead received / demo milestone / completed milestone / enrolled milestone | Lead |
| Demo awaiting assignment / assigned / completed decision pending / cancelled | Demo record |
| Billing / collections | Financial transaction / charge |
| Session delivery | Session |
| Teacher earnings | Teacher earning entry rolled up to teacher |
| Enrollment health | Enrollment |

Never force two legitimate counts to match when they represent different grains.

## Funnel contract

The executive conversion funnel is strictly:

`Leads Received -> Demo Created -> Demo Completed -> Enrolled`

`Assigned` and `Cancelled` are operational states, not primary sequential funnel milestones.

Conversion rates must use the same lead cohort and safe zero-denominator handling.

## Visual hierarchy

1. One management title + reporting-period control.
2. One compact section-navigation row.
3. A small number of high-value KPIs.
4. Management attention before deep detail.
5. Drill-down analytics after the summary.
6. Detailed tables only in the relevant specialist view.

Use colour semantically and sparingly. Most surfaces should remain neutral; colour supports meaning rather than decorating every card.

## Data-health contract

The header exposes one clear status:

- Loading
- Healthy
- Attention required

Errors must not silently fall back to believable zeroes. Previous-period values are cleared before a new period is loaded, preserving the stale-data protection added before V2.

## Performance contract

- Month-scoped finance reads remain scoped by `monthKey` / selected dates.
- Heavy user/enrollment/course reads remain lazy and are loaded only when a view actually requires them.
- Lead/demo live subscriptions are mounted only in Overview or Growth, not permanently across every Analytics view.
- Detailed teacher tables are rendered only in the Teachers view.

### Future scale path

Operational Firestore collections remain the source of truth. If volume grows enough to make client aggregation expensive, introduce read-optimized daily/monthly aggregate documents (for example `analyticsDaily/{date}` and `analyticsMonthly/{month}`) with scheduled reconciliation and rebuild tooling. Aggregates must never become a second authoritative business ledger.

## Accessibility contract

- section navigation is keyboard operable and exposes current state with `aria-pressed`
- reporting-period control has an accessible label
- chart containers have textual context / accessible names
- live/error states use text in addition to colour
- tables preserve semantic headers
- focus styles are not removed
- responsive layouts do not hide required actions or obscure focused controls

## Acceptance criteria

- Default Overview is materially shorter and easier to scan than the previous all-in-one page.
- No management metric is duplicated at equal visual weight on the same view.
- Funnel and attribution default to the same selected-month period.
- Actual finance and forecast finance are visually separated.
- Teacher earnings table is full-width in Teachers view.
- Admin Overview no longer presents total users/courses as top-level management KPIs.
- Existing stale-month protections, finance calculations, lead cohort semantics, and data-grain safeguards remain intact.
- Existing operational pages are unchanged.
- Tests cover navigation, period propagation, stale-data protection, and data-grain semantics.
