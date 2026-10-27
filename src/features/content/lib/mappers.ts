import { MEDIA_STATUS } from "../../../shared/constants/app";
import { POLL } from "../constants/poll";

import type { ComposerMedia } from "../types/composer";
import type { ComposerPoll } from "../types/poll";
import type { TweetPoll } from "../types/poll";
import type { MediaAttachment } from "../types/media";

export function mapMediaToComposerMedia(
  attachments: MediaAttachment[] = [],
): ComposerMedia[] {
  return attachments.map((attachment) => ({
    id: attachment.id,
    attachmentId: attachment.id,
    url: attachment.url,
    previewUrl: attachment.url,
    type: attachment.type,
    name: attachment.url.split("/").pop() || "attachment",
    size: attachment.sizeInBytes || 0,
    width: attachment.width,
    height: attachment.height,
    status: MEDIA_STATUS.UPLOADED,
    progress: 100,
  }));
}

export function mapPollToComposerPoll(poll?: TweetPoll): ComposerPoll | null {
  if (!poll) return null;

  return {
    options: poll.options.map((option) => ({
      id: option.id,
      text: option.text,
    })),
    duration: POLL.DEFAULT_DURATION_MINUTES,
  };
}
