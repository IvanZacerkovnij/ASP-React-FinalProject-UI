import { useState } from "react";
import { skipToken } from "@tanstack/react-query";

import {
  errorMessage,
  useGetPostsQuery,
  useGetThreadQuery,
  useCreateCommentMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} from "../api/queries";

import type { Tweet } from "../types/tweet";
import type { ComposerSubmitData } from "../types/composer";

interface UseTweetCommentsOptions {
  postId: string;
  parentCommentId?: string | null;
  initialCount: number;
  initiallyOpen?: boolean;
}
const EMPTY: Tweet[] = [];

export function useTweetComments({
  postId,
  parentCommentId = null,
  initialCount,
  initiallyOpen = false,
}: UseTweetCommentsOptions) {
  const [open, setOpen] = useState(initiallyOpen);
  const [requested, setRequested] = useState(initiallyOpen);
  const query = useGetPostsQuery(
    { kind: "comments", postId },
    { skip: !requested || Boolean(parentCommentId) },
  );
  const thread = useGetThreadQuery(parentCommentId && requested ? parentCommentId : skipToken);

  const [create, creating] = useCreateCommentMutation();
  const [update, updating] = useUpdatePostMutation();
  const [remove, removing] = useDeletePostMutation();
  const comments = parentCommentId ? thread.currentData?.replies ?? EMPTY : query.currentData ?? EMPTY;
  const activeQuery = parentCommentId ? thread : query;
  const mutationError = creating.error ?? updating.error ?? removing.error;
  const clearErrors = () => {
    creating.reset();
    updating.reset();
    removing.reset();
  };

  return {
    pagination: { hasMore: activeQuery.hasMore, isFetching: activeQuery.isFetching, error: activeQuery.error, onLoadMore: activeQuery.loadMore, onRetry: activeQuery.isFetchNextPageError ? activeQuery.loadMore : activeQuery.refetch },
    open,
    comments,
    commentsCount: initialCount,
    isLoading: activeQuery.isLoading,
    isSubmitting: creating.isLoading,
    error:
      mutationError || activeQuery.error
        ? errorMessage(mutationError ?? activeQuery.error)
        : null,

    toggleOpen: () => {
      setOpen(!open);
      if (!open) setRequested(true);
    },

    loadComments: () => {
      if (requested) void query.refetch();
      else setRequested(true);
    },

    createComment: async (
      data: ComposerSubmitData,
      childParentCommentId?: string | null,
    ) => {
      if (creating.isLoading) return false;
      clearErrors();
      try {
        await create({
          postId,
          parentCommentId:
            childParentCommentId === undefined
              ? parentCommentId
              : childParentCommentId,
          ...data,
          poll: data.poll ?? undefined,
        }).unwrap();
        return true;
      } catch {
        return false;
      }
    },

    deleteComment: async (id: string) => {
      clearErrors();
      await remove({ id, type: "comment" }).unwrap();
    },

    updateComment: async (id: string, data: ComposerSubmitData | string) => {
      clearErrors();
      try {
        await update({
          id,
          type: "comment",
          data: typeof data === "string" ? { content: data } : data,
        }).unwrap();
        return true;
      } catch {
        return false;
      }
    },
  };
}
