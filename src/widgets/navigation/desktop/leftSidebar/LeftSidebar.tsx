import { useAuth } from "../../../../features/auth/hooks/useAuth";

import Navigation from "../navigation/Navigation";
import LeftSidebarProfile from "./LeftSidebarProfile";
import LeftSidebarHeader from "./LeftSidebarHeader";

export default function LeftSidebar() {
  const { user } = useAuth();

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-0 flex h-screen flex-col border-r border-border px-6 py-6">
        <LeftSidebarHeader />

        <div className="mt-6 flex-1">
          <Navigation vertical />
        </div>

        {user && (
          <div className="mt-auto flex flex-col gap-2">
            <LeftSidebarProfile />
          </div>
        )}
      </div>
    </aside>
  );
}
