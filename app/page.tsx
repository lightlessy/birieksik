import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="relative min-h-screen bg-neutral-950 text-white">
      <div className="absolute right-6 top-6 flex items-center gap-3 text-xs text-neutral-200">
        {user ? (
          <>
            <span>İTÜ hesabın aktif</span>
            <span className="text-neutral-500">{user.email}</span>
            <Link href="/dashboard" className="text-white/90 hover:text-white">
              Dashboard
            </Link>
          </>
        ) : (
          <Link href="/login" className="text-white/90 hover:text-white">
            Giriş yap
          </Link>
        )}
      </div>

      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
        <p className="mb-4 text-sm font-medium text-neutral-400">Biri Eksik / +1 İTÜ</p>

        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Kampüste biri eksikse, tamamla.
        </h1>

        <p className="mt-6 text-lg leading-8 text-neutral-300">
          Okey, spor, ders çalışma veya kahve için eksik kişiyi bul.
          Sadece İTÜ mailiyle giriş yapılır.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/requests"
            className="rounded-2xl bg-white px-6 py-3 text-center font-semibold text-black"
          >
            Aktif istekleri gör
          </Link>

          <Link
            href="/requests/new"
            className="rounded-2xl border border-white/20 px-6 py-3 text-center font-semibold text-white"
          >
            İstek aç
          </Link>
        </div>
      </section>
    </main>
  );
}