"use client";

import AppShell from "@/components/AppShell";
import {
  getEnrollments,
  removeEnrollment,
} from "@/lib/api";
import type { EnrollmentResponse } from "@/types";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

interface CourseEnrollmentGroup {
  courseId: number;
  courseCode: string;
  courseName: string;
  instructorName: string;
  enrollments: EnrollmentResponse[];
}

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<
    EnrollmentResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] =
    useState<number | null>(null);
  const [error, setError] = useState("");

  const loadEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getEnrollments();
      setEnrollments(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load enrollments",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadEnrollments();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadEnrollments]);

  const groupedEnrollments = useMemo(() => {
    const groups = new Map<number, CourseEnrollmentGroup>();

    enrollments.forEach((enrollment) => {
      const existingGroup = groups.get(
        enrollment.course.id,
      );

      if (existingGroup) {
        existingGroup.enrollments.push(enrollment);
        return;
      }

      groups.set(enrollment.course.id, {
        courseId: enrollment.course.id,
        courseCode: enrollment.course.code,
        courseName: enrollment.course.name,
        instructorName:
          enrollment.course.instructor.username,
        enrollments: [enrollment],
      });
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        enrollments: group.enrollments.sort((left, right) =>
          left.student.username.localeCompare(
            right.student.username,
          ),
        ),
      }))
      .sort((left, right) =>
        left.courseCode.localeCompare(right.courseCode),
      );
  }, [enrollments]);

  async function handleRemoveEnrollment(
    enrollment: EnrollmentResponse,
  ) {
    const confirmed = window.confirm(
      `Remove ${enrollment.student.username} from ${enrollment.course.name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingId(enrollment.id);
      setError("");

      await removeEnrollment(enrollment.id);
      await loadEnrollments();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to remove enrollment",
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
          Course Activity
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-950">
          Enrollments
        </h2>

        <p className="mt-1 text-slate-500">
          Review student course enrollment records
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50/85 p-4 text-red-700 shadow-sm">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => void loadEnrollments()}
            className="danger-button mt-3 text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {loading && (
        <div className="glass-panel p-6 text-slate-600">
          Loading enrollments...
        </div>
      )}

      {!loading && enrollments.length === 0 && (
        <section className="glass-panel p-8 text-center">
          <p className="text-lg font-semibold text-slate-950">
            No course enrollments yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Enrolled students will appear grouped under each course.
          </p>
        </section>
      )}

      {!loading && groupedEnrollments.length > 0 && (
        <section className="space-y-5">
          {groupedEnrollments.map((group) => (
            <article
              key={group.courseId}
              className="glass-panel overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 bg-white/52 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
                    {group.courseCode}
                  </p>

                  <h3 className="mt-1 text-xl font-bold text-slate-950">
                    {group.courseName}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Instructor: {group.instructorName}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200/70 bg-white/70 px-4 py-3 text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Enrolled Students
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">
                    {group.enrollments.length}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="data-table w-full min-w-[780px] text-left">
                  <thead className="enrollment-table-head text-sm">
                    <tr>
                      <th className="px-5 py-3">Student</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Enrolled</th>
                      <th className="px-5 py-3">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {group.enrollments.map((enrollment) => (
                      <tr
                        key={enrollment.id}
                        className="border-t border-slate-200/70"
                      >
                        <td className="px-5 py-4 font-medium">
                          {enrollment.student.username}
                        </td>

                        <td className="px-5 py-4">
                          {enrollment.student.email}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {new Date(
                            enrollment.enrolledAt,
                          ).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            disabled={removingId === enrollment.id}
                            onClick={() =>
                              void handleRemoveEnrollment(
                                enrollment,
                              )
                            }
                            className="danger-button px-3 py-1.5 text-sm"
                          >
                            {removingId === enrollment.id
                              ? "Removing..."
                              : "Remove"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </section>
      )}
    </AppShell>
  );
}
