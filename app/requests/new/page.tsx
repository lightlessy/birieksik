"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SelectedCoords = { lat: number; lng: number };

const LocationPickerMap = dynamic(() => import("@/components/LocationPickerMap"), {
    ssr: false,
}) as ComponentType<{
    campus: string;
    selectedCoords: SelectedCoords | null;
    selectedLocationLabel: string;
    onSelect: (coords: SelectedCoords, label: string) => void;
}>;

export default function NewRequestPage() {
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [timeText, setTimeText] = useState("Şimdi");
    const [campus, setCampus] = useState("");
    const [selectedCoords, setSelectedCoords] = useState<SelectedCoords | null>(null);
    const [selectedLocationLabel, setSelectedLocationLabel] = useState("");
    const [customLocationLabel, setCustomLocationLabel] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const form = new FormData(e.currentTarget);
        const { data } = await supabase.auth.getUser();

        if (!data.user) {
            router.push("/login");
            return;
        }

        const title = String(form.get("title") || "");
        const activityType = String(form.get("activity_type") || "");
        const campusValue = campus || String(form.get("campus") || "");
        const currentCount = Number(form.get("current_count"));
        const neededCount = Number(form.get("needed_count"));
        const description = String(form.get("description") || "");
        const hasLocation = !!selectedCoords;
        const finalLocationLabel = customLocationLabel || selectedLocationLabel || "";

        const { error } = await supabase.from("requests").insert({
            creator_id: data.user.id,
            title,
            activity_type: activityType,
            campus: campusValue,
            location_text: finalLocationLabel,
            needed_count: neededCount,
            current_count: currentCount,
            time_text: timeText,
            description,
            show_location: hasLocation,
            latitude: selectedCoords?.lat ?? null,
            longitude: selectedCoords?.lng ?? null,
            status: "open",
        });

        setLoading(false);

        if (error) alert(error.message);
        else router.push("/requests");
    }

    return (
        <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
            <div className="mx-auto max-w-xl">
                <div className="mb-10 flex items-center gap-2 text-sm text-neutral-500">
                    <Link href="/" className="transition hover:text-white">
                        Ana Sayfa
                    </Link>
                    <span>/</span>
                    <Link href="/requests" className="transition hover:text-white">
                        İstekler
                    </Link>
                    <span>/</span>
                    <span className="text-neutral-300">Yeni istek</span>
                </div>
                <h1 className="text-3xl font-bold">Yeni istek aç</h1>
                <p className="mt-2 text-sm text-neutral-400">
                    Eksik kişiyi bulmak için 30 saniyelik bir istek aç.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <div className="space-y-2">
                        <label htmlFor="title" className="text-sm text-neutral-300">
                            Başlık
                        </label>
                        <input
                            id="title"
                            name="title"
                            required
                            placeholder="Örn: Okey için 1 kişi lazım"
                            className="input"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="activity_type" className="text-sm text-neutral-300">
                            Aktivite
                        </label>
                        <select id="activity_type" name="activity_type" required className="input">
                            <option value="">Aktivite seç</option>
                            <option>Okey / Masa Oyunu</option>
                            <option>Spor</option>
                            <option>Ders Çalışma</option>
                            <option>Yemek / Kahve</option>
                            <option>Diğer</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="campus" className="text-sm text-neutral-300">
                            Kampüs
                        </label>
                        <select
                            id="campus"
                            name="campus"
                            required
                            value={campus}
                            onChange={(e) => {
                                setCampus(e.target.value);
                                setSelectedCoords(null);
                                setSelectedLocationLabel("");
                                setCustomLocationLabel("");
                            }}
                            className="input"
                        >
                            <option value="">Kampüs seç</option>
                            <option>Maçka</option>
                            <option>Gümüşsuyu</option>
                            <option>Taşkışla</option>
                            <option>Ayazağa</option>
                            <option>Diğer</option>
                        </select>
                    </div>

                    {campus && (
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-neutral-300">Buluşma noktası</p>
                                <p className="mt-1 text-xs text-neutral-500">
                                    Hazır noktalardan birini seçebilir veya haritada başka bir noktaya tıklayabilirsin.
                                </p>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                                <div className="h-72 w-full">
                                    <LocationPickerMap
                                        campus={campus}
                                        selectedCoords={selectedCoords}
                                        selectedLocationLabel={selectedLocationLabel}
                                        onSelect={(coords, label) => {
                                            setSelectedCoords(coords);
                                            setSelectedLocationLabel(label);
                                            setCustomLocationLabel(label);
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm text-neutral-300">Buluşma noktası</p>
                                <input
                                    value={customLocationLabel}
                                    onChange={(e) => setCustomLocationLabel(e.target.value)}
                                    placeholder="Henüz nokta seçilmedi"
                                    disabled={!selectedCoords}
                                    className="input disabled:cursor-not-allowed disabled:opacity-60"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="current_count" className="text-sm text-neutral-300">
                            Şu an kaç kişisiniz?
                        </label>
                        <input
                            id="current_count"
                            name="current_count"
                            type="number"
                            min="1"
                            defaultValue="1"
                            required
                            className="input"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="needed_count" className="text-sm text-neutral-300">
                             Kaç kişi eksik?
                        </label>
                        <input
                            id="needed_count"
                            name="needed_count"
                            type="number"
                            min="1"
                            defaultValue="1"
                            required
                            className="input"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="starts_at" className="text-sm text-neutral-300">
                            Ne zaman?
                        </label>
                        <select
                            id="starts_at"
                            value={timeText}
                            onChange={(e) => setTimeText(e.target.value)}
                            className="input"
                        >
                            <option>Şimdi</option>
                            <option>Bugün</option>
                            <option>Yarın</option>
                            <option>Bu hafta</option>
                        </select>
                        <p className="text-xs text-neutral-500">
                            Yakın zamanlı istekler daha hızlı eşleşir.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm text-neutral-300">
                            Kısa açıklama (opsiyonel)
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            placeholder="Örn: 10 dk içinde başlıyoruz"
                            className="input min-h-28"
                        />
                    </div>

                    <button disabled={loading} className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-black">
                        {loading ? "Oluşturuluyor..." : "İsteği yayınla"}
                    </button>
                </form>
            </div>
        </main>
    );
}