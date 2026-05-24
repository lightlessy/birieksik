"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
    const [loading, setLoading] = useState(false);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();

        setMessage("");
        setMessageType("info");

        const normalizedEmail = email.trim().toLowerCase();

        const isDev = process.env.NODE_ENV === "development";

        const isAllowedEmail =
            normalizedEmail.endsWith("@itu.edu.tr") ||
            (isDev && normalizedEmail.endsWith("@gmail.com"));

        if (!isAllowedEmail) {
            setMessage(
                isDev
                    ? "Dev modda @itu.edu.tr veya @gmail.com kabul ediliyor."
                    : "Şimdilik sadece @itu.edu.tr uzantılı mailler kabul ediliyor."
            );
            setMessageType("error");
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();

            const { error } = await supabase.auth.signInWithOtp({
                email: normalizedEmail,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                setMessage("Giriş linki gönderilemedi. Lütfen tekrar dene.");
                setMessageType("error");
            } else {
                setMessage("Giriş linki İTÜ mailine gönderildi. Gelen kutunu kontrol et.");
                setMessageType("success");
            }
        } catch {
            setMessage("Beklenmeyen bir hata oluştu. Birazdan tekrar dene.");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    }

    const messageClass =
        messageType === "success"
            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
            : messageType === "error"
                ? "border-red-400/20 bg-red-400/10 text-red-200"
                : "border-white/10 bg-white/5 text-neutral-300";

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,#27272a_0,#0a0a0a_42%,#000_100%)] px-6 py-16 text-white">
            <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
                    <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
                        İTÜ kapalı beta
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight">
                        Birieksik’e giriş yap
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-neutral-400">
                        Şimdilik sadece İTÜ öğrencileri için açık. Mailine gelen güvenli
                        bağlantı ile hesaba giriş yapabilirsin.
                    </p>

                    <form onSubmit={handleLogin} className="mt-8 space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-neutral-300">
                                İTÜ mail adresin
                            </label>

                            <input
                                type="email"
                                required
                                placeholder={process.env.NODE_ENV === "development" ? "ornek@gmail.com" : "ornek@itu.edu.tr"}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-neutral-600 outline-none transition focus:border-white/30 focus:bg-black/50"
                            />
                        </div>

                        <button
                            disabled={loading}
                            className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? "Link gönderiliyor..." : "Giriş linki gönder"}
                        </button>
                    </form>

                    {message && (
                        <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${messageClass}`}>
                            {message}
                        </div>
                    )}

                    <div className="mt-6 border-t border-white/10 pt-5 text-xs leading-5 text-neutral-500">
                        Spam klasörünü de kontrol et. Link birkaç dakika içinde gelmezse
                        tekrar deneyebilirsin.
                    </div>
                </div>
            </div>
        </main>
    );
}