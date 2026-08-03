"use client";

import AppShell from "@/components/AppShell";
import {
  createStudent,
  deleteStudent,
  getCourses,
  getStudents,
  updateStudent,
} from "@/lib/api";
import type {
  Course,
  Student,
  StudentPayload,
} from "@/types";
import type { FormEvent } from "react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

interface StudentForm {
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  courseId: string;
}

const emptyForm: StudentForm = {
  studentNumber: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  courseId: "",
};

export default function StudentsPage() {
  const [students, setStudents] =
    useState<Student[]>([]);

  const [courses, setCourses] =
    useState<Course[]>([]);

  const [form, setForm] =
    useState<StudentForm>(emptyForm);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [studentData, courseData] =
        await Promise.all([
          getStudents(),
          getCourses(),
        ]);

      setStudents(studentData);
      setCourses(courseData);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load student information",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEditing(student: Student) {
    setEditingId(student.id);

    setForm({
      studentNumber: student.studentNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone ?? "",
      courseId: String(student.course.id),
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

    const courseId = Number(form.courseId);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      setError("Please select a course");
      return;
    }

    const payload: StudentPayload = {
      studentNumber: form.studentNumber,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      courseId,
    };

    try {
      setSaving(true);
      setError("");

      if (editingId === null) {
        await createStudent(payload);
      } else {
        await updateStudent(editingId, payload);
      }

      resetForm();
      await loadData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save student",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this student?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      await deleteStudent(id);
      await loadData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete student",
      );
    }
  }

  return (
    <AppShell>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Students</h2>

        <p className="mt-1 text-slate-500">
          Create, update and manage students
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {courses.length === 0 && !loading && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Create a course before adding students.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-xl bg-white p-5 shadow-sm"
      >
        <h3 className="mb-5 text-lg font-semibold">
          {editingId === null
            ? "Add Student"
            : "Update Student"}
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Student number
            </label>

            <input
              required
              value={form.studentNumber}
              onChange={(event) =>
                setForm({
                  ...form,
                  studentNumber: event.target.value,
                })
              }
              placeholder="STU001"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Course
            </label>

            <select
              required
              value={form.courseId}
              onChange={(event) =>
                setForm({
                  ...form,
                  courseId: event.target.value,
                })
              }
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="">Select a course</option>

              {courses.map((course) => (
                <option
                  key={course.id}
                  value={course.id}
                >
                  {course.code} — {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              First name
            </label>

            <input
              required
              value={form.firstName}
              onChange={(event) =>
                setForm({
                  ...form,
                  firstName: event.target.value,
                })
              }
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Last name
            </label>

            <input
              required
              value={form.lastName}
              onChange={(event) =>
                setForm({
                  ...form,
                  lastName: event.target.value,
                })
              }
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Email
            </label>

            <input
              required
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({
                  ...form,
                  email: event.target.value,
                })
              }
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Phone
            </label>

            <input
              value={form.phone}
              onChange={(event) =>
                setForm({
                  ...form,
                  phone: event.target.value,
                })
              }
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving || courses.length === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : editingId === null
                ? "Add Student"
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
            Student List
          </h3>
        </div>

        {loading && (
          <p className="p-5">Loading students...</p>
        )}

        {!loading && students.length === 0 && (
          <p className="p-5 text-slate-500">
            No students have been created.
          </p>
        )}

        {!loading && students.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50 text-sm">
                <tr>
                  <th className="px-5 py-3">Number</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Course</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-t"
                  >
                    <td className="px-5 py-4 font-medium">
                      {student.studentNumber}
                    </td>

                    <td className="px-5 py-4">
                      {student.firstName}{" "}
                      {student.lastName}
                    </td>

                    <td className="px-5 py-4">
                      {student.email}
                    </td>

                    <td className="px-5 py-4">
                      {student.phone || "—"}
                    </td>

                    <td className="px-5 py-4">
                      {student.course.code}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            startEditing(student)
                          }
                          className="rounded-md border px-3 py-1.5 text-sm"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(student.id)
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