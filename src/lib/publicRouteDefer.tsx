import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from "react";

type DeferredBelowFoldProps = {
  children: ReactNode;
  fallback?: ReactNode;
  /** Pre-reserve space so layout does not shift when content mounts. */
  minHeight?: string;
  rootMargin?: string;
  className?: string;
};

/** Mount children when the placeholder nears the viewport. */
export function DeferredBelowFold({
  children,
  fallback = null,
  minHeight,
  rootMargin = "240px 0px",
  className,
}: DeferredBelowFoldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin, threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={hostRef}
      className={className}
      style={minHeight && !visible ? { minHeight } : undefined}
    >
      {visible ? children : fallback}
    </div>
  );
}

/** Run a callback once the main thread is idle (non-blocking follow-up work). */
export function scheduleIdleWork(work: () => void, timeoutMs = 2000): void {
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(work, { timeout: timeoutMs });
    return;
  }
  window.setTimeout(work, 1);
}

type IdleMountProps = {
  children: ReactNode;
  timeoutMs?: number;
};

/** Mount children after idle — keeps hero/headline paint unblocked. */
export function IdleMount({ children, timeoutMs = 1600 }: IdleMountProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    scheduleIdleWork(() => setReady(true), timeoutMs);
  }, [timeoutMs]);

  return ready ? children : null;
}

type ViewportDeferredProps = {
  children: ReactNode;
  rootMargin?: string;
  minHeight?: string;
  className?: string;
};

/** Mount when the anchor nears the viewport — avoids post-paint footer work above the fold. */
export function ViewportDeferred({
  children,
  rootMargin = "320px 0px",
  minHeight,
  className,
}: ViewportDeferredProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin, threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={hostRef}
      className={className}
      style={minHeight && !visible ? { minHeight } : undefined}
    >
      {visible ? children : null}
    </div>
  );
}

type LazyBelowFoldProps<P extends object> = {
  load: () => Promise<{ default: ComponentType<P> }>;
  props: P;
  minHeight?: string;
  rootMargin?: string;
  className?: string;
};

/** Lazy import + viewport gate for below-the-fold sections. */
export function LazyBelowFold<P extends object>({
  load,
  props,
  minHeight,
  rootMargin,
  className,
}: LazyBelowFoldProps<P>) {
  const LazyComponent = lazy(load) as LazyExoticComponent<ComponentType<P>>;

  return (
    <DeferredBelowFold minHeight={minHeight} rootMargin={rootMargin} className={className}>
      <Suspense fallback={null}>
        <LazyComponent {...props} />
      </Suspense>
    </DeferredBelowFold>
  );
}
