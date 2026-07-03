"use client";

import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import { useGsapReveal } from "@/lib/useGsapReveal";
import {
  User,
  Briefcase,
  Mail,
  Phone,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Loader2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DoodleSparkle } from "./DoodleWidgets";
import { getLenis } from "@/lib/scroll";
import {
  questions as ogiQuestions,
  answerOptions as ogiAnswerOptions,
  computeOgiScore,
} from "@/lib/ogi-data";
import { EASE } from "@/lib/motion";
import OGIResults from "./OGIResults";

// Questions + answer options + scoring live in src/lib/ogi-data.ts so the API
// route and this component share the exact same data source.
const questions = ogiQuestions;
const answerOptions = ogiAnswerOptions;

export default function OGIDiagnostic() {
  // Screens state: INTRO → INFO_CAPTURE → QUESTIONS → NUDGE → LOADING → RESULTS
  const [screen, setScreen] = useState<
    "INTRO" | "INFO_CAPTURE" | "QUESTIONS" | "NUDGE" | "LOADING" | "RESULTS"
  >("INTRO");

  // User info
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Question tracking
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [selectedOptionTemp, setSelectedOptionTemp] = useState<number | null>(
    null
  );

  // Validation state
  const [infoError, setInfoError] = useState("");

  // Per-field validation micro-interactions. `invalidField` holds the field
  // name that should shake (cleared after the shake animation completes so it
  // can re-trigger on a subsequent bad submit).
  const [invalidField, setInvalidField] = useState<string | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timer for the auto-advance delay in handleAnswerSelect.
  const answerAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Derived validity — drives the checkmark icon + gold "valid" border.
  const isNameValid = name.trim().length >= 2;
  const isRoleValid = role.trim().length >= 2;
  const isPhoneValid = phone.trim().replace(/[^0-9]/g, "").length >= 10;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const triggerShake = (field: string) => {
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    setInvalidField(field);
    shakeTimerRef.current = setTimeout(() => setInvalidField(null), 450);
  };

  const clearFieldError = () => {
    if (invalidField) setInvalidField(null);
  };

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    emailSent: boolean;
    smtpConfigured?: boolean;
  } | null>(null);
  const [submitError, setSubmitError] = useState("");
  // Tracks whether the auto-save (DB + Excel) has been done for this session.
  const [autoSaved, setAutoSaved] = useState(false);

  // Refs for reveal animations
  const contentBoxRef = useGsapReveal<HTMLDivElement>("fade", {
    delay: 0.15,
    duration: 0.8,
  });
  // Intro heading — fade mode (not "words") because the heading contains an
  // inline <span class="font-serif italic text-gold"> child. Words mode splits
  // text nodes unevenly around inline elements, producing a janky reveal.
  const headingRef = useGsapReveal<HTMLHeadingElement>("fade", {
    delay: 0.1,
    duration: 0.6,
  });

  // Track whether this is the first render — we don't auto-scroll on mount
  const isFirstRender = useRef(true);

  // ── Intelligent viewport auto-scroll on screen changes ──
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (screen === "LOADING") return;

    const el = contentBoxRef.current;
    if (!el) return;

    const timer = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const headerOffset = 120;
      const viewportHeight = window.innerHeight;
      const upperViewportBound = viewportHeight * 0.4;
      const isTopVisible =
        rect.top >= headerOffset - 20 && rect.top <= upperViewportBound;
      if (isTopVisible) return;

      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(el, { offset: -headerOffset, duration: 0.8 });
      } else {
        const top = rect.top + window.scrollY - headerOffset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [screen, contentBoxRef]);

  // Auto-advance delay handler
  const handleAnswerSelect = (score: number) => {
    setSelectedOptionTemp(score);
    setAnswers((prev) => ({
      ...prev,
      [questions[currentQuestionIndex].id]: score,
    }));

    if (answerAdvanceTimerRef.current) clearTimeout(answerAdvanceTimerRef.current);
    answerAdvanceTimerRef.current = setTimeout(() => {
      setSelectedOptionTemp(null);
      const nextIndex = currentQuestionIndex + 1;

      if (currentQuestionIndex === 7) {
        setScreen("NUDGE");
      } else if (nextIndex < 16) {
        setCurrentQuestionIndex(nextIndex);
      } else {
        setScreen("LOADING");
      }
    }, 300);
  };

  // Cancel any pending auto-advance timer if the component unmounts.
  useEffect(() => {
    return () => {
      if (answerAdvanceTimerRef.current) clearTimeout(answerAdvanceTimerRef.current);
    };
  }, []);

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else {
      setScreen("INFO_CAPTURE");
    }
  };

  const validateAndNextInfo = (e?: FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      setInfoError("Please enter your name.");
      triggerShake("name");
      return;
    }
    if (!role.trim()) {
      setInfoError("Please enter your professional role.");
      triggerShake("role");
      return;
    }
    const cleanPhone = phone.trim();
    const digitsOnly = cleanPhone.replace(/[^0-9]/g, "");
    if (!cleanPhone || digitsOnly.length < 10) {
      setInfoError("Please enter a valid WhatsApp number (at least 10 digits).");
      triggerShake("phone");
      return;
    }
    const cleanEmail = email.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    if (!cleanEmail || !emailOk) {
      setInfoError("Please enter a valid business email address.");
      triggerShake("email");
      return;
    }
    setInfoError("");
    setScreen("QUESTIONS");
  };

  // Nudge auto-timer
  useEffect(() => {
    if (screen === "NUDGE") {
      const timer = setTimeout(() => {
        setScreen("QUESTIONS");
        setCurrentQuestionIndex(8);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // Loading auto-timer — results computation is local, no backend call
  useEffect(() => {
    if (screen === "LOADING") {
      const timer = setTimeout(() => {
        setScreen("RESULTS");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // ── Auto-save to DB when RESULTS screen appears ──
  // Fires once when the results screen first shows up. The dep list is
  // intentionally [screen, autoSaved] only — adding name/role/phone/email/
  // answers would re-fire the effect if any of those changed (which they
  // shouldn't after results, but the guard prevents it anyway).
  useEffect(() => {
    if (screen !== "RESULTS" || autoSaved) return;
    setAutoSaved(true);

    const autoSave = async () => {
      try {
        await fetch("/api/ogi/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            role: role.trim(),
            contact: phone.trim(),
            email: email.trim(),
            answers,
          }),
        });
      } catch (err) {
        console.error("[OGI] auto-save failed:", err);
      }
    };
    autoSave();
  }, [screen, autoSaved]);

  // Restart assessment
  const handleRestart = useCallback(() => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setName("");
    setRole("");
    setPhone("");
    setEmail("");
    setSubmissionResult(null);
    setSubmitError("");
    setAutoSaved(false);
    setScreen("INTRO");
  }, []);

  // ── Submit results to backend ──
  // Uses the shared computeOgiScore() so the DB record exactly matches what
  // the user saw on the results screen (OGIResults uses the same function).
  const handleSubmitResults = async () => {
    if (isSubmitting || submissionResult) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const { score, band } = computeOgiScore(answers);
      const res = await fetch("/api/ogi/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim(),
          contact: phone.trim(),
          email: email.trim(),
          answers,
          score,
          band: band.badge,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Submission failed");
      }
      setSubmissionResult({
        emailSent: !!data.emailSent,
        smtpConfigured: data.smtpConfigured,
      });
    } catch (err) {
      console.error("[OGI] submit failed:", err);
      setSubmitError(
        "Something went wrong while saving your results. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = questions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / 16) * 100;

  return (
    <section
      id="consult"
      className="relative py-8 bg-transparent border-none overflow-hidden md:py-12 scroll-mt-20"
    >
      {/* Static radial gradient ambiance — replaces the two animated blur orbs
          that caused repaint jank during scroll. Same premium glow, zero
          per-frame cost. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 50% 40% at 70% 20%, rgba(184,146,78,0.04), transparent 70%), radial-gradient(ellipse 50% 40% at 30% 80%, rgba(84,122,149,0.03), transparent 70%)",
        }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Content Box */}
        <div
          ref={contentBoxRef}
          className="card-premium bg-gradient-to-br from-white to-slate-50 border border-slate-100 rounded-3xl overflow-hidden min-h-[420px] flex flex-col justify-between"
        >
          <AnimatePresence mode="wait">
            {/* INTRO SCREEN */}
            {screen === "INTRO" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center items-center h-full flex-grow text-center"
                id="ogi-screen-intro"
              >
                <div className="max-w-3xl">
                  <div className="flex justify-center mb-5">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/5 rounded-full border border-gold/10 text-[12.5px] text-gold font-mono tracking-widest font-bold uppercase relative">
                      <Zap className="w-3.5 h-3.5 text-gold" />
                      Organizational Assessment
                      <DoodleSparkle
                        className="-top-3 -right-4 text-gold w-5 h-5 animate-pulse"
                        delay={0.1}
                      />
                    </span>
                  </div>

                  <h2
                    ref={headingRef}
                    className="font-display font-medium text-3xl sm:text-5xl text-navy-soft tracking-tighter leading-[1.15] mb-5"
                  >
                    OGI —{" "}
                    <span className="font-serif italic text-gold">
                      Organizational Growth Index
                    </span>
                  </h2>

                  <p className="text-slate-600 font-sans text-base sm:text-lg max-w-xl mx-auto leading-relaxed font-light mb-8">
                    A structured self-assessment measuring execution gaps
                    across 4 core growth pillars. It takes 3 minutes to complete
                    and instantly generates your personalized strategic report.
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    {[
                      { name: "Leadership", code: "L", color: "bg-navy-soft" },
                      { name: "Managers", code: "M", color: "bg-gold" },
                      { name: "Accountability", code: "T", color: "bg-info" },
                      { name: "Execution", code: "E", color: "bg-success" },
                    ].map((item) => (
                      <div
                        key={item.code}
                        className="p-3 rounded-xl bg-white/50 border border-slate-200/50 flex flex-col items-center group"
                      >
                        <span
                          className={`w-6 h-6 rounded-full ${item.color} mb-2 flex items-center justify-center text-[11.5px] text-white font-mono font-bold`}
                        >
                          {item.code}
                        </span>
                        <h3 className="text-[11.5px] font-display font-bold text-navy-soft leading-tight">
                          {item.name}
                        </h3>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => setScreen("INFO_CAPTURE")}
                    aria-label="Begin OGI assessment"
                    className="btn-premium group inline-flex items-center gap-3 bg-navy-soft hover:bg-gold text-white font-display text-sm font-semibold tracking-wider uppercase px-10 py-4 rounded-xl shadow-lg focus-ring cursor-pointer"
                    id="ogi-btn-start"
                  >
                    <span>Begin Assessment</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* INFO CAPTURE SCREEN */}
            {screen === "INFO_CAPTURE" && (
              <motion.div
                key="info_capture"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="p-6 sm:p-8 md:p-10 flex flex-col justify-between h-full flex-grow"
                id="ogi-screen-info"
              >
                <div>
                  <button
                    onClick={() => setScreen("INTRO")}
                    aria-label="Back to intro"
                    className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-gold font-mono tracking-wide mb-5 group focus-ring cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
                    Back to intro
                  </button>

                  <h3 className="font-display font-bold text-xl sm:text-2xl text-navy-deep tracking-tight mb-2">
                    Let&rsquo;s index your identity
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm font-sans font-light leading-relaxed mb-6 max-w-xl">
                    Who is operating the blueprint? Provide brief parameters so
                    we customize your index evaluation correctly.
                  </p>

                  <form onSubmit={validateAndNextInfo} className="space-y-5 max-w-xl">
                    {/* Name Entry */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="ogi-input-name"
                        className="block text-[11.5px] font-mono tracking-wider text-slate-400 uppercase font-bold"
                      >
                        Your Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-3.5 w-4 h-4 text-gold pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (infoError) setInfoError("");
                            clearFieldError();
                          }}
                          placeholder="e.g. Kirankumar Pandey"
                          className={`w-full bg-slate-50 border border-slate-200 focus:border-gold focus:ring-1 focus:ring-gold/20 rounded-xl py-3.5 pl-11 pr-12 text-slate-800 placeholder-slate-400/80 font-sans text-sm focus:outline-none transition-all ${
                            isNameValid ? "ogi-input-valid" : ""
                          } ${
                            invalidField === "name"
                              ? "ogi-input-shake ogi-input-invalid"
                              : ""
                          }`}
                          id="ogi-input-name"
                        />
                        <CheckCircle2
                          className={`ogi-field-check absolute right-4 top-3.5 w-4 h-4 text-gold ${
                            isNameValid ? "is-visible" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* Role Entry */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="ogi-input-role"
                        className="block text-[11.5px] font-mono tracking-wider text-slate-400 uppercase font-bold"
                      >
                        Professional Designation / Role
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-4 top-3.5 w-4 h-4 text-gold pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={role}
                          onChange={(e) => {
                            setRole(e.target.value);
                            if (infoError) setInfoError("");
                            clearFieldError();
                          }}
                          placeholder="e.g. Founder, CEO, VP of Operations"
                          className={`w-full bg-slate-50 border border-slate-200 focus:border-gold focus:ring-1 focus:ring-gold/20 rounded-xl py-3.5 pl-11 pr-12 text-slate-800 placeholder-slate-400/80 font-sans text-sm focus:outline-none transition-all ${
                            isRoleValid ? "ogi-input-valid" : ""
                          } ${
                            invalidField === "role"
                              ? "ogi-input-shake ogi-input-invalid"
                              : ""
                          }`}
                          id="ogi-input-role"
                        />
                        <CheckCircle2
                          className={`ogi-field-check absolute right-4 top-3.5 w-4 h-4 text-gold ${
                            isRoleValid ? "is-visible" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* WhatsApp Number */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="ogi-input-phone"
                        className="block text-[11.5px] font-mono tracking-wider text-slate-400 uppercase font-bold"
                      >
                        WhatsApp Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-3.5 w-4 h-4 text-gold pointer-events-none" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if (infoError) setInfoError("");
                            clearFieldError();
                          }}
                          placeholder="e.g. +91 91234 56789"
                          className={`w-full bg-slate-50 border border-slate-200 focus:border-gold focus:ring-1 focus:ring-gold/20 rounded-xl py-3.5 pl-11 pr-12 text-slate-800 placeholder-slate-400/80 font-sans text-sm focus:outline-none transition-all ${
                            isPhoneValid ? "ogi-input-valid" : ""
                          } ${
                            invalidField === "phone"
                              ? "ogi-input-shake ogi-input-invalid"
                              : ""
                          }`}
                          id="ogi-input-phone"
                          autoComplete="tel"
                        />
                        <CheckCircle2
                          className={`ogi-field-check absolute right-4 top-3.5 w-4 h-4 text-gold ${
                            isPhoneValid ? "is-visible" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* Business Email */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="ogi-input-email"
                        className="block text-[11.5px] font-mono tracking-wider text-slate-400 uppercase font-bold"
                      >
                        Business Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gold pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (infoError) setInfoError("");
                            clearFieldError();
                          }}
                          placeholder="e.g. contact@firm.com"
                          className={`w-full bg-slate-50 border border-slate-200 focus:border-gold focus:ring-1 focus:ring-gold/20 rounded-xl py-3.5 pl-11 pr-12 text-slate-800 placeholder-slate-400/80 font-sans text-sm focus:outline-none transition-all ${
                            isEmailValid ? "ogi-input-valid" : ""
                          } ${
                            invalidField === "email"
                              ? "ogi-input-shake ogi-input-invalid"
                              : ""
                          }`}
                          id="ogi-input-email"
                          autoComplete="email"
                        />
                        <CheckCircle2
                          className={`ogi-field-check absolute right-4 top-3.5 w-4 h-4 text-gold ${
                            isEmailValid ? "is-visible" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {infoError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="text-xs text-red-500 font-mono"
                      >
                        {infoError}
                      </motion.p>
                    )}
                  </form>
                </div>

                <div className="flex justify-end pt-8 mt-6 border-t border-slate-100">
                  <button
                    onClick={() => validateAndNextInfo()}
                    aria-label="Continue to questions"
                    className="btn-premium group inline-flex items-center gap-2.5 bg-navy-deep hover:bg-gold text-white font-display text-xs font-bold tracking-wider uppercase px-7 py-3.5 rounded-xl shadow-md focus-ring cursor-pointer"
                    id="ogi-btn-info-continue"
                  >
                    <span>Continue to Questions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* QUESTION SCREENS */}
            {screen === "QUESTIONS" && (
              <motion.div
                key={`question-${currentQuestionIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="p-6 sm:p-8 md:p-10 flex flex-col justify-between h-full flex-grow"
                id={`ogi-screen-q-${currentQuestionIndex + 1}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: currentQ.color }}
                      />
                      <span className="text-[11.5px] font-mono tracking-widest text-navy-deep uppercase font-bold">
                        {currentQ.dimensionName}
                      </span>
                    </div>

                    <button
                      onClick={handleBack}
                      aria-label="Go back to previous question"
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-gold font-mono transition-colors group focus-ring cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-0.5 transition-transform" />
                      Back
                    </button>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between text-[11.5px] font-mono text-slate-400 uppercase tracking-widest mb-2">
                      <span>Index Integrity Question</span>
                      <strong className="text-slate-700">
                        {currentQuestionIndex + 1} of 16
                      </strong>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: currentQ.color,
                          transformOrigin: "left",
                        }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: progressPercent / 100 }}
                        transition={{ duration: 0.5, ease: EASE }}
                      />
                    </div>
                  </div>

                  <div className="text-center py-4 px-2 max-w-2xl mx-auto my-3">
                    <p className="font-display font-medium text-xl sm:text-2xl text-navy-deep leading-snug tracking-tight">
                      &ldquo;{currentQ.text}&rdquo;
                    </p>
                  </div>
                </div>

                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 max-w-3xl mx-auto">
                    {answerOptions.map((opt) => {
                      const isSelected =
                        selectedOptionTemp === opt.value ||
                        answers[currentQ.id] === opt.value;
                      return (
                        <motion.button
                          key={opt.label}
                          onClick={() => handleAnswerSelect(opt.value)}
                          aria-pressed={isSelected}
                          aria-label={`${opt.label} — ${currentQ.text.substring(0, 60)}`}
                          whileTap={{ scale: 0.95 }}
                          transition={{ duration: 0.15, ease: EASE }}
                          className={`relative py-4 px-3 text-xs sm:text-sm text-center rounded-xl font-display font-semibold transition-all duration-300 border cursor-pointer select-none focus-ring ${
                            isSelected
                              ? "bg-navy-deep border-navy-deep text-white shadow-md shadow-slate-900/10"
                              : "bg-slate-50 border-slate-200/80 hover:border-gold hover:bg-white text-slate-600 hover:text-navy-deep"
                          }`}
                          id={`ogi-q-${currentQ.id}-opt-${opt.label}`}
                        >
                          {opt.label}
                        </motion.button>
                      );
                    })}
                  </div>

                  <p className="text-center text-[11.5px] font-mono text-slate-400 mt-5 tracking-wider uppercase">
                    Selecting auto-advances to the next milestone
                  </p>
                </div>
              </motion.div>
            )}

            {/* HALFWAY NUDGE SCREEN */}
            {screen === "NUDGE" && (
              <motion.div
                key="nudge"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                role="status"
                aria-live="polite"
                aria-label="Halfway through the assessment. Continuing to Team Accountability questions."
                onClick={() => {
                  setScreen("QUESTIONS");
                  setCurrentQuestionIndex(8);
                }}
                className="p-8 sm:p-10 md:p-12 flex flex-col items-center justify-center h-full flex-grow text-center bg-slate-50 relative cursor-pointer group focus-ring"
                id="ogi-screen-nudge"
              >
                <div className="absolute top-4 right-4 text-[10.5px] font-mono text-slate-300 uppercase tracking-widest">
                  Tap to skip countdown
                </div>

                <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold mb-5">
                  <TrendingUp className="w-8 h-8 animate-pulse" />
                </div>

                <h3 className="font-display font-medium text-xl sm:text-2xl text-navy-deep tracking-tight mb-2">
                  Halfway There
                </h3>

                <p className="text-slate-500 font-sans text-sm max-w-sm leading-relaxed font-light mb-3 text-center">
                  Outstanding consistency! Diagnosing execution friction is the
                  single most vital step towards systemic scaling. You are doing
                  fantastic.
                </p>

                <div className="w-24 h-[1px] bg-slate-200 my-4" />

                <p className="text-gold font-mono text-[11.5px] tracking-widest uppercase font-bold flex items-center gap-1.5 animate-bounce">
                  Next Dimension: Team Accountability
                  <ChevronRight className="w-3.5 h-3.5" />
                </p>
              </motion.div>
            )}

            {/* LOADING SCREEN */}
            {screen === "LOADING" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="p-8 sm:p-10 md:p-12 flex flex-col items-center justify-center h-full flex-grow text-center bg-navy-deep text-white relative min-h-[380px]"
                id="ogi-screen-loading"
              >
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:20px_20px]" />

                <div className="relative flex flex-col items-center z-10">
                  <div className="relative mb-6">
                    <Loader2 className="w-10 h-10 text-gold animate-spin" />
                    <div className="absolute inset-0 rounded-full border-2 border-white/5 opacity-25 animate-ping" />
                  </div>

                  <h3 className="font-display font-medium text-xl sm:text-2xl text-white tracking-tight mb-2">
                    Analyzing {name}&rsquo;s Results...
                  </h3>

                  <p className="text-slate-300 font-sans text-sm max-w-sm font-light mt-1 mb-6 leading-relaxed">
                    Calculating organizational growth dimensions, resolving
                    execution dependencies, and scanning critical alignments.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[11.5px] font-mono text-slate-300 uppercase tracking-widest animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Executing strategic scoring matrices</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* RESULTS SCREEN — delegated to OGIResults component */}
            {screen === "RESULTS" && (
              <OGIResults
                name={name}
                role={role}
                phone={phone}
                email={email}
                answers={answers}
                isSubmitting={isSubmitting}
                submitError={submitError}
                submissionResult={submissionResult}
                onSubmit={handleSubmitResults}
                onRestart={handleRestart}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
