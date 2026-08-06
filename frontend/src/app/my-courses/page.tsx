"use client";

import AppShell from "@/components/AppShell";
import {
  getMyCourses,
  unenrollFromCourse,
} from "@/lib/api";
import type { Course } from "@/types";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

function getCourseAccent(courseCode: string): string {
  const accents = [
    "from-teal-500 to-emerald-500",
    "from-sky-500 to-cyan-500",
    "from-rose-500 to-orange-500",
    "from-violet-500 to-fuchsia-500",
    "from-slate-700 to-slate-950",
  ];

  const index =
    courseCode
      .split("")
      .reduce(
        (total, character) =>
          total + character.charCodeAt(0),
        0,
      ) % accents.length;

  return accents[index];
}

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [unenrollingId, setUnenrollingId] =
    useState<number | null>(null);
  const [error, setError] = useState("");

  const instructorCount = useMemo(
    () =>
      new Set(
        courses.map((course) => course.instructor.id),
      ).size,
    [courses],
  );

  const loadMyCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyCourses();
      setCourses(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load enrolled courses",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadMyCourses();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadMyCourses]);

  async function handleUnenroll(course: Course) {
    const confirmed = window.confirm(
      `Drop ${course.name} from your courses?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setUnenrollingId(course.id);
      setError("");

      await unenrollFromCourse(course.id);
      await loadMyCourses();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to drop course",
      );
    } finally {
      setUnenrollingId(null);
    }
  }

  return (
    <AppShell>
      <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
            Student Enrollment
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-950">
            My Courses
          </h2>

          <p className="mt-1 max-w-2xl text-slate-500">
            Your enrolled course catalog with instructor details and current learning access.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <article className="glass-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Enrolled
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {courses.length}
            </p>
          </article>

          <article className="glass-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Instructors
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {instructorCount}
            </p>
          </article>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50/85 p-4 text-red-700 shadow-sm">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => void loadMyCourses()}
            className="danger-button mt-3 text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {loading && (
        <div className="glass-panel p-6 text-slate-600">
          Loading enrolled courses...
        </div>
      )}

      {!loading && courses.length === 0 && (
        <section className="glass-panel p-8 text-center">
          <p className="text-lg font-semibold text-slate-950">
            No enrolled courses yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Once you enroll from the Courses page, your selected courses will appear here.
          </p>
        </section>
      )}

      {!loading && courses.length > 0 && (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <article
              key={course.id}
              className="glass-panel overflow-hidden"
            >
              <div
                className={`bg-gradient-to-br ${getCourseAccent(
                  course.code,
                )} p-5 text-white`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/78">
                      {course.code}
                    </p>
                    <h3 className="mt-2 text-xl font-bold">
                      {course.name}
                    </h3>
                  </div>

                  <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-semibold backdrop-blur">
                    Enrolled
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal-50 text-sm font-bold text-teal-700">
                    {course.instructor.username
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Instructor
                    </p>
                    <p className="font-semibold text-slate-950">
                      {course.instructor.username}
                    </p>
                  </div>
                </div>

                <p className="min-h-[4.5rem] text-sm leading-6 text-slate-600">
                  {course.description ||
                    "Course details will be updated soon."}
                </p>

                <div className="mt-5 rounded-lg border border-slate-200/70 bg-white/52 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
                    Access Status
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    You are currently enrolled in this course.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={unenrollingId === course.id}
                  onClick={() => void handleUnenroll(course)}
                  className="danger-button mt-4 w-full"
                >
                  {unenrollingId === course.id
                    ? "Dropping..."
                    : "Drop Course"}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </AppShell>
  );
}
