import TwemojiText from "../../../../shared/ui/TwemojiText";

import TweetLocation from "./location/TweetLocation";
import LinkPreviewCard from "./linkPreview/LinkPreviewCard";
import TweetPoll from "./poll/TweetPoll";
import TweetMedia from "./TweetMedia";
import QuotedTweetCard from "./quote/QuotedTweetCard";

import type { Tweet } from "../../types/tweet";

import { removePreviewUrl } from "../../../../shared/lib/linkPreview";

interface TweetContentProps {
  tweet: Tweet;
  readOnly?: boolean;
}

export default function TweetContent({
  tweet,
  readOnly = false,
}: TweetContentProps) {
  const displayContent = removePreviewUrl(
    tweet.content,
    tweet.linkPreview?.url,
  );

  return (
    <div className="min-w-0">
      {displayContent && (
        <TwemojiText
          text={displayContent}
          className="mt-1 wrap-break-word whitespace-pre-wrap"
        />
      )}

      {tweet.attachments.length > 0 && (
        <TweetMedia attachments={tweet.attachments} autoPlayVideos />
      )}

      {tweet.poll && (
        <TweetPoll
          isComment={tweet.isComment}
          tweetId={tweet.id}
          poll={tweet.poll}
          readOnly={readOnly}
        />
      )}

      {tweet.linkPreview && <LinkPreviewCard preview={tweet.linkPreview} />}

      {tweet.quote && (
        <QuotedTweetCard quote={tweet.quote} readOnly={readOnly} />
      )}

      {tweet.location && <TweetLocation location={tweet.location} />}
    </div>
  );
}
