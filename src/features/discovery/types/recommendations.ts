import type { CursorPage } from "../../../shared/types/api";
import { type UserShort } from "../../profiles/index";
import { type Tweet } from "../../content/index";

export interface TrendRecommendation {
  id: string;
  title: string;
  context: string;
  query: string;
  postsCount?: number;
}

export interface TrendRecommendationsResponse {
  items: TrendRecommendation[];
}

export type PaginatedRecommendations = CursorPage<UserShort>;
export type PaginatedRecommendedPosts = CursorPage<Tweet>;

export type ExploreCategory = "news" | "sports" | "entertainment";
export type ExploreTab = "overview" | "trending" | ExploreCategory;

export type TrendFeedbackReason =
  | "irrelevant_content"
  | "spam"
  | "abusive"
  | "not_interested"
  | "duplicate"
  | "harmful_or_spam";
