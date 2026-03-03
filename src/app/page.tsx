"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Image from "next/image";

/* ── helpers ── */
function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/* ── hooks ── */
function useCountUp(end: number, ms = 2000) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const ran = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !ran.current) {
          ran.current = true;
          const t0 = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - t0) / ms, 1);
            setV(Math.round((1 - Math.pow(1 - p, 3)) * end));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [end, ms]);
  return { ref, v };
}

function useTheme() {
  const [t, setT] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const s = localStorage.getItem("theme");
    if (s === "light" || s === "dark") setT(s);
    else setT(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
  }, [t]);
  const toggle = useCallback(() => setT((p) => (p === "dark" ? "light" : "dark")), []);
  return { theme: t, toggle };
}

/* ── animation wrapper ── */
function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.25, 1, 0.5, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── sparkline ── */
function Spark({ data, color, w = 72, h = 28 }: { data: number[]; color: string; w?: number; h?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const visible = useInView(ref, { once: true });
  const mn = Math.min(...data), mx = Math.max(...data), r = mx - mn || 1;
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * w, y: h - 2 - ((v - mn) / r) * (h - 4) }));
  const d = "M" + pts.map((p) => `${p.x} ${p.y}`).join("L");
  const uid = `sp-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg ref={ref} width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="shrink-0">
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {visible && (
        <>
          <path d={`${d}L${w} ${h}L0 ${h}Z`} fill={`url(#${uid})`} />
          <path d={d} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="sparkline-draw" />
        </>
      )}
    </svg>
  );
}

/* ══════════════════════════════════════════════
   DATA
   ══════════════════════════════════════════════ */
const METRICS = [
  { value: 2900, unit: "만", label: "Claude Code 일일 설치", delta: "+64%", note: "VS Code 기준, 2026.02", color: "var(--green)", soft: "var(--green-soft)", spark: [4, 5, 6, 7, 8, 10, 12, 15, 17, 21, 25, 29] },
  { value: 80, unit: "%", label: "업무 시간 단축", delta: "최대", note: "Anthropic 내부 연구 기준", color: "var(--cyan)", soft: "var(--cyan-soft)", spark: [20, 30, 42, 50, 55, 60, 65, 72, 75, 78, 80, 80] },
  { value: 4, unit: "%", label: "GitHub 커밋 중 AI 생성", delta: "→20%+", note: "2026년 말 전망", color: "var(--amber)", soft: "var(--amber-soft)", spark: [0.2, 0.5, 0.7, 1, 1.5, 2, 2.5, 3, 3.2, 3.6, 4, 4] },
  { value: 8, unit: "/10", label: "Fortune 10 기업이 Claude 사용", delta: "80%", note: "세계 최대 기업이 선택", color: "var(--violet)", soft: "var(--violet-soft)", spark: [2, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8, 8] },
  { value: 50, unit: "%+", label: "비개발직군 AI 사용", delta: "과반", note: "Epic 社 Claude Code 사용자 중", color: "var(--green)", soft: "var(--green-soft)", spark: [10, 15, 22, 28, 30, 35, 42, 45, 47, 50, 52, 52] },
  { value: 35, unit: "만+", label: "글로벌 기업 도입 인원", delta: "확산", note: "Cognizant 35만 · Accenture 3만", color: "var(--cyan)", soft: "var(--cyan-soft)", spark: [2, 5, 8, 10, 15, 18, 22, 26, 30, 33, 35, 35] },
];

const CASES = [
  {
    tab: "회의록 정리", icon: "📋",
    title: "1시간 회의 → 3분 요약",
    lines: [
      { t: "title", v: "CX그룹 주간회의 요약" },
      { t: "meta", v: "2026.03.03 (월) 10:00 · 참석 12명" },
      { t: "head", v: "핵심 결정사항" },
      { t: "item", v: "AI 커리큘럼 전사 배포 일정 확정 — 3/10(월)" },
      { t: "item", v: "파일럿 팀 피드백 반영 완료" },
      { t: "item", v: "신규 고객사 온보딩 프로세스 개선안 확정" },
      { t: "head", v: "액션 아이템" },
      { t: "item", v: "김OO — 교육 자료 최종 검토 (D-3)" },
      { t: "item", v: "이OO — 온보딩 가이드 업데이트 (D-5)" },
      { t: "item", v: "박OO — 고객 피드백 대시보드 구성 (D-7)" },
    ],
  },
  {
    tab: "데이터 분석", icon: "📊",
    title: "복잡한 데이터 → 인사이트 추출",
    lines: [
      { t: "title", v: "2월 고객 이탈 분석 보고서" },
      { t: "meta", v: "분석 기간: 2026.02.01 — 02.28" },
      { t: "head", v: "요약" },
      { t: "highlight", v: "이탈률 12.3% → 8.7% (29% 개선)" },
      { t: "head", v: "주요 발견" },
      { t: "item", v: "온보딩 30일 이내 이탈이 전체의 67%" },
      { t: "item", v: "기술지원 응답 시간과 이탈률 상관계수 0.82" },
      { t: "item", v: "교육 참여 고객 이탈률 3.1%" },
      { t: "head", v: "권장 조치" },
      { t: "item", v: "온보딩 첫 주 집중 케어 프로그램 도입" },
      { t: "item", v: "기술지원 응답 목표 4h → 2h" },
    ],
  },
  {
    tab: "업무 자동화", icon: "⚡",
    title: "반복 업무 → 자동 워크플로우",
    lines: [
      { t: "title", v: "주간 리포트 자동화" },
      { t: "meta", v: "마지막 실행: 2026.03.03 09:00" },
      { t: "head", v: "자동 처리 완료" },
      { t: "check", v: "Notion 주간 회의록 수집 (12건)" },
      { t: "check", v: "태스크 진행률 집계" },
      { t: "check", v: "팀별 KPI 달성률 계산" },
      { t: "check", v: "주간 요약 보고서 생성" },
      { t: "check", v: "Mattermost 팀 채널 공유" },
      { t: "head", v: "절감 효과" },
      { t: "highlight", v: "매주 3시간 → 3분 (98% 절감)" },
    ],
  },
];

const DAYS = [
  { n: 0, label: "오리엔테이션", time: "~5분" },
  { n: 1, label: "AI에게 잘 시키는 법", time: "~60분" },
  { n: 2, label: "내 업무를 AI로", time: "~60분" },
  { n: 3, label: "도구 연결하기", time: "~60분" },
  { n: 4, label: "자동화하기", time: "~60분" },
  { n: 5, label: "졸업 프로젝트", time: "~60분" },
];

/* ══════════════════════════════════════════════
   NAV
   ══════════════════════════════════════════════ */
function Nav({ theme, onToggle }: { theme: string; onToggle: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <header className={cn("fixed top-0 inset-x-0 z-50 transition-all duration-300", scrolled && "glass-nav")}>
      <div className="mx-auto max-w-[1120px] px-6 sm:px-8 h-14 flex items-center justify-between">
        <Image
          src={theme === "dark" ? "/logos/Exem_logo_white.svg" : "/logos/Exem_logo_black.svg"}
          alt="EXEM" width={72} height={20} className="h-[18px] w-auto"
        />
        <button
          onClick={onToggle}
          aria-label="테마 전환"
          className="w-8 h-8 rounded-lg grid place-items-center text-sm cursor-pointer transition-colors"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border-0)" }}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>
    </header>
  );
}

/* ══════════════════════════════════════════════
   HERO
   ══════════════════════════════════════════════ */
function Hero() {
  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden" style={{ background: "var(--bg-0)" }}>
      {/* gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute w-[520px] h-[520px] rounded-full blur-[120px] opacity-[.15]"
          style={{ background: "var(--green)", top: "20%", left: "15%", animation: "float-a 8s ease-in-out infinite" }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-[.10]"
          style={{ background: "var(--cyan)", bottom: "10%", right: "10%", animation: "float-b 10s ease-in-out infinite" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-8 text-center">
        <Reveal>
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium"
            style={{ background: "var(--green-soft)", color: "var(--green)", border: "1px solid var(--green-soft)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--green)", animation: "pulse-dot 2s ease-in-out infinite" }} />
            2026.03 — EXEM AI Initiative
          </span>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="mt-8 text-[clamp(2.25rem,6vw,4.5rem)] font-semibold leading-[1.1] tracking-[-0.035em]">
            일하는 방식이
            <br />
            <span style={{ color: "var(--green)" }}>바뀌고 있습니다</span>
          </h1>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mt-6 text-[clamp(1rem,2.2vw,1.25rem)] leading-relaxed" style={{ color: "var(--text-1)" }}>
            AI는 더 이상 개발자만의 도구가 아닙니다.
            <br />
            전 세계 비전공자들이 AI로 업무를 바꾸고 있습니다.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <p className="mt-3 text-sm" style={{ color: "var(--text-2)" }}>
            EXEM은 기술을 만드는 회사입니다. 가장 먼저 활용할 수 있습니다.
          </p>
        </Reveal>

        <Reveal delay={0.36}>
          <div className="mt-16 flex flex-col items-center gap-1" style={{ color: "var(--text-3)", animation: "scroll-bounce 2.4s ease-in-out infinite" }}>
            <span className="text-[11px] tracking-[.15em] uppercase">Scroll</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 5l6 6 6-6" /></svg>
          </div>
        </Reveal>
      </div>

      {/* bottom fade-out gradient for smooth transition */}
      <div className="absolute bottom-0 inset-x-0 h-32 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, var(--bg-1))" }} />
    </section>
  );
}

/* ══════════════════════════════════════════════
   METRIC CARD
   ══════════════════════════════════════════════ */
function MetricCard({ m, i }: { m: (typeof METRICS)[0]; i: number }) {
  const { ref, v } = useCountUp(m.value, 1800 + i * 150);
  return (
    <Reveal delay={i * 0.06} className="h-full">
      <div
        className="relative h-full p-5 sm:p-6 flex flex-col gap-3 overflow-hidden transition-colors"
      >
        {/* top row: delta + sparkline */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold rounded-md px-2 py-0.5" style={{ background: m.soft, color: m.color }}>
            {m.delta}
          </span>
          <Spark data={m.spark} color={m.color} />
        </div>

        {/* big number */}
        <div className="flex items-baseline gap-1">
          <span ref={ref} className="text-[2.5rem] leading-none font-bold tabular-nums tracking-tight">{v.toLocaleString()}</span>
          <span className="text-lg font-medium" style={{ color: "var(--text-2)" }}>{m.unit}</span>
        </div>

        {/* label */}
        <div className="mt-auto">
          <p className="text-sm font-medium" style={{ color: "var(--text-0)" }}>{m.label}</p>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--text-2)" }}>{m.note}</p>
        </div>

        {/* colored left accent */}
        <div className="absolute left-0 top-5 bottom-5 w-[3px] rounded-r-full" style={{ background: m.color, opacity: 0.4 }} />
      </div>
    </Reveal>
  );
}

/* ══════════════════════════════════════════════
   TRENDS SECTION
   ══════════════════════════════════════════════ */
function Trends() {
  return (
    <section className="section-alt py-16 sm:py-24 px-6 sm:px-8">
      <div className="mx-auto max-w-[1120px]">
        <Reveal>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">지금, 세상은</h2>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wider uppercase"
              style={{ background: "var(--green-soft)", color: "var(--green)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--green)", animation: "pulse-dot 2s ease-in-out infinite" }} />
              Live 2026.03
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <p className="text-base mb-12" style={{ color: "var(--text-1)" }}>
            먼 미래가 아닙니다. 지금 이 순간 일어나고 있는 변화입니다.
          </p>
        </Reveal>

        {/* dashboard frame */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-0)", border: "1px solid var(--border-0)" }}>
          {/* title bar */}
          <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: "1px solid var(--border-0)" }}>
            <div className="flex gap-[6px]">
              <span className="w-[10px] h-[10px] rounded-full" style={{ background: "#ff5f57" }} />
              <span className="w-[10px] h-[10px] rounded-full" style={{ background: "#febc2e" }} />
              <span className="w-[10px] h-[10px] rounded-full" style={{ background: "#28c840" }} />
            </div>
            <span className="text-[11px] font-medium tracking-wide" style={{ color: "var(--text-2)" }}>
              AI Trend Dashboard — EXEM Monitoring
            </span>
          </div>

          {/* cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: "var(--border-0)" }}>
            {METRICS.map((m, i) => (
              <div key={m.label} style={{ background: "var(--bg-0)" }}>
                <MetricCard m={m} i={i} />
              </div>
            ))}
          </div>
        </div>

        <Reveal delay={0.3}>
          <p className="text-[11px] mt-3 text-right" style={{ color: "var(--text-3)" }}>
            출처: Anthropic · SemiAnalysis · VentureBeat · Pragmatic Engineer (2026.03)
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   POSITION SECTION
   ══════════════════════════════════════════════ */
function Position() {
  const items = [
    { icon: "🏢", title: "IT 모니터링 전문 기업", desc: "20년 이상 데이터를 다뤄온 기술 기업.\nAI를 가장 잘 이해하고 활용할 수 있는 위치." },
    { icon: "👩‍💼", title: "비전공자도 활용하는 시대", desc: "Epic(의료 IT)에서 Claude Code 사용자의\n절반 이상이 비개발 직군입니다." },
    { icon: "🌍", title: "글로벌 기업이 먼저 움직이는 중", desc: "Microsoft는 자사 Copilot을 판매하면서도\n내부적으로 Claude Code를 도입했습니다." },
  ];

  return (
    <section className="py-20 sm:py-32 px-6 sm:px-8" style={{ background: "var(--bg-0)" }}>
      <div className="mx-auto max-w-[1120px]">
        <Reveal>
          <p className="text-[13px] font-semibold tracking-wider uppercase" style={{ color: "var(--green)" }}>EXEM&apos;s Position</p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-snug">
            우리는 기술을 만드는 회사입니다.
            <br />
            <span style={{ color: "var(--text-1)" }}>가장 잘 활용할 수 있는 위치에 있습니다.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-4 text-base max-w-2xl leading-relaxed" style={{ color: "var(--text-1)" }}>
            EXEM은 2001년부터 DB, APM, 인프라 모니터링 소프트웨어를 만들어온 IT 전문 기업입니다.
            데이터를 수집하고, 분석하고, 시각화하는 것이 우리의 본업입니다.
          </p>
        </Reveal>

        {/* 3 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={0.14 + i * 0.06}>
              <div
                className="rounded-xl p-6 h-full flex flex-col gap-3"
                style={{ background: "var(--bg-1)", border: "1px solid var(--border-0)" }}
              >
                <span className="text-2xl">{it.icon}</span>
                <p className="text-[15px] font-semibold">{it.title}</p>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-1)" }}>{it.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* quote */}
        <Reveal delay={0.3}>
          <blockquote
            className="mt-12 rounded-xl p-8 relative"
            style={{ background: "var(--bg-1)", border: "1px solid var(--border-0)" }}
          >
            <div className="absolute left-8 -top-3 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase"
              style={{ background: "var(--bg-0)", color: "var(--text-2)", border: "1px solid var(--border-0)" }}>
              Anthropic CEO
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-medium leading-relaxed tracking-tight mt-2">
              &ldquo;2025년 Claude가 <span style={{ color: "var(--green)" }}>개발자의 업무</span>를 바꿨다면,
              {" "}2026년은 <span style={{ color: "var(--cyan)" }}>모든 지식 노동자의 업무</span>를 바꿀 것입니다.&rdquo;
            </p>
            <p className="mt-4 text-sm" style={{ color: "var(--text-2)" }}>— Dario Amodei</p>
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   CLAUDE CODE SECTION
   ══════════════════════════════════════════════ */
function MockupLine({ l }: { l: { t: string; v: string } }) {
  switch (l.t) {
    case "title":
      return <p className="text-[15px] font-semibold mb-1">{l.v}</p>;
    case "meta":
      return <p className="text-[12px] mb-4" style={{ color: "var(--text-2)" }}>{l.v}</p>;
    case "head":
      return <p className="text-[13px] font-semibold mt-4 mb-1.5" style={{ color: "var(--text-1)" }}>{l.v}</p>;
    case "item":
      return (
        <div className="flex gap-2 py-[3px] text-sm" style={{ color: "var(--text-1)" }}>
          <span style={{ color: "var(--text-2)" }}>·</span>
          <span>{l.v}</span>
        </div>
      );
    case "check":
      return (
        <div className="flex gap-2 py-[3px] text-sm" style={{ color: "var(--text-1)" }}>
          <span style={{ color: "var(--green)" }}>✓</span>
          <span>{l.v}</span>
        </div>
      );
    case "highlight":
      return (
        <div className="inline-block rounded-lg px-3 py-1.5 text-sm font-semibold my-1" style={{ background: "var(--green-soft)", color: "var(--green)" }}>
          {l.v}
        </div>
      );
    default:
      return <p className="text-sm" style={{ color: "var(--text-1)" }}>{l.v}</p>;
  }
}

function ClaudeCode() {
  const [tab, setTab] = useState(0);
  return (
    <section className="section-alt py-20 sm:py-32 px-6 sm:px-8">
      <div className="mx-auto max-w-[1120px]">
        <Reveal>
          <p className="text-[13px] font-semibold tracking-wider uppercase" style={{ color: "var(--cyan)" }}>Claude Code</p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-snug">
            코딩이 아닙니다.
            <br />
            <span style={{ color: "var(--text-1)" }}>AI에게 일을 시키는 새로운 방식입니다.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-4 text-base max-w-xl" style={{ color: "var(--text-1)" }}>
            코드를 쓰는 도구가 아니라, 한국어로 대화하면 업무를 처리해주는 AI 동료입니다.
          </p>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="mt-10">
            {/* tabs */}
            <div className="flex gap-2 overflow-x-auto pb-3 -mx-6 px-6 sm:mx-0 sm:px-0">
              {CASES.map((c, i) => (
                <button
                  key={c.tab}
                  onClick={() => setTab(i)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer shrink-0",
                  )}
                  style={{
                    background: tab === i ? "var(--bg-2)" : "transparent",
                    border: tab === i ? "1px solid var(--border-1)" : "1px solid transparent",
                    color: tab === i ? "var(--text-0)" : "var(--text-2)",
                  }}
                >
                  <span>{c.icon}</span>{c.tab}
                </button>
              ))}
            </div>

            {/* browser mockup */}
            <div className="rounded-xl overflow-hidden mt-2" style={{ background: "var(--bg-0)", border: "1px solid var(--border-0)" }}>
              {/* chrome */}
              <div className="flex items-center gap-3 px-5 h-10" style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border-0)" }}>
                <div className="flex gap-[6px]">
                  <span className="w-[10px] h-[10px] rounded-full" style={{ background: "#ff5f57" }} />
                  <span className="w-[10px] h-[10px] rounded-full" style={{ background: "#febc2e" }} />
                  <span className="w-[10px] h-[10px] rounded-full" style={{ background: "#28c840" }} />
                </div>
                <div className="flex-1 flex justify-center">
                  <span className="text-[11px] px-4 py-0.5 rounded" style={{ background: "var(--bg-0)", color: "var(--text-2)" }}>
                    Claude Code — {CASES[tab].tab}
                  </span>
                </div>
                <div className="w-12" />
              </div>

              {/* content */}
              <div className="p-5 sm:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6"
                  >
                    <div>
                      <p className="text-xs font-medium mb-4" style={{ color: "var(--text-2)" }}>{CASES[tab].title}</p>
                      <div className="rounded-lg p-5 sm:p-6" style={{ background: "var(--bg-1)", border: "1px solid var(--border-0)" }}>
                        {CASES[tab].lines.map((l, i) => <MockupLine key={i} l={l} />)}
                      </div>
                    </div>
                    <div className="hidden lg:flex flex-col justify-center gap-4 py-4">
                      <div className="rounded-lg p-4" style={{ background: "var(--bg-1)", border: "1px solid var(--border-0)" }}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-2)" }}>처리 시간</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold" style={{ color: "var(--green)" }}>
                            {tab === 0 ? "3분" : tab === 1 ? "즉시" : "3분"}
                          </span>
                        </div>
                        <p className="text-[11px] mt-1" style={{ color: "var(--text-2)" }}>
                          {tab === 0 ? "1시간 회의 기준" : tab === 1 ? "데이터 업로드 후" : "매주 월요일 자동 실행"}
                        </p>
                      </div>
                      <div className="rounded-lg p-4" style={{ background: "var(--bg-1)", border: "1px solid var(--border-0)" }}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-2)" }}>필요한 기술</p>
                        <p className="text-sm font-medium" style={{ color: "var(--green)" }}>한국어 대화</p>
                        <p className="text-[11px] mt-1" style={{ color: "var(--text-2)" }}>코딩 지식 불필요</p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <p className="mt-5 text-center text-sm" style={{ color: "var(--text-2)" }}>
              터미널이나 코드를 몰라도 됩니다. 대화만 하면 AI가 처리합니다.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   CURRICULUM SECTION
   ══════════════════════════════════════════════ */
function Curriculum() {
  return (
    <section className="py-20 sm:py-28 px-6 sm:px-8" style={{ background: "var(--bg-0)" }}>
      <div className="mx-auto max-w-[1120px] text-center">
        <Reveal>
          <p className="text-[13px] font-semibold tracking-wider uppercase" style={{ color: "var(--green)" }}>EXEM AI Curriculum</p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
            <span style={{ color: "var(--green)" }}>5일</span>이면 충분합니다
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-4 text-base max-w-md mx-auto" style={{ color: "var(--text-1)" }}>
            비전공자를 위해 설계된 실전 AI 커리큘럼.
            <br />
            하루 1시간이면 AI로 업무를 바꿀 수 있습니다.
          </p>
        </Reveal>

        {/* day timeline */}
        <Reveal delay={0.16}>
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {DAYS.map((d, i) => (
              <motion.div
                key={d.n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.05, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                className="rounded-xl p-4 text-left"
                style={{ background: "var(--bg-1)", border: "1px solid var(--border-0)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg grid place-items-center text-sm font-bold mb-3"
                  style={{
                    background: i < 2 ? "var(--green-soft)" : i < 4 ? "var(--cyan-soft)" : "var(--amber-soft)",
                    color: i < 2 ? "var(--green)" : i < 4 ? "var(--cyan)" : "var(--amber)",
                  }}
                >
                  {d.n}
                </div>
                <p className="text-sm font-semibold leading-snug">{d.label}</p>
                <p className="text-[12px] mt-1" style={{ color: "var(--text-2)" }}>{d.time}</p>
              </motion.div>
            ))}
          </div>
        </Reveal>

        {/* CTA */}
        <Reveal delay={0.3}>
          <div className="mt-12">
            <a
              href="https://exem-ai-curriculum-landing.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "var(--green)", color: "#000" }}
            >
              커리큘럼 시작하기
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9h10M10 5l4 4-4 4" /></svg>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   CLOSING
   ══════════════════════════════════════════════ */
function Closing({ theme }: { theme: string }) {
  return (
    <section className="relative py-28 sm:py-40 px-6 sm:px-8 overflow-hidden" style={{ background: "var(--bg-0)" }}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute w-[600px] h-[300px] rounded-full blur-[140px] opacity-[.08] left-1/2 bottom-0 -translate-x-1/2" style={{ background: "var(--green)" }} />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
            엑셈의 내일은,
            <br />
            <span style={{ color: "var(--green)" }}>오늘</span> 시작됩니다.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 text-base leading-relaxed" style={{ color: "var(--text-1)" }}>
            두려워하지 마세요. 우리 모두 처음은 낯설었습니다.
            <br />
            하지만 시작한 사람만이 변화를 만듭니다.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-16 pt-6" style={{ borderTop: "1px solid var(--border-0)" }}>
            <Image
              src={theme === "dark" ? "/logos/Exem_logo_white.svg" : "/logos/Exem_logo_black.svg"}
              alt="EXEM" width={56} height={16} className="mx-auto h-3.5 w-auto opacity-25"
            />
            <p className="mt-2 text-[12px]" style={{ color: "var(--text-3)" }}>&copy; 2026 EXEM</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════ */
export default function Home() {
  const { theme, toggle } = useTheme();
  return (
    <>
      <Nav theme={theme} onToggle={toggle} />
      <main>
        <Hero />
        <Trends />
        <Position />
        <ClaudeCode />
        <Curriculum />
        <Closing theme={theme} />
      </main>
    </>
  );
}
