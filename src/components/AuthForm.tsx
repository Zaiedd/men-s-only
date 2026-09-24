"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, signupAction, type AuthResult } from "@/actions/auth";

export function AuthForm({
  mode,
  returnPath,
}: {
  mode: "login" | "signup";
  returnPath?: string;
}) {
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState<AuthResult, FormData>(
    action,
    {},
  );

  return (
    <div className="form-card">
      <p className="eyebrow eyebrow--red">{mode === "login" ? "Welcome back" : "Join the standard"}</p>
      <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>
        {mode === "login" ? "Sign in" : "Create an account"}
      </h1>

      {state.error && <p className="alert alert-error">{state.error}</p>}

      <form action={formAction} className="list-stack" style={{ marginTop: 22 }}>
        <input type="hidden" name="return" value={returnPath ?? ""} />
        {mode === "signup" && (
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" className="input" placeholder="Your name" autoComplete="name" required />
            {state.fieldErrors?.name && (
              <p className="error-text">{state.fieldErrors.name[0]}</p>
            )}
          </div>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input" placeholder="you@example.com" autoComplete="email" required />
          {state.fieldErrors?.email && (
            <p className="error-text">{state.fieldErrors.email[0]}</p>
          )}
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" className="input" placeholder={mode === "signup" ? "At least 6 characters" : "Your password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} required />
          {state.fieldErrors?.password && (
            <p className="error-text">{state.fieldErrors.password[0]}</p>
          )}
        </div>
        <button className="btn btn--gold btn--block" type="submit" disabled={pending}>
          {pending ? "Working..." : mode === "login" ? "Enter" : "Build the account"}
        </button>
      </form>

      <p style={{ color: "var(--faint)", fontSize: "0.9rem", marginTop: 18, textAlign: "center" }}>
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link href={`/auth/signup${returnPath ? `?return=${encodeURIComponent(returnPath)}` : ""}`} style={{ color: "var(--gold)" }}>
              Forge one
            </Link>
            .
          </>
        ) : (
          <>
            Already a member?{" "}
            <Link href={`/auth/login${returnPath ? `?return=${encodeURIComponent(returnPath)}` : ""}`} style={{ color: "var(--gold)" }}>
              Sign in
            </Link>
            .
          </>
        )}
      </p>
    </div>
  );
}