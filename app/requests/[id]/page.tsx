import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RequestsMapWrapper from "../../components/RequestsMapWrapper";
import ApplicationBoard from "../../components/ApplicationBoard";

type Profile = {
  full_name: string | null;
  email: string | null;
  department?: string | null;
  class_year?: string | null;
  contact_handle?: string | null;
};

type RequestDetail = {
  id: string;
  creator_id: string;
  title: string;
  activity_type: string;
  campus: string;
  location_text?: string | null;
  needed_count: number;
  current_count?: number | null;
  starts_at?: string | null;
  time_text?: string | null;
  description?: string | null;
  status: "open" | "filled" | "cancelled" | "expired" | string;
  created_at: string;
  show_location?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
  profiles?: Profile[] | Profile | null;
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

type SimilarRequest = Pick<
  RequestDetail,
  "id" | "title" | "activity_type" | "campus" | "time_text" | "needed_count" | "current_count" | "location_text"
>;

type PageProps = {
  params: Promise<{ id: string }>;
};

function firstProfile(profile: RequestDetail["profiles"] | Application["profiles"]): Profile | null {
  if (!profile) return null;
  return Array.isArray(profile) ? profile[0] ?? null : profile;
}

function formatDate(value?: string | null) {
  if (!value) return null;

  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    open: "Açık",
    filled: "Tamamlandı",
    cancelled: "İptal",
    expired: "Süresi geçti",
    pending: "Beklemede",
    accepted: "Onaylandı",
    rejected: "Bu sefer olmadı",
  };

  return labels[status] ?? status;
}

function activityEmoji(activity: string) {
  const normalized = activity.toLocaleLowerCase("tr-TR");

  if (normalized.includes("kahve") || normalized.includes("yemek")) return "☕";
  if (normalized.includes("spor")) return "🏃";
  if (normalized.includes("ders") || normalized.includes("çalış")) return "📚";
  if (normalized.includes("oyun") || normalized.includes("okey")) return "🎲";
  if (normalized.includes("etkin")) return "🎟️";
  return "•";
}

function getFillRatio(acceptedCount: number, neededCount: number) {
  const accepted = Math.max(0, acceptedCount);
  const needed = Math.max(1, neededCount);
  return Math.min(100, Math.round((accepted / needed) * 100));
}

function ownerDisplayName(owner: Profile | null) {
  return owner?.full_name || owner?.email || "Bir İTÜ öğrencisi";
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: requestData, error } = await supabase
    .from("requests")
    .select(
      "id, creator_id, title, activity_type, campus, location_text, needed_count, current_count, starts_at, time_text, description, status, created_at, show_location, latitude, longitude, profiles(full_name, email, department, class_year, contact_handle)"
    )
    .eq("id", id)
    .single();

  if (error || !requestData) {
    return (
      <main className="min-h-screen bg-[#0b0a09] px-5 py-8 text-stone-100 md:px-6 md:py-10">
        <section className="mx-auto max-w-2xl rounded-[28px] border border-stone-800 bg-stone-900/70 p-6 shadow-xl">
          <p className="text-sm text-stone-500">İstek bulunamadı</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Bu bağlantı artık geçerli görünmüyor.</h1>
          <p className="mt-3 text-stone-400">İstek silinmiş, kapatılmış veya erişimin olmayan bir kayda dönüşmüş olabilir.</p>
          <Link href="/requests" className="mt-6 inline-flex rounded-full bg-stone-100 px-5 py-2 text-sm font-medium text-stone-950 transition hover:bg-white">
            Aktif isteklere dön
          </Link>
        </section>
      </main>
    );
  }

  const request = requestData as RequestDetail;
  const owner = firstProfile(request.profiles);
  const isOwner = user?.id === request.creator_id;
  const isOpen = request.status === "open";
  const createdAt = formatDate(request.created_at);
  const startsAt = formatDate(request.starts_at);
  const displayTime = request.time_text || startsAt || "Zaman netleşecek";
  const displayLocation = request.location_text || request.campus;
  const ownerName = ownerDisplayName(owner);

  let myApplication: Application | null = null;
  let applications: Application[] = [];

  const { count: acceptedApplicationCount } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("request_id", request.id)
    .eq("status", "accepted");

  const acceptedCount = acceptedApplicationCount ?? 0;
  const neededCount = Number(request.needed_count ?? 1);
  const remainingCount = Math.max(0, neededCount - acceptedCount);
  const isAtTarget = acceptedCount >= neededCount;
  const fillRatio = getFillRatio(acceptedCount, neededCount);

  if (user && !isOwner) {
    const { data } = await supabase
      .from("applications")
      .select("id, request_id, applicant_id, message, status, created_at")
      .eq("request_id", request.id)
      .eq("applicant_id", user.id)
      .maybeSingle();

    myApplication = (data as Application | null) ?? null;
  }

  if (isOwner) {
    const { data } = await supabase
      .from("applications")
      .select("id, request_id, applicant_id, message, status, created_at, profiles(full_name, email, department, class_year, contact_handle)")
      .eq("request_id", request.id)
      .order("created_at", { ascending: false });

    applications = (data ?? []) as Application[];
  }

  const { data: similarData } = await supabase
    .from("requests")
    .select("id, title, activity_type, campus, time_text, needed_count, current_count, location_text")
    .eq("status", "open")
    .eq("campus", request.campus)
    .neq("id", request.id)
    .limit(3);

  const similarRequests = (similarData ?? []) as SimilarRequest[];
  const mapRequests =
    request.show_location && request.latitude != null && request.longitude != null
      ? [
          {
            id: request.id,
            title: request.title,
            activity_type: request.activity_type,
            campus: request.campus,
            location_text: request.location_text,
            time_text: request.time_text,
            needed_count: request.needed_count,
            latitude: request.latitude,
            longitude: request.longitude,
          },
        ]
      : [];

  async function applyToRequest(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: freshRequest } = await supabase
      .from("requests")
      .select("creator_id, status")
      .eq("id", id)
      .single();

    if (!freshRequest || freshRequest.status !== "open" || freshRequest.creator_id === user.id) {
      redirect(`/requests/${id}?error=not_allowed`);
    }

    const message = String(formData.get("message") || "").trim();
    const availability = String(formData.get("availability") || "").trim();
    const finalMessage = [message, availability ? `Uygunluk: ${availability}` : ""]
      .filter(Boolean)
      .join("\n\n");

    const { error } = await supabase.from("applications").insert({
      request_id: id,
      applicant_id: user.id,
      message: finalMessage || null,
      status: "pending",
    });

    if (error) redirect(`/requests/${id}?error=apply_failed`);

    revalidatePath(`/requests/${id}`);
    revalidatePath("/requests");
    redirect(`/requests/${id}?applied=1`);
  }

  async function updateApplication(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const applicationId = String(formData.get("application_id") || "");
    const status = String(formData.get("status") || "");

    if (!applicationId || !["accepted", "rejected"].includes(status)) return;

    await supabase.from("applications").update({ status }).eq("id", applicationId);
    revalidatePath(`/requests/${id}`);
    revalidatePath("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#0b0a09] px-5 py-8 text-stone-100 md:px-6 md:py-10">
      <section className="mx-auto max-w-6xl">
        <nav className="mb-5 flex items-center justify-between text-sm text-stone-400">
          <Link href="/requests" className="rounded-full border border-stone-800 bg-stone-900/80 px-4 py-2 transition hover:border-stone-700 hover:bg-stone-800">
            ← İstekler
          </Link>
          <Link href="/dashboard" className="rounded-full border border-stone-800 bg-stone-900/80 px-4 py-2 transition hover:border-stone-700 hover:bg-stone-800">
            Dashboard
          </Link>
        </nav>

        <div className={isOwner ? "grid gap-5" : "grid gap-5 lg:grid-cols-[1.42fr_0.58fr]"}>
          <section className="overflow-hidden rounded-[30px] border border-stone-800 bg-stone-900/80 shadow-xl">
            <div className="border-b border-stone-800/80 px-6 py-4 md:px-8">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill active={isOpen}>{statusLabel(request.status)}</StatusPill>
                <QuietPill>{activityEmoji(request.activity_type)} {request.activity_type}</QuietPill>
                <QuietPill>{request.campus}</QuietPill>
                {request.time_text && <TimePill>{request.time_text}</TimePill>}
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1fr_250px]">
              <article className="px-6 py-7 md:px-8 md:py-8">
                <p className="text-sm text-stone-500">
                  {ownerName} tarafından açıldı
                  {owner?.department ? ` · ${owner.department}` : ""}
                </p>

                <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                  {request.title}
                </h1>

                <p className="mt-5 max-w-2xl whitespace-pre-line text-[15px] leading-7 text-stone-300">
                  {request.description || "Açıklama eklenmemiş. Uygunsan kısa bir notla başvuru gönderebilirsin."}
                </p>

                <div className="mt-7 grid gap-2 rounded-[22px] border border-stone-800 bg-stone-950/35 p-4 md:grid-cols-3">
                  <EntryMeta label="ne zaman" value={displayTime} helper={createdAt ? `${createdAt} açıldı` : undefined} />
                  <EntryMeta label="nerede" value={displayLocation} helper={request.show_location ? "haritada var" : "metinle belirtilmiş"} />
                  <EntryMeta label="durum" value={isOpen ? "başvuru açık" : "başvuru kapalı"} helper={isOwner ? "senin isteğin" : myApplication ? statusLabel(myApplication.status) : "henüz başvurmadın"} />
                </div>
              </article>

              <aside className="border-t border-stone-800 bg-stone-950/25 p-6 lg:border-l lg:border-t-0">
                <p className="text-sm text-stone-500">Eksik kişi</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-6xl font-semibold tracking-tight">+{neededCount}</span>
                  <span className="mb-2 text-sm text-stone-500">kişi</span>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-stone-800">
                  <div className="h-full rounded-full bg-emerald-300" style={{ width: `${fillRatio}%` }} />
                </div>

                {isOwner ? (
                  <>
                    <p className="mt-2 text-xs text-stone-500">
                      {acceptedCount} onaylandı · hedef {neededCount}
                    </p>
                    {isAtTarget ? (
                      <p className="mt-4 rounded-2xl border border-amber-900/70 bg-amber-950/25 p-3 text-xs leading-5 text-amber-100">
                        Hedef doldu. Yine de ekstra kişiyi kabul edebilirsin.
                      </p>
                    ) : (
                      <p className="mt-4 text-sm leading-6 text-stone-400">
                        Başvurular geldikçe aşağıdan yönetebilirsin.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-stone-400">
                    {remainingCount <= 1
                      ? "Bir kişi daha aranıyor. Uygunsan başvuru gönderebilirsin."
                      : `${remainingCount} kişi daha aranıyor. Kısa bir not yeterli.`}
                  </p>
                )}
              </aside>
            </div>
          </section>

          {!isOwner && (
            <aside className="space-y-5">
              <section className="rounded-[28px] border border-stone-800 bg-stone-900/80 p-5 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-stone-500">1 dakikadan kısa</p>
                    <h2 className="mt-1 text-xl font-semibold">
                      {myApplication ? "Başvuru durumun" : "Katılım isteği gönder"}
                    </h2>
                  </div>
                  <span className="rounded-full border border-emerald-900/80 bg-emerald-950/35 px-3 py-1 text-xs font-medium text-emerald-200">
                    {myApplication ? statusLabel(myApplication.status) : "açık"}
                  </span>
                </div>

                {myApplication ? (
                  <div className="mt-5 rounded-2xl border border-stone-800 bg-stone-950/40 p-4">
                    <p className="text-sm text-stone-500">Durum</p>
                    <p className="mt-1 text-xl font-semibold">{statusLabel(myApplication.status)}</p>

                    {myApplication.message && (
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-stone-400">
                        {myApplication.message}
                      </p>
                    )}
                  </div>
                ) : isOpen ? (
                  user ? (
                    <form action={applyToRequest} className="mt-5 space-y-3">
                      <textarea
                        name="message"
                        rows={3}
                        placeholder="Kısa yaz: bugün kampüsteyim, saat uyarsa gelirim."
                        className="w-full rounded-2xl border border-stone-800 bg-stone-950/40 px-4 py-3 text-sm outline-none placeholder:text-stone-600 focus:border-stone-600"
                      />

                      <select
                        name="availability"
                        className="w-full rounded-2xl border border-stone-800 bg-stone-950/40 px-4 py-3 text-sm text-stone-100 outline-none focus:border-stone-600"
                      >
                        <option value="">Uygunluk seç</option>
                        <option value="Şimdi uygunum">Şimdi uygunum</option>
                        <option value="Bugün uygunum">Bugün uygunum</option>
                        <option value="Saat netleşirse gelirim">Saat netleşirse gelirim</option>
                      </select>

                      <button className="w-full rounded-full bg-stone-100 px-5 py-3 text-sm font-medium text-stone-950 transition hover:bg-white">
                        Başvuru gönder
                      </button>

                      <p className="text-center text-xs leading-5 text-stone-500">
                        İstek sahibi onaylarsa iletişim bilgisi görünür.
                      </p>
                    </form>
                  ) : (
                    <Link
                      href="/login"
                      className="mt-5 inline-flex w-full justify-center rounded-full bg-stone-100 px-5 py-3 text-sm font-medium text-stone-950 transition hover:bg-white"
                    >
                      Giriş yap ve başvur
                    </Link>
                  )
                ) : (
                  <p className="mt-4 text-sm text-stone-400">Bu istek artık başvuru almıyor.</p>
                )}
              </section>
            </aside>
          )}
        </div>

        {mapRequests.length > 0 && (
          <section className="mt-5 overflow-hidden rounded-[28px] border border-stone-800 bg-stone-900/75 shadow-xl">
            <div className="max-h-[300px] overflow-hidden">
              <RequestsMapWrapper requests={mapRequests as unknown[]} />
            </div>
          </section>
        )}

        {isOwner && (
          <section className="mt-5">
            <ApplicationBoard applications={applications} updateApplication={updateApplication} />
          </section>
        )}

        {similarRequests.length > 0 && (
          <section className="mt-5 rounded-[28px] border border-stone-800 bg-stone-900/75 p-5 shadow-xl md:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm text-stone-500">Aynı kampüste</p>
                <h2 className="mt-1 text-2xl font-semibold">Benzer açık istekler</h2>
              </div>
              <Link href="/requests" className="text-sm font-medium text-stone-400 hover:text-stone-100">
                Tümünü gör
              </Link>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {similarRequests.map((similar) => (
                <Link
                  key={similar.id}
                  href={`/requests/${similar.id}`}
                  className="group rounded-2xl border border-stone-800 bg-stone-950/35 p-4 transition hover:border-stone-700 hover:bg-stone-800/60"
                >
                  <p className="text-xs text-stone-500">
                    {similar.activity_type} · {similar.time_text || "Zaman esnek"}
                  </p>
                  <h3 className="mt-2 font-medium text-stone-100 group-hover:text-white">{similar.title}</h3>
                  <p className="mt-2 text-sm text-stone-500">
                    {similar.location_text || similar.campus} · +{similar.needed_count}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function StatusPill({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span className={active ? "rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-950" : "rounded-full border border-stone-700 px-3 py-1 text-sm text-stone-300"}>
      {children}
    </span>
  );
}

function QuietPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-stone-700 bg-stone-950/20 px-3 py-1 text-sm text-stone-300">
      {children}
    </span>
  );
}

function TimePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-emerald-900 bg-emerald-950/40 px-3 py-1 text-sm text-emerald-200">
      {children}
    </span>
  );
}

function EntryMeta({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-stone-100">{value}</p>
      {helper && <p className="mt-1 truncate text-xs text-stone-500">{helper}</p>}
    </div>
  );
}
