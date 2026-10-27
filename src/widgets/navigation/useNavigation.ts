import { Shield } from "lucide-react";

import { useAuth } from "../../features/auth/hooks/useAuth";

import { MAIN_NAVIGATION, type NavigationItem } from "../../shared/constants/navigation";
import { APP_ROUTES } from "../../shared/config/routes";

export function useNavigation() {
  const { user } = useAuth();

  const navigation: NavigationItem[] =
    user?.role === "Admin"
      ? [
          ...MAIN_NAVIGATION,
          {
            label: "Адмін-панель",
            icon: Shield,
            getPath: () => APP_ROUTES.ADMIN,
            requiresAuth: true,
            mobilePlacement: ["more"],
          },
        ]
      : MAIN_NAVIGATION;

  return navigation
    .filter((item) => !item.requiresAuth || !!user)
    .map((item) => ({
      ...item,
      to: item.getPath(user),
    }));
}
