"use client";

import {
  clearAuthSession,
  getCurrentUser,
  hasAuthSession,
} from "@/lib/api";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import type { ReactNode } from "react";
import {
  useEffect,
  useState,
} from "react";
import type {
  CurrentUser,
  UserRole,
} from "@/types";

interface AppShellProps {
  children: ReactNode;
}

const navigation = [
  {
    href: "/dashboard",
    label: "Dashboard",
    token: "DB",
    roles: ["ADMIN", "INSTRUCTOR", "STUDENT"],
  },
  {
    href: "/profile",
    label: "Profile",
    token: "PR",
    roles: ["ADMIN", "INSTRUCTOR", "STUDENT"],
  },
  {
    href: "/students",
    label: "Students",
    token: "ST",
    roles: ["ADMIN", "INSTRUCTOR"],
  },
  {
    href: "/enrollments",
    label: "Enrollments",
    token: "EN",
    roles: ["ADMIN", "INSTRUCTOR"],
  },
  {
    href: "/courses",
    label: "Courses",
    token: "CO",
    roles: ["ADMIN", "INSTRUCTOR", "STUDENT"],
  },
  {
    href: "/my-courses",
    label: "My Courses",
    token: "MC",
    roles: ["STUDENT"],
  },
  {
    href: "/users",
    label: "Users",
    token: "US",
    roles: ["ADMIN"],
  },
] satisfies Array<{
  href: string;
  label: string;
  token: string;
  roles: UserRole[];
}>;

export default function AppShell({
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);
  const [mounted, setMounted] = useState(false);

  const visibleNavigation = navigation.filter(
    (item) =>
      currentUser !== null &&
      item.roles.includes(currentUser.role),
  );
  const currentRoute = navigation.find(
    (item) => item.href === pathname,
  );
  const canAccessCurrentPath =
    currentUser !== null &&
    (currentRoute === undefined ||
      currentRoute.roles.includes(currentUser.role));

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!hasAuthSession()) {
        router.replace("/login");
        return;
      }

      setCurrentUser(getCurrentUser());
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [router]);

  useEffect(() => {
    if (
      !mounted ||
      currentUser === null ||
      canAccessCurrentPath
    ) {
      return;
    }

    router.replace(
      "/dashboard",
    );
  }, [
    canAccessCurrentPath,
    currentUser,
    mounted,
    router,
  ]);

  function handleLogout() {
    clearAuthSession();
    router.replace("/login");
  }

  const pageLabel = currentRoute?.label ?? "Workspace";

  return (
    <div className="min-h-screen text-slate-950">
      {/* Mobile header */}
      <header className="border-b border-white/70 bg-white/82 shadow-sm backdrop-blur-xl md:hidden">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="brand-mark text-sm">SM</div>
            <div>
              <h1 className="text-lg font-bold text-slate-950">
                Student Management
              </h1>

              {currentUser && (
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
                  {currentUser.role}
                </p>
              )}
            </div>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
          {visibleNavigation.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-700 hover:bg-[rgba(20,184,166,0.14)] hover:text-cyan-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="mx-auto flex min-h-screen max-w-[92rem] gap-6 p-0 md:p-6 lg:p-8">
        {/* Desktop sidebar */}
        <aside className="glass-panel-strong app-sidebar sticky top-6 hidden h-[calc(100vh-3rem)] w-[17.5rem] shrink-0 p-5 md:flex md:flex-col lg:top-8 lg:h-[calc(100vh-4rem)]">
          <div className="flex items-center gap-3">
            <div className="brand-mark">SM</div>
            <div>
              <h1 className="text-base font-bold text-slate-950">
                Student Management
              </h1>

              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Academic Workspace
              </p>
            </div>
          </div>

          {currentUser && (
            <div className="account-card mt-6 rounded-lg px-3 py-3">
              <p className="truncate text-sm font-semibold text-slate-950">
                {currentUser.username}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
                {currentUser.role}
              </p>
            </div>
          )}

          <nav className="mt-7 flex flex-col gap-1.5">
            {visibleNavigation.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                      : "border-transparent text-slate-600 hover:border-[rgba(148,252,239,0.28)] hover:bg-[rgba(20,184,166,0.14)] hover:text-cyan-100"
                  }`}
                >
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-md text-[0.68rem] font-bold ${
                      active
                        ? "bg-black/10 text-slate-950"
                        : "bg-white/5 text-teal-700 group-hover:bg-[rgba(34,211,238,0.18)] group-hover:text-cyan-100"
                    }`}
                  >
                    {item.token}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="secondary-button mt-auto w-full text-center text-sm"
          >
            Log out
          </button>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-0">
          <header className="app-topbar mb-6 hidden items-center justify-between gap-4 px-5 py-3 md:flex">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                Workspace / {pageLabel}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Student Management System
              </p>
            </div>

            {currentUser && (
              <div className="flex items-center gap-3 rounded-lg border border-slate-200/70 bg-white/52 px-3 py-2">
                <div className="grid h-8 w-8 place-items-center rounded-md bg-teal-50 text-xs font-bold text-teal-700">
                  {currentUser.username
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="max-w-40 truncate text-sm font-semibold text-slate-950">
                    {currentUser.username}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
                    {currentUser.role}
                  </p>
                </div>
              </div>
            )}
          </header>

          {mounted && canAccessCurrentPath ? (
            children
          ) : (
            <div className="glass-panel p-6 text-slate-600">
              Loading workspace...
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
