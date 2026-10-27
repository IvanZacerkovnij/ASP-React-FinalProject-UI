import type {
  CreateCommentRequest,
  CreateTweetRequest,
  UpdateCommentRequest,
  UpdateTweetRequest,
} from "../../types/tweet";
import type { LinkPreview } from "../../types/linkPreview";

type ComposerPoll = { options: string[]; duration: number };

const mapPoll = (poll: ComposerPoll) => ({
  options: poll.options,
  endsAt: new Date(Date.now() + poll.duration * 60_000).toISOString(),
});

const mapLinkPreview = (preview: LinkPreview) => ({
  url: preview.url,
  title: preview.title || undefined,
  imageUrl: preview.imageUrl || undefined,
});

export function mapCreatePostRequest(
  data: CreateTweetRequest | CreateCommentRequest,
) {
  const isComment = "postId" in data;
  if (isComment && !data.content.trim()) throw new Error("Сервер вимагає текст коментаря. Вкладення збережено в редакторі.");
  if (!isComment && !data.content.trim() && !data.mediaIds?.length && !data.poll && !data.linkPreview)
    throw new Error("Додайте текст, медіа, опитування або посилання. Самої локації недостатньо.");
  return {
    ...data,
    content: data.content.trim() || undefined,
    mediaIds: data.mediaIds ?? [],
    ...(data.poll ? { poll: mapPoll(data.poll) } : {}),
    ...(data.linkPreview
      ? { linkPreview: mapLinkPreview(data.linkPreview) }
      : {}),
  };
}

export function mapUpdateRequest(
  data: UpdateTweetRequest | UpdateCommentRequest,
) {
  const {
    poll,
    location,
    linkPreview,
    removePoll,
    removeLocation,
    removeLinkPreview,
    ...fields
  } = data;

  if (removePoll && poll)
    throw new Error("Не можна одночасно оновити й видалити опитування.");
  if (removeLocation && location)
    throw new Error("Не можна одночасно оновити й видалити локацію.");
  if (removeLinkPreview && linkPreview)
    throw new Error("Не можна одночасно оновити й видалити прев’ю посилання.");

  return {
    ...fields,
    ...(fields.content !== undefined && !fields.content.trim() ? { content: undefined } : {}),
    ...(poll ? { poll: mapPoll(poll) } : {}),
    ...(poll === null || removePoll ? { removePoll: true } : {}),
    ...(location ? { location } : {}),
    ...(location === null || removeLocation ? { removeLocation: true } : {}),
    ...(linkPreview ? { linkPreview: mapLinkPreview(linkPreview) } : {}),
    ...(linkPreview === null || removeLinkPreview
      ? { removeLinkPreview: true }
      : {}),
  };
}

export const mapScheduledLinkPreview = (
  preview: LinkPreview | null | undefined,
) => (preview ? mapLinkPreview(preview) : preview);
