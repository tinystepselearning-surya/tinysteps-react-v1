import SpellBeeFlashTrainer, { gameMeta } from "./SpellBeeFlashTrainer";
import ErrorBoundary from "./ErrorBoundary";

export { gameMeta };

export default function SpellBeeFlashTrainerWithBoundary() {
  return (
    <ErrorBoundary>
      <SpellBeeFlashTrainer />
    </ErrorBoundary>
  );
}
