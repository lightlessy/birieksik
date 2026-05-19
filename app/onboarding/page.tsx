"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [classYear, setClassYear] = useState("");
  const [contactHandle, setContactHandle] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkProfile() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (profile) router.push("/requests");
    }

    checkProfile();
  }, [router, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("profiles").insert({
      id: data.user.id,
      email: data.user.email,
      full_name: fullName,
      department,
      class_year: classYear,
      contact_handle: contactHandle,
    });

    setLoading(false);

    if (!error) router.push("/requests");
    else alert(error.message);
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold">Profilini tamamla</h1>
        <p className="mt-3 text-neutral-400">
          Kabul edildiğinde iletişim bilgin karşı tarafa gösterilir.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            required
            placeholder="Ad Soyad"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
          />

          <input
            placeholder="Bölüm"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
          />

          <input
            placeholder="Sınıf"
            value={classYear}
            onChange={(e) => setClassYear(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
          />

          <input
            placeholder="Telegram / Instagram / WhatsApp"
            value={contactHandle}
            onChange={(e) => setContactHandle(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
          />

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-black"
          >
            {loading ? "Kaydediliyor..." : "Devam et"}
          </button>
        </form>
      </div>
    </main>
  );
}