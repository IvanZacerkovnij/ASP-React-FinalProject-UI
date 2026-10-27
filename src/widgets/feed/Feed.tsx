import { useFeed } from "../../features/content/hooks/useFeed";
import { Button } from "../../shared/ui/Button";

import FeedList from "./FeedList";
import PageHeader from "../navigation/pageHeader/PageHeader";
import TweetComposer from "../../features/content/components/tweet/TweetComposer/TweetComposer";

export default function Feed() {
  const { tweets, isLoading, error, reload } = useFeed();

  return (
    <section className="w-full max-w-3xl border-r border-border bg-background">
      <PageHeader title="Головна" showMobileLogo />

      <TweetComposer />

      <FeedList
        tweets={tweets}
        isLoading={isLoading}
        error={error}
        emptyMessage="Поки що тут порожньо. Опублікуйте перший твіт!"
      />
      {error && <Button type="button" variant="outline" onClick={() => void reload()}>Спробувати ще раз</Button>}
    </section>
  );
}
