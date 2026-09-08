import type { FC } from 'react';
import PhonicsSoundBox from './PhonicsSoundBox';
import type { PhonicsWordUtilityRecord } from '../../lib/phonicsWordUtilityRegistry.js';

const PhonicsWordSoundBox: FC<{ record: PhonicsWordUtilityRecord }> = ({ record }) => (
  <div data-phonics-word-sound-box={record.word}>
    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
      <span>{record.soundChunkCount} sound-spelling {record.soundChunkCount === 1 ? 'chunk' : 'chunks'}</span>
      <span aria-hidden="true">•</span>
      <span>{record.phonemeCount} {record.phonemeCount === 1 ? 'phoneme' : 'phonemes'}</span>
    </div>
    <div className="mt-4 flex flex-wrap gap-2.5">
      {record.segments.map((segment, index) => (
        <PhonicsSoundBox key={`${record.word}-${segment.grapheme}-${index}`} segment={segment} word={record.word} />
      ))}
    </div>
    <p className="mt-3 text-xs leading-5 text-slate-500">
      The boxes show stored sound-spelling chunks. Some spellings, such as <strong>qu</strong> or <strong>x</strong>, can represent more than one phoneme.
    </p>
  </div>
);

export default PhonicsWordSoundBox;
