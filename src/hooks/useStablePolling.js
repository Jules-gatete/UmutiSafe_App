import { useEffect, useRef } from 'react';

/**
 * useStablePolling
 * - Calls provided callback immediately (background=false) and then on an interval.
 * - Only triggers background polls when the document is visible and window has focus.
 * - Stores the latest callback in a ref so callers may pass inline functions without
 *   forcing the hook to teardown/recreate the interval on every render.
 *
 * callback signature: async ({ background }) => void
 */
export default function useStablePolling(callback, interval = 10000) {
  const callbackRef = useRef(callback);

  // keep ref up to date with latest callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    let mounted = true;

    const invoke = (background = false) => {
      if (!mounted) return;
      try {
        const cb = callbackRef.current;
        if (cb) cb({ background });
      } catch (e) {
        // swallow — individual callbacks should handle their own errors
        // console.error('useStablePolling callback error', e);
      }
    };

    // initial immediate invocation
    invoke(false);

    const id = setInterval(() => {
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        invoke(true);
      }
    }, interval);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && document.hasFocus()) invoke(true);
    };

    const handleFocus = () => invoke(true);

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      mounted = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
    // NOTE: intentionally omit `callback` from deps — the ref handles updates.
  }, [interval]);
}
