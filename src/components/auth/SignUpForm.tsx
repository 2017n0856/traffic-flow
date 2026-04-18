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
import {
  bodyMutedClass,
  formFieldErrorClass,
  formHelperClass,
  formInputBaseClass,
  formLabelClass,
  pageTitleClass,
  primaryButtonClass,
  textLinkClass,
} from "@/lib/ui/form";

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

  const inputClass = formInputBaseClass;

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitleClass}>Create account</h1>
        <p className={`mt-1 ${bodyMutedClass}`}>
          Create your new user account.
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-1.5">
          <label htmlFor="signup-name" className={formLabelClass}>
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
            <p id="signup-name-error" className={formFieldErrorClass}>
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="signup-email" className={formLabelClass}>
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
            <p id="signup-email-error" className={formFieldErrorClass}>
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="signup-phone" className={formLabelClass}>
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
            <p id="signup-phone-error" className={formFieldErrorClass}>
              {fieldErrors.phone}
            </p>
          ) : null}
          <p className={formHelperClass}>
            10–15 digits; formatting characters are ignored.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="signup-password" className={formLabelClass}>
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
            <p id="signup-password-error" className={formFieldErrorClass}>
              {fieldErrors.password}
            </p>
          ) : null}
          <p className={formHelperClass}>
            Use at least 8 characters with letters and numbers.
          </p>
        </div>

        {formError ? (
          <p className={formFieldErrorClass} role="alert">
            {formError}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <p className={`text-center ${bodyMutedClass}`}>
        Already have an account?{" "}
        <Link href="/sign-in" className={textLinkClass}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
