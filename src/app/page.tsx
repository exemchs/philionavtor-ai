"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import {
  motion,
  AnimatePresence,
  useInView,
} from "framer-motion";
import Image from "next/image";

/* ═══════════════════════════════════════════
   UTILS
   ═══════════════════════════════════════════ */

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ═══════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════ */

function useCountUp(target: number, duration = 2000, decimals = 0) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Number((eased * target).toFixed(decimals)));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, decimals]);

  return { ref, value };
}

function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggle };
}

/* ═══════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════ */

function FadeIn({
  children,
  delay = 0,
  className,
  y = 24,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Sparkline({
  data,
  color,
  width = 80,
  height = 32,
  className,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pointsArr = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return { x, y };
  });

  const path =
    "M " + pointsArr.map((p) => `${p.x},${p.y}`).join(" L ");

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
    >
      <defs>
        <linearGradient
          id={`grad-${color.replace(/[^a-zA-Z0-9]/g, "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${path} L ${width},${height} L 0,${height} Z`}
        fill={`url(#grad-${color.replace(/[^a-zA-Z0-9]/g, "")})`}
        opacity={inView ? 1 : 0}
        style={{ transition: "opacity 0.8s ease" }}
      />
      <path
        d={path}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={inView ? "sparkline-animate" : ""}
        style={inView ? {} : { opacity: 0 }}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */

const METRICS = [
  {
    value: 2900,
    suffix: "만",
    label: "Claude Code 일일 설치",
    sub: "1,770만에서 64% 증가",
    change: "+64%",
    color: "var(--accent)",
    sparkData: [4, 5, 5, 6, 7, 8, 10, 12, 15, 17, 21, 25, 29],
  },
  {
    value: 80,
    suffix: "%",
    label: "업무 시간 단축",
    sub: "AI 도구 활용 시 평균 단축율",
    change: "최대",
    color: "var(--cyan)",
    sparkData: [20, 30, 35, 42, 50, 55, 60, 65, 68, 72, 75, 78, 80],
  },
  {
    value: 4,
    suffix: "%",
    label: "GitHub 커밋 중 AI 생성",
    sub: "2026년 말 20%+ 전망",
    change: "→ 20%+",
    color: "var(--amber)",
    sparkData: [0.2, 0.3, 0.5, 0.7, 1, 1.2, 1.5, 2, 2.5, 3, 3.2, 3.6, 4],
  },
  {
    value: 8,
    suffix: "/10",
    label: "Fortune 10 기업 Claude 고객",
    sub: "세계 최대 기업이 선택한 AI",
    change: "80%",
    color: "var(--violet)",
    sparkData: [2, 3, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8, 8],
  },
  {
    value: 50,
    suffix: "%+",
    label: "비개발자 AI 사용 비율",
    sub: "Epic 社 Claude Code 사용자 중",
    change: "과반",
    color: "var(--accent)",
    sparkData: [10, 15, 18, 22, 28, 30, 35, 38, 42, 45, 47, 50, 52],
  },
  {
    value: 35,
    suffix: "만+",
    label: "글로벌 기업 AI 도입 인원",
    sub: "Cognizant 35만, Accenture 3만",
    change: "확산",
    color: "var(--cyan)",
    sparkData: [2, 3, 5, 8, 10, 12, 15, 18, 22, 26, 30, 33, 35],
  },
];

const USE_CASES = [
  {
    title: "회의록 자동 정리",
    desc: "1시간 회의 → 3분 만에 핵심 요약 완성",
    icon: "📋",
    mockup: [
      "EXEM CX그룹 주간회의 요약",
      "━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "📅 2026년 3월 3일 (월) 10:00-11:00",
      "👥 참석: CX그룹 전원 (12명)",
      "",
      "▸ 핵심 결정사항",
      "  1. AI 커리큘럼 전사 배포 — 3/10(월)",
      "  2. 파일럿 팀 피드백 반영 완료",
      "  3. 신규 고객사 온보딩 프로세스 개선안 확정",
      "",
      "▸ 액션 아이템",
      "  • 김OO: 교육 자료 최종 검토 (D-3)",
      "  • 이OO: 온보딩 가이드 업데이트 (D-5)",
      "  • 박OO: 고객 피드백 대시보드 구성 (D-7)",
      "",
      "▸ 다음 회의: 3/10 10:00",
    ],
  },
  {
    title: "데이터 분석 보고서",
    desc: "복잡한 데이터 → 인사이트 자동 추출",
    icon: "📊",
    mockup: [
      "2월 고객 이탈 분석 보고서",
      "━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "▸ 요약",
      "  이탈률 12.3% → 8.7% (전월 대비 29% 개선)",
      "",
      "▸ 주요 발견",
      "  1. 온보딩 30일 이내 이탈이 전체의 67%",
      "  2. 기술 지원 응답 시간과 이탈률 상관계수 0.82",
      "  3. 교육 프로그램 참여 고객 이탈률 3.1%",
      "",
      "▸ 권장 조치",
      "  • 온보딩 첫 주 집중 케어 프로그램 도입",
      "  • 기술 지원 응답 목표: 4시간 → 2시간",
      "  • 분기별 고객 교육 세션 확대",
      "",
      "▸ 예상 효과: 이탈률 5% 이하 달성 가능",
    ],
  },
  {
    title: "업무 프로세스 자동화",
    desc: "반복 업무 → 자동 처리 워크플로우",
    icon: "⚡",
    mockup: [
      "주간 리포트 자동화 완료",
      "━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "▸ 자동화된 작업",
      "  ✅ Notion 주간 회의록 수집 (12건)",
      "  ✅ ClickUp 태스크 진행률 집계",
      "  ✅ 팀별 KPI 달성률 계산",
      "  ✅ 주간 요약 보고서 생성",
      "  ✅ Mattermost 팀 채널 공유",
      "",
      "▸ 절감 시간",
      "  기존: 매주 3시간 수작업",
      "  현재: 자동 실행 (3분)",
      "",
      "▸ 다음 실행: 3/10(월) 09:00",
      "",
      "  ─ 98% 시간 절감 ─",
    ],
  },
];

/* ═══════════════════════════════════════════
   NAV
   ═══════════════════════════════════════════ */

function Nav({ theme, onToggle }: { theme: string; onToggle: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "glass border-b py-3" : "py-5"
      )}
      style={{ borderColor: scrolled ? "var(--border)" : "transparent" }}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <Image
          src={
            theme === "dark"
              ? "/logos/Exem_logo_white.svg"
              : "/logos/Exem_logo_black.svg"
          }
          alt="EXEM"
          width={80}
          height={24}
          className="h-5 w-auto"
        />

        <button
          onClick={onToggle}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
          aria-label="테마 전환"
        >
          <span className="text-sm">
            {theme === "dark" ? "☀️" : "🌙"}
          </span>
        </button>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════ */

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg" />

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, var(--accent-glow), transparent)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <FadeIn>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs tracking-wide mb-8"
            style={{
              background: "var(--accent-dim)",
              color: "var(--accent)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
              style={{ background: "var(--accent)" }}
            />
            2026년 3월 — EXEM AI Initiative
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight"
            style={{ letterSpacing: "-0.04em" }}
          >
            일하는 방식이
            <br />
            <span style={{ color: "var(--accent)" }}>바뀌고 있습니다</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p
            className="mt-6 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            AI는 더 이상 개발자만의 도구가 아닙니다.
            <br className="hidden sm:block" />
            지금 이 순간, 전 세계 비전공자들이 AI로 업무를 바꾸고 있습니다.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="mt-4 text-sm" style={{ color: "var(--text-dim)" }}>
            EXEM은 기술을 만드는 회사입니다. 가장 먼저 활용할 수 있습니다.
          </p>
        </FadeIn>

        {/* Scroll indicator */}
        <FadeIn delay={0.5}>
          <div className="mt-16 flex flex-col items-center gap-2 animate-scroll-hint">
            <span
              className="text-xs tracking-widest uppercase"
              style={{ color: "var(--text-dim)" }}
            >
              Scroll
            </span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ color: "var(--text-dim)" }}
            >
              <path d="M10 4 L10 16 M5 11 L10 16 L15 11" />
            </svg>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   METRIC CARD
   ═══════════════════════════════════════════ */

function MetricCard({
  metric,
  index,
}: {
  metric: (typeof METRICS)[0];
  index: number;
}) {
  const { ref, value } = useCountUp(metric.value, 2000 + index * 200);

  const colorKey = metric.color.replace("var(--", "").replace(")", "");
  const dimVar = `var(--${colorKey}-dim)`;

  return (
    <FadeIn delay={index * 0.08}>
      <div className="dashboard-card p-5 sm:p-6 flex flex-col gap-3 h-full">
        {/* Header: change badge */}
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded"
            style={{
              background: dimVar,
              color: metric.color,
            }}
          >
            {metric.change}
          </span>
          <Sparkline
            data={metric.sparkData}
            color={metric.color}
            width={64}
            height={24}
          />
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1">
          <span
            ref={ref}
            className="text-3xl sm:text-4xl font-light tabular-nums"
            style={{ letterSpacing: "-0.03em" }}
          >
            {value.toLocaleString()}
          </span>
          <span
            className="text-lg sm:text-xl font-light"
            style={{ color: "var(--text-secondary)" }}
          >
            {metric.suffix}
          </span>
        </div>

        {/* Label */}
        <div>
          <p className="text-sm font-medium">{metric.label}</p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--text-dim)" }}
          >
            {metric.sub}
          </p>
        </div>
      </div>
    </FadeIn>
  );
}

/* ═══════════════════════════════════════════
   TRENDS DASHBOARD SECTION
   ═══════════════════════════════════════════ */

function TrendsSection() {
  return (
    <section className="py-20 sm:py-28 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-light"
              style={{ letterSpacing: "-0.03em" }}
            >
              지금, 세상은
            </h2>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] tracking-wider uppercase w-fit"
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
                style={{ background: "var(--accent)" }}
              />
              Live — 2026.03
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <p
            className="text-sm sm:text-base max-w-xl mb-10 sm:mb-14"
            style={{ color: "var(--text-secondary)" }}
          >
            이건 먼 미래가 아닙니다. 지금 이 순간 일어나고 있는 변화입니다.
          </p>
        </FadeIn>

        {/* Dashboard frame */}
        <div
          className="rounded-2xl p-3 sm:p-4"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Dashboard title bar */}
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg mb-3 sm:mb-4"
            style={{ background: "var(--bg-card)" }}
          >
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            <span
              className="text-[11px] tracking-wide"
              style={{ color: "var(--text-dim)" }}
            >
              AI TREND DASHBOARD — EXEM MONITORING
            </span>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {METRICS.map((metric, i) => (
              <MetricCard key={metric.label} metric={metric} index={i} />
            ))}
          </div>
        </div>

        {/* Attribution */}
        <FadeIn delay={0.4}>
          <p
            className="text-[11px] mt-4 text-right"
            style={{ color: "var(--text-dim)" }}
          >
            출처: Anthropic, SemiAnalysis, VentureBeat, Pragmatic Engineer
            (2026.03)
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   EXEM POSITION SECTION
   ═══════════════════════════════════════════ */

function PositionSection() {
  const points = [
    {
      title: "IT 모니터링 전문 기업",
      desc: "20년 이상 데이터를 다뤄온 기술 기업. AI를 가장 잘 이해하고 활용할 수 있는 위치에 있습니다.",
    },
    {
      title: "비전공자도 활용하는 시대",
      desc: "의료 IT 기업 Epic에서는 Claude Code 사용자의 절반 이상이 비개발 직군입니다. 기술 배경과 무관합니다.",
    },
    {
      title: "글로벌 기업이 먼저 움직이고 있다",
      desc: "Microsoft는 자사 Copilot을 판매하면서도 내부적으로 Claude Code를 도입했습니다.",
    },
  ];

  return (
    <section className="py-20 sm:py-28 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text */}
          <div>
            <FadeIn>
              <span
                className="text-xs tracking-widest uppercase"
                style={{ color: "var(--accent)" }}
              >
                EXEM&apos;s Position
              </span>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-light mt-4 leading-snug"
                style={{ letterSpacing: "-0.03em" }}
              >
                우리는 기술을 만드는 회사입니다.
                <br />
                <span style={{ color: "var(--text-secondary)" }}>
                  가장 잘 활용할 수 있는 위치에 있습니다.
                </span>
              </h2>
            </FadeIn>

            <FadeIn delay={0.15}>
              <p
                className="mt-6 text-sm sm:text-base leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                EXEM은 2001년부터 DB, APM, 인프라 모니터링 소프트웨어를 만들어온
                IT 전문 기업입니다. 데이터를 수집하고, 분석하고, 시각화하는 것이
                우리의 본업입니다. AI는 그 연장선에 있습니다.
              </p>
            </FadeIn>

            <div className="mt-10 flex flex-col gap-4">
              {points.map((point, i) => (
                <FadeIn key={point.title} delay={0.2 + i * 0.08}>
                  <div
                    className="flex gap-4 p-4 rounded-xl transition-colors"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-medium"
                      style={{
                        background: "var(--accent-dim)",
                        color: "var(--accent)",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{point.title}</p>
                      <p
                        className="text-xs mt-1 leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {point.desc}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          {/* Right: Quote card */}
          <FadeIn delay={0.2}>
            <div
              className="relative p-8 sm:p-10 rounded-2xl"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="absolute -top-3 left-8 px-3 py-1 rounded-full text-[10px] tracking-wider uppercase"
                style={{
                  background: "var(--bg)",
                  color: "var(--text-dim)",
                  border: "1px solid var(--border)",
                }}
              >
                Anthropic CEO
              </div>

              <blockquote
                className="text-lg sm:text-xl md:text-2xl font-light leading-relaxed mt-4"
                style={{ letterSpacing: "-0.02em" }}
              >
                &ldquo;2025년 Claude가
                <span style={{ color: "var(--accent)" }}>
                  {" "}
                  개발자의 업무
                </span>
                를 바꿨다면, 2026년은
                <span style={{ color: "var(--cyan)" }}>
                  {" "}
                  모든 지식 노동자의 업무
                </span>
                를 바꿀 것입니다.&rdquo;
              </blockquote>

              <p
                className="mt-6 text-sm"
                style={{ color: "var(--text-dim)" }}
              >
                Dario Amodei, Anthropic CEO
              </p>

              {/* Decorative glow */}
              <div
                className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full blur-3xl opacity-30"
                style={{
                  background:
                    "radial-gradient(circle, var(--accent-glow), transparent 70%)",
                }}
              />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   CLAUDE CODE SECTION
   ═══════════════════════════════════════════ */

function ClaudeCodeSection() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-20 sm:py-28 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: "var(--cyan)" }}
          >
            Claude Code
          </span>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-light mt-4 leading-snug"
            style={{ letterSpacing: "-0.03em" }}
          >
            코딩이 아닙니다.
            <br />
            <span style={{ color: "var(--text-secondary)" }}>
              AI에게 일을 시키는 새로운 방식입니다.
            </span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.15}>
          <p
            className="mt-4 text-sm sm:text-base max-w-xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Claude Code는 대화로 업무를 처리합니다. 코드를 쓰는 도구가 아니라,
            여러분의 일을 대신 해주는 AI 동료입니다.
          </p>
        </FadeIn>

        {/* Use case tabs + mockup */}
        <FadeIn delay={0.2}>
          <div className="mt-10 sm:mt-14">
            {/* Tabs */}
            <div className="flex gap-2 sm:gap-3 mb-6 overflow-x-auto pb-2 -mx-6 px-6 sm:mx-0 sm:px-0">
              {USE_CASES.map((uc, i) => (
                <button
                  key={uc.title}
                  onClick={() => setActiveTab(i)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all cursor-pointer shrink-0"
                  style={{
                    background:
                      activeTab === i ? "var(--bg-card)" : "transparent",
                    border:
                      activeTab === i
                        ? "1px solid var(--border-hover)"
                        : "1px solid var(--border)",
                    color:
                      activeTab === i
                        ? "var(--text)"
                        : "var(--text-secondary)",
                  }}
                >
                  <span>{uc.icon}</span>
                  {uc.title}
                </button>
              ))}
            </div>

            {/* Device mockup */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              {/* Browser chrome */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  background: "var(--bg-card)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div
                    className="px-4 py-1 rounded-md text-[11px]"
                    style={{
                      background: "var(--bg)",
                      color: "var(--text-dim)",
                    }}
                  >
                    Claude Code — {USE_CASES[activeTab].title}
                  </div>
                </div>
                <div className="w-[52px]" />
              </div>

              {/* Content area */}
              <div className="p-5 sm:p-8 md:p-10 min-h-[340px] sm:min-h-[400px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p
                      className="text-xs mb-4"
                      style={{ color: "var(--text-dim)" }}
                    >
                      {USE_CASES[activeTab].desc}
                    </p>

                    <div
                      className="rounded-xl p-4 sm:p-6 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto"
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {USE_CASES[activeTab].mockup.map((line, i) => (
                        <div key={i} className={line === "" ? "h-3" : ""}>
                          {line}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom message */}
            <FadeIn delay={0.3}>
              <p
                className="mt-6 text-center text-sm"
                style={{ color: "var(--text-dim)" }}
              >
                터미널이나 코드를 몰라도 됩니다. 한국어로 대화하면 AI가
                처리합니다.
              </p>
            </FadeIn>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   CURRICULUM CTA SECTION
   ═══════════════════════════════════════════ */

function CurriculumSection() {
  const days = [
    { day: 0, label: "오리엔테이션", color: "var(--accent)" },
    { day: 1, label: "AI에게 잘 시키는 법", color: "var(--accent)" },
    { day: 2, label: "내 업무를 AI로", color: "var(--cyan)" },
    { day: 3, label: "도구 연결하기", color: "var(--cyan)" },
    { day: 4, label: "자동화하기", color: "var(--amber)" },
    { day: 5, label: "졸업", color: "var(--amber)" },
  ];

  return (
    <section className="py-20 sm:py-28 md:py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <FadeIn>
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: "var(--accent)" }}
          >
            EXEM AI Curriculum
          </span>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-light mt-4"
            style={{ letterSpacing: "-0.03em" }}
          >
            <span style={{ color: "var(--accent)" }}>5일</span>이면 충분합니다
          </h2>
        </FadeIn>

        <FadeIn delay={0.15}>
          <p
            className="mt-4 text-sm sm:text-base max-w-lg mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            비전공자를 위해 설계된 실전 AI 커리큘럼.
            <br />
            하루 1시간, 5일이면 AI로 업무를 바꿀 수 있습니다.
          </p>
        </FadeIn>

        {/* Day badges */}
        <FadeIn delay={0.2}>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-10 sm:mt-14">
            {days.map((d, i) => (
              <motion.div
                key={d.day}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  delay: 0.3 + i * 0.06,
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-medium"
                  style={{
                    background: d.color,
                    color: "var(--bg)",
                  }}
                >
                  {d.day}
                </span>
                <span
                  className="hidden sm:inline"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {d.label}
                </span>
              </motion.div>
            ))}
          </div>
        </FadeIn>

        {/* CTA Buttons */}
        <FadeIn delay={0.35}>
          <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <a
              href="https://exem-ai-curriculum-landing.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "var(--accent)",
                color: "#000",
              }}
            >
              커리큘럼 시작하기
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   CLOSING SECTION
   ═══════════════════════════════════════════ */

function ClosingSection({ theme }: { theme: string }) {
  return (
    <section className="relative py-24 sm:py-32 md:py-40 px-6 overflow-hidden">
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 100%, var(--accent-glow), transparent)",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <FadeIn>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-tight"
            style={{ letterSpacing: "-0.04em" }}
          >
            엑셈의 내일은,
            <br />
            <span style={{ color: "var(--accent)" }}>오늘</span> 시작됩니다.
          </h2>
        </FadeIn>

        <FadeIn delay={0.15}>
          <p
            className="mt-6 sm:mt-8 text-sm sm:text-base leading-relaxed max-w-lg mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            두려워하지 마세요. 우리 모두 처음은 낯설었습니다.
            <br />
            하지만 시작한 사람만이 변화를 만듭니다.
          </p>
        </FadeIn>

        <FadeIn delay={0.25}>
          <div
            className="mt-12 pt-8"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <Image
              src={
                theme === "dark"
                  ? "/logos/Exem_logo_white.svg"
                  : "/logos/Exem_logo_black.svg"
              }
              alt="EXEM"
              width={64}
              height={20}
              className="mx-auto h-4 w-auto opacity-30"
            />
            <p
              className="mt-3 text-xs"
              style={{ color: "var(--text-dim)" }}
            >
              &copy; 2026 EXEM. AI가 만드는 새로운 가능성.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════ */

export default function Home() {
  const { theme, toggle } = useTheme();

  return (
    <>
      <Nav theme={theme} onToggle={toggle} />
      <main>
        <HeroSection />
        <TrendsSection />
        <PositionSection />
        <ClaudeCodeSection />
        <CurriculumSection />
        <ClosingSection theme={theme} />
      </main>
    </>
  );
}
