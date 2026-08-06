"use client";

import AppShell from "@/components/AppShell";
import {
  createCourse,
  deleteCourse,
  enrollInCourse,
  getApprovedInstructors,
  getAvailableCourses,
  getCurrentUser,
  getCourses,
  updateCourse,
} from "@/lib/api";
import type {
  Course,
  CoursePayload,
  CurrentUser,
  UserResponse,
} from "@/types";
import type { FormEvent } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const emptyForm: CoursePayload = {
  code: "",
  name: "",
  description: "",
  instructorId: 0,
};

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

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<
    UserResponse[]
  >([]);
  const [form, setForm] =
    useState<CoursePayload>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] =
    useState<number | null>(null);
  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enrollingId, setEnrollingId] =
    useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const canManageCourses =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "INSTRUCTOR";
  const canAssignInstructor =
    currentUser?.role === "ADMIN";
  const canEnroll = currentUser?.role === "STUDENT";
  const isInstructor =
    currentUser?.role === "INSTRUCTOR";

  const courseCountLabel = useMemo(() => {
    if (canEnroll) {
      return "Available";
    }

    if (isInstructor) {
      return "Assigned";
    }

    return "Total";
  }, [canEnroll, isInstructor]);

  const uniqueInstructorCount = useMemo(
    () =>
      new Set(
        courses.map((course) => course.instructor.id),
      ).size,
    [courses],
  );

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (query.length === 0) {
      return courses;
    }

    return courses.filter((course) => {
      return [
        course.code,
        course.name,
        course.description ?? "",
        course.instructor.username,
      ].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [courses, searchQuery]);

  const loadCourses = useCallback(async () => {
    if (currentUser === null) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data =
        currentUser.role === "STUDENT"
          ? await getAvailableCourses()
          : await getCourses();

      setCourses(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load courses",
      );
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const loadInstructors = useCallback(async () => {
    if (!canAssignInstructor) {
      return;
    }

    const data = await getApprovedInstructors();
    setInstructors(data);

    if (data.length > 0 && form.instructorId === 0) {
      setForm((current) => ({
        ...current,
        instructorId: data[0].id,
      }));
    }
  }, [canAssignInstructor, form.instructorId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCurrentUser(getCurrentUser());
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadCourses();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadCourses]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadInstructors();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadInstructors]);

  function resetForm() {
    setForm({
      ...emptyForm,
      instructorId:
        canAssignInstructor
          ? instructors[0]?.id ?? 0
          : currentUser?.userId ?? 0,
    });
    setEditingId(null);
  }

  function openCreateForm() {
    resetForm();
    setError("");
    setFormOpen(true);
  }

  function closeForm() {
    resetForm();
    setError("");
    setFormOpen(false);
  }

  function startEditing(course: Course) {
    setEditingId(course.id);
    setError("");
    setFormOpen(true);

    setForm({
      code: course.code,
      name: course.name,
      description: course.description ?? "",
      instructorId: course.instructor.id,
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      canAssignInstructor &&
      form.instructorId === 0
    ) {
      setError(
        "Please approve an instructor before creating courses",
      );
      return;
    }

    if (currentUser === null) {
      setError("Please sign in to manage courses");
      return;
    }

    const payload: CoursePayload = {
      ...form,
      instructorId: canAssignInstructor
        ? form.instructorId
        : currentUser.userId,
    };

    try {
      setSaving(true);
      setError("");

      if (editingId === null) {
        await createCourse(payload);
      } else {
        await updateCourse(editingId, payload);
      }

      resetForm();
      setFormOpen(false);
      await loadCourses();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save course",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this course?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      await deleteCourse(id);
      await loadCourses();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete course",
      );
    }
  }

  async function handleEnroll(courseId: number) {
    try {
      setEnrollingId(courseId);
      setError("");

      await enrollInCourse(courseId);
      await loadCourses();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to enroll in course",
      );
    } finally {
      setEnrollingId(null);
    }
  }

  return (
    <AppShell>
      <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              Course Catalog
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-950">
              Courses
            </h2>

            <p className="mt-1 max-w-2xl text-slate-500">
              {canManageCourses
                ? canAssignInstructor
                  ? "Create courses, assign instructors, and keep the academic catalog organized."
                  : "Create and manage your teaching catalog."
                : canEnroll
                  ? "Browse available courses, review the instructor, and enroll from the catalog."
                  : "Review your assigned teaching catalog and course ownership."}
            </p>
          </div>

          {canManageCourses && (
            <button
              type="button"
              onClick={openCreateForm}
              className="primary-button"
            >
              Create Course
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <article className="glass-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {courseCountLabel}
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
              {canAssignInstructor
                ? instructors.length
                : uniqueInstructorCount}
            </p>
          </article>
        </div>
      </div>

      {error && !formOpen && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50/85 p-4 text-red-700 shadow-sm">
          {error}
        </div>
      )}

      <div className="glass-panel mb-6 p-4">
        <label
          htmlFor="course-search"
          className="mb-2 block text-sm font-medium"
        >
          Search courses
        </label>

        <input
          id="course-search"
          value={searchQuery}
          onChange={(event) =>
            setSearchQuery(event.target.value)
          }
          placeholder="Search by code, course, instructor"
          className="field-control"
        />

        {searchQuery.trim().length > 0 && (
          <p className="mt-2 text-sm text-slate-500">
            Showing {filteredCourses.length} of {courses.length}
          </p>
        )}
      </div>

      {canManageCourses && formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="glass-panel-strong max-h-[90vh] w-full max-w-4xl overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 bg-white/52 px-5 py-4">
              <div>
                <h3 className="font-semibold text-slate-950">
                  {editingId === null
                    ? "Create Course"
                    : "Edit Course"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {canAssignInstructor
                    ? "Assign every course to an approved instructor."
                    : "New courses are automatically assigned to you."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="secondary-button px-3 py-1.5 text-sm"
              >
                Close
              </button>
            </div>

            {error && (
              <div className="mx-5 mt-5 rounded-lg border border-red-200 bg-red-50/85 p-4 text-red-700 shadow-sm">
                {error}
              </div>
            )}

            <div
              className={`grid gap-4 p-5 ${
                canAssignInstructor
                  ? "md:grid-cols-[0.8fr_1.2fr_1fr]"
                  : "md:grid-cols-[0.8fr_1.2fr]"
              }`}
            >
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Course code
                </label>

                <input
                  required
                  value={form.code}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      code: event.target.value,
                    })
                  }
                  placeholder="CS101"
                  className="field-control"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Course name
                </label>

                <input
                  required
                  pattern="[A-Za-z]+([ '&.-][A-Za-z]+)*"
                  title="Use words only, no numbers"
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                  placeholder="Computer Science"
                  className="field-control"
                />
              </div>

              {canAssignInstructor && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Instructor
                  </label>

                  <select
                    required
                    value={form.instructorId}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        instructorId: Number(
                          event.target.value,
                        ),
                      })
                    }
                    className="field-control"
                  >
                    {instructors.length === 0 && (
                      <option value={0}>
                        No approved instructors
                      </option>
                    )}

                    {instructors.map((instructor) => (
                      <option
                        key={instructor.id}
                        value={instructor.id}
                      >
                        {instructor.username}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div
                className={
                  canAssignInstructor
                    ? "md:col-span-3"
                    : "md:col-span-2"
                }
              >
                <label className="mb-1 block text-sm font-medium">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Course description"
                  className="field-control"
                />
              </div>

              <div
                className={`flex flex-wrap gap-3 ${
                  canAssignInstructor
                    ? "md:col-span-3"
                    : "md:col-span-2"
                }`}
              >
                <button
                  type="submit"
                  disabled={
                    saving ||
                    (canAssignInstructor &&
                      instructors.length === 0)
                  }
                  className="primary-button"
                >
                  {saving
                    ? "Saving..."
                    : editingId === null
                      ? "Create Course"
                      : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  className="secondary-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <div className="glass-panel p-6 text-slate-600">
          Loading courses...
        </div>
      )}

      {!loading && courses.length === 0 && (
        <section className="glass-panel p-8 text-center">
          <p className="text-lg font-semibold text-slate-950">
            {canEnroll
              ? "No courses available right now"
              : "No courses created yet"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {canEnroll
              ? "Once Admin creates courses and assigns instructors, available courses will appear here."
              : "Courses will appear here after Admin creates them and assigns instructors."}
          </p>
        </section>
      )}

      {!loading &&
        courses.length > 0 &&
        filteredCourses.length === 0 && (
          <section className="glass-panel p-8 text-center">
            <p className="text-lg font-semibold text-slate-950">
              No matching courses
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Try another code, course name, or instructor.
            </p>
          </section>
        )}

      {!loading &&
        filteredCourses.length > 0 &&
        !canManageCourses && (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
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
                    {canEnroll ? "Open" : "Assigned"}
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

                {canEnroll && (
                  <button
                    type="button"
                    disabled={enrollingId === course.id}
                    onClick={() =>
                      void handleEnroll(course.id)
                    }
                    className="primary-button mt-5 w-full"
                  >
                    {enrollingId === course.id
                      ? "Enrolling..."
                      : "Enroll Course"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {!loading &&
        filteredCourses.length > 0 &&
        canManageCourses && (
        <section className="glass-panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 p-5">
            <div>
              <h3 className="font-semibold text-slate-950">
                Course Management
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Edit course ownership, details, and catalog status.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table w-full min-w-[880px] text-left">
              <thead className="bg-white/55 text-sm">
                <tr>
                  <th className="px-5 py-3">Course</th>
                  <th className="px-5 py-3">Instructor</th>
                  <th className="px-5 py-3">
                    Description
                  </th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCourses.map((course) => (
                  <tr
                    key={course.id}
                    className="border-t border-slate-200/70"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br ${getCourseAccent(
                            course.code,
                          )} text-sm font-bold text-white`}
                        >
                          {course.code.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">
                            {course.name}
                          </p>
                          <p className="text-sm font-medium text-slate-500">
                            {course.code}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {course.instructor.username}
                    </td>

                    <td className="max-w-md px-5 py-4 text-sm text-slate-600">
                      {course.description || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            startEditing(course)
                          }
                          className="secondary-button px-3 py-1.5 text-sm"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(course.id)
                          }
                          className="danger-button px-3 py-1.5 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </AppShell>
  );
}
