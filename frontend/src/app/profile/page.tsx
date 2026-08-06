"use client";

import AppShell from "@/components/AppShell";
import PasswordField from "@/components/PasswordField";
import {
  getCurrentUser,
  saveAuthSession,
  updateMyProfile,
} from "@/lib/api";
import type { CurrentUser } from "@/types";
import type { FormEvent } from "react";
import {
  useEffect,
  useState,
} from "react";

interface ProfileForm {
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
}

const emptyForm: ProfileForm = {
  username: "",
  email: "",
  currentPassword: "",
  newPassword: "",
};

export default function ProfilePage() {
  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);
  const [form, setForm] =
    useState<ProfileForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canEditProfile =
    currentUser?.role === "STUDENT" ||
    currentUser?.role === "INSTRUCTOR";

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const user = getCurrentUser();

      setCurrentUser(user);
      setForm({
        ...emptyForm,
        username: user?.username ?? "",
        email: user?.email ?? "",
      });
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!canEditProfile) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await updateMyProfile({
        username: form.username,
        email: form.email,
        currentPassword: form.currentPassword,
        newPassword:
          form.newPassword.trim().length === 0
            ? null
            : form.newPassword,
      });

      saveAuthSession(response);

      const updatedUser = getCurrentUser();
      setCurrentUser(updatedUser);
      setForm({
        ...emptyForm,
        username: updatedUser?.username ?? "",
        email: updatedUser?.email ?? "",
      });
      setSuccess("Profile updated successfully.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update profile",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
          Account
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-950">
          Profile
        </h2>

        <p className="mt-1 text-slate-500">
          {canEditProfile
            ? "Update your account information and password"
            : "Review your signed-in account information"}
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

      <section className="glass-panel max-w-3xl p-6">
        {!currentUser ? (
          <p className="text-slate-600">Loading profile...</p>
        ) : canEditProfile ? (
          <form
            onSubmit={handleSubmit}
            className="grid gap-5 sm:grid-cols-2"
          >
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
                className="field-control"
              />
            </div>

            <PasswordField
              label="Current password"
              required
              value={form.currentPassword}
              onChange={(value) =>
                setForm({
                  ...form,
                  currentPassword: value,
                })
              }
            />

            <PasswordField
              label="New password"
              minLength={8}
              pattern="^(?=.*[A-Za-z])(?=.*[0-9]).+$"
              title="Use at least 8 characters with a letter and a number"
              value={form.newPassword}
              onChange={(value) =>
                setForm({
                  ...form,
                  newPassword: value,
                })
              }
              placeholder="Leave blank to keep current"
            />

            <div className="sm:col-span-2">
              <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                {currentUser.role}
              </span>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="primary-button"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Name
              </p>
              <p className="mt-1 font-semibold text-slate-950">
                {currentUser.username}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Email
              </p>
              <p className="mt-1 font-semibold text-slate-950">
                {currentUser.email}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Role
              </p>
              <span className="mt-2 inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                {currentUser.role}
              </span>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
