"use client";

import AppShell from "@/components/AppShell";
import {
  approveUser,
  getCurrentUser,
  getUsers,
} from "@/lib/api";
import type {
  CurrentUser,
  UserResponse,
} from "@/types";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

export default function UsersPage() {
  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] =
    useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = currentUser?.role === "ADMIN";

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
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadUsers, mounted]);

  async function handleApprove(user: UserResponse) {
    try {
      setApprovingId(user.id);
      setError("");
      setSuccess("");

      const approved = await approveUser(user.id);
      setSuccess(
        `${approved.username} can now log in as an instructor.`,
      );
      await loadUsers();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to approve instructor",
      );
    } finally {
      setApprovingId(null);
    }
  }

  if (!mounted) {
    return (
      <AppShell>
        <div className="glass-panel p-6 text-slate-600">
          Loading users...
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="rounded-lg border border-red-200 bg-red-50/85 p-4 text-red-700 shadow-sm">
          Permission denied
        </div>
      </AppShell>
    );
  }

  const pendingInstructors = users.filter(
    (user) =>
      user.role === "INSTRUCTOR" && !user.approved,
  );

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
          Admin Only
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-950">
          Users
        </h2>

        <p className="mt-1 text-slate-500">
          Approve instructor requests and review account access
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50/85 p-4 text-red-700 shadow-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50/85 p-4 text-emerald-700 shadow-sm">
          {success}
        </div>
      )}

      <section className="glass-panel mb-8 overflow-hidden">
        <div className="border-b border-slate-200/70 p-5">
          <h3 className="font-semibold">
            Pending Instructor Requests
          </h3>
        </div>

        {loading && <p className="p-5">Loading users...</p>}

        {!loading && pendingInstructors.length === 0 && (
          <p className="p-5 text-slate-500">
            No instructor requests are waiting.
          </p>
        )}

        {!loading && pendingInstructors.length > 0 && (
          <div className="overflow-x-auto">
            <table className="data-table w-full min-w-[700px] text-left">
              <thead className="bg-white/55 text-sm">
                <tr>
                  <th className="px-5 py-3">Instructor</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {pendingInstructors.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-slate-200/70"
                  >
                    <td className="px-5 py-4 font-medium">
                      {user.username}
                    </td>
                    <td className="px-5 py-4">
                      {user.email}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        Pending
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        disabled={approvingId === user.id}
                        onClick={() => void handleApprove(user)}
                        className="primary-button px-3 py-1.5 text-sm"
                      >
                        {approvingId === user.id
                          ? "Approving..."
                          : "Approve"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="glass-panel overflow-hidden">
        <div className="border-b border-slate-200/70 p-5">
          <h3 className="font-semibold">All User Accounts</h3>
        </div>

        {loading && <p className="p-5">Loading users...</p>}

        {!loading && users.length === 0 && (
          <p className="p-5 text-slate-500">
            No users have been created.
          </p>
        )}

        {!loading && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="data-table w-full min-w-[760px] text-left">
              <thead className="bg-white/55 text-sm">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Access</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-slate-200/70"
                  >
                    <td className="px-5 py-4 font-medium">
                      {user.username}
                    </td>
                    <td className="px-5 py-4">
                      {user.email}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.approved
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {user.approved
                          ? "Approved"
                          : "Pending"}
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
