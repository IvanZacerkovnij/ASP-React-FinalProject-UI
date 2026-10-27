import { useTweetComposer } from "../../../hooks/composer/useTweetComposer";

import Composer from "../../composer/Composer";

export default function TweetComposer() {
  const composer = useTweetComposer({
    allowScheduling: true,
  });

  return (
    <Composer
      composer={composer}
      className="border-b border-border px-4 py-3"
    />
  );
}
