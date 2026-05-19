"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [request, setRequest] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function loadRequest() {
      const { data } = await supabase
        .from("requests")
        .select("*")
        .eq("id", params.id)
        .single();

      setRequest(data);
    }

    loadRequest();
  }, [params.id, supabase]);

  async function apply() {
    setStatus("");

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("applications").insert({
      request_id: params.id,
      applicant_id: data.user.id,
      message,
      status: "pending",
    });

    if (error) setStatus(error.message);
    else setStatus("Başvurun gönderildi.");
  }

  if (!request) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
        Yükleniyor...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-neutral-400">
            {request.activity_type} · {request.campus}
          </p>

          <h1 className="mt-3 text-3xl font-bold">{request.title}</h1>

          <p className="mt-4 text-neutral-300">{request.description}</p>

          <div className="mt-6 rounded-2xl bg-white/5 p-4 text-sm text-neutral-300">
            <p>Konum: {request.location_text || "Belirtilmedi"}</p>
            <p>Şu an: {request.current_count} kişi</p>
            <p>Aranan: {request.needed_count} kişi</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Katılmak istiyorum</h2>

          <textarea
            placeholder="Kısa mesaj: Ben gelebilirim, 10 dk içindeyim."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input mt-4 min-h-28"
          />

          <button
            onClick={apply}
            className="mt-4 w-full rounded-2xl bg-white px-4 py-3 font-semibold text-black"
          >
            Başvur
          </button>

          {status && <p className="mt-4 text-sm text-neutral-300">{status}</p>}
        </div>
      </div>
    </main>
  );
}