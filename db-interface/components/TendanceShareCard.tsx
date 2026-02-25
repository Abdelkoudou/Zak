"use client";

import React from "react";

// ── Types ────────────────────────────────────────────────────────────
interface ShareCourseEntry {
  cours_topic: string;
  question_count: number;
}

interface ShareSubDiscGroup {
  sub_discipline: string;
  entries: ShareCourseEntry[];
}

interface TendanceShareCardProps {
  moduleName: string;
  totalQuestions: number;
  examYearsRange: string;
  totalExamYears: number;
  subDiscGroups: ShareSubDiscGroup[];
}

// ── Sub-Disc color mapping (inline hex for html2canvas) ─────────────
const SUB_DISC_ACCENT: Record<string, string> = {
  Anatomie: "#f43f5e",
  Histologie: "#a855f7",
  Physiologie: "#3b82f6",
  Biochimie: "#10b981",
  Biophysique: "#f59e0b",
};

const SUB_DISC_ICONS: Record<string, string> = {
  Anatomie: "🫀",
  Histologie: "🔬",
  Physiologie: "⚡",
  Biochimie: "🧪",
  Biophysique: "📐",
};

/**
 * A purely presentational card designed for image export.
 * Rendered off-screen, captured by html2canvas as a PNG.
 * Fixed 1080×1080 px — ideal for Instagram posts.
 */
const TendanceShareCard = React.forwardRef<
  HTMLDivElement,
  TendanceShareCardProps
>(
  (
    {
      moduleName,
      totalQuestions,
      examYearsRange,
      totalExamYears,
      subDiscGroups,
    },
    ref,
  ) => {
    // Limit courses per sub-discipline for space
    const MAX_COURSES = 5;

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1080,
          background:
            "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          color: "#ffffff",
          fontFamily: "'Manrope', 'Inter', 'Segoe UI', sans-serif",
          display: "flex",
          flexDirection: "column",
          padding: 48,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decorative elements */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(9,178,172,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(153,65,255,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* ── Header ─────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 32,
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  background: "#09b2ac",
                  color: "#262626",
                  fontWeight: 800,
                  fontSize: 18,
                  padding: "6px 16px",
                  borderRadius: 8,
                  letterSpacing: 1,
                }}
              >
                FMC App
              </div>
              <span
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.5)",
                  fontWeight: 500,
                }}
              >
                Tendance des Cours
              </span>
            </div>
            <h1
              style={{
                fontSize: 36,
                fontWeight: 800,
                margin: 0,
                lineHeight: 1.2,
                color: "#ffffff",
              }}
            >
              {moduleName}
            </h1>
          </div>
          <div
            style={{
              textAlign: "right",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 6,
            }}
          >
            <div
              style={{
                background: "rgba(9,178,172,0.15)",
                border: "1px solid rgba(9,178,172,0.3)",
                borderRadius: 10,
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 600,
                color: "#09b2ac",
              }}
            >
              {totalQuestions} Questions
            </div>
            <span
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.5)",
                fontWeight: 500,
              }}
            >
              {totalExamYears} promos · {examYearsRange}
            </span>
          </div>
        </div>

        {/* ── Divider ────────────────────────────────────── */}
        <div
          style={{
            height: 2,
            background:
              "linear-gradient(90deg, #09b2ac, rgba(153,65,255,0.5), transparent)",
            borderRadius: 2,
            marginBottom: 28,
            flexShrink: 0,
          }}
        />

        {/* ── Body: Sub-discipline groups ─────────────────── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            overflow: "hidden",
          }}
        >
          {subDiscGroups.map((group) => {
            const accent = SUB_DISC_ACCENT[group.sub_discipline] || "#09b2ac";
            const icon = SUB_DISC_ICONS[group.sub_discipline] || "📖";
            const displayEntries = group.entries.slice(0, MAX_COURSES);
            const maxQ = displayEntries[0]?.question_count || 1;

            return (
              <div key={group.sub_discipline} style={{ flexShrink: 0 }}>
                {/* Sub-disc header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: accent,
                      letterSpacing: 0.5,
                    }}
                  >
                    {group.sub_discipline}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.35)",
                      fontWeight: 500,
                    }}
                  >
                    — Top {displayEntries.length}
                  </span>
                </div>

                {/* Course rows */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {displayEntries.map((entry, idx) => {
                    const barPct = Math.max(
                      8,
                      (entry.question_count / maxQ) * 100,
                    );

                    return (
                      <div
                        key={entry.cours_topic}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          height: 32,
                        }}
                      >
                        {/* Rank */}
                        <span
                          style={{
                            width: 24,
                            fontSize: 13,
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.4)",
                            textAlign: "right",
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}.
                        </span>

                        {/* Bar + label */}
                        <div
                          style={{
                            flex: 1,
                            position: "relative",
                            height: 28,
                            background: "rgba(255,255,255,0.05)",
                            borderRadius: 6,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              height: "100%",
                              width: `${barPct}%`,
                              background: `linear-gradient(90deg, ${accent}66, ${accent}22)`,
                              borderRadius: 6,
                            }}
                          />
                          <span
                            style={{
                              position: "relative",
                              zIndex: 1,
                              padding: "0 12px",
                              lineHeight: "28px",
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#ffffff",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "block",
                              maxWidth: "85%",
                            }}
                          >
                            {entry.cours_topic}
                          </span>
                        </div>

                        {/* Count */}
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: accent,
                            flexShrink: 0,
                            minWidth: 40,
                            textAlign: "right",
                          }}
                        >
                          {entry.question_count}Q
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.1)",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.35)",
              fontWeight: 500,
            }}
          >
            Classement basé sur {totalExamYears} promos ({examYearsRange})
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.35)",
                fontWeight: 500,
              }}
            >
              Généré par
            </span>
            <span
              style={{
                background: "#09b2ac",
                color: "#262626",
                fontWeight: 800,
                fontSize: 12,
                padding: "3px 10px",
                borderRadius: 6,
              }}
            >
              FMC App
            </span>
          </div>
        </div>
      </div>
    );
  },
);

TendanceShareCard.displayName = "TendanceShareCard";

export default TendanceShareCard;
export type { TendanceShareCardProps, ShareSubDiscGroup, ShareCourseEntry };
