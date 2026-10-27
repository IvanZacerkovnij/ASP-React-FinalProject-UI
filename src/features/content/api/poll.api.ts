import { apiClient } from "../../../shared/api/domain-client";
import { ENDPOINTS } from "../../../shared/api/endpoints";
import {
  mapBackendPollToTweetPoll,
  type BackendPollResponse,
  type BackendPost,
} from "./mappers/post.mapper";
import type { TweetPoll } from "../types/poll";

const realPollApi = {
  async get(
    targetType: "post" | "comment",
    targetId: string,
    signal?: AbortSignal,
  ): Promise<TweetPoll | null> {
    const post =
      targetType === "post"
        ? await apiClient.get<BackendPost>(ENDPOINTS.posts.byId(targetId), { signal })
        : (
            await apiClient.get<{ target: BackendPost }>(
              ENDPOINTS.comments.thread(targetId), { signal },
            )
          ).target;
    return mapBackendPollToTweetPoll(post.poll) ?? null;
  },

  async vote(
    targetType: "post" | "comment",
    targetId: string,
    optionId: string,
  ): Promise<TweetPoll> {
    const poll = await apiClient.post<BackendPollResponse>(
      ENDPOINTS.poll.vote(targetType, targetId),
      {
        optionId,
      },
    );

    return mapBackendPollToTweetPoll(poll)!;
  },
};

export const pollApi = realPollApi;
