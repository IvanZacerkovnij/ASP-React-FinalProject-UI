import { useState } from "react";
import { skipToken } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { useAuth } from "../../features/auth/hooks/useAuth";
import { useFollow } from "../../features/profiles/hooks/useFollow";

import { useGetProfileQuery, useGetFollowersQuery } from "../../features/profiles/api/queries";

import { Spinner } from "../../shared/ui/Spinner";
import { PaginationControls } from "../../shared/ui/PaginationControls";

import FollowNavigation from "../../widgets/profile/FollowNavigation";
import UserListItem from "../../features/profiles/components/user/UserListItem";
import { ConfirmModal } from "../../shared/ui/ConfirmModal";

import type { UserShort } from "../../features/profiles/types/user";

export default function FollowersPage() {
  const { username } = useParams<{
    username: string;
  }>();

  const profile = useGetProfileQuery(username ?? skipToken);
  const user =
    profile.currentData?.username === username ? profile.currentData : null;
  const isLoading = Boolean(username) && !user && !profile.error;
  const { user: currentUser } = useAuth();
  const { removeFollower, pending, error: followError } = useFollow();
  const list = useGetFollowersQuery(user?.id ?? skipToken);
  const users = list.data ?? [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFollower, setSelectedFollower] = useState<UserShort | null>(
    null,
  );

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

  const isOwnProfile = currentUser?.id === user.id;

  const handleRemoveFollower = async () => {
    if (!selectedFollower || !isOwnProfile) return;

    await removeFollower(selectedFollower);

    setIsModalOpen(false);
    setSelectedFollower(null);
  };

  return (
    <section className="max-w-3xl border-r bg-background">
      <FollowNavigation user={user} />

      <div className="divide-y divide-border">
        {users.length === 0 ? (
          <p className="p-4 text-center text-2xl font-bold text-foreground">
            Немає читачів
          </p>
        ) : (
          users.map((follower) => (
            <UserListItem
              key={follower.id}
              user={follower}
              showRemoveButton={isOwnProfile}
              onRemove={() => {
                setSelectedFollower(follower);
                setIsModalOpen(true);
              }}
            />
          ))
        )}
      </div>

      <PaginationControls hasMore={list.hasMore} isFetching={list.isFetching} error={list.error} onLoadMore={list.loadMore} onRetry={list.refetch} />
      <ConfirmModal
        busy={pending}
        error={followError ? "Не вдалося видалити читача. Спробуйте ще раз." : null}
        open={isModalOpen}
        title="Видалити читача?"
        description="Цей користувач більше не буде вашим читачем."
        cancelText="Скасувати"
        confirmText="Видалити"
        onCancel={() => {
          setIsModalOpen(false);
          setSelectedFollower(null);
        }}
        onConfirm={() => {
          void handleRemoveFollower().catch(() => undefined);
        }}
      />
    </section>
  );
}
