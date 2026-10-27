import MediaGrid from "../media/MediaGrid";
import ComposerMediaItem from "../media/ComposerMediaItem";

import type { ComposerMedia } from "../../../types/composer";

interface TweetComposerMediaPreviewProps {
  media: ComposerMedia[];
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export default function TweetComposerMediaPreview({
  media,
  onRemove,
  disabled = false,
}: TweetComposerMediaPreviewProps) {
  return (
    <MediaGrid
      items={media}
      renderItem={(item) => (
        <ComposerMediaItem
          key={item.id}
          media={item}
          onRemove={onRemove}
          disabled={disabled}
        />
      )}
    />
  );
}
