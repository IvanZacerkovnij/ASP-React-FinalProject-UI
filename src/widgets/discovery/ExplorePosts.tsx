import FeedList from "../feed/FeedList";
import { ExploreSection } from "../../features/discovery";

import { useRecommendedPosts } from "../../features/discovery";

import { Button } from "../../shared/ui/Button";
import { Spinner } from "../../shared/ui/Spinner";

export function ExplorePosts() {
  const {
    tweets,
    isLoading,
    isFetching,
    isLoadingMore,
    hasMore,
    error,
    loadMoreRef,
    retry,
    loadMore,
  } = useRecommendedPosts();

  return (
    <ExploreSection title="Дописи для вас">
      {(!error || tweets.length > 0) && (
        <FeedList
          tweets={tweets}
          isLoading={isLoading}
          emptyMessage="Поки що рекомендованих дописів немає."
        />
      )}

      {error && (
        <div className="px-4 py-6 text-center">
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={isFetching}
            onClick={() => void retry()}
          >
            Спробувати ще раз
          </Button>
        </div>
      )}

      {hasMore && !error && (
        <>
          <div className="flex justify-center p-4">
            <Button type="button" variant="outline" disabled={isFetching} onClick={() => void loadMore()}>Показати більше</Button>
          </div>
          <div ref={loadMoreRef} className="h-px" aria-hidden="true" />
          {isLoadingMore && (
            <div
              role="status"
              aria-label="Завантаження дописів"
              className="flex justify-center px-4 py-5"
            >
              <Spinner variant="inline" />
            </div>
          )}
        </>
      )}
    </ExploreSection>
  );
}
