import KidsPhonicsMission from "../KidsPhonicsMission";
import SoundDetectiveGame from "../kids/games/phonics/SoundDetectiveGame";
import MyFirstWordsGame from "../kids/games/phonics/MyFirstWords/MyFirstWordsGame";
import SentenceStepperStage4 from "../kids/games/phonics/SentenceStepperStage4";
import BuildBetterSentencesChooseBetter from "../kids/games/grammar/BuildBetterSentencesChooseBetter";
import StoryReadingGame from "../kids/games/reading/StoryReading/StoryReadingGame";
import MakeAWordRimeGame from "../kids/games/phonics/CvcWordReader/MakeAWordRimeGame";
import { lazy, Suspense } from "react";

// Keep older-child visual puzzles out of the initial public SEO/classic game
// bundle. This route only loads the additional code when explicitly requested.
const VisualSpellingPuzzleLab = lazy(() => import("../kids/games/VisualSpellingPuzzleLab"));

type PublicEnglishGamePlayerProps = {
  publicPath: string;
  visualPuzzleMode?: boolean;
};

export default function PublicEnglishGamePlayer({
  publicPath,
  visualPuzzleMode = false,
}: PublicEnglishGamePlayerProps) {
  switch (publicPath) {
    case "/free-letter-sounds-game-for-kids":
      return (
        <KidsPhonicsMission
          forceAnonymousMode
          missionReturnHrefOverride={publicPath}
          missionBackLabel="← Back to English Games"
        />
      );
    case "/free-sound-listening-game-for-kids":
      return (
        <SoundDetectiveGame
          forceAnonymousMode
          missionReturnHrefOverride={publicPath}
          missionBackLabel="← Back to English Games"
        />
      );
    case "/free-word-building-game-for-kids":
      return (
        <MyFirstWordsGame
          forceAnonymousMode
          missionReturnHrefOverride={publicPath}
          missionBackLabel="← Back to English Games"
        />
      );
    case "/free-spelling-game-for-kids":
      if (visualPuzzleMode) {
        return (
          <Suspense fallback={<div role="status" className="min-h-screen bg-indigo-950 p-6 text-white">Loading visual spelling puzzles…</div>}>
            <VisualSpellingPuzzleLab />
          </Suspense>
        );
      }
      return (
        <MakeAWordRimeGame
          forceAnonymousMode
          disableAudio
          publicSpellingAdventure
          activityContextLabelOverride="Guest Play Mode • Spelling Adventure"
          missionReturnHrefOverride={publicPath}
          missionBackLabel="← Spelling Games"
        />
      );
    case "/free-sentence-making-game-for-kids":
      return (
        <SentenceStepperStage4
          forceAnonymousMode
          forcedPackId="4.2"
          activityContextLabelOverride="Stage 3 • Make Sentences"
          missionReturnHrefOverride={publicPath}
          missionBackLabel="← Back to English Games"
        />
      );
    case "/free-reading-fluency-game-for-kids":
      return (
        <StoryReadingGame
          forceAnonymousMode
          forcedPackId="pack-1"
          activityContextLabelOverride="Guest Play Mode • Reading Fluency"
          missionReturnHrefOverride={publicPath}
          missionBackLabel="← Back to Free Games"
        />
      );
    case "/free-grammar-practice-game-for-kids":
      return (
        <BuildBetterSentencesChooseBetter
          forceAnonymousMode
          missionReturnHrefOverride={publicPath}
          missionBackLabel="Back to English Games"
        />
      );
    default:
      return null;
  }
}
