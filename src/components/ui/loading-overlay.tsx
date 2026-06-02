"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingOverlayContextValue = {
  isLoading: boolean;
  label: string;
  showLoading: (label?: string) => void;
  hideLoading: () => void;
};

type LoadingRouterOptions = {
  scroll?: boolean;
  transitionTypes?: string[];
  loadingLabel?: string;
};

type LoadingLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> & {
    loadingLabel?: string;
  };

const LoadingOverlayContext =
  createContext<LoadingOverlayContextValue | null>(null);

function isModifiedNavigation(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}

function isHashOnlyNavigation(targetHref: string) {
  if (typeof window === "undefined") {
    return false;
  }

  const target = new URL(targetHref, window.location.href);
  return (
    target.pathname === window.location.pathname &&
    target.search === window.location.search &&
    target.hash !== window.location.hash
  );
}

function isCurrentPageNavigation(targetHref: string) {
  if (typeof window === "undefined") {
    return false;
  }

  const target = new URL(targetHref, window.location.href);
  return (
    target.pathname === window.location.pathname &&
    target.search === window.location.search &&
    target.hash === window.location.hash
  );
}

function shouldShowLinkLoading(
  event: MouseEvent<HTMLAnchorElement>,
  href: LinkProps["href"],
  target?: string,
) {
  if (event.defaultPrevented || isModifiedNavigation(event)) {
    return false;
  }

  if (target && target !== "_self") {
    return false;
  }

  if (typeof href !== "string") {
    return true;
  }

  const hrefValue = href;
  if (
    hrefValue.startsWith("#") ||
    hrefValue.startsWith("mailto:") ||
    hrefValue.startsWith("tel:")
  ) {
    return false;
  }

  return !isHashOnlyNavigation(hrefValue) && !isCurrentPageNavigation(hrefValue);
}

export function LoadingOverlayProvider({
  children,
}: {
  children: ReactNode;
}) {
  const t = useTranslations("common");
  const defaultLabel = t("loading");
  const [state, setState] = useState({
    isLoading: false,
    label: defaultLabel,
  });

  const hideLoading = useCallback(() => {
    setState((current) =>
      current.isLoading
        ? { isLoading: false, label: defaultLabel }
        : current,
    );
  }, [defaultLabel]);

  const showLoading = useCallback(
    (label?: string) => {
      setState({
        isLoading: true,
        label: label || defaultLabel,
      });
    },
    [defaultLabel],
  );

  const value = useMemo(
    () => ({
      isLoading: state.isLoading,
      label: state.label,
      showLoading,
      hideLoading,
    }),
    [hideLoading, showLoading, state.isLoading, state.label],
  );

  return (
    <LoadingOverlayContext.Provider value={value}>
      <Suspense fallback={null}>
        <LoadingRouteReset />
      </Suspense>
      {children}
      <LoadingOverlay isLoading={state.isLoading} label={state.label} />
    </LoadingOverlayContext.Provider>
  );
}

function LoadingRouteReset() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hideLoading } = useAppLoading();

  useEffect(() => {
    hideLoading();
  }, [pathname, searchParams, hideLoading]);

  return null;
}

export function LoadingOverlay({
  isLoading,
  label,
}: {
  isLoading: boolean;
  label: string;
}) {
  if (!isLoading) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/20 px-4 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex min-w-40 flex-col items-center gap-3 rounded-lg border border-slate-200 bg-white px-6 py-5 text-slate-900 shadow-xl">
        <Loader2 className="size-7 animate-spin text-sky-600" />
        <p className="text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}

export function useAppLoading() {
  const context = useContext(LoadingOverlayContext);

  if (!context) {
    throw new Error("useAppLoading must be used inside LoadingOverlayProvider");
  }

  return context;
}

export function useLoadingRouter() {
  const router = useRouter();
  const { hideLoading, showLoading } = useAppLoading();
  const pendingTimerRef = useRef<number | null>(null);

  const clearPendingTimer = useCallback(() => {
    if (pendingTimerRef.current !== null) {
      window.clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
  }, []);

  const scheduleFallbackHide = useCallback(
    (delayMs = 8000) => {
      clearPendingTimer();
      pendingTimerRef.current = window.setTimeout(() => {
        pendingTimerRef.current = null;
        hideLoading();
      }, delayMs);
    },
    [clearPendingTimer, hideLoading],
  );

  useEffect(() => {
    return clearPendingTimer;
  }, [clearPendingTimer]);

  return useMemo(
    () => ({
      push: (href: string, options?: LoadingRouterOptions) => {
        if (isCurrentPageNavigation(href)) {
          hideLoading();
          return;
        }
        showLoading(options?.loadingLabel);
        scheduleFallbackHide();
        const navigateOptions = options
          ? {
              scroll: options.scroll,
              transitionTypes: options.transitionTypes,
            }
          : undefined;
        router.push(href, navigateOptions);
      },
      replace: (href: string, options?: LoadingRouterOptions) => {
        if (isCurrentPageNavigation(href)) {
          hideLoading();
          return;
        }
        showLoading(options?.loadingLabel);
        scheduleFallbackHide();
        const navigateOptions = options
          ? {
              scroll: options.scroll,
              transitionTypes: options.transitionTypes,
            }
          : undefined;
        router.replace(href, navigateOptions);
      },
      refresh: (label?: string) => {
        showLoading(label);
        router.refresh();
        scheduleFallbackHide(1200);
      },
      back: (label?: string) => {
        showLoading(label);
        scheduleFallbackHide();
        router.back();
      },
      forward: (label?: string) => {
        showLoading(label);
        scheduleFallbackHide();
        router.forward();
      },
      prefetch: router.prefetch,
    }),
    [hideLoading, router, scheduleFallbackHide, showLoading],
  );
}

export function LoadingLink({
  children,
  className,
  href,
  loadingLabel,
  onClick,
  target,
  ...props
}: LoadingLinkProps) {
  const { showLoading } = useAppLoading();

  return (
    <Link
      href={href}
      target={target}
      className={cn(className)}
      onClick={(event) => {
        onClick?.(event);
        if (shouldShowLinkLoading(event, href, target)) {
          showLoading(loadingLabel);
        }
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
