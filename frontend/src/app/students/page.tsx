"use client";

import AppShell from "@/components/AppShell";
import PasswordField from "@/components/PasswordField";
import {
  createStudent,
  deleteStudent,
  getCurrentUser,
  getRegisteredStudents,
  updateStudent,
} from "@/lib/api";
import type {
  CurrentUser,
  StudentPayload,
  UserResponse,
} from "@/types";
import type { FormEvent } from "react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

interface StudentForm {
  username: string;
  email: string;
  password: string;
}

const emptyForm: StudentForm = {
  username: "",
  email: "",
  password: "",
};

export default function StudentsPage() {
  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);
  const [students, setStudents] = useState<
    UserResponse[]
  >([]);
  const [form, setForm] =
    useState<StudentForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] =
    useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] =
    useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = currentUser?.role === "ADMIN";

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getRegisteredStudents();
      setStudents(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load registered students",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCurrentUser(getCurrentUser());
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void loadStudents();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadStudents, mounted]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function openCreateForm() {
    resetForm();
    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  function closeForm() {
    resetForm();
    setError("");
    setFormOpen(false);
  }

  function startEditing(student: UserResponse) {
    setEditingId(student.id);
    setError("");
    setSuccess("");
    setFormOpen(true);
    setForm({
      username: student.username,
      email: student.email,
      password: "",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!isAdmin) {
      return;
    }

    if (
      editingId === null &&
      form.password.trim().length === 0
    ) {
      setError("Password is required when creating a student");
      return;
    }

    const payload: StudentPayload = {
      username: form.username,
      email: form.email,
      password:
        editingId !== null &&
        form.password.trim().length === 0
          ? null
          : form.password,
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const saved =
        editingId === null
          ? await createStudent(payload)
          : await updateStudent(editingId, payload);

      setSuccess(
        editingId === null
          ? `${saved.username} was added as a student.`
          : `${saved.username}'s student account was updated.`,
      );

      resetForm();
      setFormOpen(false);
      await loadStudents();
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

  async function handleDelete(student: UserResponse) {
    if (!isAdmin) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${student.username}'s student account? This will also remove their enrollments.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(student.id);
      setError("");
      setSuccess("");

      await deleteStudent(student.id);
      setSuccess(`${student.username} was deleted.`);

      if (editingId === student.id) {
        resetForm();
      }

      await loadStudents();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete student",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppShell>
      <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              Student Accounts
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-950">
              Students
            </h2>

            <p className="mt-1 text-slate-500">
              {isAdmin
                ? "Manage student accounts and course enrollment access."
                : "Review students enrolled in your assigned courses."}
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={openCreateForm}
              className="primary-button"
            >
              Add Student
            </button>
          )}
        </div>

        <article className="glass-panel p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {isAdmin ? "Total Students" : "My Students"}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-950">
            {students.length}
          </p>
        </article>
      </div>

      {error && !formOpen && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50/85 p-4 text-red-700 shadow-sm">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => void loadStudents()}
            className="danger-button mt-3 text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50/85 p-4 text-emerald-700 shadow-sm">
          {success}
        </div>
      )}

      {isAdmin && formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="glass-panel-strong max-h-[90vh] w-full max-w-4xl overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 bg-white/52 px-5 py-4">
              <div>
                <h3 className="font-semibold text-slate-950">
                  {editingId === null
                    ? "Add Student"
                    : "Edit Student"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Create student access or update account details.
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
                <p>{error}</p>
              </div>
            )}

            <div className="grid gap-4 p-5 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Name
                </label>

                <input
                  required
                  minLength={3}
                  pattern="[A-Za-z]+([ '-][A-Za-z]+)*"
                  title="Use letters only"
                  value={form.username}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      username: event.target.value,
                    })
                  }
                  placeholder="Student Name"
                  className="field-control"
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
                  placeholder="student@example.com"
                  className="field-control"
                />
              </div>

              <PasswordField
                label="Password"
                required={editingId === null}
                minLength={8}
                pattern="^(?=.*[A-Za-z])(?=.*[0-9]).+$"
                title="Use at least 8 characters with a letter and a number"
                value={form.password}
                onChange={(value) =>
                  setForm({
                    ...form,
                    password: value,
                  })
                }
                placeholder={
                  editingId === null
                    ? "Student123"
                    : "Leave blank to keep current"
                }
              />

              <div className="flex flex-wrap gap-3 md:col-span-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="primary-button"
                >
                  {saving
                    ? "Saving..."
                    : editingId === null
                      ? "Add Student"
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

      <section className="glass-panel overflow-hidden">
        <div className="border-b border-slate-200/70 p-5">
          <h3 className="font-semibold">
            {isAdmin
              ? "Manage Students"
              : "Registered Student List"}
          </h3>
        </div>

        {loading && (
          <p className="p-5">Loading students...</p>
        )}

        {!loading && students.length === 0 && (
          <p className="p-5 text-slate-500">
            {isAdmin
              ? "No students have been added yet."
              : "No students have enrolled in your courses yet."}
          </p>
        )}

        {!loading && students.length > 0 && (
          <div className="overflow-x-auto">
            <table className="data-table w-full min-w-[760px] text-left">
              <thead className="bg-white/55 text-sm">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  {isAdmin && (
                    <th className="px-5 py-3">Actions</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-t border-slate-200/70"
                  >
                    <td className="px-5 py-4 font-medium">
                      {student.username}
                    </td>

                    <td className="px-5 py-4">
                      {student.email}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                        {student.role}
                      </span>
                    </td>

                    {isAdmin && (
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              startEditing(student)
                            }
                            className="secondary-button px-3 py-1.5 text-sm"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={deletingId === student.id}
                            onClick={() =>
                              void handleDelete(student)
                            }
                            className="danger-button px-3 py-1.5 text-sm"
                          >
                            {deletingId === student.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    )}
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
