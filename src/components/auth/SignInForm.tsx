"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithPassword } from "@/services/client/auth";
import { validateEmail, validatePasswordLogin } from "@/lib/auth/validation";
import {
  bodyMutedClass,
  formFieldErrorClass,
  formInputBaseClass,
  formLabelClass,
  pageTitleClass,
  primaryButtonClass,
  textLinkClass,
} from "@/lib/ui/form";

type FieldKey = "email" | "password";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
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
    const emailResult = validateEmail(email);
    if (!emailResult.ok) nextErrors.email = emailResult.message;
    const passwordResult = validatePasswordLogin(password);
    if (!passwordResult.ok) nextErrors.password = passwordResult.message;

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    try {
      const { error } = await signInWithPassword(email.trim(), password);

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

  const inputClass = formInputBaseClass;

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitleClass}>Sign in</h1>
        <p className={`mt-1 ${bodyMutedClass}`}>
          Sign in using your account credentials.
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-1.5">
          <label htmlFor="signin-email" className={formLabelClass}>
            Email
          </label>
          <input
            id="signin-email"
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
              fieldErrors.email ? "signin-email-error" : undefined
            }
            className={`${inputClass} border-zinc-200 bg-white text-zinc-900 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 ${
              fieldErrors.email
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                : ""
            }`}
            placeholder="you@example.com"
          />
          {fieldErrors.email ? (
            <p id="signin-email-error" className={formFieldErrorClass}>
              {fieldErrors.email}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="signin-password" className={formLabelClass}>
            Password
          </label>
          <input
            id="signin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(ev) => {
              setPassword(ev.target.value);
              clearFieldError("password");
            }}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? "signin-password-error" : undefined
            }
            className={`${inputClass} border-zinc-200 bg-white text-zinc-900 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 ${
              fieldErrors.password
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                : ""
            }`}
          />
          {fieldErrors.password ? (
            <p id="signin-password-error" className={formFieldErrorClass}>
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        {formError ? (
          <p className={formFieldErrorClass} role="alert">
            {formError}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className={`text-center ${bodyMutedClass}`}>
        No account?{" "}
        <Link href="/sign-up" className={textLinkClass}>
          Create one
        </Link>
      </p>
    </div>
  );
}
