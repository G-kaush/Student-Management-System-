"use client";

import {
  login,
  saveAuthSession,
} from "@/lib/api";
import PasswordField from "@/components/PasswordField";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await login(email, password);

      saveAuthSession(response);
      router.replace("/dashboard");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to sign in",
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
            Student Management Portal
          </p>

          <h1 className="text-3xl font-bold text-slate-950">
            Student Management System
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to continue to your workspace
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
              placeholder="admin@example.com"
              className="field-control"
            />
          </div>

          <PasswordField
            label="Password"
            required
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
          />

          <button
            type="submit"
            disabled={loading}
            className="primary-button w-full"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Need an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-teal-700 hover:text-teal-900"
          >
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
