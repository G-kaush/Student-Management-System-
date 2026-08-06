"use client";

import {
  registerInstructor,
  registerStudent,
  saveAuthSession,
} from "@/lib/api";
import PasswordField from "@/components/PasswordField";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<
    "STUDENT" | "INSTRUCTOR"
  >("STUDENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      if (accountType === "INSTRUCTOR") {
        await registerInstructor({
          username,
          email,
          password,
        });

        setSuccess(
          "Instructor request submitted. You can sign in after Admin approval.",
        );
        setUsername("");
        setEmail("");
        setPassword("");
        return;
      }

      const response = await registerStudent({
        username,
        email,
        password,
      });

      saveAuthSession(response);
      router.replace("/dashboard");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create account",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-screen flex min-h-screen items-center justify-center p-4">
      <section className="glass-panel-strong w-full max-w-md p-6 sm:p-8">
        <div className="mb-8 text-center">
          <div className="brand-mark mx-auto mb-5">SM</div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
            Registration Portal
          </p>

          <h1 className="text-3xl font-bold text-slate-950">
            Create Account
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Students can start immediately. Instructors wait for Admin approval.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50/90 p-3 text-sm text-red-700 shadow-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/90 p-3 text-sm text-emerald-700 shadow-sm">
              {success}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Account type
            </label>

            <div className="grid grid-cols-2 gap-2">
              {(["STUDENT", "INSTRUCTOR"] as const).map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountType(type)}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                      accountType === type
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"
                    }`}
                  >
                    {type === "STUDENT"
                      ? "Student"
                      : "Instructor"}
                  </button>
                ),
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium"
            >
              Name
            </label>

            <input
              id="username"
              required
              minLength={3}
              pattern="[A-Za-z]+([ '-][A-Za-z]+)*"
              title="Use letters only"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder={
                accountType === "STUDENT"
                  ? "Student Name"
                  : "Instructor Name"
              }
              className="field-control"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder={
                accountType === "STUDENT"
                  ? "student@example.com"
                  : "instructor@example.com"
              }
              className="field-control"
            />
          </div>

          <PasswordField
            label="Password"
            required
            minLength={8}
            value={password}
            onChange={setPassword}
            placeholder={
              accountType === "STUDENT"
                ? "Student123"
                : "Instructor123"
            }
          />

          <button
            type="submit"
            disabled={loading}
            className="primary-button w-full"
          >
            {loading
              ? "Submitting..."
              : accountType === "STUDENT"
                ? "Create Student Account"
                : "Request Instructor Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already approved?{" "}
          <Link
            href="/login"
            className="font-semibold text-teal-700 hover:text-teal-900"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
