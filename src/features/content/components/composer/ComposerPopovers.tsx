import ComposerPopover from "./ComposerPopover";
import { lazy, Suspense } from "react";
import GifPicker from "./gif/GifPicker";
import LocationPicker from "./location/LocationPicker";

import type { Gif } from "../../types/gif";
import type { Location } from "../../types/location";
const EmojiPicker = lazy(() => import("./emoji/EmojiPicker"));

type ComposerPopoverState = {
  open: boolean;
  reference: HTMLElement | null;
  onOpenChange: (open: boolean) => void;
};

interface ComposerPopoversProps {
  emoji: ComposerPopoverState & {
    onSelect: (emoji: string) => void;
  };

  gif: ComposerPopoverState & {
    available: boolean;
    gifs: Gif[];
    query: string;
    loading: boolean;
    error: string | null;
    onQueryChange: (value: string) => void;
    onSelect: (gif: Gif) => void;
  };

  location: ComposerPopoverState & {
    locations: Location[];
    query: string;
    loading: boolean;
    error: string | null;
    onQueryChange: (value: string) => void;
    onSelect: (location: Location) => void;
  };
}

export default function ComposerPopovers({
  emoji,
  gif,
  location,
}: ComposerPopoversProps) {
  return (
    <>
      <ComposerPopover
        open={emoji.open}
        onOpenChange={emoji.onOpenChange}
        reference={emoji.reference}
      >
        <Suspense fallback={<p role="status" className="p-4">Завантаження емодзі…</p>}>
          <EmojiPicker onSelect={emoji.onSelect} />
        </Suspense>
      </ComposerPopover>

      <ComposerPopover
        open={gif.open}
        onOpenChange={gif.onOpenChange}
        reference={gif.reference}
      >
        <GifPicker
          available={gif.available}
          gifs={gif.gifs}
          query={gif.query}
          loading={gif.loading}
          error={gif.error}
          onQueryChange={gif.onQueryChange}
          onSelect={gif.onSelect}
        />
      </ComposerPopover>

      <ComposerPopover
        open={location.open}
        onOpenChange={location.onOpenChange}
        reference={location.reference}
      >
        <LocationPicker
          locations={location.locations}
          query={location.query}
          loading={location.loading}
          error={location.error}
          onQueryChange={location.onQueryChange}
          onSelect={location.onSelect}
        />
      </ComposerPopover>
    </>
  );
}
