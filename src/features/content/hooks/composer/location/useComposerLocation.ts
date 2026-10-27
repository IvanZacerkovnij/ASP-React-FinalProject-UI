import { useComposerPopup } from "../useComposerPopup";
import { useLocationSearch } from "../../location/useLocationSearch";

export function useComposerLocation() {
  const popup = useComposerPopup();
  const search = useLocationSearch();

  return {
    ...popup,

    query: search.query,
    setQuery: search.setQuery,

    locations: search.locations,

    loading: search.loading,
    error: search.error,
  };
}
