import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';

const root=process.cwd();
const letters='abcdefghijklmnopqrstuvwxyz'.split('');
const read=(p:string)=>fs.readFileSync(path.join(root,p),'utf8');
const digest=(p:string)=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');

describe('public media canonicalization phase 1',()=>{
  it('keeps canonical A-Z bytes identical to both legacy game copies',()=>{
    for(const l of letters){
      const canonical=`public/games/phonics/shared/letter-sounds/${l}.mp3`;
      const balloon=`public/games/phonics/balloon-pop/${l}.mp3`;
      const match=`public/games/phonics/letter-sound-match/${l}.mp3`;
      expect(fs.existsSync(path.join(root,canonical))).toBe(true);
      expect(digest(canonical)).toBe(digest(balloon));
      expect(digest(canonical)).toBe(digest(match));
    }
  });

  it('routes the active games to canonical audio',()=>{
    const balloon=read('src/pages/KidsBalloonPop.tsx');
    const mission=read('src/pages/KidsPhonicsMission.tsx');
    expect(balloon).toContain('const LETTER_BASE = "/games/phonics/shared/letter-sounds";');
    expect(balloon).toContain('confetti: "/confetti.mp3"');
    expect(mission).toContain('const LETTER_SOUND_DIR = "/games/phonics/shared/letter-sounds";');
  });

  it('preserves 16 Christmas logical IDs while reusing duplicate bytes',()=>{
    const source=read('src/pages/public/seasonal/ChristmasTreeDecoratePublic.tsx');
    expect(source).toContain('const assetNumber = DECORATION_ASSET_NUMBER[n] ?? n;');
    for(const pair of ['5: 4','11: 9','12: 1','13: 3','14: 10','15: 8','16: 7']){
      expect(source).toContain(pair);
    }
  });
});
