import { useNavigate, useParams } from "react-router-dom";

import BackButton from "../../widgets/navigation/pageHeader/BackButton";

import { skipToken } from "@tanstack/react-query";

import { useAdminUserQuery, useAdminUserActionMutation } from "../../features/moderation/queries";

import { useActionConfirmation } from "../../features/moderation/components/ActionConfirmation";
import { UserSummary } from "../../features/moderation/components/Summaries";
import { QueryState } from "../../features/moderation/components/ListControls";
import { UserActions } from "../../features/moderation/components/UserActions";

import { APP_ROUTES } from "../../shared/config/routes";
import { USER_ACTION_LABELS } from "../../features/moderation/constants";

import { formatCount, formatDateTime } from "../../shared/lib/format";

import type { UserAction } from "../../features/moderation/types";

export default function UserPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const query = useAdminUserQuery(userId ?? skipToken);
  const [mutate] = useAdminUserActionMutation();
  const confirmation = useActionConfirmation();
  const user = query.currentData;

  const act = (action: UserAction) => {
    if (!user) return;
    confirmation.ask({
      label: USER_ACTION_LABELS[action],
      tasks: [
        { id: user.id, run: () => mutate({ id: user.id, action }).unwrap() },
      ],
      onDone: (failed) => {
        if (!failed.length && action === "delete") navigate(APP_ROUTES.ADMIN_USERS, { replace: true });
      },
    });
  };

  return (
    <>
      <header className="flex items-center gap-3">
        <BackButton
          fallbackTo={APP_ROUTES.ADMIN_USERS}
          ariaLabel="До користувачів"
          className="size-11 rounded-sm"
        />
        <h1 className="text-2xl font-bold">Акаунт користувача</h1>
      </header>
      <QueryState
        loading={query.isFetching && !user}
        error={query.error}
        retry={query.refetch}
        empty={!user}
      >
        {user && (
          <section className="space-y-5 overflow-hidden rounded-2xl border border-border p-5">
            <UserSummary user={user} linkName={false} />
            <p className="wrap-break-word whitespace-pre-wrap">
              {user.bio || "Опис відсутній."}
            </p>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="wrap-break-word">{user.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Приєднався</dt>
                <dd>{formatDateTime(user.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Читачі / читає</dt>
                <dd>
                  {formatCount(user.followersCount)} /{" "}
                  {formatCount(user.followingCount)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Дописи</dt>
                <dd>{formatCount(user.postsCount)}</dd>
              </div>
            </dl>
            <div className="border-t border-border pt-4">
              <UserActions
                user={user}
                busy={confirmation.busy || query.isFetching}
                onAction={act}
              />
            </div>
          </section>
        )}
      </QueryState>
      {confirmation.modal}
    </>
  );
}
