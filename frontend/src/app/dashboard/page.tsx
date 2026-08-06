"use client";

import AppShell from "@/components/AppShell";
import {
  getAvailableCourses,
  getCourses,
  getCurrentUser,
  getEnrollments,
  getMyCourses,
  getRegisteredStudents,
  getUsers,
} from "@/lib/api";
import type {
  Course,
  CurrentUser,
  EnrollmentResponse,
  UserResponse,
} from "@/types";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

interface DashboardSummary {
  students: number;
  courses: number;
  enrollments: number;
  pendingInstructors: number;
  availableCourses: number;
  enrolledCourses: number;
}

const emptySummary: DashboardSummary = {
  students: 0,
  courses: 0,
  enrollments: 0,
  pendingInstructors: 0,
  availableCourses: 0,
  enrolledCourses: 0,
};

export default function DashboardPage() {
  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);
  const [summary, setSummary] =
    useState<DashboardSummary>(emptySummary);
  const [recentEnrollments, setRecentEnrollments] =
    useState<EnrollmentResponse[]>([]);
  const [latestCourses, setLatestCourses] = useState<
    Course[]
  >([]);
  const [pendingInstructors, setPendingInstructors] =
    useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    if (currentUser === null) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (currentUser.role === "STUDENT") {
        const [available, enrolled] = await Promise.all([
          getAvailableCourses(),
          getMyCourses(),
        ]);

        setSummary({
          ...emptySummary,
          availableCourses: available.length,
          enrolledCourses: enrolled.length,
        });
        setLatestCourses(
          [...available]
            .sort((left, right) => right.id - left.id)
            .slice(0, 4),
        );
        setRecentEnrollments([]);
        setPendingInstructors([]);
        return;
      }

      if (currentUser.role === "INSTRUCTOR") {
        const [courses, enrollments] = await Promise.all([
          getCourses(),
          getEnrollments(),
        ]);

        const studentIds = new Set(
          enrollments.map(
            (enrollment) => enrollment.student.id,
          ),
        );

        setSummary({
          ...emptySummary,
          students: studentIds.size,
          courses: courses.length,
          enrollments: enrollments.length,
        });
        setLatestCourses(
          [...courses]
            .sort((left, right) => right.id - left.id)
            .slice(0, 4),
        );
        setRecentEnrollments(enrollments.slice(0, 5));
        setPendingInstructors([]);
        return;
      }

      const [students, courses, enrollments, users] =
        await Promise.all([
          getRegisteredStudents(),
          getCourses(),
          getEnrollments(),
          getUsers(),
        ]);

      setSummary({
        ...emptySummary,
        students: students.length,
        courses: courses.length,
        enrollments: enrollments.length,
        pendingInstructors: users.filter(
          (user) =>
            user.role === "INSTRUCTOR" && !user.approved,
        ).length,
      });
      setLatestCourses(
        [...courses]
          .sort((left, right) => right.id - left.id)
          .slice(0, 4),
      );
      setRecentEnrollments(enrollments.slice(0, 5));
      setPendingInstructors(
        users
          .filter(
            (user) =>
              user.role === "INSTRUCTOR" && !user.approved,
          )
          .slice(0, 5),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load dashboard",
      );
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCurrentUser(getCurrentUser());
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadDashboard]);

  const cards =
    currentUser?.role === "STUDENT"
      ? [
          {
            label: "Available Courses",
            value: summary.availableCourses,
          },
          {
            label: "My Enrolled Courses",
            value: summary.enrolledCourses,
          },
        ]
      : currentUser?.role === "INSTRUCTOR"
        ? [
            {
              label: "My Courses",
              value: summary.courses,
            },
            {
              label: "My Enrolled Students",
              value: summary.students,
            },
            {
              label: "Enrollment Records",
              value: summary.enrollments,
            },
          ]
        : [
            {
              label: "Total Students",
              value: summary.students,
            },
            {
              label: "Total Courses",
              value: summary.courses,
            },
            {
              label: "Total Enrollments",
              value: summary.enrollments,
            },
            {
              label: "Pending Instructors",
              value: summary.pendingInstructors,
            },
          ];

  const quickActions =
    currentUser?.role === "STUDENT"
      ? [
          {
            href: "/courses",
            label: "Find Courses",
          },
          {
            href: "/my-courses",
            label: "My Courses",
          },
          {
            href: "/profile",
            label: "Update Profile",
          },
        ]
      : currentUser?.role === "INSTRUCTOR"
        ? [
            {
              href: "/courses",
              label: "Manage Courses",
            },
            {
              href: "/enrollments",
              label: "View Enrollments",
            },
            {
              href: "/students",
              label: "View Students",
            },
          ]
        : [
            {
              href: "/users",
              label: "Approve Users",
            },
            {
              href: "/students",
              label: "Manage Students",
            },
            {
              href: "/courses",
              label: "Manage Courses",
            },
          ];

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
          Overview
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-950">
          Dashboard
        </h2>

        <p className="mt-1 text-slate-500">
          {currentUser?.role === "STUDENT"
            ? "Track your course registration progress"
            : currentUser?.role === "INSTRUCTOR"
              ? "Monitor your assigned courses and enrolled students"
              : "Manage the overall academic workspace"}
        </p>
      </div>

      {loading && (
        <div className="glass-panel p-6 text-slate-600">
          Loading dashboard information...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50/85 p-4 text-red-700 shadow-sm">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="danger-button mt-3 text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <article
                key={card.label}
                className="glass-panel p-6"
              >
                <p className="text-sm font-medium text-slate-500">
                  {card.label}
                </p>

                <p className="mt-3 text-4xl font-bold text-slate-950">
                  {card.value}
                </p>
              </article>
            ))}
          </div>

          <section className="glass-panel p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-950">
                  Quick Actions
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Common next steps for your role
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="primary-button"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="glass-panel overflow-hidden">
              <div className="border-b border-slate-200/70 px-5 py-4">
                <h3 className="font-semibold text-slate-950">
                  Latest Courses
                </h3>
              </div>

              {latestCourses.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">
                  No courses to show yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-200/70">
                  {latestCourses.map((course) => (
                    <div
                      key={course.id}
                      className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <p className="font-semibold text-slate-950">
                          {course.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {course.code} / {course.instructor.username}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="glass-panel overflow-hidden">
              <div className="border-b border-slate-200/70 px-5 py-4">
                <h3 className="font-semibold text-slate-950">
                  Recent Enrollments
                </h3>
              </div>

              {recentEnrollments.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">
                  No recent enrollments to show.
                </p>
              ) : (
                <div className="divide-y divide-slate-200/70">
                  {recentEnrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="px-5 py-4"
                    >
                      <p className="font-semibold text-slate-950">
                        {enrollment.student.username}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {enrollment.course.code} / {enrollment.course.name} /{" "}
                        {new Date(
                          enrollment.enrolledAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {currentUser?.role === "ADMIN" && (
            <section className="glass-panel overflow-hidden">
              <div className="border-b border-slate-200/70 px-5 py-4">
                <h3 className="font-semibold text-slate-950">
                  Pending Instructor Requests
                </h3>
              </div>

              {pendingInstructors.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">
                  No instructor requests are waiting.
                </p>
              ) : (
                <div className="divide-y divide-slate-200/70">
                  {pendingInstructors.map((user) => (
                    <div
                      key={user.id}
                      className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <p className="font-semibold text-slate-950">
                          {user.username}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/users"
                        className="secondary-button text-center text-sm"
                      >
                        Review
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </AppShell>
  );
}
