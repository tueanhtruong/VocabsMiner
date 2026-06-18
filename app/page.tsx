"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const VOCAB_CARDS = [
  {
    word: "proliferate",
    type: "verb",
    definition: "Increase rapidly in numbers; multiply",
    example:
      "Industrial farming has caused pesticide use to proliferate across the region.",
    band: "B2",
  },
  {
    word: "ubiquitous",
    type: "adjective",
    definition: "Present, appearing, or found everywhere",
    example: "Smartphones have become ubiquitous in modern society.",
    band: "C1",
  },
  {
    word: "exacerbate",
    type: "verb",
    definition: "Make a problem or bad situation worse",
    example: "Air pollution exacerbates respiratory conditions significantly.",
    band: "C1",
  },
  {
    word: "indigenous",
    type: "adjective",
    definition: "Originating or occurring naturally in a particular place",
    example:
      "Indigenous communities have preserved ancient farming techniques.",
    band: "B2",
  },
];

const PAIN_POINTS = [
  { icon: "⏱️", text: "Hours wasted looking up words one by one" },
  { icon: "📖", text: "Lost context by the time you find the definition" },
  { icon: "🧠", text: "Forgetting new words without a systematic approach" },
  {
    icon: "🎯",
    text: "Missing the exact band-critical vocabulary examiners look for",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Paste Your Passage",
    description:
      "Copy any IELTS reading passage — academic, general, or practice test material — and paste it into VocabMiner's intelligent input field.",
    icon: (
      <svg
        className="h-8 w-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    number: "02",
    title: "AI Extracts Vocabulary",
    description:
      "Our AI model scans the passage and pinpoints every high-impact academic word — with Band 7+ relevance scoring so you know exactly what to focus on.",
    icon: (
      <svg
        className="h-8 w-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    number: "03",
    title: "Study with Full Context",
    description:
      "Every extracted word comes with a precise definition, its usage in the original passage highlighted, synonyms, and example sentences — everything in one place.",
    icon: (
      <svg
        className="h-8 w-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    gradient: "from-purple-500 to-pink-500",
  },
];

const FEATURES = [
  {
    icon: "🔍",
    title: "Smart Extraction",
    description:
      "AI trained on academic English identifies vocabulary that appears most in IELTS Band 7+ essays and readings.",
  },
  {
    icon: "📍",
    title: "In-Context Highlighting",
    description:
      "See exactly where each word appears in your original passage. Never lose context between the word and its usage.",
  },
  {
    icon: "📚",
    title: "Rich Definitions",
    description:
      "Get dictionary-quality definitions, part of speech, example sentences tailored to academic contexts, and common collocations.",
  },
  {
    icon: "📜",
    title: "History & Review",
    description:
      "Every passage you analyze is saved. Review your vocabulary mining history and track your growing academic word bank over time.",
  },
  {
    icon: "⚡",
    title: "Seconds, Not Hours",
    description:
      "What used to take 45 minutes of manual lookup takes under 10 seconds. Spend your time learning, not searching.",
  },
  {
    icon: "🎯",
    title: "Band-Focused",
    description:
      "Filters prioritize vocabulary that directly impacts your IELTS score — not everyday words, but the ones examiners love to see.",
  },
];

const STATS = [
  { value: "<5m", label: "To extract vocabulary from any passage" },
  { value: "20+", label: "Vocabulary words extracted per passage" },
  { value: "Band 6+", label: "Target vocabulary level focus" },
  { value: "100%", label: "Context preserved per extracted word" },
];

export default function Home() {
  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % VOCAB_CARDS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex w-full flex-col overflow-hidden bg-white">
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0714] px-6 py-24 text-center">
        {/* Animated gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float absolute -top-40 -left-40 h-125 w-125 rounded-full bg-indigo-700/25 blur-3xl" />
          <div className="animate-float-reverse absolute top-1/2 -right-40 h-100 w-100 rounded-full bg-purple-700/20 blur-3xl" />
          <div className="animate-float absolute bottom-0 left-1/3 h-87.5 w-87.5 rounded-full bg-blue-700/15 blur-3xl" />
          {/* Dot grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-5xl space-y-8">
          {/* Live badge */}
          <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-600/15 px-5 py-2 text-sm font-medium text-indigo-300 backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
            AI-Powered IELTS Vocabulary Extractor
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up text-5xl font-extrabold leading-tight tracking-tight text-white md:text-7xl">
            Stop Looking Up Words.{" "}
            <span className="animate-gradient-text bg-linear-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Start Mastering Them.
            </span>
          </h1>

          {/* Sub-headline */}
          <p
            className="animate-fade-in-up mx-auto max-w-2xl text-xl leading-relaxed text-gray-300"
            style={{ animationDelay: "0.1s" }}
          >
            Paste any IELTS reading passage and watch VocabMiner instantly
            extract, define, and contextualize every band-critical academic word
            — so you study smarter, not harder.
          </p>

          {/* CTAs */}
          <div
            className="animate-fade-in-up flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            style={{ animationDelay: "0.2s" }}
          >
            <Link
              href="/dashboard"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 px-8 py-4 text-base font-semibold text-white shadow-2xl shadow-indigo-500/40 transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/60 active:scale-100"
            >
              Start Free Extraction
              <svg
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="/dashboard/history"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/15"
            >
              View History
            </Link>
          </div>

          {/* Live vocab card carousel */}
          <div
            className="animate-scale-in mx-auto mt-6 w-full max-w-sm"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left shadow-2xl backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                  Live Preview
                </span>
                <div className="flex gap-1.5">
                  {VOCAB_CARDS.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === activeCard
                          ? "w-5 bg-indigo-400"
                          : "w-1.5 bg-white/25"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="min-h-30 transition-all duration-500">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-2xl font-bold text-white">
                    {VOCAB_CARDS[activeCard].word}
                  </h3>
                  <span className="mt-1 shrink-0 rounded-full border border-indigo-500/30 bg-indigo-600/35 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                    {VOCAB_CARDS[activeCard].band}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-indigo-300">
                  {VOCAB_CARDS[activeCard].type}
                </p>
                <p className="mt-2 text-sm text-gray-300">
                  {VOCAB_CARDS[activeCard].definition}
                </p>
                <p className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-xs italic text-gray-400">
                  &ldquo;{VOCAB_CARDS[activeCard].example}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="animate-bounce-slow absolute bottom-8">
          <div className="flex flex-col items-center gap-1 text-white/35">
            <span className="text-xs">Scroll to explore</span>
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ───────────────────────────────────────────────── */}
      <section className="bg-gray-950 px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">
            Sound familiar?
          </h2>
          <p className="mb-12 text-lg text-gray-400">
            Every IELTS learner hits these walls. VocabMiner tears them down.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {PAIN_POINTS.map((point, i) => (
              <div
                key={i}
                className="animate-slide-in-right flex items-center gap-4 rounded-xl border border-red-900/30 bg-red-950/20 p-5 text-left"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="text-2xl">{point.icon}</span>
                <p className="text-gray-300">{point.text}</p>
                <svg
                  className="ml-auto h-5 w-5 shrink-0 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            ))}
          </div>
          <div className="mt-10 flex items-center justify-center gap-4">
            <div className="h-px flex-1 bg-linear-to-r from-transparent to-indigo-600/50" />
            <span className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white">
              VocabMiner fixes all of this
            </span>
            <div className="h-px flex-1 bg-linear-to-l from-transparent to-indigo-600/50" />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <span className="mb-3 inline-block rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-semibold text-indigo-700">
              3 Simple Steps
            </span>
            <h2 className="text-4xl font-bold text-gray-900 md:text-5xl">
              How VocabMiner Works
            </h2>
            <p className="mt-4 text-xl text-gray-500">
              From raw passage to mastered vocabulary in under 60 seconds.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="animate-fade-in-up rounded-2xl border border-gray-100 bg-gray-50 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="mb-6 flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${step.gradient} text-white shadow-lg`}
                  >
                    {step.icon}
                  </div>
                  <span className="text-5xl font-black text-gray-100">
                    {step.number}
                  </span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">
                  {step.title}
                </h3>
                <p className="leading-relaxed text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ─────────────────────────────────────────────── */}
      <section className="bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <span className="mb-3 inline-block rounded-full bg-purple-100 px-4 py-1.5 text-sm font-semibold text-purple-700">
              Everything You Need
            </span>
            <h2 className="text-4xl font-bold text-gray-900 md:text-5xl">
              Built for Serious IELTS Learners
            </h2>
            <p className="mt-4 text-xl text-gray-500">
              Not a general dictionary. A precision instrument tuned for IELTS
              success.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="animate-fade-in-up rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="mb-4 text-3xl">{feature.icon}</div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAMPLE OUTPUT ─────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Copy */}
            <div>
              <span className="mb-3 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-700">
                See It In Action
              </span>
              <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
                Every word, fully unpacked
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-gray-600">
                VocabMiner doesn&apos;t just list difficult words — it delivers
                a complete learning package for each one. You get the
                definition, part of speech, the original sentence from your
                passage highlighted, and academic usage examples, all in one
                view.
              </p>
              <ul className="space-y-3">
                {[
                  "Band-level indicator so you know its exact difficulty",
                  "Original passage sentence highlighted for full context",
                  "Concise, precise academic definition",
                  "Example sentence showing natural academic usage",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock vocabulary card */}
            <div className="rounded-3xl bg-linear-to-br from-indigo-600 via-purple-600 to-blue-700 p-1 shadow-2xl shadow-indigo-500/30">
              <div className="rounded-3xl bg-white p-7">
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                    Extracted from passage
                  </span>
                  <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                    Band C1
                  </span>
                </div>
                <h3 className="text-3xl font-black text-gray-900">
                  exacerbate
                </h3>
                <p className="mt-1 text-sm font-semibold text-indigo-600">
                  verb &middot; /ɪɡˈzæs.ə.beɪt/
                </p>
                <p className="mt-3 text-gray-700">
                  To make an existing problem, bad situation, or negative
                  feeling worse.
                </p>
                <div className="mt-5 rounded-xl border-l-4 border-indigo-400 bg-gray-50 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    In your passage
                  </p>
                  <p className="text-sm italic text-gray-600">
                    &ldquo;Carbon emissions{" "}
                    <mark className="not-italic rounded bg-indigo-100 px-0.5 font-semibold text-indigo-800">
                      exacerbate
                    </mark>{" "}
                    the greenhouse effect, accelerating global temperature
                    rise.&rdquo;
                  </p>
                </div>
                <div className="mt-4 rounded-xl bg-indigo-50 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    Example sentence
                  </p>
                  <p className="text-sm text-indigo-900">
                    &ldquo;Poor nutrition can exacerbate the symptoms of many
                    chronic diseases.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <section className="bg-linear-to-br from-indigo-600 via-purple-700 to-blue-800 px-6 py-24 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            The numbers speak for themselves
          </h2>
          <p className="mb-16 text-lg text-indigo-200">
            Stop wasting study time. Start building vocabulary that sticks.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {STATS.map((stat, i) => (
              <div
                key={i}
                className="animate-fade-in-up rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <p className="text-4xl font-black text-white">{stat.value}</p>
                <p className="mt-2 text-sm text-indigo-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a0714] px-6 py-32 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-float absolute top-0 left-1/4 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="animate-float-reverse absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="mb-6 text-4xl font-extrabold text-white md:text-6xl">
            Your IELTS Band 7+{" "}
            <span className="animate-gradient-text bg-linear-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              starts here.
            </span>
          </h2>
          <p className="mb-10 text-xl text-gray-400">
            Join learners who stopped guessing and started building a systematic
            academic vocabulary — one passage at a time.
          </p>
          <Link
            href="/dashboard"
            className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-indigo-600 to-blue-600 px-10 py-5 text-lg font-bold text-white shadow-2xl shadow-indigo-500/40 transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/60 active:scale-100"
          >
            Start Extracting Now — It&apos;s Free
            <svg
              className="h-5 w-5 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="bg-gray-950 px-6 py-10 text-center">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-600 to-blue-600">
              <span className="text-sm font-bold text-white">V</span>
            </div>
            <span className="text-lg font-bold text-white">VocabMiner</span>
          </div>
          <p className="text-sm text-gray-500">
            © 2026 VocabMiner. Empowering IELTS learners worldwide.
          </p>
        </div>
      </footer>
    </main>
  );
}
