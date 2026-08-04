"use client";

import AppShell from "@/components/AppShell";
import {
  getCurrentUser,
  getUsers,
  registerUser,
} from "@/lib/api";
import type {
  RegisterUserPayload,
  UserResponse,
  UserRole,
} from "@/types";
import type { FormEvent } from "react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

interface UserForm {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

const emptyForm: UserForm = {
  username: "",
  email: "",
  password: "",
  role: "INSTRUCTOR",
};

export default function UsersPage() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [loading, setLoading] = useState(isAdmin);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUsers = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getUsers();
      setUsers(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load users",
      );
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadUsers]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const payload: RegisterUserPayload = {
      username: form.username,
      email: form.email,
      password: form.password,
      role: form.role,
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const createdUser = await registerUser(payload);

      setForm(emptyForm);
      setSuccess(
        `${createdUser.username} account created successfully.`,
      );
      await loadUsers();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create user",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Permission denied
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Users</h2>

        <p className="mt-1 text-slate-500">
          Create instructor accounts and review system users
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-xl bg-white p-5 shadow-sm"
      >
        <h3 className="mb-5 text-lg font-semibold">
          Register User
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Username
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
              placeholder="Instructor One"
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
              placeholder="instructor@example.com"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Password
            </label>

            <input
              required
              type="password"
              minLength={8}
              value={form.password}
              onChange={(event) =>
                setForm({
                  ...form,
                  password: event.target.value,
                })
              }
              placeholder="Instructor123"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Role
            </label>

            <select
              required
              value={form.role}
              onChange={(event) =>
                setForm({
                  ...form,
                  role: event.target.value as UserRole,
                })
              }
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="INSTRUCTOR">
                Instructor
              </option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        <div className="mt-5">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Account"}
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="border-b p-5">
          <h3 className="font-semibold">User List</h3>
        </div>

        {loading && <p className="p-5">Loading users...</p>}

        {!loading && users.length === 0 && (
          <p className="p-5 text-slate-500">
            No users have been created.
          </p>
        )}

        {!loading && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-slate-50 text-sm">
                <tr>
                  <th className="px-5 py-3">Username</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t"
                  >
                    <td className="px-5 py-4 font-medium">
                      {user.username}
                    </td>
                    <td className="px-5 py-4">
                      {user.email}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {user.role}
                      </span>
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
