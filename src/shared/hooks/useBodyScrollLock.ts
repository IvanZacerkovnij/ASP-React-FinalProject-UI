import { useEffect } from "react";

import { lockBodyScroll } from "../lib/bodyScrollLock";

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (active) return lockBodyScroll();
  }, [active]);
}
