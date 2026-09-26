import { ExternalLink, ShieldCheck } from 'lucide-react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { PHONICS_PUBLISHED_RESOURCE_PAGES } from '../../lib/phonicsPublicationRegistry.js';
import {
  PHONICS_PREPUBLICATION_QUALITY_REVISION,
  PHONICS_PREPUBLICATION_QUALITY_STATE,
} from '../../lib/phonicsPrepublicationQuality.js';

export default function FounderEditorialReviewsPanel() {
  const pages = PHONICS_PUBLISHED_RESOURCE_PAGES;
  const passed = pages.filter(
    (page) =>
      page.prepublicationQualityState === PHONICS_PREPUBLICATION_QUALITY_STATE
      && page.prepublicationQualityRevision === PHONICS_PREPUBLICATION_QUALITY_REVISION,
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-slate-950">Pre-publication Quality Status</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          Programmatic phonics guides are checked before they enter the published registry.
          There is no post-publication approve/reject queue for these pages.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500">Published guides</p>
          <p className="mt-1 text-2xl font-black">{pages.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500">Prechecked</p>
          <p className="mt-1 text-2xl font-black text-emerald-700">{passed.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500">Post-publication approvals required</p>
          <p className="mt-1 text-2xl font-black">0</p>
        </Card>
      </div>

      <Card className="border-emerald-200 bg-emerald-50/60 p-4 sm:p-5">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
          <div>
            <p className="font-black text-emerald-900">Publication gate active</p>
            <p className="mt-1 text-sm leading-6 text-emerald-900/80">
              Every governed guide must carry a passed pre-publication quality state for the current
              quality revision before it can be included in the published 31-page registry.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {pages.map((page) => {
          const current =
            page.prepublicationQualityState === PHONICS_PREPUBLICATION_QUALITY_STATE
            && page.prepublicationQualityRevision === PHONICS_PREPUBLICATION_QUALITY_REVISION;

          return (
            <Card key={page.conceptId} className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-slate-950">{page.cardTitle}</h3>
                    <span className={
                      current
                        ? 'rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700'
                        : 'rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700'
                    }>
                      {current ? 'Prechecked' : 'Quality revision mismatch'}
                    </span>
                  </div>
                  <p className="mt-1 break-all text-xs text-slate-500">{page.path}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {page.group} · {page.publicationWave === 'pilot-wave-1' ? 'Wave 1' : 'Wave 2'}
                    {' · '}Quality revision {page.prepublicationQualityRevision}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(page.path, '_blank', 'noopener,noreferrer')}
                >
                  Open Page <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
