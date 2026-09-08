import { useMemo, useState, type FormEvent, type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PhonicsWordSoundBox from './PhonicsWordSoundBox';
import {
  PHONICS_WORD_UTILITY_RECORDS,
  getPhonicsWordSoundCategories,
  getPhonicsWordUtility,
  searchPhonicsWordUtilities,
} from '../../lib/phonicsWordUtilityRegistry.js';
import { getPublishedPhonicsResourcePageByConceptId } from '../../lib/phonicsPublicationRegistry.js';

const QUICK_WORDS = ['ship', 'chick', 'thin', 'rain', 'team', 'boat', 'book', 'moon', 'soil', 'cow', 'car', 'bird', 'fruit', 'about'] as const;

const PhonicsWordSoundUtility: FC = () => {
  const location = useLocation();
  const initialWord = useMemo(() => {
    const requested = new URLSearchParams(location.search).get('word') || '';
    return getPhonicsWordUtility(requested) ?? getPhonicsWordUtility('ship');
  }, [location.search]);
  const [query, setQuery] = useState(initialWord?.word ?? 'ship');
  const [record, setRecord] = useState(initialWord);
  const [notFound, setNotFound] = useState('');

  const suggestions = useMemo(() => searchPhonicsWordUtilities(query, 6), [query]);
  const patternPages = useMemo(
    () => (record?.conceptIds ?? []).map((id) => getPublishedPhonicsResourcePageByConceptId(id)).filter(Boolean),
    [record],
  );
  const categories = record ? getPhonicsWordSoundCategories(record) : [];

  const chooseWord = (word: string) => {
    const next = getPhonicsWordUtility(word);
    if (!next) return;
    setQuery(next.word);
    setRecord(next);
    setNotFound('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const exact = getPhonicsWordUtility(query);
    if (exact) {
      chooseWord(exact.word);
      return;
    }
    setNotFound(query.trim());
  };

  return (
    <section id="word-sound-tool" aria-labelledby="word-sound-tool-title" className="mx-auto mt-10 max-w-7xl scroll-mt-24 px-0" data-resource-word-utility="r13">
      <div className="overflow-hidden rounded-[2rem] border border-sky-100 bg-[radial-gradient(circle_at_10%_0%,rgba(14,165,233,0.12),transparent_32%),linear-gradient(135deg,#f8fdff_0%,#ffffff_50%,#fffaf5_100%)] shadow-[0_20px_60px_rgba(15,23,42,0.065)]">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          <div className="border-b border-sky-100 p-5 sm:p-7 lg:border-b-0 lg:border-r">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">Interactive phonics utility</p>
            <h2 id="word-sound-tool-title" className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950 sm:text-3xl">Break a word into stored sound chunks</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Search the starter bank, see the exact grapheme-to-sound map, and play each available recording. The tool never guesses an unknown word from spelling.
            </p>

            <form onSubmit={handleSubmit} className="mt-5">
              <label htmlFor="phonics-word-query" className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Try a word</label>
              <div className="mt-2 flex gap-2">
                <input
                  id="phonics-word-query"
                  value={query}
                  onChange={(event) => { setQuery(event.target.value); setNotFound(''); }}
                  autoComplete="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base font-bold text-slate-950 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  placeholder="ship, rain, book…"
                />
                <button type="submit" className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800">Show sounds</button>
              </div>
            </form>

            {notFound ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-5 text-amber-900" role="status">
                <strong>“{notFound}” is not in this starter bank yet.</strong> We do not auto-segment it. Try one of the stored words below.
              </div>
            ) : null}

            {query.trim() && suggestions.length ? (
              <div className="mt-4">
                <p className="text-xs font-bold text-slate-500">Matching stored words</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestions.map((item) => <button key={item.word} type="button" onClick={() => chooseWord(item.word)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 hover:border-sky-300 hover:text-sky-800">{item.word}</button>)}
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              {QUICK_WORDS.map((word) => <button key={word} type="button" onClick={() => chooseWord(word)} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-sky-100 hover:text-sky-900">{word}</button>)}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              {PHONICS_WORD_UTILITY_RECORDS.length} explicit starter word maps · human-review status remains pending · no automatic word-page publishing.
            </p>
          </div>

          <div className="p-5 sm:p-7">
            {record ? (
              <div aria-live="polite">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Selected word</p>
                    <h3 className="mt-1 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">{record.word}</h3>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {categories.map((category) => <span key={category} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">{category}</span>)}
                  </div>
                </div>

                <div className="mt-5"><PhonicsWordSoundBox record={record} /></div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Meaning</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{record.meaning}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Example</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{record.exampleSentence}</p>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/75 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">Phonics note</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{record.trickyPart}</p>
                  {record.note ? <p className="mt-1.5 text-xs leading-5 text-slate-500">{record.note}</p> : null}
                </div>

                {patternPages.length ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Related Tiny Steps guide</span>
                    {patternPages.map((page) => page ? <Link key={page.path} to={page.path} className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-black text-sky-800 hover:bg-sky-100">{page.cardTitle} →</Link> : null)}
                  </div>
                ) : null}

                <p className="mt-5 text-xs leading-5 text-slate-500">
                  These buttons play isolated stored sound cues. Tiny Steps does not join isolated clips and label that result as natural whole-word blending; whole-word audio is a separate future layer.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhonicsWordSoundUtility;
