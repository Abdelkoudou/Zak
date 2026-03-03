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

/**
 * A purely presentational card designed for image export.
 * Rendered off-screen, captured by html2canvas as a PNG.
 * Scaled to 1080×1920 px.
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
    const MAX_COURSES = 99;

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1920,
          background:
            "linear-gradient(to bottom, #101526 0%, #1b2646 40%, #11172d 100%)",
          color: "#ffffff",
          fontFamily: "'Manrope', 'Inter', 'Segoe UI', sans-serif",
          display: "flex",
          flexDirection: "column",
          padding: 64,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 24,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              flex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  background: "#09b2ac",
                  color: "#1a1a1a",
                  fontWeight: 800,
                  fontSize: 22,
                  padding: "8px 20px",
                  borderRadius: 12,
                  letterSpacing: 0.5,
                }}
              >
                FMC App
              </div>
              <span
                style={{
                  fontSize: 22,
                  color: "rgba(255,255,255,0.9)",
                  fontWeight: 500,
                }}
              >
                Tendance des Cours
              </span>
            </div>
            <h1
              style={{
                fontSize: 42,
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
              gap: 12,
              flexShrink: 0,
              paddingBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.9)",
                fontWeight: 500,
                marginRight: 8,
              }}
            >
              {examYearsRange.replace("-", " ")}
            </span>
            <div
              style={{
                background: "rgba(25, 35, 60, 0.8)",
                border: "1px solid rgba(9,178,172,0.3)",
                borderRadius: 12,
                padding: "10px 24px",
                fontSize: 20,
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              {totalQuestions} Questions
            </div>
          </div>
        </div>

        {/* ── Divider ────────────────────────────────────── */}
        <div
          style={{
            height: 2,
            background:
              "linear-gradient(90deg, rgba(153,65,255,0.6), rgba(9,178,172,0.6), transparent)",
            borderRadius: 2,
            marginBottom: 40,
            flexShrink: 0,
          }}
        />

        {/* ── Body: Sub-discipline groups ─────────────────── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 40,
            overflow: "hidden",
          }}
        >
          {subDiscGroups.map((group) => {
            const accent = SUB_DISC_ACCENT[group.sub_discipline] || "#09b2ac";
            const displayEntries = group.entries.slice(0, MAX_COURSES);
            const maxQ = displayEntries[0]?.question_count || 1;

            return (
              <div key={group.sub_discipline} style={{ flexShrink: 0 }}>
                {/* Sub-disc header */}
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: accent,
                    letterSpacing: 1,
                    marginBottom: 24,
                  }}
                >
                  {group.sub_discipline}
                </div>

                {/* Course rows */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
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
                          gap: 16,
                        }}
                      >
                        {/* Rank */}
                        <span
                          style={{
                            width: 50,
                            fontSize: 28,
                            fontWeight: 600,
                            color: "rgba(255,255,255,0.4)",
                            textAlign: "left",
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
                            height: 60,
                            background: "rgba(255, 255, 255, 0.05)",
                            borderRadius: 8,
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
                              background: `linear-gradient(90deg, ${accent}88, ${accent}22)`,
                              borderRadius: 8,
                            }}
                          />
                          <span
                            style={{
                              position: "relative",
                              zIndex: 1,
                              padding: "0 24px",
                              lineHeight: "60px",
                              fontSize: 24,
                              fontWeight: 700,
                              color: "#ffffff",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "block",
                            }}
                          >
                            {entry.cours_topic}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

TendanceShareCard.displayName = "TendanceShareCard";

export default TendanceShareCard;
export type { TendanceShareCardProps, ShareSubDiscGroup, ShareCourseEntry };
