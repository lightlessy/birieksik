"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type RequestItem = {
    id: string;
    title: string;
    status: string;
};

type ApplicationItem = {
    id: string;
    status: "pending" | "accepted" | "rejected";
    message?: string | null;
    profiles?: {
        full_name?: string | null;
        department?: string | null;
        class_year?: string | null;
        contact_handle?: string | null;
    } | null;
    requests?: {
        title?: string | null;
    } | null;
};

export default function DashboardPage() {
    const router = useRouter();
    const supabase = createClient();

    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [applications, setApplications] = useState<ApplicationItem[]>([]);

    useEffect(() => {
        async function load() {
            const { data: userData } = await supabase.auth.getUser();

            if (!userData.user) {
                router.push("/login");
                return;
            }

            const { data: ownRequests } = await supabase
                .from("requests")
                .select("*")
                .eq("creator_id", userData.user.id)
                .order("created_at", { ascending: false });

            setRequests(ownRequests || []);

            if (ownRequests?.length) {
                const ids = ownRequests.map((r) => r.id);

                const { data: apps } = await supabase
                    .from("applications")
                    .select("*, profiles(full_name, department, class_year, contact_handle), requests(title)")
                    .in("request_id", ids)
                    .order("created_at", { ascending: false });

                setApplications(apps || []);
            }
        }

        load();
    }, [router, supabase]);

    async function updateApplication(id: string, status: "accepted" | "rejected") {
        const { error } = await supabase
            .from("applications")
            .update({ status })
            .eq("id", id);

        if (error) alert(error.message);
        else {
            setApplications((prev) =>
                prev.map((app) => (app.id === id ? { ...app, status } : app))
            );
        }
    }

    return (
        <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
            <div className="mx-auto max-w-3xl">
                <div className="mb-10 flex items-center gap-2 text-sm text-neutral-500">
                    <Link href="/" className="transition hover:text-white">
                        Ana Sayfa
                    </Link>
                    <span>/</span>
                    <span className="text-neutral-300">Panelim</span>
                </div>

                <h1 className="text-3xl font-bold">Panelim</h1>

                <section className="mt-8">
                    <h2 className="text-xl font-semibold">Açtığım istekler</h2>

                    <div className="mt-4 space-y-3">
                        {!requests.length && (
                            <p className="text-neutral-400">Henüz istek açmadın.</p>
                        )}

                        {requests.map((request) => (
                            <div key={request.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="font-semibold">{request.title}</p>
                                <p className="text-sm text-neutral-400">{request.status}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-10">
                    <h2 className="text-xl font-semibold">Gelen başvurular</h2>

                    <div className="mt-4 space-y-3">
                        {!applications.length && (
                            <p className="text-neutral-400">Henüz başvuru yok.</p>
                        )}

                        {applications.map((app) => (
                            <div key={app.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-sm text-neutral-400">{app.requests?.title}</p>
                                <p className="mt-1 font-semibold">{app.profiles?.full_name}</p>
                                <p className="text-sm text-neutral-400">
                                    {app.profiles?.department} {app.profiles?.class_year}
                                </p>
                                <p className="mt-3 text-neutral-300">{app.message}</p>

                                {app.status === "accepted" && (
                                    <p className="mt-3 rounded-xl bg-white/10 p-3 text-sm">
                                        İletişim: {app.profiles?.contact_handle || "Belirtilmedi"}
                                    </p>
                                )}

                                <p className="mt-3 text-sm text-neutral-400">Durum: {app.status}</p>

                                {app.status === "pending" && (
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => updateApplication(app.id, "accepted")}
                                            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
                                        >
                                            Kabul et
                                        </button>
                                        <button
                                            onClick={() => updateApplication(app.id, "rejected")}
                                            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold"
                                        >
                                            Reddet
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}