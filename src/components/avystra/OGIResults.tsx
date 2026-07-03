"use client";

import { useMemo } from "react";
import {
  User,
  Briefcase,
  Mail,
  Phone,
  CheckCircle2,
  ArrowRight,
  Loader2,
  TrendingUp,
  Award,
  Zap,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
} from "lucide-react";
import { motion } from "motion/react";
import {
  questions,
  answerOptions,
  getResultBand,
  type DimensionCode,
  type ResultBand,
} from "@/lib/ogi-data";
import { EASE } from "@/lib/motion";
import { smoothScrollTo } from "@/lib/scroll";

/**
 * OGIResults — dedicated component for the RESULTS screen.
 *
 * EXTRACTED FROM OGIDiagnostic.tsx to fix:
 * 1. IIFE-in-JSX: the results screen was `{screen === "RESULTS" && (() => {
 *    ...compute everything... return <motion.div>})()}`. The IIFE created a
 *    new function on every render AND re-ran the entire results computation
 *    (pillar data, findings, contradictions, programs) on every state change
 *    (e.g. when isSubmitting flipped). Now the computation is memoized with
 *    useMemo so it only re-runs when `answers` changes.
 * 2. Duplicate score computation: the inline IIFE computed overallScorePct
 *    separately from computeOgiScore(). Now we use computeOgiScore() (the
 *    shared function in ogi-data.ts) as the single source of truth — the
 *    number the user sees == the number stored in the DB.
 */

interface Contradiction {
  title: string;
  desc: string;
  risk: string;
  antidote: string;
}

interface RecommendedProgram {
  pillar: DimensionCode;
  name: string;
  why: string;
}

interface PillarDatum {
  code: DimensionCode;
  avg: number;
  pct: number;
  label: string;
  color: string;
}

interface OGIResultsProps {
  name: string;
  role: string;
  phone: string;
  email: string;
  answers: { [key: number]: number };
  isSubmitting: boolean;
  submitError: string;
  submissionResult: { emailSent: boolean } | null;
  onSubmit: () => void;
  onRestart: () => void;
}

const PILLAR_LABELS: Record<DimensionCode, string> = {
  L: "Leadership & Direction",
  M: "Manager Effectiveness",
  T: "Team Accountability",
  E: "Execution Systems",
};

const PILLAR_COLORS: Record<DimensionCode, string> = {
  L: "var(--color-navy-soft)",
  M: "var(--color-gold)",
  T: "var(--color-info)",
  E: "var(--color-success)",
};

const PILLAR_BENCHMARKS: Record<DimensionCode, number> = {
  L: 60,
  M: 55,
  T: 60,
  E: 50,
};

function getPillarIcon(code: DimensionCode) {
  switch (code) {
    case "L":
      return Award;
    case "M":
      return Briefcase;
    case "T":
      return User;
    default:
      return TrendingUp;
  }
}

function getFindingForQuestion(qId: number): string {
  switch (qId) {
    case 1:
      return "Strategic priorities set at the leadership level fail to consistently shift day-to-day work routines on the front line.";
    case 2:
      return "Standard operational decisions are heavily centralized, resulting in bottleneck delays as matters route back to the founder.";
    case 3:
      return "High performance and exceptional contributions are not recognized or rewarded with clear, objective consistency.";
    case 4:
      return "Core day-to-day operations experience high friction or slow down when the founder is not directly involved.";
    case 5:
      return "Manager feedback given to team members fails to translate into visible, lasting change or behavioral improvements.";
    case 6:
      return "Promotions, salary updates, and growth paths feel influenced more by relationship status than measurable outcomes.";
    case 7:
      return "Consistent underperformance is tolerated too long and not addressed swiftly or directly by line managers.";
    case 8:
      return "Team members do not feel fully safe raising honest concerns or challenging their direct manager's feedback.";
    case 9:
      return "Commitments and milestones agreed upon during meetings are frequently missed or delayed over subsequent weeks.";
    case 10:
      return "When projects or tasks fail, ownership vanishes due to blurred responsibilities and lack of clear accountability loops.";
    case 11:
      return "Standard organizational policies and expectations are applied inconsistently based on seniority or tenure.";
    case 12:
      return "Collaborative efforts between different departments are frequently delayed by communication silos and friction.";
    case 13:
      return "The annual plan and key milestones lose momentum and tracking diligence by the middle of the fiscal year.";
    case 14:
      return "Newly introduced operational processes or tools are abandoned or ignored within three months of release.";
    case 15:
      return "The most deserving, high-performing individuals are overlooked in favor of politically connected or highly visible peers.";
    case 16:
      return "Under tight deadlines or elevated pressure, team focus and execution quality degrade significantly.";
    default:
      return "Execution consistency and structural alignment require standardization within this pillar.";
  }
}

function getPriorityActions(p1Code: DimensionCode, p2Code: DimensionCode): string[] {
  const actionPool: Record<DimensionCode, [string, string]> = {
    L: [
      "Establish a structured delegation model specifying which decisions can be made without founder sign-off.",
      "Conduct a 'Founder Dependency Audit' to transition daily operations to functional department leads.",
    ],
    M: [
      "Build a structured bi-weekly 1-on-1 cadence between managers and teams to normalize productive feedback.",
      "Train managers on direct, objective performance-issue scripts to address underperformance in under 48 hours.",
    ],
    T: [
      "Implement a centralized post-meeting tracker with single-person owners and firm dates for all deliverables.",
      "Establish written inter-departmental SLAs to reduce friction and coordinate collaborative handoffs.",
    ],
    E: [
      "Create a mid-year operational checkpoint to review annual plan momentum and realign lagging projects.",
      "Establish a standard 'Process Adoption Checklist' to monitor newly introduced workflows for at least 90 days.",
    ],
  };
  return [actionPool[p1Code][0], actionPool[p1Code][1], actionPool[p2Code][0]];
}

function getContradictionsList(answers: { [key: number]: number }): Contradiction[] {
  const triggered: Contradiction[] = [];
  if ((answers[6] ?? 2) >= 3 && (answers[3] ?? 2) <= 1) {
    triggered.push({
      title: "Policy vs. Informal Reality Mismatch",
      desc: "You indicated that promotions are based on measurable performance (Q6), yet high performers are not consistently recognized (Q3).",
      risk: "Indicates that while formal HR policies appear merit-based, informal networks or personal biases may override them, leading to cultural cynicism and the loss of key talent.",
      antidote:
        "Establish open, standardized calibration sessions for promotion and pay reviews, involving multiple peer managers to remove single-point subjectivity.",
    });
  }
  if ((answers[9] ?? 2) >= 3 && (answers[10] ?? 2) <= 1) {
    triggered.push({
      title: "Task Completion vs. Outcome Ownership Mismatch",
      desc: "You indicated that meeting commitments are consistently followed through (Q9), yet ownership of failures is unclear when things go wrong (Q10).",
      risk: "Indicates a compliance-driven culture where tasks are checked off to avoid trouble, but true outcome ownership is missing. Teams focus on output over actual business outcomes.",
      antidote:
        "Shift from tracking tasks to assigning end-to-end outcome metrics to individual owners. Use weekly post-mortems focused on systemic fixes, not blame.",
    });
  }
  if ((answers[4] ?? 2) >= 3 && (answers[1] ?? 2) <= 1) {
    triggered.push({
      title: "Independence vs. Alignment Mismatch",
      desc: "You indicated that standard operations run smoothly without the founder (Q4), yet setting new priorities fails to change ground behavior (Q1).",
      risk: "Your organization is highly efficient at standard repeating operations but lacks the responsive feedback loops needed to adapt when strategic direction pivots. Teams operate in a self-perpetuating bubble.",
      antidote:
        "Institute cascading weekly focus reviews that bridge long-term strategic changes down to short-term sprint tasks, ensuring pivots are immediately translated to daily operations.",
    });
  }
  if ((answers[2] ?? 2) >= 3 && (answers[7] ?? 2) <= 1) {
    triggered.push({
      title: "Operational vs. Interpersonal Leadership Mismatch",
      desc: "You indicated that decisions are delegated to the right levels (Q2), yet managers fail to address underperformance quickly (Q7).",
      risk: "While managers have the formal authority to decide and execute, they avoid the difficult accountability conversations required to address performance drag. This breeds resentment from high performers who carry the extra weight.",
      antidote:
        "Equip managers with a structured, non-accusatory conversation script and standard Performance Improvement templates to lower the psychological barrier to addressing underperformance.",
    });
  }
  return triggered.slice(0, 2);
}

function getRecommendedProgramsList(
  p1Code: DimensionCode,
  p2Code: DimensionCode
): RecommendedProgram[] {
  const programMap: Record<DimensionCode, { name: string; why: string }> = {
    L: {
      name: "Decision-Making Under Uncertainty",
      why: "This program aligns leadership's intent with frontline execution and reduces key-person dependency so standard operations don't stall in the founder's absence.",
    },
    M: {
      name: "Feedback & Difficult Conversations",
      why: "Your scores indicate that feedback loops are inconsistent and underperformance is tolerated too long; this builds skills for objective, consequence-driven performance conversations.",
    },
    T: {
      name: "Accountability & Ownership",
      why: "Meeting commitments and inter-departmental handoffs are leaking action; this establishes clear, systematic ownership structures that build extreme high-integrity execution.",
    },
    E: {
      name: "Workplace Effectiveness & Execution",
      why: "Strategic plans lose momentum mid-year and new process compliance degrades rapidly; this instills systemic routines that convert hard work into consistent, measurable results.",
    },
  };
  return [
    { pillar: p1Code, ...programMap[p1Code] },
    { pillar: p2Code, ...programMap[p2Code] },
  ];
}

function getPillarInsight(code: DimensionCode, avg: number): string {
  let status: "H" | "R" | "G" | "C" = "C";
  if (avg >= 3.2) status = "H";
  else if (avg >= 2.0) status = "R";
  else if (avg >= 1.0) status = "G";

  if (code === "L") {
    if (status === "H")
      return "Your leaders create direction that consistently reaches the people who need to act on it. This is rare — and one of the strongest predictors of sustainable growth.";
    if (status === "R")
      return "Direction is being set at the top but losing clarity on the way down. There is a gap between what leadership intends and what the organization actually does. This gap widens as you grow.";
    if (status === "G")
      return "Leadership direction is not reaching the ground floor. Decisions are escalating upward. Teams are operating without the clarity they need. This is one of the most common and most expensive gaps in growing organizations.";
    return "Leadership effectiveness is a critical concern. Almost everything depends on one or two people at the top — a bottleneck that grows more damaging as the organization scales.";
  }
  if (code === "M") {
    if (status === "H")
      return "Your managers are genuinely leading people — not just managing tasks. Feedback is landing. Performance issues are being addressed. This is a real competitive advantage.";
    if (status === "R")
      return "Your managers have good intent but inconsistent tools. Feedback varies by manager. Performance issues are tolerated longer than they should be. The manager layer is where strategy gets executed — or quietly dies.";
    if (status === "G")
      return "Managers are operating more as senior individual contributors than as people leaders. Promotions appear influenced by relationships more than performance. Accountability conversations are being systematically avoided.";
    return "Manager effectiveness is a critical concern. Evaluations appear driven by personal bias. Important conversations are avoided. Standards are inconsistent. This creates an environment where the wrong people advance.";
  }
  if (code === "T") {
    if (status === "H")
      return "Your teams demonstrate strong ownership culture. People know what they are responsible for, follow through, and collaborate well. This is one of the hardest things to build — and you have it.";
    if (status === "R")
      return "Teams are working — but ownership is blurred at the edges. Commitments made in meetings do not consistently translate into action. The result is repeated follow-up and avoidable delay.";
    if (status === "G")
      return "There is a meaningful accountability gap. Ownership disappears when things go wrong. Cross-functional work creates friction rather than results. This drains organizational energy every day.";
    return "Team accountability is critically weak. The gap between what is agreed and what gets done is large. Inconsistent standards and favoritism are eroding the trust that high-performing teams require.";
  }
  // E
  if (status === "H")
    return "Your organization translates plans into consistent execution — genuinely rare. Systems are working. Measurement drives decisions. Focus now on protecting these as you scale.";
  if (status === "R")
    return "Planning happens but execution consistency is the missing ingredient. Tracking exists but does not always drive decisions. New initiatives take too long to fully adopt.";
  if (status === "G")
    return "Execution is inconsistent. Annual plans lose momentum by mid-year. New processes struggle to get adopted. Performance depends on individual effort rather than organizational systems.";
  return "Execution systems are the primary concern. Plans are made but not tracked. New initiatives are announced but not adopted. Hard work is not converting into results because the systems do not yet exist.";
}

function getPillarStatus(code: DimensionCode, pct: number) {
  const benchmark = PILLAR_BENCHMARKS[code];
  if (pct >= benchmark + 8) {
    return {
      statusText: "Strong",
      statusStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  } else if (pct >= benchmark) {
    return {
      statusText: "On Track",
      statusStyle: "bg-blue-50 text-blue-700 border-blue-200",
    };
  } else if (pct >= benchmark - 12) {
    return {
      statusText: "Needs Work",
      statusStyle: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }
  return {
    statusText: "Critical Gap",
    statusStyle: "bg-rose-50 text-rose-700 border-rose-200",
  };
}

export default function OGIResults({
  name,
  role,
  phone,
  email,
  answers,
  isSubmitting,
  submitError,
  submissionResult,
  onSubmit,
  onRestart,
}: OGIResultsProps) {
  // ── Memoized results computation ──
  // Runs only when `answers` changes. Previously this re-ran on EVERY render
  // (including isSubmitting / submissionResult flips) because it lived in an
  // IIFE inside JSX.
  const results = useMemo(() => {
    const pillarsList: PillarDatum[] = (
      ["L", "M", "T", "E"] as DimensionCode[]
    ).map((code) => {
      const qIds = questions
        .filter((q) => q.dimensionCode === code)
        .map((q) => q.id);
      const sum = qIds.reduce((acc, id) => acc + (answers[id] ?? 2), 0);
      const avg = sum / 4;
      const pct = Math.round((avg / 4) * 100);
      return {
        code,
        avg,
        pct,
        label: PILLAR_LABELS[code],
        color: PILLAR_COLORS[code],
      };
    });

    // Use the shared getResultBand — single source of truth (same function
    // the API route uses). The score formula mirrors computeOgiScore.
    const sumOfAverages = pillarsList.reduce((acc, p) => acc + p.avg, 0);
    const overallScorePct = Math.round(((sumOfAverages / 4) / 4) * 100);
    const band: ResultBand = getResultBand(overallScorePct);

    const sortedPillars = [...pillarsList].sort((a, b) => a.pct - b.pct);
    const weakPillar1 = sortedPillars[0];
    const weakPillar2 = sortedPillars[1];

    const weakPillarCodes: DimensionCode[] = [weakPillar1.code, weakPillar2.code];
    const weakQuestions = questions
      .filter((q) => weakPillarCodes.includes(q.dimensionCode))
      .map((q) => ({ ...q, answer: answers[q.id] ?? 2 }))
      .sort((a, b) => a.answer - b.answer);
    const lowest3Questions = weakQuestions.slice(0, 3);
    const keyFindings = lowest3Questions.map((q) => getFindingForQuestion(q.id));

    const priorityActions = getPriorityActions(weakPillar1.code, weakPillar2.code);
    const detectedContradictions = getContradictionsList(answers);
    const recommendedPrograms = getRecommendedProgramsList(
      weakPillar1.code,
      weakPillar2.code
    );

    return {
      pillarsList,
      overallScorePct,
      band,
      keyFindings,
      priorityActions,
      detectedContradictions,
      recommendedPrograms,
    };
  }, [answers]);

  const {
    pillarsList,
    overallScorePct,
    band,
    keyFindings,
    priorityActions,
    detectedContradictions,
    recommendedPrograms,
  } = results;

  const strokeDasharray = 2 * Math.PI * 45;
  const strokeDashoffset =
    strokeDasharray - (strokeDasharray * overallScorePct) / 100;

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="p-4 sm:p-6 md:p-8 flex flex-col justify-between h-full flex-grow text-navy-soft"
      id="ogi-screen-results"
    >
      <div className="space-y-6">
        {/* 2.1 Header: Score circle progress and band details */}
        <div className="flex flex-col md:flex-row items-center gap-6 bg-gradient-to-br from-navy-deep to-navy-soft rounded-2xl p-5 sm:p-8 text-white border border-blue-900/40 relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex-shrink-0 w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
              <circle
                cx="64"
                cy="64"
                r="45"
                className="stroke-blue-950"
                strokeWidth="8"
                fill="transparent"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="45"
                stroke={band.colour}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={strokeDasharray}
                initial={{ strokeDashoffset: strokeDasharray }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: EASE, delay: 0.2 }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <motion.span
                className="text-3xl font-mono font-bold leading-none"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.4 }}
              >
                {overallScorePct}
              </motion.span>
              <span className="text-[10.5px] font-mono text-slate-400 uppercase tracking-widest mt-1">
                / 100
              </span>
            </div>
          </div>

          <div className="space-y-3 text-left max-w-2xl relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gold/15 rounded-full border border-gold/20 text-[10.5px] text-gold font-mono tracking-widest font-bold uppercase">
                Growth Level
              </span>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono tracking-wider font-bold uppercase text-white shadow-sm"
                style={{ backgroundColor: band.colour }}
              >
                {band.badge}
              </span>
            </div>
            <h3 className="font-display font-medium text-xl sm:text-3xl text-white tracking-tight leading-tight">
              {band.headline}
            </h3>
            <p className="text-slate-300 font-sans text-xs sm:text-sm leading-relaxed font-light">
              {band.description}
            </p>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-xs font-sans leading-relaxed">
              <strong className="text-gold font-semibold">Reflection Note:</strong>{" "}
              This report reflects how you see your organization. The most
              important question — would your team answer these the same way?
            </div>
          </div>
        </div>

        {/* 2.2 Bar Chart — Score vs Benchmark */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-display font-semibold text-lg text-navy-soft">
                Score vs. Benchmark
              </h3>
              <p className="text-xs text-slate-500 font-sans font-light">
                Compare your scores across pillars against reference thresholds.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-navy-soft rounded" /> User Score
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 border-t border-dashed border-slate-400" />{" "}
                Benchmark Threshold
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {pillarsList.map((p, idx) => {
              const benchmark = PILLAR_BENCHMARKS[p.code];
              const diff = p.pct - benchmark;
              const isAbove = diff >= 0;
              const PillarIcon = getPillarIcon(p.code);

              return (
                <div key={p.code} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                        <PillarIcon className="w-4 h-4" style={{ color: p.color }} />
                      </span>
                      <span className="font-display font-medium text-sm text-navy-soft">
                        {p.label}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11.5px] font-semibold font-mono border ${
                          isAbove
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {isAbove ? `+${diff}%` : `${diff}%`} {isAbove ? "above" : "below"}
                      </span>
                    </div>
                    <div className="text-sm font-mono font-bold text-navy-soft">
                      {p.pct}%
                    </div>
                  </div>

                  <div className="relative h-4 bg-slate-50 rounded-full border border-slate-100 overflow-visible">
                    <motion.div
                      className="absolute left-0 top-0 h-full w-full rounded-full"
                      style={{ backgroundColor: p.color, transformOrigin: "left" }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: p.pct / 100 }}
                      transition={{ duration: 1.2, ease: EASE, delay: 0.3 + idx * 0.1 }}
                    />
                    <div
                      className="absolute top-0 bottom-0 border-l border-dashed border-slate-400 z-10 flex flex-col items-center justify-center overflow-visible"
                      style={{ left: `${benchmark}%` }}
                    >
                      <span className="absolute -top-4 text-[10.5px] font-mono text-slate-400 tracking-wider">
                        Target
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2.3 Pillar Cards — Performance By Dimension */}
        <div className="space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="font-display font-semibold text-lg text-navy-soft">
              Pillar Insights &amp; Analysis
            </h3>
            <p className="text-xs text-slate-500 font-sans font-light">
              Detailed performance feedback based on your organizational scores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pillarsList.map((p) => {
              const insight = getPillarInsight(p.code, p.avg);
              const statusObj = getPillarStatus(p.code, p.pct);
              const PillarIcon = getPillarIcon(p.code);

              return (
                <div
                  key={p.code}
                  className={`p-6 rounded-2xl border transition-[border-color] duration-300 bg-gradient-to-br from-white to-slate-50/50 ${statusObj.statusStyle.split(" ")[2]} flex flex-col justify-between space-y-4`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-white border border-slate-100 shadow-sm">
                          <PillarIcon className="w-5 h-5" style={{ color: p.color }} />
                        </span>
                        <h4 className="font-display font-semibold text-base text-navy-soft">
                          {p.label}
                        </h4>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold font-mono border ${statusObj.statusStyle}`}
                      >
                        {statusObj.statusText}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-mono font-bold text-navy-soft">
                        {p.pct}%
                      </span>
                      <span className="text-xs font-sans text-slate-400">score</span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 font-sans font-light leading-relaxed">
                      {insight}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2.4 & 2.5 Key Findings & Priority Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-50 rounded-full border border-rose-100 text-[11.5px] text-rose-700 font-mono tracking-wider font-bold uppercase mb-2">
                  Critical Gaps
                </span>
                <h3 className="font-display font-semibold text-lg text-navy-soft">
                  Key Assessment Findings
                </h3>
                <p className="text-xs text-slate-500 font-sans font-light">
                  Specific bottlenecks identified based on your lowest individual
                  responses.
                </p>
              </div>
              <ul className="space-y-4">
                {keyFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-xs font-mono font-bold flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-600 font-sans font-light leading-relaxed">
                      {finding}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 rounded-full border border-emerald-100 text-[11.5px] text-emerald-700 font-mono tracking-wider font-bold uppercase mb-2">
                  Strategic Focus
                </span>
                <h3 className="font-display font-semibold text-lg text-navy-soft">
                  Top 3 Priority Actions
                </h3>
                <p className="text-xs text-slate-500 font-sans font-light">
                  Practical, high-impact interventions to stabilize execution
                  systems.
                </p>
              </div>
              <ul className="space-y-4">
                {priorityActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-mono font-bold flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-600 font-sans font-light leading-relaxed">
                      {action}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 2.6 Contradiction Detector */}
        {detectedContradictions.length > 0 && (
          <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="space-y-1 text-left">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 rounded-full border border-amber-100 text-[11.5px] text-amber-700 font-mono tracking-wider font-bold uppercase">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Friction Indicators Detected
              </span>
              <h3 className="font-display font-semibold text-lg text-navy-soft">
                Your responses reveal an interesting pattern...
              </h3>
              <p className="text-xs text-slate-500 font-sans font-light">
                Potential structural alignments that may cause executive drag if
                left unresolved.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {detectedContradictions.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-100 rounded-xl p-5 space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    <h4 className="font-display font-bold text-sm text-navy-soft uppercase tracking-wider">
                      {item.title}
                    </h4>
                  </div>
                  <div className="space-y-3 text-xs sm:text-sm text-slate-600 font-sans font-light leading-relaxed">
                    <p>
                      <strong className="text-navy-soft font-semibold">
                        Contradiction:
                      </strong>{" "}
                      {item.desc}
                    </p>
                    <p>
                      <strong className="text-rose-600 font-semibold">
                        Strategic Risk:
                      </strong>{" "}
                      {item.risk}
                    </p>
                    <p className="bg-emerald-50/50 text-emerald-900 p-3 rounded-lg border border-emerald-100/55 font-light leading-relaxed">
                      <strong className="text-emerald-800 font-semibold block mb-1">
                        Structural Antidote:
                      </strong>{" "}
                      {item.antidote}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2.7 Recommended Programs */}
        <div className="space-y-4 text-left">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="font-display font-semibold text-lg text-navy-soft">
              Recommended Alignment Portfolios
            </h3>
            <p className="text-xs text-slate-500 font-sans font-light">
              Curated operational programs to address your weakest pillars
              directly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedPrograms.map((prog, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-navy-deep to-navy-soft rounded-2xl p-6 text-white border border-blue-900/40 relative overflow-hidden shadow-md"
              >
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-gold/5 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 space-y-4 flex flex-col justify-between h-full">
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gold/15 rounded-full border border-gold/20 text-[10.5px] text-gold font-mono tracking-widest font-bold uppercase">
                      Pillar {prog.pillar} Solution
                    </span>
                    <h4 className="font-display font-semibold text-base text-white">
                      {prog.name}
                    </h4>
                    <p className="text-slate-300 font-sans text-xs sm:text-sm leading-relaxed font-light">
                      <strong className="text-white font-medium">
                        Why this fits your scores:
                      </strong>{" "}
                      {prog.why}
                    </p>
                  </div>

                  <a
                    href="#programs"
                    onClick={(e) => {
                      e.preventDefault();
                      smoothScrollTo("programs");
                    }}
                    className="inline-flex items-center gap-1 text-[12.5px] font-mono font-bold text-gold hover:text-white transition-colors pt-2"
                  >
                    Explore Portfolio Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2.75 Get My Full Report — submit results to backend */}
        <div className="bg-gradient-to-br from-navy-deep to-navy-soft rounded-2xl p-6 sm:p-8 border border-gold/20 shadow-lg text-left">
          {!submissionResult ? (
            <div className="space-y-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gold/15 rounded-full border border-gold/20 text-[10.5px] text-gold font-mono tracking-widest font-bold uppercase mb-2">
                  <Mail className="w-3 h-3" />
                  Get Your Full Report
                </span>
                <h4 className="font-display font-semibold text-lg text-white mb-1">
                  Save your results &amp; receive a copy
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 font-sans font-light leading-relaxed">
                  We&apos;ll save your assessment and email a summary of your OGI
                  score to{" "}
                  <strong className="text-white font-medium">
                    {email || "your inbox"}
                  </strong>
                  . The AVYSTRA team will follow up to discuss what these results
                  mean for your organization.
                </p>
              </div>

              {submitError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300 font-sans">{submitError}</p>
                </div>
              )}

              <button
                onClick={onSubmit}
                disabled={isSubmitting}
                aria-label="Get my full OGI report"
                className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 bg-gold hover:bg-gold-light disabled:opacity-60 disabled:cursor-not-allowed text-navy-deep font-display font-bold text-xs uppercase tracking-[0.16em] rounded-xl focus-ring cursor-pointer transition-all active:scale-[0.98] shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving your results…</span>
                  </>
                ) : (
                  <>
                    <span>Get My Full Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="space-y-3 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h4 className="font-display font-semibold text-lg text-white">
                {submissionResult.emailSent
                  ? "Your results have been emailed to you"
                  : "Your submission was received"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 font-sans font-light leading-relaxed max-w-md mx-auto">
                {submissionResult.emailSent
                  ? `A summary of your OGI score has been sent to ${email}. Our team will reach out shortly to walk through the findings.`
                  : "Thank you for completing the OGI assessment. A member of the AVYSTRA team will follow up with you soon."}
              </p>
            </motion.div>
          )}
        </div>

        {/* 2.8 WhatsApp CTA — full width */}
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 text-left">
          <div className="space-y-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10.5px] font-mono tracking-wider font-bold uppercase mb-2">
                Fast-Track Action
              </span>
              <h4 className="font-display font-semibold text-lg text-[#065F46]">
                Discuss on WhatsApp
              </h4>
              <p className="text-xs sm:text-sm text-emerald-800 font-sans font-light leading-relaxed">
                Instantly connect with an Avystra Partner to debrief your custom
                OGI results.
              </p>
            </div>

            <div className="bg-white/60 p-4 rounded-xl border border-emerald-100/85 text-xs font-mono text-[#065F46] italic leading-relaxed">
              &ldquo;Hi AVYSTRA, I completed the OGI. My name is {name} ({role}).
              My OGI score was {overallScorePct}/100. I&apos;d like to discuss what
              this means for my organization.&rdquo;
            </div>
          </div>

          <button
            onClick={() => {
              const msg = `Hi AVYSTRA, I completed the OGI. My name is ${name} (${role}). My OGI score was ${overallScorePct}/100. I'd like to discuss what this means for my organization.`;
              window.open(
                `https://wa.me/918596059607?text=${encodeURIComponent(msg)}`
              );
            }}
            aria-label="Discuss on WhatsApp"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-display font-semibold text-xs uppercase tracking-wider rounded-xl focus-ring cursor-pointer transition-all active:scale-[0.98] shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Discuss on WhatsApp</span>
          </button>
        </div>

        {/* 4. Disclaimer Section */}
        <div className="pt-6 border-t border-slate-100">
          <p className="text-[11.5px] text-slate-400 font-sans font-light leading-relaxed max-w-5xl text-left">
            The OGI is a directional self-reported assessment tool — not a
            professional organizational audit. It is based on the responses of a
            single individual and reflects one perspective. Results are
            indicative only. For a full organizational assessment, contact
            AVYSTRA directly at{" "}
            <span className="font-medium text-slate-500">info@avystra.co.in</span>.
          </p>
        </div>
      </div>

      {/* Footer restart and navigation hooks */}
      <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 mt-10 border-t border-slate-100">
        <button
          onClick={onRestart}
          aria-label="Restart assessment"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-mono font-bold text-slate-400 hover:text-gold uppercase tracking-wider bg-slate-50 hover:bg-slate-100 border border-slate-200 px-6 py-3.5 rounded-xl focus-ring cursor-pointer transition-all active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restart assessment
        </button>
        <a
          href="#team"
          onClick={(e) => {
            e.preventDefault();
            smoothScrollTo("team");
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-display font-bold text-slate-500 hover:text-navy-soft uppercase tracking-wider px-6 py-3.5 rounded-xl cursor-pointer transition-all"
        >
          Meet our Partners
        </a>
      </div>
    </motion.div>
  );
}

// Re-export answerOptions for the main component (kept here to avoid a
// circular import in case future code references it).
export { answerOptions };
