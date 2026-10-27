import { BadgeCheck, type LucideProps } from "lucide-react";

import { ADMIN_BADGE_COLOR, VERIFIED_BADGE_COLOR } from "../constants/profile";
import { useAuth } from "../../auth/index";

import { cn } from "../../../shared/lib/cn";

import type { User } from "../types/user";

type VerifiedBadgeProps = LucideProps & {
  user: Pick<User, "id" | "role" | "isVerified">;
};

export function VerifiedBadge({ user, className, ...props }: VerifiedBadgeProps) {
  const { user: currentUser } = useAuth();
  const sessionUser = currentUser?.id === user.id ? currentUser : null;
  const role = sessionUser?.role ?? user.role;
  const isAdmin = role === "Admin";
  if (!isAdmin && !user.isVerified) return null;

  return (
    <BadgeCheck
      {...props}
      fill={isAdmin ? ADMIN_BADGE_COLOR : VERIFIED_BADGE_COLOR}
      className={cn("shrink-0 text-background", className)}
      role="img"
      aria-hidden={false}
      aria-label={
        isAdmin ? "Адміністратор" : (props["aria-label"] ?? "Верифікований профіль")
      }
    />
  );
}
