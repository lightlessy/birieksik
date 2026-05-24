"use client";

import { useMemo, useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";

type Profile = {
  full_name: string | null;
  email: string | null;
  department?: string | null;
  class_year?: string | null;
  contact_handle?: string | null;
};

type Application = {
  id: string;
  request_id: string;
  applicant_id: string;
  message?: string | null;
  status: "pending" | "accepted" | "rejected" | string;
  created_at: string;
  profiles?: Profile[] | Profile | null;
};

type Filter = "all" | "pending" | "accepted" | "rejected";

function firstProfile(profile: Application["profiles"]): Profile | null {
  if (!profile) return null;
  return Array.isArray(profile) ? profile[0] ?? null : profile;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Beklemede",
    accepted: "Onaylandı",
    rejected: "Bu sefer olmadı",
  };

  return labels[status] ?? status;
}

function statusClass(status: string) {
  if (status === "accepted") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }

  if (status === "rejected") {
    return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }

  return "border-amber-300/20 bg-amber-300/10 text-amber-200";
}

export default function ApplicationBoard({
  applications,
  updateApplication,
}: {
  applications: Application[];
  updateApplication: (formData: FormData) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [listRef] = useAutoAnimate();

  const counts = useMemo(() => {
    return {
      all: applications.length,
      pending: applications.filter((item) => item.status === "pending").length,
      accepted: applications.filter((item) => item.status === "accepted").length,
      rejected: applications.filter((item) => item.status === "rejected").length,
    };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    if (filter === "all") return applications;
    return applications.filter((item) => item.status === filter);
  }, [applications, filter]);

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "Tümü", count: counts.all },
    { key: "pending", label: "Bekleyen", count: counts.pending },
    { key: "accepted", label: "Onaylanan", count: counts.accepted },
    { key: "rejected", label: "Reddedilen", count: counts.rejected },
  ];

  return (
    <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="mt-1 text-2xl font-bold">Başvurular</h2>
        </div>

        <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-neutral-400">
          {applications.length} başvuru
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={
              filter === item.key
                ? "rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
                : "rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-white/10"
            }
          >
            {item.label} · {item.count}
          </button>
        ))}
      </div>

      {!applications.length && (
        <p className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-400">
          Henüz başvuru yok. Başlık, zaman ve konum netse feed’de daha hızlı reaksiyon alırsın.
        </p>
      )}

      {applications.length > 0 && !filteredApplications.length && (
        <p className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-400">
          Bu filtrede başvuru yok.
        </p>
      )}

      <div ref={listRef} className="mt-5 grid gap-3 md:grid-cols-2">
        {filteredApplications.map((application) => {
          const applicant = firstProfile(application.profiles);

          return (
            <article
              key={application.id}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {applicant?.full_name || applicant?.email || "Bilinmiyor"}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    {[applicant?.department, applicant?.class_year].filter(Boolean).join(" · ") ||
                      "Profil detayı yok"}
                  </p>
                </div>

                <span className={`rounded-full border px-3 py-1 text-xs ${statusClass(application.status)}`}>
                  {statusLabel(application.status)}
                </span>
              </div>

              {application.message && (
                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-neutral-400">
                  {application.message}
                </p>
              )}

              {application.status === "accepted" && (
                <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">
                  İletişim: {applicant?.contact_handle || "Profilde belirtilmemiş"}
                </p>
              )}

              {application.status === "pending" && (
                <div className="mt-4 flex gap-2">
                  <form action={updateApplication}>
                    <input type="hidden" name="application_id" value={application.id} />
                    <input type="hidden" name="status" value="accepted" />
                    <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200">
                      Kabul et
                    </button>
                  </form>

                  <form action={updateApplication}>
                    <input type="hidden" name="application_id" value={application.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <button className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                      Reddet
                    </button>
                  </form>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}