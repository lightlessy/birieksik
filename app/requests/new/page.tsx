"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { createClient } from "@/lib/supabase/client";

type SelectedCoords = { lat: number; lng: number };
type ChoiceOption = { id: string; label: string; value: string };

const LocationPickerMap = dynamic(() => import("@/components/LocationPickerMap"), {
    ssr: false,
}) as ComponentType<{
    campus: string;
    selectedCoords: SelectedCoords | null;
    selectedLocationLabel: string;
    onSelect: (coords: SelectedCoords, label: string) => void;
}>;

const activityOptions: ChoiceOption[] = [
    { id: "okey", label: "Okey / Masa Oyunu", value: "Okey / Masa Oyunu" },
    { id: "spor", label: "Spor", value: "Spor" },
    { id: "ders", label: "Ders Çalışma", value: "Ders Çalışma" },
    { id: "kahve", label: "Yemek / Kahve", value: "Yemek / Kahve" },
    { id: "etkinlik", label: "Etkinlik", value: "Etkinlik" },
    { id: "diger", label: "Diğer", value: "Diğer" },
];

const campusOptions: ChoiceOption[] = [
    { id: "macka", label: "Maçka", value: "Maçka" },
    { id: "gumus", label: "Gümüşsuyu", value: "Gümüşsuyu" },
    { id: "taskis", label: "Taşkışla", value: "Taşkışla" },
    { id: "ayaz", label: "Ayazağa", value: "Ayazağa" },
    { id: "diger", label: "Diğer", value: "Diğer" },
];

const timeOptions = ["Şimdi", "30 dk içinde", "Bugün", "Bu akşam", "Yarın"];

export default function NewRequestPage() {
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [submitError, setSubmitError] = useState("");

    const [title, setTitle] = useState("");
    const [activityType, setActivityType] = useState("");
    const [campus, setCampus] = useState("");
    const [timeText, setTimeText] = useState("");
    const [currentCount, setCurrentCount] = useState(0);
    const [neededCount, setNeededCount] = useState(0);
    const [description, setDescription] = useState("");
    const [selectedCoords, setSelectedCoords] = useState<SelectedCoords | null>(null);
    const [selectedLocationLabel, setSelectedLocationLabel] = useState("");
    const [customLocationLabel, setCustomLocationLabel] = useState("");

    const [sectionAnimateRef] = useAutoAnimate({ duration: 180 });
    const [mapAnimateRef] = useAutoAnimate({ duration: 220 });

    const descriptionPlaceholder = useMemo(() => {
        if (activityType === "Okey / Masa Oyunu") return "Mesela: Masadayız, 10 dk içinde başlıyoruz.";
        if (activityType === "Yemek / Kahve") return "Mesela: Kısa sohbet, sakin ortam.";
        return "Mesela: 10 dk içinde başlıyoruz, yeni gelen de olur.";
    }, [activityType]);

    const previewLocation = customLocationLabel || selectedLocationLabel || "";

    const canSuggestTitle = Boolean(activityType || neededCount > 0 || campus || timeText);

    const canSubmit = Boolean(
        title.trim() &&
        activityType &&
        campus &&
        currentCount > 0 &&
        neededCount > 0 &&
        timeText
    );

    const steps = [
        { id: "title", label: "Başlık", done: Boolean(title.trim()) },
        { id: "activity", label: "Aktivite", done: Boolean(activityType) },
        { id: "place", label: "Yer", done: Boolean(campus) },
        { id: "people", label: "Kişi", done: currentCount > 0 && neededCount > 0 },
        { id: "time", label: "Zaman", done: Boolean(timeText) },
        { id: "publish", label: "Yayın", done: canSubmit },
    ];

    const activeStepIndex = steps.findIndex((step) => !step.done);
    const activeStep = activeStepIndex === -1 ? steps.length - 1 : activeStepIndex;

    function clearErrors() {
        setErrorMessage("");
        setSubmitError("");
    }

    function generateTitleSuggestion() {
        if (activityType && neededCount > 0) {
            const neededText =
                neededCount === 1
                    ? "1 kişi"
                    : neededCount >= 5
                      ? "5+ kişi"
                      : `${neededCount} kişi`;

            setTitle(`${activityType} için ${neededText} aranıyor`);
            clearErrors();
            return;
        }

        if (activityType) {
            setTitle(`${activityType} için kişi aranıyor`);
            clearErrors();
            return;
        }

        setTitle("Yeni istek");
        clearErrors();
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (loading) return;

        setErrorMessage("");
        setSubmitError("");

        if (!title.trim() || !activityType || !campus || !timeText || currentCount <= 0 || neededCount <= 0) {
            setErrorMessage("Yayınlamak için başlık, aktivite, kampüs, kişi ve zaman seç.");
            return;
        }

        setLoading(true);

        const { data } = await supabase.auth.getUser();

        if (!data.user) {
            setLoading(false);
            router.push("/login");
            return;
        }

        const hasLocation = !!selectedCoords;
        const finalLocationLabel = customLocationLabel || selectedLocationLabel || "";

        const { error } = await supabase.from("requests").insert({
            creator_id: data.user.id,
            title: title.trim(),
            activity_type: activityType,
            campus,
            location_text: finalLocationLabel,
            needed_count: neededCount,
            current_count: currentCount,
            time_text: timeText,
            description: description.trim(),
            show_location: hasLocation,
            latitude: selectedCoords?.lat ?? null,
            longitude: selectedCoords?.lng ?? null,
            status: "open",
        });

        setLoading(false);

        if (error) {
            setSubmitError("Bir şeyler ters gitti. Lütfen tekrar dene.");
            return;
        }

        router.push("/requests");
    }

    return (
        <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
            <div className="mx-auto max-w-5xl">
                <div className="mb-10 flex items-center gap-2 text-sm text-neutral-500">
                    <Link href="/requests" className="transition hover:text-white">
                        İstekler
                    </Link>
                    <span>/</span>
                    <span className="text-neutral-300">Yeni istek</span>
                </div>

                <div>
                    <h1 className="text-3xl font-semibold">Yeni istek aç</h1>
                    <p className="mt-2 text-sm text-neutral-400">
                        Eksik kişiyi bulmak için birkaç seçim yap, isteğini yayınla.
                    </p>
                </div>

                <div className="sticky top-0 z-30 -mx-6 mt-6 border-b border-white/10 bg-neutral-950/85 px-6 py-3 backdrop-blur-xl">
                    <div className="mx-auto max-w-5xl overflow-x-auto">
                        <StepFeedback steps={steps} activeIndex={activeStep} />
                    </div>
                </div>

                <form
                    id="new-request-form"
                    onSubmit={handleSubmit}
                    className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]"
                >
                    <div className="space-y-10" ref={sectionAnimateRef}>
                        <SectionCard
                            title="Başlık"
                            subtitle="İnsan gibi yaz. Bu cümle kartta görünecek."
                            emphasis
                        >
                            <div className="space-y-3">
                                <input
                                    value={title}
                                    onChange={(e) => {
                                        setTitle(e.target.value);
                                        clearErrors();
                                    }}
                                    placeholder="Örn: Okey için 1 kişi lazım"
                                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none transition focus:border-white/20"
                                />

                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={generateTitleSuggestion}
                                        disabled={!canSuggestTitle}
                                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-neutral-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Otomatik öner
                                    </button>

                                    <p className="text-xs text-neutral-500">
                                        İstersen kendin yaz, istersen seçimlerden öneri oluştur.
                                    </p>
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard title="Ne yapıyorsunuz?" emphasis>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {activityOptions.map((option) => (
                                    <ChoiceChip
                                        key={option.id}
                                        label={option.label}
                                        selected={activityType === option.value}
                                        onClick={() => {
                                            setActivityType(option.value);
                                            clearErrors();
                                        }}
                                    />
                                ))}
                            </div>
                        </SectionCard>

                        <SectionCard title="Neredesiniz?" subtitle="Kampüsü seç, istersen buluşma noktası ekle." emphasis>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {campusOptions.map((option) => (
                                    <ChoiceChip
                                        key={option.id}
                                        label={option.label}
                                        selected={campus === option.value}
                                        onClick={() => {
                                            setCampus(option.value);
                                            setSelectedCoords(null);
                                            setSelectedLocationLabel("");
                                            setCustomLocationLabel("");
                                            clearErrors();
                                        }}
                                    />
                                ))}
                            </div>

                            <div ref={mapAnimateRef} className="mt-6 space-y-4">
                                {campus ? (
                                    <div className="space-y-4">
                                        <div className="rounded-2xl bg-white/[0.03] p-4">
                                            <p className="text-sm text-neutral-300">Buluşma noktası</p>
                                            <p className="mt-1 text-xs text-neutral-500">
                                                Haritadan yaklaşık noktayı seçebilir veya sonra netleştirebilirsin.
                                            </p>

                                            <div className="mt-4 h-64 overflow-hidden rounded-2xl border border-white/10">
                                                <LocationPickerMap
                                                    campus={campus}
                                                    selectedCoords={selectedCoords}
                                                    selectedLocationLabel={selectedLocationLabel}
                                                    onSelect={(coords, label) => {
                                                        setSelectedCoords(coords);
                                                        setSelectedLocationLabel(label);
                                                        setCustomLocationLabel(label);
                                                        clearErrors();
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm text-neutral-300">Buluşma noktası</label>
                                            <input
                                                value={customLocationLabel}
                                                onChange={(e) => {
                                                    setCustomLocationLabel(e.target.value);
                                                    clearErrors();
                                                }}
                                                placeholder="Henüz nokta seçilmedi"
                                                disabled={!selectedCoords}
                                                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none transition focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                                            />

                                            {!selectedCoords && (
                                                <p className="text-xs text-neutral-500">
                                                    İstersen haritadan yaklaşık buluşma noktasını seçebilirsin.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-neutral-500">
                                        Kampüs seçince harita ve buluşma noktası açılır.
                                    </p>
                                )}
                            </div>
                        </SectionCard>

                        <SectionCard title="Kaç kişi?" subtitle="Hızlı ve net: iki seçim yeter." compact>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <CountSelector
                                    label="Şu an kaç kişisiniz?"
                                    mode="current"
                                    value={currentCount}
                                    onChange={(value) => {
                                        setCurrentCount(value);
                                        clearErrors();
                                    }}
                                />

                                <CountSelector
                                    label="Kaç kişi eksik?"
                                    mode="needed"
                                    value={neededCount}
                                    onChange={(value) => {
                                        setNeededCount(value);
                                        clearErrors();
                                    }}
                                />
                            </div>
                        </SectionCard>

                        <SectionCard title="Ne zaman?" subtitle="Yakın zamanlar daha hızlı eşleşir." compact>
                            <div className="flex flex-wrap gap-2">
                                {timeOptions.map((option) => (
                                    <ChoiceChip
                                        key={option}
                                        label={option}
                                        selected={timeText === option}
                                        onClick={() => {
                                            setTimeText(option);
                                            clearErrors();
                                        }}
                                        size="sm"
                                    />
                                ))}
                            </div>
                        </SectionCard>

                        <SectionCard title="Kısa not" subtitle="Opsiyonel ama samimi bir cümle iyi gelir." compact>
                            <textarea
                                value={description}
                                onChange={(e) => {
                                    setDescription(e.target.value);
                                    clearErrors();
                                }}
                                placeholder={descriptionPlaceholder}
                                className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none transition focus:border-white/20"
                            />
                        </SectionCard>

                        {errorMessage && (
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-neutral-300">
                                {errorMessage}
                            </div>
                        )}

                        {submitError && (
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-neutral-300">
                                {submitError}
                            </div>
                        )}
                    </div>

                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <LivePreviewCard
                            title={title}
                            timeText={timeText}
                            campus={campus}
                            currentCount={currentCount}
                            neededCount={neededCount}
                            location={previewLocation}
                            description={description}
                            loading={loading}
                            canSubmit={canSubmit}
                        />
                    </aside>
                </form>
            </div>
        </main>
    );
}

function SectionCard({
    title,
    subtitle,
    children,
    emphasis,
    compact,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    emphasis?: boolean;
    compact?: boolean;
}) {
    return (
        <section className={compact ? "space-y-3" : "space-y-4"}>
            <div>
                <h2 className={emphasis ? "text-xl font-semibold text-white" : "text-lg font-semibold text-white"}>
                    {title}
                </h2>

                {subtitle && (
                    <p className={emphasis ? "mt-1 text-sm text-neutral-300" : "mt-1 text-sm text-neutral-400"}>
                        {subtitle}
                    </p>
                )}
            </div>

            {children}
        </section>
    );
}

function ChoiceChip({
    label,
    selected,
    onClick,
    size,
}: {
    label: string;
    selected: boolean;
    onClick: () => void;
    size?: "sm" | "md";
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={`rounded-2xl transition ${
                size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
            } ${
                selected
                    ? "bg-white text-black"
                    : "border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
            }`}
        >
            {label}
        </button>
    );
}

function CountSelector({
    label,
    mode,
    value,
    onChange,
}: {
    label: string;
    mode: "current" | "needed";
    value: number;
    onChange: (value: number) => void;
}) {
    const options =
        mode === "current"
            ? [
                  { label: "Tekim", value: 1 },
                  { label: "2 kişiyiz", value: 2 },
                  { label: "3 kişiyiz", value: 3 },
                  { label: "4+", value: 4 },
              ]
            : [
                  { label: "1 kişi", value: 1 },
                  { label: "2 kişi", value: 2 },
                  { label: "3 kişi", value: 3 },
                  { label: "4 kişi", value: 4 },
                  { label: "5+", value: 5 },
              ];

    return (
        <div className="space-y-3">
            <p className="text-sm text-neutral-300">{label}</p>

            <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                    <ChoiceChip
                        key={`${mode}-${option.value}`}
                        label={option.label}
                        selected={value === option.value}
                        onClick={() => onChange(option.value)}
                        size="sm"
                    />
                ))}
            </div>
        </div>
    );
}

function StepFeedback({
    steps,
    activeIndex,
}: {
    steps: { id: string; label: string; done: boolean }[];
    activeIndex: number;
}) {
    return (
        <div className="flex min-w-max items-center gap-2 text-xs text-neutral-400">
            {steps.map((step, index) => {
                const isActive = index === activeIndex;

                return (
                    <div key={step.id} className="flex items-center gap-2">
                        <div
                            className={`flex items-center gap-2 rounded-full border px-2 py-1 transition ${
                                isActive
                                    ? "border-white/15 bg-white/[0.06]"
                                    : "border-white/10 bg-white/[0.03]"
                            }`}
                        >
                            <div className="relative flex h-4 w-4 items-center justify-center">
                                {isActive && (
                                    <motion.span
                                        layoutId="activeStep"
                                        className="absolute h-4 w-4 rounded-full bg-white"
                                        transition={{ type: "spring", stiffness: 260, damping: 22 }}
                                    />
                                )}

                                <span
                                    className={`relative h-2 w-2 rounded-full ${
                                        isActive ? "bg-neutral-950" : step.done ? "bg-white" : "bg-white/30"
                                    }`}
                                />
                            </div>

                            <span className={step.done || isActive ? "text-white" : "text-neutral-400"}>
                                {index + 1}. {step.label}
                            </span>

                            {step.done && !isActive && <span className="text-white">✓</span>}
                        </div>

                        {index < steps.length - 1 && <span className="text-neutral-600">—</span>}
                    </div>
                );
            })}
        </div>
    );
}

function LivePreviewCard({
    title,
    timeText,
    campus,
    currentCount,
    neededCount,
    location,
    description,
    loading,
    canSubmit,
}: {
    title: string;
    timeText: string;
    campus: string;
    currentCount: number;
    neededCount: number;
    location: string;
    description: string;
    loading: boolean;
    canSubmit: boolean;
}) {
    const peopleText =
        currentCount > 0 && neededCount > 0
            ? `${currentCount === 1 ? "Tek başınasın" : `${currentCount} kişisiniz`} · ${
                  neededCount === 1 ? "1 kişi eksik" : neededCount >= 5 ? "5+ kişi aranıyor" : `${neededCount} kişi eksik`
              }`
            : "Kişi sayısı seçilmedi";

    return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.8)]">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Canlı önizleme</p>

            <motion.h3
                key={title}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="mt-3 text-lg font-semibold"
            >
                {title.trim() || "Başlık bekleniyor"}
            </motion.h3>

            <p className="mt-2 text-sm text-neutral-400">
                {timeText || "Zaman seçilmedi"} · {campus || "Kampüs seçilmedi"}
            </p>

            <div className="mt-4 space-y-2 text-sm text-neutral-300">
                <p>{peopleText}</p>
                <p>{location ? location : "Konum isteğe bağlı"}</p>
                <p className="text-neutral-400">
                    {description.trim() ? description : "Kısa not eklenmedi"}
                </p>
            </div>

            <p className="mt-4 text-xs text-neutral-500">Katılma isteği onaydan geçer.</p>

            {!canSubmit && (
                <p className="mt-3 text-xs text-neutral-500">
                    Yayınlamak için başlık, aktivite, kampüs, kişi ve zaman seç.
                </p>
            )}

            <button
                type="submit"
                form="new-request-form"
                disabled={!canSubmit || loading}
                className="mt-4 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition disabled:cursor-not-allowed disabled:bg-white/60"
            >
                {loading ? "Yayınlanıyor..." : "İsteği yayınla"}
            </button>
        </div>
    );
}