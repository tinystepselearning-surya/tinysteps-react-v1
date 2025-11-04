/**
 * Balloon-Pop Phonics Game
 * Entry point - routes to Phase 1 or Phase 2 based on query params
 */

import { useSearchParams } from 'react-router-dom';
import BalloonPop, { gameMeta } from './BalloonPop';
import Phase2BalloonPop from './Phase2BalloonPop';

export { gameMeta };

export default function BalloonPopIPARouter() {
  const [searchParams] = useSearchParams();
  const set = searchParams.get('set');

  // If 'set' param exists (sat, pin, satpin, mixed), render Phase 2
  // Otherwise render original Phase 1 (IPA listening)
  if (set && ['sat', 'pin', 'satpin', 'mixed'].includes(set)) {
    return <Phase2BalloonPop />;
  }

  return <BalloonPop />;
}

