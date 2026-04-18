"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  normalizePhoneDigits,
  validateEmail,
  validateName,
  validatePasswordSignup,
  validatePhone,
} from "@/lib/auth/validation";

type FieldKey = "name" | "email" | "phone" | "password";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldKey, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function clearFieldError(key: FieldKey) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const nextErrors: Partial<Record<FieldKey, string>> = {};
    const nameResult = validateName(name);
    if (!nameResult.ok) nextErrors.name = nameResult.message;
    const emailResult = validateEmail(email);
    if (!emailResult.ok) nextErrors.email = emailResult.message;
    const phoneResult = validatePhone(phone);
    if (!phoneResult.ok) nextErrors.phone = phoneResult.message;
    const passwordResult = validatePasswordSignup(password);
    if (!passwordResult.ok) nextErrors.password = passwordResult.message;

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            phone: normalizePhoneDigits(phone),
          },
        },
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    "block w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none ring-zinc-400/40 placeholder:text-zinc-400 focus:ring-2 dark:ring-zinc-600/40";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Create account
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Create your new user account.
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-1.5">
          <label
            htmlFor="signup-name"
            className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            Name
          </label>
          <input
            id="signup-name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(ev) => {
              setName(ev.target.value);
              clearFieldError("name");
            }}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={
              fieldErrors.name ? "signup-name-error" : undefined
            }
            className={`${inputClass} border-zinc-200 bg-white text-zinc-900 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 ${
              fieldErrors.name
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                : ""
            }`}
            placeholder="Alex Rivera"
          />
          {fieldErrors.name ? (
            <p
              id="signup-name-error"
              className="text-xs text-red-600 dark:text-red-400"
            >
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="signup-email"
            className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            Email
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(ev) => {
              setEmail(ev.target.value);
              clearFieldError("email");
            }}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={
              fieldErrors.email ? "signup-email-error" : undefined
            }
            className={`${inputClass} border-zinc-200 bg-white text-zinc-900 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 ${
              fieldErrors.email
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                : ""
            }`}
            placeholder="you@example.com"
          />
          {fieldErrors.email ? (
            <p
              id="signup-email-error"
              className="text-xs text-red-600 dark:text-red-400"
            >
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="signup-phone"
            className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            Phone
          </label>
          <input
            id="signup-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={phone}
            onChange={(ev) => {
              setPhone(ev.target.value);
              clearFieldError("phone");
            }}
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={
              fieldErrors.phone ? "signup-phone-error" : undefined
            }
            className={`${inputClass} border-zinc-200 bg-white text-zinc-900 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 ${
              fieldErrors.phone
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                : ""
            }`}
            placeholder="+1 555 010 0199"
          />
          {fieldErrors.phone ? (
            <p
              id="signup-phone-error"
              className="text-xs text-red-600 dark:text-red-400"
            >
              {fieldErrors.phone}
            </p>
          ) : null}
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            10–15 digits; formatting characters are ignored.
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="signup-password"
            className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            Password
          </label>
          <input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(ev) => {
              setPassword(ev.target.value);
              clearFieldError("password");
            }}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? "signup-password-error" : undefined
            }
            className={`${inputClass} border-zinc-200 bg-white text-zinc-900 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 ${
              fieldErrors.password
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                : ""
            }`}
          />
          {fieldErrors.password ? (
            <p
              id="signup-password-error"
              className="text-xs text-red-600 dark:text-red-400"
            >
              {fieldErrors.password}
            </p>
          ) : null}
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Use at least 8 characters with letters and numbers.
          </p>
        </div>

        {formError ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
