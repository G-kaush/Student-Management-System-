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
import { useEffect } from "react";

interface AppShellProps {
  children: ReactNode;
}

const navigation = [
  {
    href: "/dashboard",
    label: "Dashboard",
  },
  {
    href: "/students",
    label: "Students",
  },
  {
    href: "/courses",
    label: "Courses",
  },
  {
    href: "/users",
    label: "Users",
    adminOnly: true,
  },
];

export default function AppShell({
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = getCurrentUser();
  const visibleNavigation = navigation.filter(
    (item) =>
      !item.adminOnly || currentUser?.role === "ADMIN",
  );

  useEffect(() => {
    if (!hasAuthSession()) {
      router.replace("/login");
    }
  }, [router]);

  function handleLogout() {
    clearAuthSession();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Mobile header */}
      <header className="border-b border-slate-200 bg-white md:hidden">
        <div className="px-4 py-4">
          <h1 className="text-lg font-bold text-slate-900">
            Student Management
          </h1>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
          {visibleNavigation.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="mx-auto flex min-h-screen max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-6 md:block">
          <h1 className="text-xl font-bold text-slate-900">
            Student Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Administration Portal
          </p>

          <nav className="mt-8 flex flex-col gap-2">
            {visibleNavigation.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-10 w-full rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Log out
          </button>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
