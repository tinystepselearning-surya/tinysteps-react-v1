import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const base='https://tinystepslearning.com';
const cases=[
  {
    slug:'child-gives-one-word-answers',
    heading:'First check whether your child struggles to start speaking or to expand an answer',
  },
  {
    slug:'child-understands-english-but-does-not-speak',
    heading:'First distinguish speaking initiation from short replies and sentence difficulties',
  },
  {
    slug:'phonics-for-parents-guide',
    heading:'What this phonics guide covers and which guide to read next',
  },
];
for(const {slug,heading} of cases){
  test('rendered parent article '+slug+' retains clean topic sections and index metadata',()=>{
    const html=readFileSync(path.join('dist','blog',slug,'index.html'),'utf8');
    const doc=new JSDOM(html).window.document;
    const main=doc.querySelector('main');
    const text=(main?.textContent||'').replace(/\s+/g,' ').trim();
    assert.ok(main && text.length>800,'real article main content exists');
    assert.ok(text.includes(heading),'editorial section is preserved in prerendered HTML');
    assert.doesNotMatch(text,/\bBlog\s+#?\d+\b/i,'no internal content-production sequence numbers');
    assert.equal(doc.querySelectorAll('link[rel="canonical"]').length,1);
    assert.equal(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'),base+'/blog/'+slug);
    assert.ok(!/\bnoindex\b/i.test(doc.querySelector('meta[name="robots"]')?.getAttribute('content')||''));
    const graph=[];
    for(const script of doc.querySelectorAll('script[type="application/ld+json"]')){
      const value=JSON.parse(script.textContent||'null');
      const collect=x=>{if(Array.isArray(x))x.forEach(collect);else if(x&&typeof x==='object'){graph.push(x);if(x['@graph'])collect(x['@graph']);}};
      collect(value);
    }
    assert.ok(graph.some(x=>(Array.isArray(x['@type'])?x['@type']:[x['@type']]).includes('BlogPosting')&&x.url===base+'/blog/'+slug),'canonical BlogPosting schema must survive editorial correction');
  });
}
