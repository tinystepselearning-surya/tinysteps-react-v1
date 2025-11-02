import ErrorBoundary from './ErrorBoundary';
import BalloonPopIPA from './BalloonPopIPA';

export default function BalloonPopIPAWithBoundary() {
  return (
    <ErrorBoundary>
      <BalloonPopIPA />
    </ErrorBoundary>
  );
}
