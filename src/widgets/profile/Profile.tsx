import FeedList from "../feed/FeedList";
import { PaginationControls, type PaginationControlsProps } from "../../shared/ui/PaginationControls";
import ProfileHeader from "./ProfileHeader";
import ProfileHero from "./ProfileHero";
import ProfileInfo from "./ProfileInfo";
import ProfileStats from "./ProfileStats";
import ProfileTabs from "./ProfileTabs";

import type { UpdateProfileRequest } from "../../features/profiles/api/user.api";

import type { ProfileTab } from "../../features/profiles/hooks/useProfile";

import type { Tweet } from "../../features/content/types/tweet";
import type { User } from "../../features/profiles/types/user";

interface ProfileProps {
  pagination: PaginationControlsProps;
  user: User;
  tweets: Tweet[];
  activeTab: ProfileTab;
  isTabLoading: boolean;
  tabError?: string | null;
  isOwnProfile: boolean;
  onUpdateProfile: (data: UpdateProfileRequest) => Promise<void>;
}

export default function Profile({
  user,
  pagination,
  tweets,
  activeTab,
  isTabLoading,
  tabError,
  isOwnProfile,
  onUpdateProfile,
}: ProfileProps) {
  const emptyMessage =
    activeTab === "likes"
      ? "У цій вкладці ще немає лайкнутих постів."
      : activeTab === "reposts"
        ? "У цій вкладці ще немає репостів."
        : activeTab === "replies"
          ? "У цій вкладці ще немає відповідей."
          : "Користувач ще нічого не публікував.";

  return (
    <section className="max-w-3xl border-r border-border bg-background">
      <ProfileHeader user={user} />

      <ProfileHero
        user={user}
        isOwnProfile={isOwnProfile}
        onUpdateProfile={onUpdateProfile}
      />

      <ProfileInfo user={user} />

      <ProfileStats user={user} isOwnProfile={isOwnProfile} />

      <ProfileTabs activeTab={activeTab} />

      <FeedList
        tweets={tweets}
        variant={activeTab === "replies" ? "replies" : "feed"}
        repostedBy={activeTab === "reposts" ? user : undefined}
        showReplyContext={activeTab === "likes" || activeTab === "reposts"}
        isLoading={isTabLoading}
        error={tabError}
        emptyMessage={emptyMessage}
      />
      <PaginationControls {...pagination} />
    </section>
  );
}
