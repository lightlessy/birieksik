"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type RequestWithProfile = {
    id: string;
    title: string;
    activity_type: string;
    campus: string;
    location_text?: string | null;
    current_count: number;
    needed_count: number;
    time_text?: string | null;
    description?: string | null;
    profiles?: { full_name: string | null; email: string | null }[] | null;
};

export default function RequestDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const supabase = createClient();

    const [request, setRequest] = useState<RequestWithProfile | null>(null);
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState("");
    const [applicationStatus, setApplicationStatus] = useState<
        "pending" | "accepted" | "rejected" | null
    >(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        async function loadRequest() {
            const { data } = await supabase
                .from("requests")
                .select("*, profiles(full_name, email)")
                .eq("id", params.id)
                .single();

            setRequest(data);

            const { data: userData } = await supabase.auth.getUser();
            setIsLoggedIn(!!userData.user);

            if (userData.user) {
                const { data: existingApplication } = await supabase
                    .from("applications")
                    .select("status")
                    .eq("request_id", params.id)
                    .eq("applicant_id", userData.user.id)
                    .maybeSingle();

                setApplicationStatus(existingApplication?.status ?? null);
            } else {
                setApplicationStatus(null);
            }
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
        else {
            setStatus("Başvurun gönderildi.");
            setApplicationStatus("pending");
        }
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
                <div className="mb-10 flex items-center gap-2 text-sm text-neutral-500">
                    <Link href="/" className="transition hover:text-white">
                        Ana Sayfa
                    </Link>
                    <span>/</span>
                    <Link href="/requests" className="transition hover:text-white">
                        İstekler
                    </Link>
                    <span>/</span>
                    <span className="text-neutral-300">İstek detayı</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <p className="text-sm text-neutral-400">
                        {request.activity_type} · {request.campus}
                    </p>
                    {request.time_text && (
                        <p className="mt-2 text-xs text-neutral-500">Ne zaman: {request.time_text}</p>
                    )}
                    <p className="mt-2 text-xs text-neutral-500">
                        Gönderen: {request.profiles?.[0]?.full_name || request.profiles?.[0]?.email || "Bilinmiyor"}
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

                    {applicationStatus === "accepted" && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white">
                            Başvurun onaylandı.
                        </div>
                    )}

                    {applicationStatus === "rejected" && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
                            Başvurun reddedildi.
                        </div>
                    )}

                    {applicationStatus === "pending" && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
                            Başvuru yapıldı. Onay bekleniyor.
                        </div>
                    )}

                    {!applicationStatus && isLoggedIn && (
                        <>
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
                        </>
                    )}

                    {!isLoggedIn && (
                        <button
                            onClick={() => router.push("/login")}
                            className="mt-4 w-full rounded-2xl bg-white px-4 py-3 font-semibold text-black"
                        >
                            Giriş yap ve başvur
                        </button>
                    )}

                    {status && <p className="mt-4 text-sm text-neutral-300">{status}</p>}
                </div>
            </div>
        </main>
    );
}