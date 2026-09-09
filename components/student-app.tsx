"use client";

import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Books,
  Brain,
  Check,
  CircleNotch,
  Compass,
  Fire,
  House,
  Lightbulb,
  Lock,
  Medal,
  MathOperations,
  PencilSimple,
  Repeat,
  Sparkle,
  Star,
  Target,
  TrendUp,
  Trophy,
  UserCircle,
  X,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthScreen } from "@/components/auth-screen";
import { eduRequest, type SessionBootstrap } from "@/lib/edu-client";
import type { ActivityDay, AttemptResult, BootstrapData, ProgressRecord, StudentProfile, StudentSummary } from "@/lib/edu-types";

type View = "start" | "auth" | "class" | "subject" | "path" | "section" | "task" | "correct" | "error" | "complete" | "progress" | "achievements" | "profile";
type Skill = { id: string; title: string; kind: string; desc?: string; sectionId?: string; grade?: number };
type Section = { id: string; title: string; desc: string; skills: Skill[] };
type Task = { q: string; a: string; h: string; e: string; kind?: string };

declare global {
  interface Window {
    EDU_MATH?: { byGrade: Record<number, Section[]>; flat: (grade: number) => Skill[] };
    EDU_GEN?: { make: (kind: string, difficulty?: number, attempts?: number) => Task };
  }
}

const fallback: Record<number, Section[]> = {
  4: [
    { id: "m4_s01", title: "§1 · Многозначные числа", desc: "Разряды, чтение и сравнение чисел", skills: [{ id: "m4_s01_read", title: "Чтение многозначных чисел", kind: "g4_num_read" }, { id: "m4_s01_compare", title: "Сравнение чисел", kind: "g4_num_compare" }] },
    { id: "m4_s02", title: "§2 · Величины", desc: "Длина, площадь, масса и время", skills: [{ id: "m4_s02_length", title: "Единицы длины", kind: "g4_units_length" }, { id: "m4_s02_time", title: "Единицы времени", kind: "g4_units_time" }] },
    { id: "m4_s03", title: "§3 · Сложение и вычитание", desc: "Письменные алгоритмы и задачи", skills: [{ id: "m4_s03_add", title: "Письменное сложение", kind: "g4_big_add" }] },
  ],
  5: [
    { id: "m5_p1", title: "§1 · Натуральные числа и шкалы", desc: "Числа, координаты и диаграммы", skills: [{ id: "m5_t01", title: "Представление данных в таблицах", kind: "g5_table" }, { id: "m5_t05", title: "Шкалы и координатная прямая", kind: "g5_scale" }] },
    { id: "m5_p2", title: "§2 · Сложение и вычитание", desc: "Вычисления, выражения и уравнения", skills: [{ id: "m5_t08", title: "Свойства сложения", kind: "g5_add" }] },
    { id: "m5_p5", title: "§5 · Обыкновенные дроби", desc: "Доли, дроби и действия с ними", skills: [{ id: "m5_t29", title: "Сложение дробей с одинаковыми знаменателями", kind: "g5_frac_same" }, { id: "m5_t34", title: "Сокращение дробей", kind: "g5_frac_reduce" }] },
  ],
};

function curriculum(grade: number) {
  return window.EDU_MATH?.byGrade?.[grade] || fallback[grade];
}

function createTask(skill: Skill, difficulty = 0, attempts = 0): Task {
  return window.EDU_GEN?.make(skill.kind, difficulty, attempts) || { q: "3/8 + 2/8 = ?", a: "5/8", h: "При одинаковых знаменателях складывай числители.", e: "Знаменатель остаётся прежним: 3 + 2 = 5, поэтому ответ 5/8." };
}

const progressKey = (topicId: string, subject = "math") => `${subject}:${topicId}`;
const emptySummary: StudentSummary = { total_attempts: 0, total_correct: 0, accuracy: 0, active_days: 0, current_day_streak: 0, last_activity: null };

function difficultyOf(record?: ProgressRecord) {
  if (!record || record.attempts < 4 || record.mastery < 60) return 0;
  if (record.attempts < 8 || record.mastery < 68) return 1;
  if (record.attempts < 13 || record.mastery < 74) return 2;
  if (record.attempts < 20 || record.mastery < 80) return 3;
  if (record.attempts < 30 || record.mastery < 86) return 4;
  return record.streak >= 4 ? 5 : 4;
}

function sectionMastery(section: Section, progress: Record<string, ProgressRecord>) {
  if (!section.skills.length) return 0;
  return Math.round(section.skills.reduce((sum, item) => sum + Number(progress[progressKey(item.id)]?.mastery || 0), 0) / section.skills.length);
}

function normalize(value: string) {
  return value.trim().toLowerCase().replaceAll(" ", "").replaceAll(",", ".").replaceAll("×", "*");
}

function answerOptions(answer: string) {
  const rotate = (values: string[]) => {
    const offset = values.length > 1 ? 1 + (answer.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % (values.length - 1)) : 0;
    return [...values.slice(offset), ...values.slice(0, offset)];
  };
  if (answer.includes("/")) {
    const [nRaw, dRaw] = answer.split("/");
    const n = Number(nRaw) || 5;
    const d = Number(dRaw) || 8;
    return rotate(Array.from(new Set([answer, `${Math.max(1, n - 2)}/${d}`, `${n + 1}/${d}`, `${n}/${d * 2}`, `${d}/${n}`, `${n + 2}/${d}`])).slice(0, 4));
  }
  const n = Number(answer);
  return rotate(Number.isFinite(n) ? [answer, String(n + 1), String(Math.max(0, n - 1)), String(n + 10)] : [answer, "да", "нет", "не знаю"]);
}

const navItems = [
  { id: "path" as View, label: "Учиться", icon: Compass },
  { id: "progress" as View, label: "Мои знания", icon: Books },
  { id: "achievements" as View, label: "Достижения", icon: Medal },
  { id: "profile" as View, label: "Профиль", icon: UserCircle },
];

export function StudentApp({ assetsReady }: { assetsReady: boolean }) {
  const [view, setView] = useState<View>("start");
  const [authMode, setAuthMode] = useState<"create" | "login">("create");
  const [booting, setBooting] = useState(true);
  const [grade, setGrade] = useState(5);
  const [subject, setSubject] = useState("math");
  const [sectionId, setSectionId] = useState("m5_p5");
  const [skill, setSkill] = useState<Skill>({ id: "m5_t29", title: "Сложение дробей с одинаковыми знаменателями", kind: "g5_frac_same" });
  const [task, setTask] = useState<Task>({ q: "3/8 + 2/8 = ?", a: "5/8", h: "При одинаковых знаменателях складывай числители.", e: "Знаменатель остаётся прежним: 3 + 2 = 5, поэтому ответ 5/8." });
  const [selected, setSelected] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [taskStartedAt, setTaskStartedAt] = useState(() => Date.now());
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [progress, setProgress] = useState<Record<string, ProgressRecord>>({});
  const [summary, setSummary] = useState<StudentSummary>(emptySummary);
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [notice, setNotice] = useState("");
  const sections = useMemo(() => (typeof window === "undefined" ? fallback[grade] : curriculum(grade)), [grade, view]);
  const section = sections.find((item) => item.id === sectionId) || sections[0];

  const applyBootstrap = useCallback((data: BootstrapData) => {
    const normalizedProfile = { ...data.profile, xp: Number(data.profile.xp) || 0, current_grade: Number(data.profile.current_grade) === 4 ? 4 as const : 5 as const };
    const normalizedProgress = data.progress.map((item) => ({ ...item, attempts: Number(item.attempts) || 0, correct: Number(item.correct) || 0, mastery: Number(item.mastery) || 0, streak: Number(item.streak) || 0, best_difficulty: Number(item.best_difficulty) || 0 }));
    const rawSummary = data.summary || emptySummary;
    setProfile(normalizedProfile);
    setGrade(normalizedProfile.current_grade);
    setProgress(Object.fromEntries(normalizedProgress.map((item) => [progressKey(item.topic_id, item.subject), item])));
    setSummary({ ...rawSummary, total_attempts: Number(rawSummary.total_attempts) || 0, total_correct: Number(rawSummary.total_correct) || 0, accuracy: Number(rawSummary.accuracy) || 0, active_days: Number(rawSummary.active_days) || 0, current_day_streak: Number(rawSummary.current_day_streak) || 0 });
    setActivity((data.activity || []).map((item) => ({ ...item, attempts: Number(item.attempts) || 0, correct: Number(item.correct) || 0, accuracy: Number(item.accuracy) || 0 })));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let legacyToken = "";
        try { legacyToken = JSON.parse(localStorage.getItem("edu5_student_v1") || "{}").token || ""; } catch { /* ignore malformed legacy state */ }
        const data = legacyToken
          ? await eduRequest<SessionBootstrap>("adoptLegacySession", { token: legacyToken })
          : await eduRequest<SessionBootstrap>("bootstrap");
        if (!cancelled && data) applyBootstrap(data);
        if (legacyToken) localStorage.removeItem("edu5_student_v1");
      } catch {
        localStorage.removeItem("edu5_student_v1");
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => { cancelled = true; };
  }, [applyBootstrap]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [view]);

  const goTask = (nextSkill: Skill) => {
    const current = progress[progressKey(nextSkill.id)];
    setSkill(nextSkill);
    setTask(createTask(nextSkill, difficultyOf(current), current?.attempts || 0));
    setTaskStartedAt(Date.now());
    setSelected("");
    setShowHint(false);
    setView("task");
    void eduRequest("setCurrentTopic", { topicId: nextSkill.id }).catch(() => setNotice("Не удалось сохранить текущую тему"));
  };

  const checkAnswer = async () => {
    if (!selected) return;
    const correct = normalize(selected) === normalize(task.a);
    setView(correct ? "correct" : "error");
    const current = progress[progressKey(skill.id)];
    try {
      const result = await eduRequest<{ attempt: AttemptResult; summary: StudentSummary }>("saveAttempt", { subject: "math", topicId: skill.id, difficulty: difficultyOf(current), correct, elapsed: Math.round((Date.now() - taskStartedAt) / 1000) });
      const record: ProgressRecord = { subject: "math", topic_id: skill.id, attempts: result.attempt.attempts, correct: result.attempt.correct, mastery: Number(result.attempt.mastery), streak: result.attempt.streak, best_difficulty: result.attempt.best_difficulty, last_practiced_at: new Date().toISOString() };
      setProgress((previous) => ({ ...previous, [progressKey(skill.id)]: record }));
      setSummary(result.summary);
      setProfile((previous) => previous ? { ...previous, xp: result.attempt.xp } : previous);
    } catch {
      setNotice("Ответ показан, но синхронизация не удалась. Проверь подключение.");
    }
  };

  const nextTask = () => {
    const current = progress[progressKey(skill.id)];
    const next = createTask(skill, difficultyOf(current), current?.attempts || 0);
    setTask(next);
    setTaskStartedAt(Date.now());
    setSelected("");
    setShowHint(false);
    setView("task");
  };

  const handleAuth = (data: BootstrapData, created: boolean) => {
    applyBootstrap(data);
    setView(created ? "class" : "path");
  };

  const chooseGrade = (nextGrade: number) => {
    const validGrade = nextGrade === 4 ? 4 : 5;
    setGrade(validGrade);
    setProfile((previous) => previous ? { ...previous, current_grade: validGrade } : previous);
    setView("subject");
    if (profile) void eduRequest("updateProfile", { nickname: profile.nickname, grade: validGrade }).catch(() => setNotice("Класс изменён на устройстве, но пока не синхронизирован"));
  };

  const logout = async () => {
    try { await eduRequest("logout"); }
    finally { setProfile(null); setProgress({}); setSummary(emptySummary); setActivity([]); setView("start"); }
  };

  if (booting || !assetsReady) return <div className="app-loading" role="status"><CircleNotch size={34} /> Загружаем учебное пространство…</div>;
  if (view === "auth") return <AuthScreen initialMode={authMode} onSuccess={handleAuth} onBack={() => setView("start")} />;
  if (view === "start") return <StartScreen profile={profile} onStart={() => { if (profile) setView("path"); else { setAuthMode("create"); setView("auth"); } }} onProfile={() => { if (profile) setView("profile"); else { setAuthMode("login"); setView("auth"); } }} />;

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Основная навигация">
        <Brand compact />
        <nav>
          <button className="nav-item" onClick={() => setView("start")}><House size={22} weight="bold" /><span>Главная</span></button>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${view === id || (["class", "subject", "section", "task", "correct", "error", "complete"].includes(view) && id === "path") ? "active" : ""}`} onClick={() => setView(id)}>
              <Icon size={22} weight="bold" /><span>{label}</span>
            </button>
          ))}
        </nav>
        <blockquote>«Практика сегодня — уверенность завтра»</blockquote>
      </aside>
      <main className="app-main">
        <header className="topbar">
          <button className="mobile-brand" onClick={() => setView("start")}><Image src="/smart-student-logo-v3.png" alt="" width={36} height={36} /><span>Умный ученик</span></button>
          <div className="top-spacer" />
          <div className="streak"><Fire size={20} weight="fill" /> <span>Серия: <strong>{summary.current_day_streak} {summary.current_day_streak === 1 ? "день" : "дней"}</strong></span></div>
          <button className="avatar" onClick={() => setView("profile")} aria-label="Открыть профиль">{profile?.nickname.slice(0, 1).toUpperCase() || "У"}</button>
        </header>
        {notice && <div className="sync-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Закрыть"><X /></button></div>}
        <div className="content">
          {view === "class" && <ClassScreen grade={grade} onSelect={chooseGrade} />}
          {view === "subject" && <SubjectScreen subject={subject} progress={progress} sections={sections} onSubject={(s) => { setSubject(s); setView("path"); }} onBack={() => setView("class")} />}
          {view === "path" && <PathScreen grade={grade} sections={sections} progress={progress} summary={summary} onOpen={(id) => { setSectionId(id); setView("section"); }} onGrade={() => setView("class")} />}
          {view === "section" && <SectionScreen grade={grade} section={section} progress={progress} onBack={() => setView("path")} onTask={goTask} />}
          {["task", "correct", "error", "complete"].includes(view) && <TaskScreen state={view} grade={grade} section={section} skill={skill} task={task} selected={selected} onSelect={setSelected} onCheck={checkAnswer} onHint={() => setShowHint((v) => !v)} showHint={showHint} onNext={nextTask} onComplete={() => setView("complete")} onPath={() => setView("path")} />}
          {view === "progress" && <ProgressScreen grade={grade} sections={sections} progress={progress} summary={summary} activity={activity} />}
          {view === "achievements" && <AchievementsScreen sections={sections} progress={progress} summary={summary} />}
          {view === "profile" && profile && <ProfileScreen profile={profile} grade={grade} onProfile={setProfile} onGrade={setGrade} onNotice={setNotice} onLogout={logout} onBack={() => setView("path")} />}
        </div>
      </main>
      <nav className="bottom-nav" aria-label="Мобильная навигация">
        {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}><Icon size={23} weight="bold" /><span>{label}</span></button>)}
      </nav>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <button className={`brand ${compact ? "compact" : ""}`}><Image src="/smart-student-logo-v3.png" alt="Сова — символ Умного ученика" width={compact ? 52 : 88} height={compact ? 52 : 88} priority /><span>Умный<br />ученик</span></button>;
}

function StartScreen({ profile, onStart, onProfile }: { profile: StudentProfile | null; onStart: () => void; onProfile: () => void }) {
  return <main className="start-screen">
    <header className="start-header"><Brand compact /><button className="button ghost" onClick={onProfile}>{profile ? `Профиль · ${profile.nickname}` : "Уже занимаюсь"}</button></header>
    <section className="start-hero">
      <div className="hero-copy"><p className="overline">СТУДИЯ РЕШЕНИЙ</p><h1>Знания становятся <span>видимыми</span></h1><p>Короткие задания, понятные объяснения и личная коллекция освоенных навыков — без скучных оценок и гонки с другими.</p><div className="hero-actions"><button className="button primary" onClick={onStart}>{profile ? "Продолжить обучение" : "Начать учиться"} <ArrowRight size={20} weight="bold" /></button>{!profile && <button className="button secondary" onClick={onProfile}>Войти по коду</button>}</div></div>
      <div className="knowledge-shelf" aria-label="Пример коллекции знаний"><div className="shelf-title"><Sparkle size={22} weight="fill" /><span>Твоя коллекция знаний</span></div><div className="artifact-row"><Artifact icon={<MathOperations />} title="Дроби" tone="blue" /><Artifact icon={<TrendUp />} title="Графики" tone="aqua" /><Artifact icon={<Lock />} title="Новый навык" tone="locked" /></div><div className="shelf-line" /></div>
    </section>
    <section className="start-benefits"><div><strong>10–15 минут</strong><span>на одно занятие</span></div><div><strong>Понятная помощь</strong><span>после каждой ошибки</span></div><div><strong>Личный прогресс</strong><span>вместо сравнения с другими</span></div></section>
  </main>;
}

function ClassScreen({ grade, onSelect }: { grade: number; onSelect: (grade: number) => void }) {
  return <PageFrame eyebrow="Первый шаг" title="В каком ты классе?" description="Курс и сложность заданий настроятся под твою программу."><div className="class-grid">{[4, 5].map((g) => <button key={g} className={`class-card ${grade === g ? "selected" : ""}`} onClick={() => onSelect(g)}><span className="class-number">{g}</span><strong>{g} класс</strong><small>{g === 4 ? "Школа России · Моро" : "Виленкин · Ткачёва"}</small><span className="class-action">Выбрать <ArrowRight size={18} /></span></button>)}</div></PageFrame>;
}

function SubjectScreen({ subject, progress, sections, onSubject, onBack }: { subject: string; progress: Record<string, ProgressRecord>; sections: Section[]; onSubject: (s: string) => void; onBack: () => void }) {
  const mathValue = sections.length ? Math.round(sections.reduce((sum, item) => sum + sectionMastery(item, progress), 0) / sections.length) : 0;
  const russianRecords = Object.values(progress).filter((item) => item.subject === "russian");
  const russianValue = russianRecords.length ? Math.round(russianRecords.reduce((sum, item) => sum + Number(item.mastery), 0) / russianRecords.length) : 0;
  return <PageFrame back={onBack} eyebrow="Выбор курса" title="Что будем изучать?" description="Прогресс по каждому предмету сохраняется отдельно."><div className="subject-grid"><button className={`subject-card ${subject === "math" ? "selected" : ""}`} onClick={() => onSubject("math")}><MathOperations size={42} weight="duotone" /><h2>Математика</h2><p>Числа, задачи, дроби, геометрия и данные</p><ProgressBar value={mathValue} label={`${mathValue}% освоено`} /></button><button className="subject-card" disabled aria-describedby="russian-status"><span className="coming-soon">Скоро</span><PencilSimple size={42} weight="duotone" /><h2>Русский язык</h2><p>Слова, правила, текст и грамотная речь</p><ProgressBar value={russianValue} label={`${russianValue}% сохранено из прежней версии`} /><small id="russian-status">Новый интерфейс курса готовится</small></button></div></PageFrame>;
}

function PathScreen({ grade, sections, progress, summary, onOpen, onGrade }: { grade: number; sections: Section[]; progress: Record<string, ProgressRecord>; summary: StudentSummary; onOpen: (id: string) => void; onGrade: () => void }) {
  const activeThisWeek = Math.min(5, summary.current_day_streak);
  return <PageFrame eyebrow={`${grade} класс · Математика`} title="Твоя траектория" description="Иди по порядку или вернись к теме, которую хочется закрепить." action={<button className="button ghost small" onClick={onGrade}>Сменить класс</button>}><div className="path-layout"><div className="path-list">{sections.map((item, index) => { const value = sectionMastery(item, progress); const previousValue = index === 0 ? 100 : sectionMastery(sections[index - 1], progress); const state = value >= 80 ? "done" : index === 0 || value > 0 || previousValue >= 60 ? "current" : "locked"; return <button className={`path-node ${state}`} key={item.id} onClick={() => onOpen(item.id)} disabled={state === "locked"}><span className="node-mark">{state === "done" ? <Check /> : state === "locked" ? <Lock /> : index + 1}</span><span className="node-copy"><strong>{item.title.replace(/^§?\d+\s*·\s*/, "")}</strong><small>{value ? `${value}% освоено` : state === "locked" ? "Откроется после предыдущего раздела" : "Можно начинать"}</small></span><ArrowRight size={20} /></button>; })}</div><aside className="path-aside"><h3>На этой неделе</h3><div className="weekly-ring"><strong>{activeThisWeek}</strong><span>дней<br />из 5</span></div><p>{activeThisWeek >= 5 ? "Недельная цель выполнена — отличный ритм." : `До недельной цели осталось ${5 - activeThisWeek}.`}</p></aside></div></PageFrame>;
}

function SectionScreen({ grade, section, progress, onBack, onTask }: { grade: number; section: Section; progress: Record<string, ProgressRecord>; onBack: () => void; onTask: (skill: Skill) => void }) {
  const sectionValue = sectionMastery(section, progress);
  const started = section.skills.filter((item) => progress[progressKey(item.id)]?.attempts).length;
  return <PageFrame back={onBack} eyebrow={`${grade} класс · Математика`} title={section.title.replace(/^§?\d+\s*·\s*/, "")} description={section.desc}><div className="section-progress"><ProgressBar value={sectionValue} label={`Раздел освоен на ${sectionValue}%`} /><span>{started} из {section.skills.length} навыков начаты</span></div><div className="topic-list">{section.skills.map((item, index) => { const record = progress[progressKey(item.id)]; const mastery = !record?.attempts ? "new" : record.mastery >= 80 ? "confident" : record.mastery >= 50 ? "learning" : "review"; return <button key={item.id} className="topic-row" onClick={() => onTask(item)}><span className={`topic-status ${mastery}`}>{mastery === "confident" ? <Check /> : mastery === "review" ? <Repeat /> : index + 1}</span><span><strong>{item.title.replace(/^\d+\.\s*/, "")}</strong><small>{mastery === "confident" ? `Уверенно · ${Math.round(record.mastery)}%` : mastery === "learning" ? `Изучаю · ${Math.round(record.mastery)}%` : mastery === "review" ? `Стоит повторить · ${Math.round(record.mastery)}%` : "Не начато"}</small></span><ArrowRight size={20} /></button>; })}</div></PageFrame>;
}

function TaskScreen({ state, grade, section, skill, task, selected, onSelect, onCheck, onHint, showHint, onNext, onComplete, onPath }: { state: View; grade: number; section: Section; skill: Skill; task: Task; selected: string; onSelect: (v: string) => void; onCheck: () => void; onHint: () => void; showHint: boolean; onNext: () => void; onComplete: () => void; onPath: () => void }) {
  const options = answerOptions(task.a);
  const isFeedback = state === "correct" || state === "error";
  if (state === "complete") return <Completion onPath={onPath} />;
  return <div className="task-page">
    <div className="task-breadcrumb"><button onClick={onPath}>{grade} класс</button><span>›</span><span>{section.title.replace(/^§?\d+\s*·\s*/, "")}</span></div>
    <div className="task-progress"><div className="step done"><Check /></div><div className="step done"><Check /></div><div className="step done"><Check /></div><div className="step current">4</div><div className="step" /><div className="step" /><div className="step" /><strong>4 из 7</strong></div>
    <div className="task-columns"><section className="task-card"><p className="task-kicker">Текущий навык</p><h1>{skill.title}</h1><p className="instruction">Реши пример и выбери правильный ответ.</p><div className="problem"><MathExpression value={task.q} /></div><div className="answer-grid">{options.map((option) => { const correct = isFeedback && normalize(option) === normalize(task.a); const wrong = state === "error" && option === selected && !correct; return <button key={option} disabled={isFeedback} className={`answer ${selected === option ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "incorrect" : ""}`} onClick={() => onSelect(option)}>{correct && <Check weight="bold" />}{wrong && <X weight="bold" />}{option}</button>; })}</div>{showHint && !isFeedback && <div className="hint"><Lightbulb size={20} weight="fill" /><span>{task.h}</span></div>}<div className="task-actions"><button className="button ghost" onClick={onHint} disabled={isFeedback}><Lightbulb size={20} /> Подсказка</button><button className="button primary" onClick={onCheck} disabled={!selected || isFeedback}>Проверить <ArrowRight size={19} /></button></div>
      {state === "correct" && <Feedback type="correct" title="Правильно!" text={task.e} action="Следующее задание" onAction={onNext} secondary="Завершить серию" onSecondary={onComplete} />}
      {state === "error" && <Feedback type="error" title="Почти получилось" text={`Правильный ответ: ${task.a}. ${task.e}`} action="Попробовать похожее" onAction={onNext} />}
      </section><KnowledgeShelf /></div>
  </div>;
}

function Feedback({ type, title, text, action, onAction, secondary, onSecondary }: { type: "correct" | "error"; title: string; text: string; action: string; onAction: () => void; secondary?: string; onSecondary?: () => void }) {
  return <div className={`feedback ${type}`} role="status"><div className="feedback-icon">{type === "correct" ? <Check weight="bold" /> : <X weight="bold" />}</div><div><h3>{title}</h3><p>{text}</p><div className="feedback-actions"><button className="button primary small" onClick={onAction}>{action} <ArrowRight size={17} /></button>{secondary && <button className="button ghost small" onClick={onSecondary}>{secondary}</button>}</div></div></div>;
}

function Completion({ onPath }: { onPath: () => void }) {
  return <div className="completion"><div className="completion-mark"><Trophy size={58} weight="duotone" /></div><p className="overline">СЕРИЯ ЗАВЕРШЕНА</p><h1>7 заданий — готово</h1><p>Ты увереннее складываешь дроби с одинаковыми знаменателями.</p><div className="earned-artifact"><Artifact icon={<MathOperations />} title="Сумма дробей" tone="blue" /><div><small>НОВЫЙ АРТЕФАКТ</small><strong>Формула суммы дробей</strong><span>a/c + b/c = (a+b)/c</span></div></div><div className="completion-stats"><div><strong>6</strong><span>правильно</span></div><div><strong>4 мин</strong><span>время серии</span></div><div><strong>+8%</strong><span>к освоению</span></div></div><button className="button primary" onClick={onPath}>Вернуться к траектории <ArrowRight size={20} /></button></div>;
}

function ProgressScreen({ grade, sections, progress, summary, activity }: { grade: number; sections: Section[]; progress: Record<string, ProgressRecord>; summary: StudentSummary; activity: ActivityDay[] }) {
  return <PageFrame eyebrow="Мои знания" title="Ты движешься вперёд" description="Здесь видно, что уже получается уверенно, а к чему лучше вернуться."><div className="progress-summary"><div><strong>{summary.total_attempts}</strong><span>заданий решено</span></div><div><strong>{Math.round(summary.accuracy)}%</strong><span>точность</span></div><div><strong>{summary.current_day_streak} {summary.current_day_streak === 1 ? "день" : "дней"}</strong><span>текущая серия</span></div></div><section className="knowledge-map"><div className="section-heading"><div><h2>Карта знаний</h2><p>Математика · {grade} класс</p></div><MasteryLegend /></div><div className="mastery-list">{sections.map((item) => { const value = sectionMastery(item, progress); const state = value >= 80 ? "confident" : value >= 50 ? "learning" : value > 0 ? "review" : ""; return <MasteryRow key={item.id} label={item.title.replace(/^§?\d+\s*·\s*/, "")} value={value} state={state} />; })}</div></section><section className="activity-panel"><div><h2>Последние 7 дней</h2><p>Столбец показывает долю верных ответов; пустой день остаётся светлым.</p></div><div className="activity-bars" aria-label="Точность за семь дней">{activity.map((item) => <div key={item.day} title={`${item.attempts} заданий · ${Math.round(item.accuracy)}%`}><span className={item.attempts ? "" : "empty"} style={{ height: `${Math.max(item.attempts ? 8 : 3, Number(item.accuracy))}%` }} /><small>{new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(new Date(`${item.day}T12:00:00`)).replace(".", "")}</small></div>)}</div></section></PageFrame>;
}

function AchievementsScreen({ sections, progress, summary }: { sections: Section[]; progress: Record<string, ProgressRecord>; summary: StudentSummary }) {
  const records = Object.values(progress).filter((item) => item.subject === "math");
  const longest = records.reduce((max, item) => Math.max(max, item.streak), 0);
  const bestSection = sections.reduce((max, item) => Math.max(max, sectionMastery(item, progress)), 0);
  const items = [{ icon: <Fire />, title: "Неделя в ритме", text: "Занимайся 7 дней подряд", value: summary.current_day_streak, target: 7, unit: "дней" }, { icon: <Target />, title: "Точный ответ", text: "10 верных ответов подряд", value: longest, target: 10, unit: "ответов" }, { icon: <Brain />, title: "Раздел освоен", text: "Достигни 80% в одном разделе", value: bestSection, target: 80, unit: "%" }, { icon: <Star />, title: "Сотня решений", text: "Реши 100 заданий", value: summary.total_attempts, target: 100, unit: "заданий" }, { icon: <BookOpen />, title: "Исследователь", text: "Начни 5 разных микронавыков", value: records.length, target: 5, unit: "навыков" }, { icon: <Trophy />, title: "Уверенный старт", text: "Дай 20 правильных ответов", value: summary.total_correct, target: 20, unit: "ответов" }];
  return <PageFrame eyebrow="Коллекция" title="Твои достижения" description="Они отмечают привычки и реальные учебные умения — не случайные награды."><div className="achievement-grid">{items.map((item) => { const percent = Math.min(100, Math.round(item.value / item.target * 100)); return <article className={`achievement ${percent >= 100 ? "earned" : ""}`} key={item.title}><div className="achievement-icon">{item.icon}</div><h2>{item.title}</h2><p>{item.text}</p><ProgressBar value={percent} label={`${Math.min(item.value, item.target)} из ${item.target} ${item.unit}`} /></article>; })}</div></PageFrame>;
}

function ProfileScreen({ profile, grade, onProfile, onGrade, onNotice, onLogout, onBack }: { profile: StudentProfile; grade: number; onProfile: (profile: StudentProfile) => void; onGrade: (grade: number) => void; onNotice: (message: string) => void; onLogout: () => Promise<void>; onBack: () => void }) {
  const [nickname, setNickname] = useState(profile.nickname);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [busy, setBusy] = useState(false);
  const saveProfile = async () => {
    setBusy(true);
    try { const updated = await eduRequest<{ nickname: string; current_grade: 4 | 5 }>("updateProfile", { nickname, grade }); onProfile({ ...profile, ...updated }); onGrade(updated.current_grade); onNotice("Профиль сохранён"); }
    catch (error) { onNotice(error instanceof Error ? error.message : "Не удалось сохранить профиль"); }
    finally { setBusy(false); }
  };
  const changePin = async () => {
    setBusy(true);
    try { await eduRequest("changePin", { oldPin, newPin }); setOldPin(""); setNewPin(""); onNotice("PIN изменён"); }
    catch (error) { onNotice(error instanceof Error ? error.message : "Не удалось изменить PIN"); }
    finally { setBusy(false); }
  };
  const copy = async (value: string, label: string) => { try { await navigator.clipboard.writeText(value); onNotice(`${label} скопирован`); } catch { onNotice(`${label}: ${value}`); } };
  return <PageFrame back={onBack} eyebrow="Профиль" title="Твоё учебное пространство" description="Прогресс доступен на разных устройствах после входа по коду и PIN."><div className="profile-layout"><section className="profile-card"><div className="profile-avatar">{nickname.slice(0, 1).toUpperCase()}</div><label>Имя ученика<input value={nickname} maxLength={40} onChange={(e) => setNickname(e.target.value)} /></label><label>Текущий класс<select value={grade} onChange={(e) => onGrade(Number(e.target.value))}><option value={4}>4 класс</option><option value={5}>5 класс</option></select></label><div className="code-block"><span>Код ученика</span><strong>{profile.student_code}</strong><button className="auth-link inline" onClick={() => copy(profile.student_code, "Код ученика")}>Скопировать</button></div><button className="button secondary" disabled={busy || !nickname.trim()} onClick={saveProfile}>Сохранить изменения</button></section><section className="profile-card"><h2>Безопасность и восстановление</h2><div className="code-block"><span>Родительский код</span><strong>{profile.parent_code}</strong><button className="auth-link inline" onClick={() => copy(profile.parent_code, "Родительский код")}>Скопировать</button></div><label>Текущий PIN<input type="password" inputMode="numeric" maxLength={6} value={oldPin} onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))} /></label><label>Новый PIN<input type="password" inputMode="numeric" maxLength={6} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} placeholder="4–6 цифр" /></label><button className="button primary" disabled={busy || oldPin.length < 4 || newPin.length < 4} onClick={changePin}>Изменить PIN</button><button className="button danger" disabled={busy} onClick={onLogout}>Выйти на этом устройстве</button><p className="security-note">Сохрани оба кода отдельно. Родительский код позволяет восстановить PIN.</p></section></div></PageFrame>;
}

function PageFrame({ eyebrow, title, description, back, action, children }: { eyebrow: string; title: string; description: string; back?: () => void; action?: React.ReactNode; children: React.ReactNode }) {
  return <div className="page-frame"><div className="page-heading">{back && <button className="back-button" onClick={back} aria-label="Назад"><ArrowLeft size={22} /></button>}<div><p className="overline">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{action}</div>{children}</div>;
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return <div className="progress-control"><div className="progress-track"><span style={{ width: `${value}%` }} /></div><small>{label}</small></div>;
}

function MathExpression({ value }: { value: string }) {
  const pieces = value.split(/(\d+\s*\/\s*\d+)/g);
  return <span className="math-expression" aria-label={value}>{pieces.map((piece, index) => {
    const match = piece.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (!match) return <span aria-hidden="true" key={`${piece}-${index}`}>{piece.replaceAll("+", " + ").replaceAll("−", " − ").replaceAll("=", " = ")}</span>;
    return <span className="math-fraction" aria-hidden="true" key={`${piece}-${index}`}><span>{match[1]}</span><span>{match[2]}</span></span>;
  })}</span>;
}

function MasteryLegend() { return <div className="mastery-legend"><span className="confident"><Check /> Уверенно</span><span className="learning"><CircleNotch /> Изучаю</span><span className="review"><Repeat /> Повторить</span></div>; }

function MasteryRow({ label, value, state }: { label: string; value: number; state: string }) { return <div className="mastery-row"><strong>{label}</strong><div className="mastery-cells">{[20, 40, 60, 80, 100].map((threshold) => <span key={threshold} className={value >= threshold ? state : ""} />)}</div><small>{value}%</small></div>; }

function Artifact({ icon, title, tone }: { icon: React.ReactNode; title: string; tone: string }) { return <div className={`artifact ${tone}`}><div>{icon}</div><span>{title}</span></div>; }

function KnowledgeShelf() { return <aside className="task-shelf"><div><p className="overline">ТВОЯ КОЛЛЕКЦИЯ</p><h2>3 из 12 артефактов</h2></div><div className="artifact-row vertical"><Artifact icon={<MathOperations />} title="Дроби" tone="blue" /><Artifact icon={<Sparkle />} title="Сложение" tone="aqua" /><Artifact icon={<Lock />} title="Новый навык" tone="locked" /></div><div className="mastery-card"><h3>Прогресс по теме</h3><MasteryRow label="Понимаю" value={80} state="confident" /><MasteryRow label="Применяю" value={60} state="learning" /><MasteryRow label="Закрепляю" value={20} state="review" /></div></aside>; }
