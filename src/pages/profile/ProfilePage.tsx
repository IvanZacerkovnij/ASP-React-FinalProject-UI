import { useParams, useSearchParams } from "react-router-dom";

import { userApi } from "../../features/profiles/api/user.api";
import type { UpdateProfileRequest } from "../../features/profiles/api/user.api";

import { useAuth } from "../../features/auth/hooks/useAuth";
import { useProfile } from "../../features/profiles/hooks/useProfile";
import type { ProfileTab } from "../../features/profiles/hooks/useProfile";

import { Spinner } from "../../shared/ui/Spinner";

import Profile from "../../widgets/profile/Profile";
import PageHeader from "../../widgets/navigation/pageHeader/PageHeader";

import { APP_ROUTES } from "../../shared/config/routes";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [searchParams] = useSearchParams();
  const { user: currentUser, updateUser: updateAuthUser } = useAuth();
  const tabParam = searchParams.get("tab");

  const activeTab: ProfileTab =
    tabParam === "replies" || tabParam === "likes" || tabParam === "reposts"
      ? tabParam
      : "posts";

  const { user, tweets, isLoading, isTabLoading, notFound, tabError, pagination } =
    useProfile(username, activeTab);

  const handleUpdateProfile = async (data: UpdateProfileRequest) => {
    const updatedUser = await userApi.updateProfile(data);

    updateAuthUser(updatedUser);
  };

  if (isLoading) {
    return (
      <section className="max-w-3xl border-r border-border">
        <PageHeader title={`@${username ?? ""}`} backTo={APP_ROUTES.HOME} />
        <div className="flex justify-center py-16">
          <Spinner variant="inline" />
        </div>
      </section>
    );
  }

  if (notFound || !user) {
    return (
      <section className="max-w-3xl border-r border-border">
        <PageHeader title="Профіль" backTo={APP_ROUTES.HOME} />
        <div className="px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-foreground">
            Профіль не знайдено
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Користувача @{username} не існує.
          </p>
        </div>
      </section>
    );
  }

  return (
    <Profile
      pagination={pagination}
      user={user}
      tweets={tweets}
      activeTab={activeTab}
      isTabLoading={isTabLoading}
      tabError={tabError}
      isOwnProfile={currentUser?.id === user.id}
      onUpdateProfile={handleUpdateProfile}
    />
  );
}
