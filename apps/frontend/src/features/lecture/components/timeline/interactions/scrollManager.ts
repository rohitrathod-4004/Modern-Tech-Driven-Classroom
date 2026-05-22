/**
 * Encapsulates scrolling heuristics to determine when automatic scrolling is justified.
 * Separated from React lifecycle to remain pure and highly testable.
 */

export const shouldAutoScroll = (
  activeIndex: number,
  firstVisibleIndex: number,
  lastVisibleIndex: number,
  isAutoScrollEnabled: boolean,
  userScrolled: boolean
): boolean => {
  // Cannot auto-scroll if user disabled it or if we don't have an active index
  if (!isAutoScrollEnabled || userScrolled || activeIndex === -1) {
    return false;
  }

  // Define the comfortable viewing bounds
  // If the active item is too close to the edges of the visible window, we should scroll it.
  const padding = 2; // Number of items to keep visible above/below the active item

  const isTooHigh = activeIndex < firstVisibleIndex + padding;
  const isTooLow = activeIndex > lastVisibleIndex - padding;

  return isTooHigh || isTooLow;
};
