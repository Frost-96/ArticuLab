"use client";

import { ArrowRight, Menu, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingLink } from "@/components/ui/loading-overlay";
import { cn } from "@/lib/utils";

const navLinks: Array<{ label: string; href: string }> = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function NavbarLanding() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  /** 仅在首页（/）显示导航链接 */
  const showNavLinks = pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => setMobileOpen(false);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md"
            : "bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <LoadingLink href="/" className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center justify-center rounded-xl bg-sky-600 text-white transition-all",
                scrolled ? "size-8" : "size-9",
              )}
            >
              <Sparkles className="size-4" />
            </div>
            <span className="text-lg font-semibold text-slate-900">
              ArticuLab
            </span>
          </LoadingLink>

          {showNavLinks ? (
            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          ) : (
            <div className="hidden md:block" />
          )}

          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" asChild>
              <LoadingLink href="/login">Log In</LoadingLink>
            </Button>
            <Button asChild className="bg-sky-600 hover:bg-sky-700">
              <LoadingLink href="/signup">
                Get Started Free
                <ArrowRight className="ml-1 size-4" />
              </LoadingLink>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </Button>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-slate-950/20"
            onClick={closeMenu}
          />
          <div className="animate-slide-down-fade absolute inset-x-0 top-16 border-b border-slate-200 bg-white shadow-lg">
            <nav className="flex flex-col gap-1 p-4">
              {showNavLinks &&
                navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className="rounded-lg px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    {link.label}
                  </a>
                ))}

              <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3">
                <Button variant="outline" asChild className="w-full">
                  <LoadingLink href="/login" onClick={closeMenu}>
                    Log In
                  </LoadingLink>
                </Button>
                <Button asChild className="w-full bg-sky-600 hover:bg-sky-700">
                  <LoadingLink href="/signup" onClick={closeMenu}>
                    Get Started Free
                  </LoadingLink>
                </Button>
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
