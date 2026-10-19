#!/usr/bin/env node
/**
 * TSSA-7/B1: build a source-derived, non-duplicated public content inventory.
 *
 * Read-only with respect to production. Run after the repository's existing
 * generator: node scripts/generate-rss.mjs
 *
 * Outputs are local audit artifacts, NOT instructions to index every route.
 * The complete on-site corpus includes intentionally noindex support routes.
 */
import { PUBLIC_ROUTE_MANIFEST, DYNAMIC_PUBLIC_ROUTE_INTENT_MANIFEST, PUBLIC_REDIRECT_MANIFEST } from '../src/lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../src/lib/routeSeoRegistry.js';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'artifacts', 'tssa7-b1');
const input = path.join(root, 'public', 'ai-resource-index.json');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const fail = (message) => { throw new Error('TSSA-7/B1 ' + message); };
const toPath = (absolute) => {
  const u = new URL(String(absolute || ''));
  if (u.origin !== 'https://tinystepslearning.com') fail('off-origin canonical ' + absolute);
  if (u.search || u.hash) fail('noncanonical query/fragment ' + absolute);
  return u.pathname;
};
const csvEscape = (value) => {
  let s = value == null ? '' : String(value);
  if (/^[=+@-]/.test(s)) s = "'" + s; // defend spreadsheet consumers against formula cells
  return '"' + s.replaceAll('"', '""') + '"';
};
const writeCsv = (name, columns, rows) => {
  const lines = [columns.join(','), ...rows.map((row) => columns.map((key) => csvEscape(row[key])).join(','))];
  fs.writeFileSync(path.join(outDir, name), lines.join('\n') + '\n', 'utf8');
};
const readCsv = (content) => {
  const records = []; let row = [], field = '', quoted = false;
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (quoted && char === '"' && content[i + 1] === '"') { field += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(field); field = ''; }
    else if ((char === '\r' || char === '\n') && !quoted) {
      if (char === '\r' && content[i+1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((cell) => cell.trim())) records.push(row);
      row = [];
    } else field += char;
  }
  if (quoted) fail('unclosed CSV quote');
  if (field || row.length) { row.push(field); records.push(row); }
  const [headers, ...values] = records;
  return values.map((cells) => Object.fromEntries(headers.map((column, index) => [column, cells[index] ?? ''])));
};

if (!fs.existsSync(input)) fail('generated public/ai-resource-index.json missing: first run node scripts/generate-rss.mjs');
fs.mkdirSync(outDir, { recursive: true });
const index = JSON.parse(fs.readFileSync(input, 'utf8'));
const families = [
  ['editorial_blogs', 'editorial-blog'],
  ['programmatic_phonics_guides', 'phonics-guide'],
  ['programmatic_grammar_guides', 'grammar-guide'],
  ['vocabulary_authority_guides', 'vocabulary-guide'],
  ['additional_public_routes', 'other-public-route'],
];
const expected = { editorial_blogs:83, programmatic_phonics_guides:31,
  programmatic_grammar_guides:38, vocabulary_authority_guides:16, additional_public_routes:111 };
const corpus = families.flatMap(([family, type]) => {
  const entries = index.corpus?.[family];
  if (!Array.isArray(entries)) fail('missing corpus family ' + family);
  if (entries.length !== index.corpus_counts?.[family]) fail('generator count discrepancy: ' + family);
  if (entries.length !== expected[family]) fail('as-of-2026-10-19 baseline changed; review before updating: ' + family + ' ' + entries.length);
  return entries.map((entry) => ({ ...entry, family, fallbackType: type }));
});
if (corpus.length !== 279 || index.corpus_counts?.connected_public_content !== 279) fail('279-entry directory baseline changed; investigate rather than overwriting old measurements');
const seen = new Map();
for (const entry of corpus) {
  const p = toPath(entry.canonical_url);
  if (seen.has(p)) fail('duplicate canonical across families: ' + p);
  seen.set(p, entry);
}
const coreFamilies = new Set(families.slice(0, 4).map(([key]) => key));
const core = corpus.filter((entry) => coreFamilies.has(entry.family));
if (core.length !== 168) fail('168 audited knowledge-owner source count changed');

const sitemapBlogs = [...read('public/sitemap-blog.xml').matchAll(/<loc>\s*(https:\/\/tinystepslearning\.com\/blog\/[^<\s]+)\s*<\/loc>/g)]
  .map((match) => toPath(match[1]));
if (sitemapBlogs.length !== 83 || new Set(sitemapBlogs).size !== 83) fail('blog sitemap must have exactly 83 unique paths at this baseline');
const corpusBlogPaths = new Set(corpus.filter((c) => c.family === 'editorial_blogs').map((c) => toPath(c.canonical_url)));
if (sitemapBlogs.some((p) => !corpusBlogPaths.has(p))) fail('blog sitemap vs generated corpus mismatch');

const layerRefs = new Map();
for (const layer of index.layers || []) {
  for (const entry of layer.items || []) {
    const p = toPath(entry.canonical_url);
    const current = layerRefs.get(p) || { layers:new Set(), count:0, questions:[] };
    current.layers.add(layer.layer);
    current.count++;
    if (layer.layer === 1) current.questions.push(entry.query);
    layerRefs.set(p, current);
  }
}
const layerCounts = Object.fromEntries((index.layers || []).map((layer) => [String(layer.layer), layer.items.length]));
if (layerCounts['1'] !== 28) fail('28 parent-problem layer changed');
const extraLayerRefs = [...layerRefs.keys()].filter((p) => !seen.has(p));

const subjectOf = (entry, p) => {
  if (entry.family === 'programmatic_phonics_guides') return 'phonics-reading';
  if (entry.family === 'programmatic_grammar_guides') return 'grammar-writing';
  if (entry.family === 'vocabulary_authority_guides') return 'vocabulary';
  if (entry.family === 'editorial_blogs') return String(entry.category || 'editorial-unclassified');
  if (p.includes('speaking')) return 'speaking-communication';
  if (p.includes('grammar') || p.includes('writing')) return 'grammar-writing';
  if (p.includes('phonics') || p.includes('reading') || p.includes('letter')) return 'phonics-reading';
  if (p.includes('vocabulary') || p.includes('word')) return 'vocabulary';
  if (p.startsWith('/parents') || p.includes('child-')) return 'parent-support';
  if (p.startsWith('/courses') || p === '/curriculum') return 'curriculum-commercial';
  if (p.includes('game') || p.startsWith('/free-')) return 'practice';
  if (p === '/for-schools') return 'schools';
  return 'cross-programme-or-other';
};
const ledger = corpus.map((entry) => {
  const p = toPath(entry.canonical_url);
  const layers = layerRefs.get(p);
  const coreVerified = coreFamilies.has(entry.family);
  return {
    canonical_url:entry.canonical_url,
    canonical_path:p,
    corpus_family:entry.family,
    content_type:entry.content_type || entry.fallbackType,
    source_id:entry.id || '',
    title:entry.title || '',
    subject_classification:subjectOf(entry,p),
    indexed_by_design:entry.indexing_state || 'UNKNOWN',
    answer_eligible_by_design:String(entry.answer_eligible ?? ''),
    retrieval_role:entry.retrieval_role || '',
    layers:(layers?.layers ? [...layers.layers].sort().join('|') : ''),
    parent_problem_owner_count:layers?.questions?.length || 0,
    answer_layer_entry_count:layers?.count || 0,
    production_direct_http_audit_2026_10_19:coreVerified ? 'PASS_WITHIN_E1E2_SCOPE' : 'NOT_INCLUDED_IN_168_URL_SCAN',
    google_url_inspection:'UNVERIFIED',
    bing_url_inspection:'UNVERIFIED',
    gsc_ai_page_metrics:'JOIN_BY_URL_FROM_OWNER_EXPORT_NOT_IN_SOURCE',
    microsoft_citation_metrics:'JOIN_BY_URL_FROM_OWNER_EXPORT_NOT_IN_SOURCE',
    origin:'generated-src-corpus'
  };
}).sort((a,b)=>a.canonical_url.localeCompare(b.canonical_url));
writeCsv('CONTENT_AUTHORITY_LEDGER.csv', [
  'canonical_url','canonical_path','corpus_family','content_type','source_id','title',
  'subject_classification','indexed_by_design','answer_eligible_by_design','retrieval_role',
  'layers','parent_problem_owner_count','answer_layer_entry_count',
  'production_direct_http_audit_2026_10_19','google_url_inspection','bing_url_inspection',
  'gsc_ai_page_metrics','microsoft_citation_metrics','origin'
], ledger);

// Cross-check generated discovery metadata against the canonical route's own source policy.
// Redirect aliases (and their noindex instruction) do NOT inherit authority over the
// final 301 destination. A conflict in this directory is not a Google-indexing verdict.
const directPublicRoutes = new Map(PUBLIC_ROUTE_MANIFEST.map((route) => [route.path, route]));
const directRedirects = new Map(PUBLIC_REDIRECT_MANIFEST.map((route) => [route.source, route]));
const routePolicy = (p) => {
  const explicit = directPublicRoutes.get(p);
  if (explicit) return { state:explicit.indexable === false ? 'noindex':'indexable', source:'PUBLIC_ROUTE_MANIFEST' };
  const dynamic = DYNAMIC_PUBLIC_ROUTE_INTENT_MANIFEST.find((rule) => {
    if (!rule.path.endsWith('/**')) return false;
    const prefix = rule.path.slice(0, -2);
    return p.startsWith(prefix);
  });
  if (dynamic) return {state:dynamic.intent === 'index' ? 'indexable' : 'noindex',
    source:'DYNAMIC_PUBLIC_ROUTE_INTENT_MANIFEST'};
  const config = ROUTE_SEO_REGISTRY[p];
  if (config?.robots) return {state:/\\bnoindex\\b/i.test(config.robots) ? 'noindex' : 'indexable',
    source:'ROUTE_SEO_REGISTRY_CANONICAL_ENTRY'};
  return {state:'NOT_DECLARED_EXPLICITLY',source:'NO_DIRECT_POLICY'};
};
const policyRows = ledger.map((row) => {
  const p = row.canonical_path;
  const resolved = routePolicy(p);
  const aliases = Object.entries(ROUTE_SEO_REGISTRY)
    .filter(([alias, config]) => alias !== p && config?.canonicalPath === p &&
      /\\bnoindex\\b/i.test(String(config.robots || '')) && directRedirects.get(alias)?.destination === p)
    .map(([alias])=>alias);
  const conflict = resolved.state !== 'NOT_DECLARED_EXPLICITLY' && resolved.state !== row.indexed_by_design;
  return {canonical_path:p, corpus_family:row.corpus_family,
    machine_index_state:row.indexed_by_design,
    canonical_route_policy_state:resolved.state,
    policy_source:resolved.source,
    metadata_conflict:conflict ? 'YES' : 'NO',
    noindex_redirect_aliases:aliases.join(' | '),
    google_index_verdict:'NOT_TESTED_BY_SOURCE_CROSSCHECK'};
});
writeCsv('SOURCE_INDEX_POLICY_CROSSCHECK.csv',[
 'canonical_path','corpus_family','machine_index_state',
 'canonical_route_policy_state','policy_source','metadata_conflict',
 'noindex_redirect_aliases','google_index_verdict'
],policyRows);
const sourcePolicyConflicts = policyRows.filter((row)=>row.metadata_conflict==='YES');
const knownCanonicalAliasConflicts = new Set([
  '/courses/public-speaking-foundations','/courses/public-speaking-excellence'
]);
const unexpectedConflicts = sourcePolicyConflicts.filter((row)=>!knownCanonicalAliasConflicts.has(row.canonical_path));
if (unexpectedConflicts.length) fail('unexpected machine-index vs canonical route policy differences: '+JSON.stringify(unexpectedConflicts));
const sourcePolicyIndexes = policyRows.filter((row)=>row.canonical_route_policy_state==='indexable').length;
const sourcePolicyNoindexes = policyRows.filter((row)=>row.canonical_route_policy_state==='noindex').length;

const parentLayer = (index.layers || []).find((l) => Number(l.layer) === 1);
const parentQuestions = parentLayer.items.map((entry) => ({
  parent_problem_id:entry.id, subject:entry.subject, parent_question:entry.query,
  canonical_owner:entry.canonical_url, ownership_state:entry.ownership_state || '',
  owner_present_in_corpus:String(seen.has(toPath(entry.canonical_url))),
  reference_urls:(entry.reference_urls || []).join(' | '),
  practice_urls:(entry.practice_urls || []).join(' | '),
  evidence_status:'SOURCE_ARCHITECTURE_ONLY_NOT_AN_AI_CITATION',
})).sort((a,b)=>a.parent_problem_id.localeCompare(b.parent_problem_id));
writeCsv('PARENT_PROBLEM_OWNER_MAP.csv',[
  'parent_problem_id','subject','parent_question','canonical_owner','ownership_state',
  'owner_present_in_corpus','reference_urls','practice_urls','evidence_status'
],parentQuestions);

const matrix = readCsv(read('docs/seo/ai-answer-engines/E4_NATIVE_12x4_SESSION_MATRIX_2026-10-19.csv'));
if (matrix.length !== 48) fail('native parent query matrix must contain 48 planned slots');
const benchmark = new Map();
for (const item of matrix) {
  if (!item.prompt_id || !item.expected_owner) fail('benchmark row lacks owner');
  if (benchmark.has(item.prompt_id) && benchmark.get(item.prompt_id).canonical_owner !== item.expected_owner)
    fail('benchmark duplicated question with divergent owner: ' + item.prompt_id);
  benchmark.set(item.prompt_id,{ question_id:item.prompt_id, parent_question:item.prompt,
    canonical_owner:item.expected_owner, corpus_owner_present:String(seen.has(toPath(item.expected_owner))),
    native_result:'USE_PR_754_NATIVE_EVIDENCE_NOT_SOURCE_MATRIX', capture_status:'CANDIDATE_OWNER_ONLY' });
}
if (benchmark.size !== 12 || [...benchmark.values()].some((x)=>x.corpus_owner_present!=='true')) fail('benchmark canonical-URL reconciliation failed');
writeCsv('PRIORITY_12_CANONICAL_OWNERS.csv',
  ['question_id','parent_question','canonical_owner','corpus_owner_present','capture_status','native_result'],
  [...benchmark.values()].sort((a,b)=>a.question_id.localeCompare(b.question_id)));

const audits = [
 ['A01','Homepage'],['A02','Curriculum'],['A03','Phonics commercial'],['A04','Reading commercial'],
 ['A05','Grammar commercial'],['A06','Speaking commercial'],['A07','Resource gateway'],
 ['A08','Phonics resources'],['A09','Grammar resources'],['A10','Vocabulary resources'],
 ['A11','Speaking resources'],['A12','Parent help'],['A13','Free learning activities'],
 ['A14','Schools and educators'],['A15','All blog articles'],
 ['A16','Commercial and lead journeys'],['A17','Sitewide technical']
];
const auditRows = audits.map(([id,subject])=>{
 const docPath = 'docs/seo/visibility-17-audits/reports/'+id+'.md';
 if (!fs.existsSync(path.join(root,docPath))) fail('missing report '+docPath);
 return {audit_id:id,workstream:subject,report_path:docPath,
  integrated_in_comprehensive_findings:'YES_AS_OF_2026_10_17',
  evidence_state:id==='A01'?'EVIDENCE_COLLECTED':'COMPLETE_WITH_LIMITATIONS',
  full_google_bing_native_assurance:'NO',
  note:'Report completed does not mean search inclusion, fixes or AI citations proven'};
});
writeCsv('SEVENTEEN_AUDIT_CROSSWALK.csv',[
  'audit_id','workstream','report_path','integrated_in_comprehensive_findings',
  'evidence_state','full_google_bing_native_assurance','note'
],auditRows);
const source=read('src/config/semanticFacts.ts');
const totals=[...source.matchAll(/totalLessonCount:\s*(\d+)/g)].map((m)=>Number(m[1]));
if (totals.join(',')!=='101,72,72') fail('curriculum total changed; review 245-lesson baseline');
const summary={
  project:'TSSA-7',brick:'B1',result:'SOURCE_RECONCILED_ONLY',
  observed_utc:new Date().toISOString(),ai_directory_revision:index.revision,
  as_of_claim:'Source-generated snapshot from current branch; direct-production 168-URL audit was dated 2026-10-19',
  connected_corpus_total:corpus.length,
  by_corpus_family:Object.fromEntries(families.map(([key])=>[key,corpus.filter((row)=>row.family===key).length])),
  indexable_by_design:ledger.filter((row)=>row.indexed_by_design==='indexable').length,
  noindex_by_design:ledger.filter((row)=>row.indexed_by_design==='noindex').length,
  known_machine_directory_vs_canonical_route_policy_conflicts:sourcePolicyConflicts.map((row)=>({
    canonical_path:row.canonical_path,machine_state:row.machine_index_state,
    canonical_route_state:row.canonical_route_policy_state,
    redirect_aliases:row.noindex_redirect_aliases,
  })),
  canonical_source_policy_indexable_count:sourcePolicyIndexes,
  canonical_source_policy_noindex_count:sourcePolicyNoindexes,
  answer_eligible_by_design:ledger.filter((row)=>row.answer_eligible_by_design==='true').length,
  technically_checked_on_2026_10_19:168,
  additional_routes_outside_168_scan:111,
  search_console_indexed_urls_verified_by_this_script:0,
  layer_counts:layerCounts,
  unique_layer_owner_paths:layerRefs.size,
  unmatched_layer_owner_paths:extraLayerRefs,
  parent_problem_routes:parentQuestions.length,
  parent_problem_owners_outside_corpus:parentQuestions.filter((row)=>row.owner_present_in_corpus!=='true').length,
  benchmark_parent_questions:benchmark.size,
  benchmark_slots:matrix.length,
  audit_reports_present:audits.length,
  curriculum_public_levels:7,
  curriculum_lessons:{phonics:totals[0],grammar:totals[1],speaking:totals[2],total:totals.reduce((a,b)=>a+b,0)},
  unfinished_bricks:'B1 acceptance review plus B2 through B7',
  baseline_scope_limit:'Do not infer Google/Bing inclusion, AI citations, production status of other routes, or indexability from source file alone.'
};
fs.writeFileSync(path.join(outDir,'BASELINE_SUMMARY.json'),JSON.stringify(summary,null,2)+'\n');
console.log('TSSA7_B1_SUMMARY '+JSON.stringify({
  total:summary.connected_corpus_total,core:summary.technically_checked_on_2026_10_19,
  other:summary.additional_routes_outside_168_scan,layerCounts,questions:benchmark.size,
  audits:summary.audit_reports_present,lessons:summary.curriculum_lessons.total,
  indexable:summary.indexable_by_design,noindex:summary.noindex_by_design,
  sourcePolicyConflicts:sourcePolicyConflicts.length,
  sourcePolicyIndexable:sourcePolicyIndexes,sourcePolicyNoindex:sourcePolicyNoindexes,
  unmatchedLayerOwnerPaths:extraLayerRefs.length
}));
console.log('TSSA7_B1_ARTIFACTS '+JSON.stringify(fs.readdirSync(outDir).sort()));
