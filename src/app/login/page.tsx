"use client";

import { useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSignIn = () => {
    setMessage("");
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      window.location.href = "/dashboard";
    });
  };

  const handleSignUp = () => {
    setMessage("");
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.session) {
        window.location.href = "/dashboard";
        return;
      }

      setMessage("Check your email to confirm your account.");
    });
  };

  const isDisabled = !email || !password || isPending;

  return (
    <div className="min-h-screen px-6 py-16 sm:px-12">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-10">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.25em] text-muted">
            Noticing
          </p>
          <h1 className="text-4xl font-semibold">Welcome back.</h1>
          <p className="text-muted">
            Sign in with your email and password to continue.
          </p>
        </header>

        <div className="rounded-3xl border border-line bg-panel p-8 shadow-soft">
          <label className="text-sm font-semibold">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-line bg-transparent px-4 py-3 text-sm focus:border-foreground focus:outline-none"
            placeholder="you@example.com"
            required
          />

          <label className="mt-5 block text-sm font-semibold">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-line bg-transparent px-4 py-3 text-sm focus:border-foreground focus:outline-none"
            placeholder="••••••••"
            required
          />

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleSignIn}
              disabled={isDisabled}
              className="flex-1 rounded-full bg-foreground px-6 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sign in
            </button>
            <button
              onClick={handleSignUp}
              disabled={isDisabled}
              className="flex-1 rounded-full border border-line px-6 py-2 text-sm font-semibold text-foreground transition hover:border-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              Create account
            </button>
          </div>

          {message ? (
            <p className="mt-4 text-sm text-muted">{message}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
