import type { useTweetComposer } from "../../hooks/composer/useTweetComposer";

import ComposerPopovers from "./ComposerPopovers";
import TweetComposerFileInputs from "../tweet/TweetComposer/TweetComposerFileInputs";

export function ComposerInputsAndPopovers({
  composer,
}: {
  composer: ReturnType<typeof useTweetComposer>;
}) {
  return (
    <>
      <ComposerPopovers
        emoji={composer.popovers.emoji}
        gif={composer.popovers.gif}
        location={composer.popovers.location}
      />

      <TweetComposerFileInputs
        imageRef={composer.imageInputRef}
        videoRef={composer.videoInputRef}
        onFilesSelected={composer.onFilesSelected}
      />
    </>
  );
}
