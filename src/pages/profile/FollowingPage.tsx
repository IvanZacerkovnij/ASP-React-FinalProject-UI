import { skipToken } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { useGetProfileQuery, useGetFollowingQuery } from "../../features/profiles/api/queries";

import { Spinner } from "../../shared/ui/Spinner";
import { PaginationControls } from "../../shared/ui/PaginationControls";

import FollowNavigation from "../../widgets/profile/FollowNavigation";
import UserListItem from "../../features/profiles/components/user/UserListItem";

export default function FollowingPage() {
  const { username } = useParams<{
    username: string;
  }>();

  const profile = useGetProfileQuery(username ?? skipToken);
  const user =
    profile.currentData?.username === username ? profile.currentData : null;
  const isLoading = Boolean(username) && !user && !profile.error;
  const list = useGetFollowingQuery(user?.id ?? skipToken);
  const users = list.data ?? [];

  if (isLoading) {
    return (
      <section className="max-w-3xl border-r bg-background">
        <div className="flex justify-center py-16">
          <Spinner variant="inline" />
        </div>
      </section>
    );
  }

  if (!user) return null;

  return (
    <section>
      <FollowNavigation user={user} />

      <div className="divide-y divide-border">
        {users.length === 0 ? (
          <p className="p-4 text-center text-2xl font-bold text-foreground">
            Немає підписок
          </p>
        ) : (
          users.map((followedUser) => (
            <UserListItem key={followedUser.id} user={followedUser} />
          ))
        )}
      </div>
      <PaginationControls hasMore={list.hasMore} isFetching={list.isFetching} error={list.error} onLoadMore={list.loadMore} onRetry={list.refetch} />
    </section>
  );
}
