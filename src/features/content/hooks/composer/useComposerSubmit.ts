import { useState } from "react";

import { buildComposerPayload, type ComposerValues } from "../../lib/composer";

import { useCreatePostMutation } from "../../api/queries";

import type { Tweet } from "../../types/tweet";
import type { ComposerMedia } from "../../types/composer";
import type { ComposerPoll } from "../../types/poll";
import type { Location } from "../../types/location";
import type { LinkPreview } from "../../types/linkPreview";
import type { ComposerSubmitData } from "../../types/composer";

interface UseComposerSubmitProps {
  content: string;
  media: ComposerMedia[];
  poll?: ComposerPoll | null;
  location?: Location | null;
  linkPreview?: LinkPreview | null;

  clearMedia: () => void;
  clearErrors: () => void;

  onCreated?: (tweet: Tweet) => void;
  onSubmit?: (data: ComposerSubmitData) => Promise<unknown>;
}

export function useComposerSubmit({
  content,
  media,
  poll,
  location,
  linkPreview,
  clearMedia,
  clearErrors,
  onCreated,
  onSubmit,
}: UseComposerSubmitProps) {
  const [isPosting, setIsPosting] = useState(false);
  const [createPost] = useCreatePostMutation();

  const submit = async (values?: ComposerValues) => {
    setIsPosting(true);

    try {
      const payload = buildComposerPayload(
        values ?? {
          content,
          media,
          poll,
          location,
          linkPreview,
        },
      );

      let result;
      if (onSubmit) result = await onSubmit(payload);
      else {
        result = await createPost({
          content: payload.content,
          mediaIds: payload.mediaIds,
          poll: payload.poll || undefined,
          location: payload.location,
          linkPreview: payload.linkPreview,
        }).unwrap();
      }

      if (result && typeof result === "object") onCreated?.(result as Tweet);

      if (result !== false) {
        clearMedia();
        clearErrors();
      }

      return result ?? true;
    } finally {
      setIsPosting(false);
    }
  };

  return {
    submit,
    isPosting,
  };
}
