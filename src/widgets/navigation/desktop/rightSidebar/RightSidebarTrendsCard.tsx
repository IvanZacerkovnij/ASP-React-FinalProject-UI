import { useRef } from "react";
import { Link } from "react-router-dom";

import RightSidebarCard, {
  sidebarCardActionClassName,
} from "./RightSidebarCard";
import { TrendsList } from "../../../../features/discovery/components/recommendations/TrendsList";

import { SIDEBAR } from "../../../../shared/constants/layout";
import { APP_ROUTES } from "../../../../shared/config/routes";

import { useTrends } from "../../../../features/discovery/hooks/useRecommendations";

import { useTrendFeedback } from "../../../../features/discovery/model/trend-feedback";

function TrendsListContent({
  result,
}: {
  result: ReturnType<typeof useTrends>;
}) {
  const { dismiss } = useTrendFeedback();
  const contentRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={contentRef} className="-mx-4" tabIndex={-1}>
      <TrendsList
        {...result}
        compact
        onDismiss={(trendId, reason) =>
          dismiss(trendId, reason)
        }
        onEmptyFocus={() => contentRef.current?.focus()}
      />
    </div>
  );
}

export default function RightSidebarTrendsCard() {
  const result = useTrends(SIDEBAR.TRENDS_LIMIT);
  const showMore =
    !result.isLoading && !result.error && result.trends.length > 0;

  return (
    <RightSidebarCard
      title="Популярне"
      footer={
        showMore ? (
          <Link
            to={APP_ROUTES.explore("trending")}
            className={sidebarCardActionClassName}
          >
            Показати більше
          </Link>
        ) : undefined
      }
    >
      <TrendsListContent result={result} />
    </RightSidebarCard>
  );
}
