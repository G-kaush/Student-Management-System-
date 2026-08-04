"use client";

import AppShell from "@/components/AppShell";
import { getCourses, getStudents } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

interface DashboardSummary {
  students: number;
  courses: number;
}

export default function DashboardPage() {
  const [summary, setSummary] =
    useState<DashboardSummary>({
      students: 0,
      courses: 0,
    });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [students, courses] = await Promise.all([
        getStudents(),
        getCourses(),
      ]);

      setSummary({
        students: students.length,
        courses: courses.length,
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load dashboard",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadDashboard]);

  return (
    <AppShell>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Dashboard</h2>

        <p className="mt-1 text-slate-500">
          Overview of the Student Management System
        </p>
      </div>

      {loading && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          Loading dashboard information...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-5 sm:grid-cols-2">
          <article className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Students
            </p>

            <p className="mt-3 text-4xl font-bold">
              {summary.students}
            </p>
          </article>

          <article className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Courses
            </p>

            <p className="mt-3 text-4xl font-bold">
              {summary.courses}
            </p>
          </article>
        </div>
      )}
    </AppShell>
  );
}
