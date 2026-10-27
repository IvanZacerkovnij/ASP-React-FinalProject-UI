import { useBookmarks } from "../../features/content/hooks/useBookmarks";
import { PaginationControls } from "../../shared/ui/PaginationControls";

import FeedList from "../../widgets/feed/FeedList";
import PageHeader from "../../widgets/navigation/pageHeader/PageHeader";

export default function BookmarksPage() {
  const { tweets, isLoading, error, pagination } = useBookmarks();

  return (
    <section className="w-full max-w-3xl border-r border-border bg-background">
      <PageHeader title="Закладки" />

      <FeedList
        tweets={tweets}
        variant="bookmarks"
        isLoading={isLoading}
        error={error}
        emptyMessage="Ви ще не додали жодного поста в закладки. Зробіть це, щоб зберегти їх на майбутнє!"
      />
      <PaginationControls {...pagination} />
    </section>
  );
}
