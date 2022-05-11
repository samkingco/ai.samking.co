import { useEffect, useState } from "react";

export function useIntersectionObserver(
  ref: React.MutableRefObject<any>,
  {
    threshold = 0,
    root,
    rootMargin = "50%",
    triggerOnce = true,
  }: IntersectionObserverInit & { triggerOnce?: boolean }
) {
  const supportsFeature = Boolean(
    typeof window !== "undefined" &&
      window &&
      "IntersectionObserver" in window &&
      "IntersectionObserverEntry" in window &&
      "intersectionRatio" in window.IntersectionObserverEntry.prototype &&
      "isIntersecting" in window.IntersectionObserverEntry.prototype
  );

  const [state, setState] = useState<{
    isVisible: boolean;
    hasTriggered: boolean;
    entry: IntersectionObserver | undefined;
  }>({
    isVisible: false,
    hasTriggered: false,
    entry: undefined,
  });

  let observer: IntersectionObserver | undefined = !supportsFeature
    ? undefined
    : new IntersectionObserver(
        (entries, observerInstance) => {
          // In the case that we only want to trigger once, we can consider
          // that if any entry has intersected, we've scrolled past the observed
          // element.
          if (triggerOnce) {
            const hasIntersected = entries.some((e) => e.isIntersecting);
            if (hasIntersected) {
              setState({
                isVisible: hasIntersected,
                hasTriggered: true,
                entry: observerInstance,
              });

              observerInstance.unobserve(ref.current);
            }
            return;
          }

          // Otherwise, in situations where scrolling is **really** fast or the browser
          // is busy, we can consider that the last entry is the most up-to-date.
          const isIntersecting = entries[entries.length - 1].isIntersecting;
          setState({
            isVisible: isIntersecting,
            hasTriggered: true,
            entry: observerInstance,
          });

          return;
        },
        {
          threshold: threshold || 0,
          root: root || null,
          rootMargin: rootMargin || "0%",
        }
      );

  useEffect(() => {
    if (ref.current && !state.hasTriggered && observer) {
      observer.observe(ref.current);
    }
  });

  useEffect(() => {
    // We disconnect the observer on unmount to prevent memory leaks etc.
    return () => observer && observer.disconnect();
    // eslint-disable react-hooks/exhaustive-deps
  }, [observer]);

  return { ...state, supportsFeature };
}
