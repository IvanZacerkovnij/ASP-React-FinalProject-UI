import { useLocation } from "react-router-dom";

import RightSidebarSearchBox from "./RightSidebarSearchBox";
import RightSidebarSuggestedUsers from "./RightSidebarSuggestedUsers";
import RightSidebarTrendsCard from "./RightSidebarTrendsCard";
import RightSidebarFooterLinks from "./RightSidebarFooterLinks";
import RightSidebarSearchFilters from "./RightSidebarSearchFilters";

import { APP_ROUTES } from "../../../../shared/config/routes";

export default function RightSidebar() {
  const location = useLocation();
  const isSearchPage = location.pathname === APP_ROUTES.SEARCH;
  const isExplorePage = location.pathname === APP_ROUTES.EXPLORE;

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-4 flex flex-col gap-4 px-4 py-4">
        {isSearchPage ? (
          <RightSidebarSearchFilters />
        ) : !isExplorePage ? (
          <RightSidebarSearchBox />
        ) : null}

        <RightSidebarTrendsCard />
        <RightSidebarSuggestedUsers />
        <RightSidebarFooterLinks />
      </div>
    </aside>
  );
}
