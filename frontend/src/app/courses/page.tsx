"use client";

import AppShell from "@/components/AppShell";
import {
  createCourse,
  deleteCourse,
  getCourses,
  updateCourse,
} from "@/lib/api";
import type { Course, CoursePayload } from "@/types";
import type { FormEvent } from "react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

const emptyForm: CoursePayload = {
  code: "",
  name: "",
  description: "",
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] =
    useState<CoursePayload>(emptyForm);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCourses();
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
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadCourses();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadCourses]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEditing(course: Course) {
    setEditingId(course.id);

    setForm({
      code: course.code,
      name: course.name,
      description: course.description ?? "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingId === null) {
        await createCourse(form);
      } else {
        await updateCourse(editingId, form);
      }

      resetForm();
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

  return (
    <AppShell>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Courses</h2>

        <p className="mt-1 text-slate-500">
          Create, update and manage courses
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-xl bg-white p-5 shadow-sm"
      >
        <h3 className="mb-5 text-lg font-semibold">
          {editingId === null
            ? "Add Course"
            : "Update Course"}
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
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
              className="w-full rounded-lg border px-3 py-2"
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
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
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
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : editingId === null
                ? "Add Course"
                : "Save Changes"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border px-4 py-2 font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="border-b p-5">
          <h3 className="font-semibold">
            Course List
          </h3>
        </div>

        {loading && (
          <p className="p-5">Loading courses...</p>
        )}

        {!loading && courses.length === 0 && (
          <p className="p-5 text-slate-500">
            No courses have been created.
          </p>
        )}

        {!loading && courses.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-slate-50 text-sm">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">
                    Description
                  </th>
                  <th className="px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {courses.map((course) => (
                  <tr
                    key={course.id}
                    className="border-t"
                  >
                    <td className="px-5 py-4 font-medium">
                      {course.code}
                    </td>

                    <td className="px-5 py-4">
                      {course.name}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {course.description || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            startEditing(course)
                          }
                          className="rounded-md border px-3 py-1.5 text-sm"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(course.id)
                          }
                          className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white"
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
        )}
      </section>
    </AppShell>
  );
}
