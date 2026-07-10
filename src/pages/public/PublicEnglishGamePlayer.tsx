import KidsPhonicsMission from "../KidsPhonicsMission";
import SoundDetectiveGame from "../kids/games/phonics/SoundDetectiveGame";
import MyFirstWordsGame from "../kids/games/phonics/MyFirstWords/MyFirstWordsGame";
import SentenceStepperStage4 from "../kids/games/phonics/SentenceStepperStage4";
import BuildBetterSentencesChooseBetter from "../kids/games/grammar/BuildBetterSentencesChooseBetter";

type PublicEnglishGamePlayerProps = {
  publicPath: string;
};

export default function PublicEnglishGamePlayer({
  publicPath,
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
