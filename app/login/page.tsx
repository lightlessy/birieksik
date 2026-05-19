"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!email.endsWith("@itu.edu.tr")) {
      setMessage("Sadece @itu.edu.tr uzantılı mail kabul edilir.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Giriş linki mailine gönderildi.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold">İTÜ mailiyle giriş yap</h1>
        <p className="mt-3 text-neutral-400">
          MVP için sadece @itu.edu.tr uzantılı adresler kabul edilir.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <input
            type="email"
            required
            placeholder="ornek@itu.edu.tr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
          />

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-black disabled:opacity-50"
          >
            {loading ? "Gönderiliyor..." : "Giriş linki gönder"}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-neutral-300">{message}</p>}
      </div>
    </main>
  );
}