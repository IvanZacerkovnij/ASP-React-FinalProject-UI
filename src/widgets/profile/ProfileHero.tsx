import { useState } from "react";
import { Flag } from "lucide-react";

import { Avatar } from "../../shared/ui/Avatar";
import { Button } from "../../shared/ui/Button";

import { useImageCache } from "../../shared/hooks/useImageCache";
import { useFollow } from "../../features/profiles/hooks/useFollow";

import { ActionsMenu } from "../../shared/ui/ActionsMenu";
import EditProfileModal from "../../features/profiles/components/modal/EditProfileModal";
import ReportModal from "../../features/moderation/components/modal/ReportModal";

import type { UpdateProfileRequest } from "../../features/profiles/api/user.api";

import type { User } from "../../features/profiles/types/user";

interface ProfileHeroProps {
  user: User;
  isOwnProfile: boolean;
  onUpdateProfile: (data: UpdateProfileRequest) => Promise<void>;
}

export default function ProfileHero({
  user,
  isOwnProfile,
  onUpdateProfile,
}: ProfileHeroProps) {
  const { src: cachedBannerUrl } = useImageCache(user.bannerUrl);
  const { follow, unfollow, isFollowing, pending, error } = useFollow();
  const following = isFollowing(user.id);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  return (
    <>
      <div className="h-40 w-full bg-muted">
        {cachedBannerUrl && (
          <img
            src={cachedBannerUrl}
            alt=""
            className="size-full object-cover"
          />
        )}
      </div>

      <div className="px-4">
        <div className="flex min-w-0 items-end justify-between gap-2">
          <div className="-mt-12 shrink-0">
            <Avatar
              userId={user.id}
              name={user.displayName}
              fallbackName={user.username}
              src={user.avatarUrl}
              className="size-24 border-4 border-background"
            />
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 pt-3">
            {!isOwnProfile && (
              <ActionsMenu
                ariaLabel="Додаткові дії"
                menuLabel="Дії з профілем"
                items={[
                  {
                    id: "report",
                    label: "Поскаржитися",
                    icon: Flag,
                    onSelect: () => setIsReportOpen(true),
                  },
                ]}
              />
            )}
            {isOwnProfile ? (
              <Button
                className={"cursor-pointer"}
                variant="outline"
                onClick={() => setIsEditProfileOpen(true)}
              >
                Редагувати профіль
              </Button>
            ) : (
              <Button
                className={"cursor-pointer"}
                size="sm"
                variant={following ? "outline" : "primary"}
                disabled={pending}
                onClick={() => { void (following ? unfollow(user) : follow(user)).catch(() => undefined); }}
              >
                {following ? "Читаю" : "Читати"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && <p role="alert" className="p-4 text-sm text-destructive">Не вдалося оновити підписку.</p>}
      <EditProfileModal
        open={isEditProfileOpen}
        user={user}
        onClose={() => setIsEditProfileOpen(false)}
        onSave={onUpdateProfile}
      />
      {isReportOpen && (
        <ReportModal
          targetType="users"
          targetId={user.id}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </>
  );
}
