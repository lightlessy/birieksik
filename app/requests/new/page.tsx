"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewRequestPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("requests").insert({
      creator_id: data.user.id,
      title: form.get("title"),
      activity_type: form.get("activity_type"),
      campus: form.get("campus"),
      location_text: form.get("location_text"),
      needed_count: Number(form.get("needed_count")),
      current_count: Number(form.get("current_count")),
      starts_at: form.get("starts_at") || null,
      description: form.get("description"),
      status: "open",
    });

    setLoading(false);

    if (error) alert(error.message);
    else router.push("/requests");
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold">Yeni istek aç</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input name="title" required placeholder="Başlık: Okey için 1 kişi lazım" className="input" />

          <select name="activity_type" required className="input">
            <option value="">Aktivite seç</option>
            <option>Okey / Masa Oyunu</option>
            <option>Spor</option>
            <option>Ders Çalışma</option>
            <option>Yemek / Kahve</option>
            <option>Diğer</option>
          </select>

          <select name="campus" required className="input">
            <option value="">Kampüs seç</option>
            <option>Maçka</option>
            <option>Gümüşsuyu</option>
            <option>Taşkışla</option>
            <option>Ayazağa</option>
            <option>Diğer</option>
          </select>

          <input name="location_text" placeholder="Konum: Maçka kantin, MED, kütüphane..." className="input" />

          <input name="current_count" type="number" min="1" defaultValue="1" required placeholder="Şu an kaç kişisiniz?" className="input" />

          <input name="needed_count" type="number" min="1" defaultValue="1" required placeholder="Kaç kişi lazım?" className="input" />

          <input name="starts_at" type="datetime-local" className="input" />

          <textarea name="description" placeholder="Kısa açıklama" className="input min-h-28" />

          <button disabled={loading} className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-black">
            {loading ? "Oluşturuluyor..." : "İsteği yayınla"}
          </button>
        </form>
      </div>
    </main>
  );
}