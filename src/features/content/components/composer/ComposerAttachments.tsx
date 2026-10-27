import type { useTweetComposer } from "../../hooks/composer/useTweetComposer";

import type { TweetQuote } from "../../types/tweet";

import TweetComposerMediaPreview from "../tweet/TweetComposer/TweetComposerMediaPreview";
import TweetComposerLocationPreview from "../tweet/TweetComposer/TweetComposerLocationPreview";
import TweetComposerLinkPreview from "../tweet/TweetComposer/TweetComposerLinkPreview";
import QuotedTweetCard from "../tweet/quote/QuotedTweetCard";
import PollComposer from "./poll/PollComposer";

interface ComposerAttachmentsProps {
  composer: ReturnType<typeof useTweetComposer>;
  quotedTweet?: TweetQuote | null;
}

export function ComposerAttachments({
  composer,
  quotedTweet,
}: ComposerAttachmentsProps) {
  return (
    <>
      {composer.pollEditor.visible && <PollComposer {...composer.pollEditor} />}

      <TweetComposerMediaPreview
        media={composer.media}
        onRemove={composer.removeMedia}
        disabled={composer.isPosting}
      />

      {composer.linkPreview.visible && (
        <TweetComposerLinkPreview
          preview={composer.linkPreview.preview}
          loading={composer.linkPreview.loading}
          onRemove={composer.linkPreview.onRemove}
          disabled={composer.isPosting}
        />
      )}

      {quotedTweet && (
        <QuotedTweetCard quote={quotedTweet} allowVoting={false} />
      )}

      {composer.locationPreview.visible &&
        composer.locationPreview.location && (
          <TweetComposerLocationPreview
            location={composer.locationPreview.location}
            onRemove={composer.locationPreview.onRemove}
            disabled={composer.isPosting}
          />
        )}
    </>
  );
}
