#!/usr/bin/env node
/**
 * TSSA-7/B4: first-party educational-authority source inventory and evidence gates.
 * Structural coverage is NOT a substitute for educator peer review, citation
 * relevance checks, clinical diagnosis, or independent author credential checks.
 * No writes outside artifacts/tssa7-b4; no network or production mutations.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PHONICS_PUBLISHED_RESOURCE_PAGES } from '../src/lib/phonicsPublicationRegistry.js';
import { GRAMMAR_KNOWLEDGE_PAGES } from '../src/lib/grammarKnowledgeRegistry.js';
import { VOCABULARY_AUTHORITY_PAGES } from '../src/lib/vocabularyAuthorityRegistry.js';

const root = process.cwd();
const out = path.join(root, 'artifacts/tssa7-b4');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const fail = message => { throw new Error('TSSA-7/B4 ' + message); };
const required = (value, label) => { if (!value) fail(label); };
const index = JSON.parse(read('public/ai-resource-index.json'));
const byFamily = index.corpus || {};
const groups = [
  ['editorial_blogs', 83],
  ['programmatic_phonics_guides', 31],
  ['programmatic_grammar_guides', 38],
  ['vocabulary_authority_guides', 16],
];
for (const [family,expected] of groups) if ((byFamily[family]||[]).length !== expected)
  fail(family+' changed: review source baseline and update counts explicitly');

const paths = new Map();
for (const [family] of groups) for (const record of byFamily[family]) {
  const pathname = new URL(record.canonical_url).pathname;
  if(paths.has(pathname)) fail('duplicate canonical '+pathname);
  paths.set(pathname,{record,family});
}
if(paths.size!==168) fail('168 source core count drifted');

function findBlogFiles(base) {
  let list = [];
  for(const file of fs.readdirSync(base,{withFileTypes:true})) {
    const full = path.join(base,file.name);
    if(file.isDirectory()) list.push(...findBlogFiles(full));
    else if(file.name.endsWith('.ts')) list.push(full);
  }
  return list;
}
const blogs = new Map();
for(const file of findBlogFiles(path.join(root,'src/content/blog/posts'))) {
  const content=fs.readFileSync(file,'utf8');
  const match=content.match(/\bslug:\s*['"]([^'"]+)['"]/);
  if(!match)continue;
  const item={file:path.relative(root,file),content};
  if(blogs.has(match[1])) {
    // Old/retired articles and unpublished sources can share slug aliases;
    // report rather than silently treating the first file as certified owner.
    blogs.get(match[1]).duplicates.push(item.file);
  } else blogs.set(match[1],{...item,duplicates:[]});
}
const hasText=x=>typeof x==='string' && x.trim().length>0;
const list=x=>Array.isArray(x)?x:[];
const flatten=[];
for(const page of PHONICS_PUBLISHED_RESOURCE_PAGES){
  const concept=page.concept;
  flatten.push({path:page.path,category:'phonics',parent_question_present:hasText(concept?.parentQuestion),named_external_references_present:null,
    answer_present:hasText(concept?.quickAnswer),
    example_count:list(concept?.exampleWords).length,
    practice_count:list(concept?.practiceIdeas).length,
    exception_count:list(concept?.commonConfusions).length,
    references_count:null,
    author:'NO_PERSONAL_CREDENTIAL_CLAIM',source_file:'governed-phonics-concept',
    notes:'Existing prepublication contract + curriculum refs; no claim of externally peer-reviewed each example'});
}
for(const page of GRAMMAR_KNOWLEDGE_PAGES){
  flatten.push({path:page.path,category:'grammar',parent_question_present:null,named_external_references_present:list(page.sources).length>=2,
    answer_present:hasText(page.quickAnswer),
    example_count:list(page.workedExamples).length+list(page.examples).length,
    practice_count:list(page.practicePrompts).length,
    exception_count:list(page.commonMistakes).length+list(page.trickyCases).length,
    references_count:list(page.sources).length,
    author:'NO_PERSONAL_CREDENTIAL_CLAIM',source_file:'governed-grammar-registry',
    notes:'References and examples are structured metadata; source relevance still needs editorial spot check'});
}
for(const page of VOCABULARY_AUTHORITY_PAGES){
  flatten.push({path:page.path,category:'vocabulary',sources_present:list(page.sources).length>=2,
    answer_present:hasText(page.quickAnswer),
    example_count:list(page.workedExamples).length+list(page.examples).length,
    practice_count:list(page.practicePrompts).length,
    exception_count:list(page.commonMistakes).length+list(page.trickyCases).length,
    references_count:list(page.sources).length,
    author:'NO_PERSONAL_CREDENTIAL_CLAIM',source_file:'governed-vocabulary-registry',
    notes:'References are named sources, not independent endorsement or reviewed competence'});
}
for(const entry of byFamily.editorial_blogs){
  const p=new URL(entry.canonical_url).pathname;
  const slug=p.split('/').pop();
  const found=blogs.get(slug);
  const txt=found?.content||'';
  const author=txt.match(/\bauthor:\s*['"]([^'"]+)['"]/)?.[1]||'UNVERIFIED';
  flatten.push({path:p,category:'blog',parent_question_present:null,named_external_references_present:/Evidence and (?:references|sources|source boundary|curriculum boundary)|References and sources|Sources and further reading|Sources and references/i.test(txt),
    answer_present:/\bquick answer\b/i.test(txt)||/\bbody:\s*\[/.test(txt),
    example_count:(txt.match(/\bexample\b/gi)||[]).length,
    practice_count:(txt.match(/\bpractis(?:e|ing)|practice\b/gi)||[]).length,
    exception_count:(txt.match(/\bnot (?:a|an|the|necessarily|automatically|universal)\b/gi)||[]).length,
    references_count:(txt.match(/https:\/\/(?:www\.)?[^\s'")]+/g)||[]).length,
    author,source_file:found?.file||'NOT_LOCATED_BY_LITERAL_SLUG',
    notes:found?.duplicates?.length?'DUPLICATE_LITERAL_SLUG_SOURCES: '+found.duplicates.join('|'):
     'Author is a source label, not verified identity, qualifications or independent review'});
}
const seen = new Map();
for(const row of flatten){
 if(seen.has(row.path))fail('duplicate output '+row.path);
 seen.set(row.path,row);
 if(!paths.has(row.path))fail('source page missing in generated index '+row.path);
}
if(flatten.length!==168||[...paths.keys()].some(p=>!seen.has(p)))fail('core corpus ledger mismatch');
for(const row of flatten.filter(x=>x.category==='phonics')){
 if(!row.parent_question_present||!row.answer_present||row.example_count<3||row.practice_count<2||row.exception_count<1)
  fail('governed Phonics teaching schema incomplete '+row.path);
}
for(const row of flatten.filter(x=>x.category==='grammar'||x.category==='vocabulary')){
 if(!row.named_external_references_present||!row.answer_present||row.example_count<2||row.practice_count<1)
  fail('governed Grammar/Vocabulary teaching schema incomplete '+row.path);
}
const appFile=read('src/pages/public/PhonicsAppsPreschoolersIndiaPage.tsx');
const appUnsafe=[
 /matches CBSE\/ICSE\/IB sound order and expectations/,
 /matches the way letters are taught at school \(CBSE\/ICSE\/IB\) will be effective/,
 /10 minutes a day is plenty for preschoolers/i,
 /helps bilingual children decode words faster/i,
 /usually resolves with consistent practice/i,
];
if(appUnsafe.some(pattern=>pattern.test(appFile)))fail('unqualified preschool app claim remains');
for(const marker of [
 'Education Endowment Foundation — Phonics evidence review',
 'Institute of Education Sciences — Foundational Reading Skills practice guide',
 'These independent references inform general teaching principles',
 'These are illustrative teaching activities, not a standardized diagnostic test',
]) required(appFile.includes(marker),'evidence or uncertainty marker absent: '+marker);

fs.mkdirSync(out,{recursive:true});
const csv=(value)=>'"'+String(value??'').replaceAll('"','""').replace(/^[=+@-]/,v=>"'"+v)+'"';
const fields=['path','category','parent_question_present','named_external_references_present','answer_present','example_count','practice_count','exception_count','references_count','author','source_file','notes'];
fs.writeFileSync(path.join(out,'SOURCE_EDUCATIONAL_AUTHORITY_168.csv'),
  [fields.join(','),...flatten.sort((a,b)=>a.path.localeCompare(b.path)).map(x=>fields.map(k=>csv(x[k])).join(','))].join('\n')+'\n');
const blogEntries=flatten.filter(x=>x.category==='blog');
const highPriority=[
 '/blog/satpin-phonics-guide',
 '/blog/what-is-phonics-for-kids',
 '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
 '/blog/why-child-reads-words-but-does-not-understand-story',
 '/blog/how-to-improve-reading-fluency-in-children',
 '/blog/how-vocabulary-supports-reading-comprehension',
 '/blog/child-gives-one-word-answers',
 '/blog/how-to-teach-storytelling-to-kids',
 '/blog/sight-words-or-phonics-first',
];
const sample=highPriority.map(p=>{
 const row=seen.get(p);if(!row)fail('priority sample not in 168 '+p);
 return {path:p,source_file:row.source_file,source_label:row.author,
    has_named_reference_section:row.named_external_references_present,linked_reference_count:row.references_count,
    status:'EDITORIAL_SOURCE_SPOT_CHECK_NOT_EXTERNAL_PEER_REVIEW'};
});
const sampleFields=['path','source_file','source_label','has_named_reference_section','linked_reference_count','status'];
fs.writeFileSync(path.join(out,'PRIORITY_9_BLOG_SPOT_CHECK.csv'),
  [sampleFields.join(','),...sample.map(x=>sampleFields.map(k=>csv(x[k])).join(','))].join('\n')+'\n');
const result={
 brick:'TSSA-7/B4',review_type:'source_structure_and_priority_spot_check',
 total_source_corpus:flatten.length,
 groups:Object.fromEntries(groups.map(([family,n])=>[family,n])),
 structural_grammar_vocab_reference_minimum_met:flatten.filter(x=>x.category==='grammar'||x.category==='vocabulary').length,
 structural_phonics_teaching_minimum_met:31,
 blog_source_files_located:blogEntries.filter(x=>x.source_file!=='NOT_LOCATED_BY_LITERAL_SLUG').length,
 blog_named_reference_sections:blogEntries.filter(x=>x.named_external_references_present).length,
 blog_sources_missing_literal_slug:blogEntries.filter(x=>x.source_file==='NOT_LOCATED_BY_LITERAL_SLUG').map(x=>x.path),
 high_priority_blog_sample:sample.length,
 sample_without_named_references:sample.filter(x=>!x.has_named_reference_section).map(x=>x.path),
 confirmed_unqualified_preschool_claim_fixed:true,
 external_peer_review_status:'NOT_PERFORMED',
 named_author_credentials_verified:false,
 independent_sources_validated_for_app:2,
 all_168_pedagogically_verified:false,
 provider_index_and_ai_citations:'OUT_OF_SCOPE',
};
fs.writeFileSync(path.join(out,'SUMMARY.json'),JSON.stringify(result,null,2)+'\n');
console.log('TSSA7_B4_SUMMARY '+JSON.stringify(result));
