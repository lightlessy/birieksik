import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function RequestsPage() {
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("requests")
    .select("id, title, activity_type, campus, location_text, needed_count, current_count, starts_at, description, status, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Aktif istekler</h1>
            <p className="mt-2 text-neutral-400">Kampüste eksik kişiyi bul.</p>
          </div>

          <Link href="/requests/new" className="rounded-2xl bg-white px-4 py-2 font-semibold text-black">
            İstek aç
          </Link>
        </div>

        <div className="mt-8 space-y-4">
          {!requests?.length && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-neutral-300">
              Henüz aktif istek yok. İlk isteği sen aç.
            </div>
          )}

          {requests?.map((request) => (
            <Link
              key={request.id}
              href={`/requests/${request.id}`}
              className="block rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{request.title}</h2>
                  <p className="mt-2 text-sm text-neutral-400">
                    {request.activity_type} · {request.campus}
                    {request.location_text ? ` · ${request.location_text}` : ""}
                  </p>
                  <p className="mt-3 text-neutral-300 line-clamp-2">{request.description}</p>
                </div>

                <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-black">
                  +{request.needed_count}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/dashboard" className="text-sm text-neutral-400 underline">
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}