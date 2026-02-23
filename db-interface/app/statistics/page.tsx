"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

// ── Types ───────────────────────────────────────────────────────────
type DatePreset = "7d" | "30d" | "90d" | "1y" | "all" | "custom";

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: "7d", label: "7j" },
  { key: "30d", label: "30j" },
  { key: "90d", label: "90j" },
  { key: "1y", label: "1 an" },
  { key: "all", label: "Tout" },
  { key: "custom", label: "Personnalisé" },
];

function getPresetDates(preset: DatePreset): {
  from: string | null;
  to: string | null;
} {
  if (preset === "all") return { from: null, to: null };
  if (preset === "custom") return { from: null, to: null };
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const daysMap: Record<string, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
  };
  const fromDate = new Date(
    now.getTime() - (daysMap[preset] || 30) * 24 * 60 * 60 * 1000,
  );
  return { from: fromDate.toISOString().slice(0, 10), to };
}

interface StatsData {
  dateFilter: {
    from: string | null;
    to: string | null;
    applied: boolean;
  };
  overview: {
    totalStudents: number;
    newStudentsInRange: number;
    expiredSubscriptions: number;
    totalQuestions: number;
    totalModules: number;
    totalTestAttempts: number;
    totalQuestionsAnswered: number;
    activeUsersLast7Days: number;
    activeUsersLast30Days: number;
    totalDeviceSessions: number;
    totalActivationKeys: number;
    keysUsed: number;
    keysUnused: number;
    savedQuestions: number;
    questionReports: number;
    feedbackCount: number;
    chatLogCount: number;
  };
  users: {
    byFaculty: { name: string; count: number }[];
    byFacultyGroup: { name: string; count: number }[];
    byYear: { name: string; count: number }[];
    bySpeciality: { name: string; count: number }[];
  };
  engagement: {
    avgScore: number;
    avgTimeSeconds: number;
    totalQuestionsAnswered: number;
    uniqueTesters: number;
    topModulesByAttempts: {
      module: string;
      attempts: number;
      avgScore: number;
      uniqueUsers: number;
    }[];
  };
  content: {
    questionsByModule: { name: string; count: number }[];
    questionsByExamType: { name: string; count: number }[];
  };
  growth: {
    registrationTimeline: { month: string; count: number }[];
    activationTimeline: { month: string; count: number }[];
  };
  revenue: {
    keysManual: number;
    keysOnline: number;
    totalOnlineRevenue: number;
    paidPaymentsCount: number;
    offerBreakdown: {
      offerName: string;
      amount: number;
      count: number;
      revenue: number;
      durationDays: number;
    }[];
  };
  tendance: {
    totalExamYears: number;
    totalCours: number;
    alwaysTendableCount: number;
    topCours: {
      module: string;
      cours: string;
      yearsAppeared: number;
      totalQuestions: number;
      tendanceScore: number;
      examYears: number[];
    }[];
    moduleSummary: {
      module: string;
      totalCours: number;
      alwaysTendable: number;
      oftenTendable: number;
      totalQuestions: number;
      tendabilityPct: number;
    }[];
  };
}

// ── Chart colors ────────────────────────────────────────────────────
const CHART_COLORS = [
  "#09b2ac", // primary—Light Green Sea
  "#9941ff", // secondary—Veronica
  "#f59e0b", // amber
  "#ef4444", // red
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f97316", // orange
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
];

const FACULTY_LABELS: Record<string, string> = {
  fac_mere: "Fac. Mère",
  annexe_biskra: "Biskra",
  annexe_souk_ahras: "Souk Ahras",
  annexe_khenchela: "Khenchela",
  annexe_oum_el_bouaghi: "Oum El Bouaghi",
  annexe_bechar: "Béchar",
  annexe_laghouat: "Laghouat",
  annexe_ouargla: "Ouargla",
  "Non renseigné": "Non renseigné",
  "": "Non renseigné",
};

const YEAR_LABELS: Record<string, string> = {
  "1": "1ère Année",
  "2": "2ème Année",
  "3": "3ème Année",
  "Non renseigné": "Non renseigné",
};

// ── Helpers ─────────────────────────────────────────────────────────
function formatMinutes(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const months = [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Jun",
    "Jul",
    "Aoû",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ];
  return `${months[parseInt(m) - 1]} ${year.slice(2)}`;
}

function truncateLabel(label: string, max = 18): string {
  return label.length > max ? label.slice(0, max) + "…" : label;
}

// ── KPI Card ────────────────────────────────────────────────────────
function KpiCard({
  icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`bg-theme-card border border-theme rounded-2xl p-5 flex flex-col gap-1 transition-shadow hover:shadow-lg ${
        accent ? "ring-2 ring-primary/30" : ""
      }`}
    >
      <div className="flex items-center gap-2 text-theme-muted text-xs font-semibold uppercase tracking-wider">
        <span className="text-lg">{icon}</span>
        {label}
      </div>
      <div className="text-2xl font-extrabold font-heading text-theme-main">
        {value}
      </div>
      {sub && <div className="text-xs text-theme-muted">{sub}</div>}
    </div>
  );
}

// ── Section Wrapper ─────────────────────────────────────────────────
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold font-heading text-theme-main flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

// ── Custom Tooltip ──────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-theme-card border border-theme rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-theme-main mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────
export default function StatisticsPage() {
  const router = useRouter();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [tendanceModule, setTendanceModule] = useState<string>("all");
  // Persist last-used filter params for retry
  const lastFilterRef = useRef<{ from: string | null; to: string | null }>({
    from: null,
    to: null,
  });

  const fetchStats = useCallback(
    async (from?: string | null, to?: string | null) => {
      setLoading(true);
      setError(null);
      // Persist filter params for retry
      lastFilterRef.current = { from: from ?? null, to: to ?? null };
      try {
        // Get current session for auth header
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setError("Session expirée. Veuillez vous reconnecter.");
          setLoading(false);
          return;
        }

        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        const qs = params.toString();
        const res = await fetch(`/api/stats${qs ? `?${qs}` : ""}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Erreur ${res.status}`);
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Auth check + initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("[stats] Session error:", sessionError);
          router.push("/login");
          return;
        }
        if (!session) {
          router.push("/login");
          return;
        }

        const { data: user, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (userError) {
          console.error("[stats] User query error:", userError);
          setError("Impossible de vérifier votre rôle.");
          setLoading(false);
          return;
        }

        if (!user || user.role !== "owner") {
          router.push("/");
          return;
        }

        fetchStats();
      } catch (err: any) {
        console.error("[stats] Auth check failed:", err);
        setError("Erreur d'authentification.");
        setLoading(false);
      }
    };
    checkAuth();
  }, [router, fetchStats]);

  // ── Loading / Error states ──────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-theme-muted text-sm font-semibold animate-pulse">
            Chargement des statistiques…
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-theme-card border border-red-500/30 rounded-2xl p-8 max-w-md text-center space-y-4">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-xl font-bold text-red-500">Erreur</h2>
          <p className="text-theme-secondary text-sm">
            {error || "Données indisponibles."}
          </p>
          <button
            onClick={() =>
              fetchStats(lastFilterRef.current.from, lastFilterRef.current.to)
            }
            className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const { overview, users, engagement, content, growth, revenue, tendance } =
    data;

  // Handle preset change
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === "custom") return; // wait for user to pick dates
    const { from, to } = getPresetDates(preset);
    fetchStats(from, to);
  };

  const handleCustomApply = () => {
    fetchStats(customFrom || null, customTo || null);
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-theme-main">
            📊 Statistiques
          </h1>
          <p className="text-theme-muted text-sm mt-1">
            Vue d&apos;ensemble de la plateforme FMC App
          </p>
        </div>
        <button
          onClick={() => {
            const { from, to } =
              datePreset === "custom"
                ? { from: customFrom || null, to: customTo || null }
                : getPresetDates(datePreset);
            fetchStats(from, to);
          }}
          className="self-start sm:self-auto px-4 py-2 bg-theme-secondary text-theme-secondary border border-theme rounded-xl text-sm font-semibold hover:bg-primary hover:text-white transition-all"
        >
          🔄 Actualiser
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-theme-card border border-theme rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-sm font-semibold text-theme-secondary flex items-center gap-1.5">
            📅 Période :
          </span>
          <div className="flex flex-wrap gap-2">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => handlePresetChange(p.key)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  datePreset === p.key
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "bg-theme-secondary text-theme-secondary hover:bg-primary/10"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {datePreset === "custom" && (
            <div className="flex items-center gap-2 ml-0 sm:ml-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-theme bg-theme-card text-theme-main text-sm focus:ring-2 focus:ring-primary/40 outline-none"
              />
              <span className="text-theme-muted text-sm">→</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-theme bg-theme-card text-theme-main text-sm focus:ring-2 focus:ring-primary/40 outline-none"
              />
              <button
                onClick={handleCustomApply}
                className="px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Appliquer
              </button>
            </div>
          )}
        </div>
        {data?.dateFilter?.applied && (
          <p className="text-xs text-theme-muted mt-2">
            🔍 Filtre actif : {data.dateFilter.from || "début"} →{" "}
            {data.dateFilter.to || "maintenant"}
          </p>
        )}
      </div>

      {/* ① Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon="👥"
          label="Étudiants payants"
          value={overview.totalStudents}
          sub={
            data.dateFilter?.applied
              ? `${overview.newStudentsInRange} nouveaux dans la période`
              : `${overview.expiredSubscriptions} abonnements expirés`
          }
          accent
        />
        <KpiCard
          icon="⚡"
          label="Actifs (7j)"
          value={overview.activeUsersLast7Days}
          sub={`${overview.activeUsersLast30Days} sur 30j`}
        />
        <KpiCard
          icon="❓"
          label="Questions"
          value={overview.totalQuestions.toLocaleString("fr-FR")}
          sub={`${overview.totalModules} modules`}
        />
        <KpiCard
          icon="✅"
          label="Tests complétés"
          value={overview.totalTestAttempts}
          sub={`${overview.totalQuestionsAnswered.toLocaleString("fr-FR")} réponses`}
        />
      </div>

      {/* Secondary KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          icon="🔑"
          label="Clés utilisées"
          value={overview.keysUsed}
          sub={`/ ${overview.totalActivationKeys}`}
        />
        <KpiCard
          icon="📱"
          label="Appareils"
          value={overview.totalDeviceSessions}
        />
        <KpiCard
          icon="💳"
          label="Paiements en ligne"
          value={revenue.paidPaymentsCount}
          sub={`${(revenue.totalOnlineRevenue / 100).toLocaleString("fr-FR")} DA`}
        />
        <KpiCard
          icon="🔖"
          label="Questions sauvées"
          value={overview.savedQuestions}
        />
        <KpiCard
          icon="🚩"
          label="Signalements"
          value={overview.questionReports}
        />
        <KpiCard icon="🤖" label="Msgs AI" value={overview.chatLogCount} />
      </div>

      {/* ② Users Section */}
      <Section title="Utilisateurs" icon="👥">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Paid vs Free Pie */}
          <div className="bg-theme-card border border-theme rounded-2xl p-5">
            <h3 className="text-sm font-bold text-theme-secondary mb-4">
              Abonnements
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={[
                    {
                      name: "Actifs",
                      value:
                        overview.totalStudents - overview.expiredSubscriptions,
                    },
                    { name: "Expirés", value: overview.expiredSubscriptions },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#09b2ac" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Faculty Bar */}
          <div className="bg-theme-card border border-theme rounded-2xl p-5 lg:col-span-2">
            <h3 className="text-sm font-bold text-theme-secondary mb-4">
              Étudiants par Faculté
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={users.byFaculty.map((f) => ({
                  name: FACULTY_LABELS[f.name] || f.name,
                  étudiants: f.count,
                }))}
                layout="vertical"
                margin={{ left: 5, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="étudiants"
                  fill="#09b2ac"
                  radius={[0, 6, 6, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Fac. Mère vs Annexes Pie */}
          <div className="bg-theme-card border border-theme rounded-2xl p-5">
            <h3 className="text-sm font-bold text-theme-secondary mb-4">
              Fac. Mère vs Annexes
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={users.byFacultyGroup}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="name"
                  stroke="none"
                >
                  <Cell fill="#09b2ac" />
                  <Cell fill="#9941ff" />
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Year of study + speciality row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-theme-card border border-theme rounded-2xl p-5">
            <h3 className="text-sm font-bold text-theme-secondary mb-4">
              Par Année d&apos;Étude
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={users.byYear.map((y) => ({
                    name: YEAR_LABELS[y.name] || y.name,
                    value: y.count,
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {users.byYear.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-theme-card border border-theme rounded-2xl p-5">
            <h3 className="text-sm font-bold text-theme-secondary mb-4">
              Par Spécialité
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={users.bySpeciality.map((s) => ({
                    name: s.name,
                    value: s.count,
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {users.bySpeciality.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      {/* ③ Engagement Section */}
      <Section title="Engagement" icon="🎯">
        {/* Engagement KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard
            icon="📊"
            label="Score moyen"
            value={`${engagement.avgScore}%`}
            accent
          />
          <KpiCard
            icon="⏱️"
            label="Temps moyen / test"
            value={formatMinutes(engagement.avgTimeSeconds)}
          />
          <KpiCard
            icon="📝"
            label="Questions répondues"
            value={engagement.totalQuestionsAnswered.toLocaleString("fr-FR")}
          />
          <KpiCard
            icon="👤"
            label="Testeurs uniques"
            value={engagement.uniqueTesters}
          />
        </div>

        {/* Top modules bar chart */}
        <div className="bg-theme-card border border-theme rounded-2xl p-5">
          <h3 className="text-sm font-bold text-theme-secondary mb-4">
            Modules les plus pratiqués
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={engagement.topModulesByAttempts.map((m) => ({
                name: truncateLabel(m.module),
                tentatives: m.attempts,
                "score moyen": m.avgScore,
              }))}
              layout="vertical"
              margin={{ left: 5, right: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                dataKey="name"
                type="category"
                width={150}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="tentatives"
                fill="#09b2ac"
                radius={[0, 6, 6, 0]}
                barSize={14}
              />
              <Bar
                dataKey="score moyen"
                fill="#9941ff"
                radius={[0, 6, 6, 0]}
                barSize={14}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ④ Content Section */}
      <Section title="Contenu" icon="📚">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Questions by module */}
          <div className="bg-theme-card border border-theme rounded-2xl p-5">
            <h3 className="text-sm font-bold text-theme-secondary mb-4">
              Questions par Module
            </h3>
            <ResponsiveContainer
              width="100%"
              height={Math.max(280, content.questionsByModule.length * 30)}
            >
              <BarChart
                data={content.questionsByModule.map((m) => ({
                  name: truncateLabel(m.name, 22),
                  questions: m.count,
                }))}
                layout="vertical"
                margin={{ left: 5, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={170}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="questions"
                  fill="#09b2ac"
                  radius={[0, 6, 6, 0]}
                  barSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Questions by exam type */}
          <div className="bg-theme-card border border-theme rounded-2xl p-5">
            <h3 className="text-sm font-bold text-theme-secondary mb-4">
              Questions par Type d&apos;Examen
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={content.questionsByExamType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="name"
                  stroke="none"
                >
                  {content.questionsByExamType.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      {/* ④b Cours Tendables Section */}
      {tendance && (
        <Section title="Cours Tendables" icon="🔥">
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              icon="📚"
              label="Total Cours"
              value={tendance.totalCours}
              sub={`dans ${tendance.moduleSummary.length} modules`}
            />
            <KpiCard
              icon="🔥"
              label="Tombent chaque année"
              value={tendance.alwaysTendableCount}
              sub={`${tendance.totalExamYears}/${tendance.totalExamYears} promos`}
              accent
            />
            <KpiCard
              icon="📊"
              label="Taux de tendabilité"
              value={`${tendance.totalCours > 0 ? Math.round((tendance.alwaysTendableCount / tendance.totalCours) * 100) : 0}%`}
              sub="cours récurrents"
            />
            <KpiCard
              icon="🗓️"
              label="Promos analysées"
              value={tendance.totalExamYears}
              sub="années d'examens"
            />
          </div>

          {/* Module filter */}
          <div className="bg-theme-card border border-theme rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-sm font-semibold text-theme-secondary flex items-center gap-1.5">
                🎯 Filtrer par module :
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTendanceModule("all")}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    tendanceModule === "all"
                      ? "bg-primary text-white shadow-md shadow-primary/25"
                      : "bg-theme-secondary text-theme-secondary hover:bg-primary/10"
                  }`}
                >
                  Tous
                </button>
                {tendance.moduleSummary.map((m) => (
                  <button
                    key={m.module}
                    onClick={() => setTendanceModule(m.module)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      tendanceModule === m.module
                        ? "bg-primary text-white shadow-md shadow-primary/25"
                        : "bg-theme-secondary text-theme-secondary hover:bg-primary/10"
                    }`}
                  >
                    {truncateLabel(m.module, 20)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Cours Bar Chart */}
            <div className="bg-theme-card border border-theme rounded-2xl p-5 lg:col-span-2">
              <h3 className="text-sm font-bold text-theme-secondary mb-4">
                Top Cours les plus Tendables
                {tendanceModule !== "all" && (
                  <span className="ml-2 text-primary font-normal">
                    — {truncateLabel(tendanceModule, 30)}
                  </span>
                )}
              </h3>
              <ResponsiveContainer
                width="100%"
                height={Math.max(
                  320,
                  (tendanceModule === "all"
                    ? tendance.topCours.slice(0, 15)
                    : tendance.topCours.filter(
                        (c) => c.module === tendanceModule,
                      )
                  ).length * 28,
                )}
              >
                <BarChart
                  data={(tendanceModule === "all"
                    ? tendance.topCours.slice(0, 15)
                    : tendance.topCours.filter(
                        (c) => c.module === tendanceModule,
                      )
                  ).map((c) => ({
                    name: truncateLabel(c.cours, 28),
                    "Score %": c.tendanceScore,
                    Questions: c.totalQuestions,
                  }))}
                  layout="vertical"
                  margin={{ left: 5, right: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={200}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="Questions"
                    fill="#09b2ac"
                    radius={[0, 6, 6, 0]}
                    barSize={12}
                  />
                  <Bar
                    dataKey="Score %"
                    fill="#f59e0b"
                    radius={[0, 6, 6, 0]}
                    barSize={12}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Module Tendability Comparison */}
            <div className="bg-theme-card border border-theme rounded-2xl p-5">
              <h3 className="text-sm font-bold text-theme-secondary mb-4">
                Tendabilité par Module
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={tendance.moduleSummary.map((m) => ({
                    name: truncateLabel(m.module, 14),
                    "Toujours 🔥": m.alwaysTendable,
                    Souvent: m.oftenTendable,
                  }))}
                  layout="vertical"
                  margin={{ left: 5, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="Toujours 🔥"
                    stackId="a"
                    fill="#ef4444"
                    radius={[0, 0, 0, 0]}
                    barSize={16}
                  />
                  <Bar
                    dataKey="Souvent"
                    stackId="a"
                    fill="#f59e0b"
                    radius={[0, 6, 6, 0]}
                    barSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>
      )}

      {/* ⑤ Growth Section */}
      <Section title="Croissance" icon="📈">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Registrations over time */}
          <div className="bg-theme-card border border-theme rounded-2xl p-5">
            <h3 className="text-sm font-bold text-theme-secondary mb-4">
              Inscriptions par Mois
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={growth.registrationTimeline.map((r) => ({
                  mois: formatMonth(r.month),
                  inscriptions: r.count,
                }))}
                margin={{ left: 0, right: 10 }}
              >
                <defs>
                  <linearGradient id="gradReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#09b2ac" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#09b2ac" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="inscriptions"
                  stroke="#09b2ac"
                  strokeWidth={2}
                  fill="url(#gradReg)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Activation keys used over time */}
          <div className="bg-theme-card border border-theme rounded-2xl p-5">
            <h3 className="text-sm font-bold text-theme-secondary mb-4">
              Activations par Mois
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={growth.activationTimeline.map((a) => ({
                  mois: formatMonth(a.month),
                  activations: a.count,
                }))}
                margin={{ left: 0, right: 10 }}
              >
                <defs>
                  <linearGradient id="gradAct" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9941ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#9941ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="activations"
                  stroke="#9941ff"
                  strokeWidth={2}
                  fill="url(#gradAct)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      {/* Revenue mini-section */}
      <Section title="Revenus (Activations)" icon="💰">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            icon="🏪"
            label="Clés manuelles"
            value={revenue.keysManual}
            accent
          />
          <KpiCard icon="💳" label="Clés en ligne" value={revenue.keysOnline} />
          <KpiCard
            icon="✅"
            label="Paiements réussis"
            value={revenue.paidPaymentsCount}
          />
          <KpiCard
            icon="💰"
            label="Revenu en ligne"
            value={`${(revenue.totalOnlineRevenue / 100).toLocaleString("fr-FR")} DA`}
          />
        </div>

        {/* Offer Breakdown Chart */}
        {revenue.offerBreakdown && revenue.offerBreakdown.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart - Sales by offer */}
            <div className="bg-theme-card border border-theme rounded-2xl p-5">
              <h3 className="text-sm font-bold text-theme-secondary mb-4">
                Ventes par Offre
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={revenue.offerBreakdown.map((o) => ({
                      name: o.offerName,
                      value: o.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {revenue.offerBreakdown.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Per-offer KPIs */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {revenue.offerBreakdown.map((offer, i) => (
                <div
                  key={offer.offerName}
                  className={`bg-theme-card border border-theme rounded-2xl p-5 flex flex-col gap-2 transition-shadow hover:shadow-lg ${
                    i === 0 ? "ring-2 ring-primary/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                    <span className="text-sm font-bold text-theme-main">
                      {offer.offerName}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div>
                      <p className="text-xs text-theme-muted uppercase tracking-wider font-semibold">
                        Ventes
                      </p>
                      <p className="text-2xl font-extrabold font-heading text-theme-main">
                        {offer.count}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-theme-muted uppercase tracking-wider font-semibold">
                        Revenu
                      </p>
                      <p className="text-2xl font-extrabold font-heading text-theme-main">
                        {offer.revenue.toLocaleString("fr-FR")}{" "}
                        <span className="text-sm font-medium text-theme-muted">
                          DA
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Footer */}
      <div className="text-center text-xs text-theme-muted pt-4 border-t border-theme">
        Données en temps réel depuis Supabase ·{" "}
        {data.dateFilter?.applied
          ? `Filtre : ${data.dateFilter.from || "début"} → ${data.dateFilter.to || "maintenant"}`
          : "Toutes les données"}
      </div>
    </div>
  );
}
