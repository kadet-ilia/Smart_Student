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

type Subject = "math" | "russian";
type View = "start" | "auth" | "class" | "subject" | "path" | "section" | "task" | "correct" | "error" | "complete" | "progress" | "achievements" | "profile";
type Skill = { id: string; title: string; kind: string; desc?: string; sectionId?: string; grade?: number };
type Section = { id: string; title: string; desc: string; skills: Skill[] };
type Task = { q: string; a: string; h: string; e: string; kind?: string };
type CurriculumAsset = { byGrade: Record<number, Section[]>; flat?: (grade: number) => Skill[] };
type GeneratorAsset = { make: (kind: string, difficulty?: number, attempts?: number) => Task };

declare global {
  interface Window {
    EDU_MATH?: CurriculumAsset;
    EDU_GEN?: GeneratorAsset;
    EDU_RUS?: CurriculumAsset;
    EDU_RUS_GEN?: GeneratorAsset;
  }
}

const fallbackMath: Record<number, Section[]> = {
  4: [{ id: "m4_s01", title: "§1 · Многозначные числа", desc: "Разряды, чтение и сравнение чисел", skills: [{ id: "m4_s01_read", title: "Чтение многозначных чисел", kind: "g4_num_read" }] }],
  5: [{ id: "m5_p1", title: "§1 · Натуральные числа и нуль. Шкалы", desc: "Числа, координаты и диаграммы", skills: [{ id: "m5_t01", title: "Представление числовой информации в таблицах", kind: "g5_table" }] }],
};

const fallbackRussian: Record<number, Section[]> = {
  4: [{ id: "r4_p1", title: "§1 · Повторение", desc: "Речь, текст, предложение и основные орфограммы", skills: [{ id: "r4_p1_text", title: "Тема и главная мысль текста", kind: "text_core" }] }],
  5: [{ id: "r5_p1", title: "§1 · Входная диагностика и повторение", desc: "Повторение программы 4 класса", skills: [{ id: "r5_p1_text", title: "Диагностика работы с текстом", kind: "text_core" }] }],
};

const subjectName = (subject: Subject) => subject === "math" ? "Математика" : "Русский язык";
const subjectIcon = (subject: Subject) => subject === "math" ? "∑" : "Я";
const subjectDescription = (subject: Subject) => subject === "math"
  ? "Числа, задачи, дроби, геометрия и данные"
  : "Орфография, грамматика, текст, лексика и грамотная речь";

function curriculum(subject: Subject, grade: number) {
  if (typeof window === "undefined") return subject === "math" ? fallbackMath[grade] : fallbackRussian[grade];
  if (subject === "math") return window.EDU_MATH?.byGrade?.[grade] || fallbackMath[grade];
  return window.EDU_RUS?.byGrade?.[grade] || fallbackRussian[grade];
}

function createTask(subject: Subject, skill: Skill, difficulty = 0, attempts = 0): Task {
  const generator = subject === "math" ? window.EDU_GEN : window.EDU_RUS_GEN;
  if (generator?.make) return generator.make(skill.kind, difficulty, attempts);
  return subject === "math"
    ? { q: "3/8 + 2/8 = ?", a: "5/8", h: "При одинаковых знаменателях складывай числители.", e: "3 + 2 = 5, знаменатель остаётся 8." }
    : { q: "Как называется общая часть родственных слов?", a: "корень", h: "Эта часть содержит общее лексическое значение.", e: "Общая часть родственных слов — корень.", kind: "txt" };
}

const progressKey = (topicId: string, subject: Subject = "math") => `${subject}:${topicId}`;
const emptySummary: StudentSummary = { total_attempts: 0, total_correct: 0, accuracy: 0, active_days: 0, current_day_streak: 0, last_activity: null };

function difficultyOf(record?: ProgressRecord) {
  if (!record || record.attempts < 4 || record.mastery < 60) return 0;
  if (record.attempts < 8 || record.mastery < 68) return 1;
  if (record.attempts < 13 || record.mastery < 74) return 2;
  if (record.attempts < 20 || record.mastery < 80) return 3;
  if (record.attempts < 30 || record.mastery < 86) return 4;
  return record.streak >= 4 ? 5 : 4;
}

function sectionMastery(section: Section, progress: Record<string, ProgressRecord>, subject: Subject) {
  if (!section.skills.length) return 0;
  return Math.round(section.skills.reduce((sum, item) => sum + Number(progress[progressKey(item.id, subject)]?.mastery || 0), 0) / section.skills.length);
}

function subjectMastery(subject: Subject, grade: number, progress: Record<string, ProgressRecord>) {
  const sections = curriculum(subject, grade);
  if (!sections.length) return 0;
  return Math.round(sections.reduce((sum, item) => sum + sectionMastery(item, progress, subject), 0) / sections.length);
}

function normalize(value: string) {
  return value.trim().toLowerCase().replaceAll("ё", "е").replaceAll(" ", "").replaceAll(",", ".").replaceAll("×", "*").replaceAll("—", "-").replaceAll("–", "-");
}

const russianGroups = [
  ["устная", "письменная"], ["диалог", "монолог"], ["повествование", "описание", "рассуждение"],
  ["повествовательное", "вопросительное", "побудительное"], ["восклицательное", "невосклицательное"],
  ["простое", "сложное"], ["синонимы", "антонимы", "омонимы"], ["мужской", "женский", "средний"],
  ["единственное", "множественное"], ["именительный", "родительный", "дательный", "винительный", "творительный", "предложный"],
  ["существительное", "прилагательное", "глагол", "местоимение", "наречие", "числительное"],
  ["настоящее", "прошедшее", "будущее"], ["I", "II"], ["звонкий", "глухой"], ["твёрдый", "мягкий"],
  ["гласный", "согласный"], ["разговорная", "книжная"], ["да", "нет"], ["корень", "приставка", "суффикс", "окончание"],
];

function answerOptions(answer: string, subject: Subject) {
  const rotate = (values: string[]) => {
    const unique = Array.from(new Set(values));
    const offset = unique.length > 1 ? answer.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % unique.length : 0;
    return [...unique.slice(offset), ...unique.slice(0, offset)].slice(0, 4);
  };
  if (answer.includes("/")) {
    const [nRaw, dRaw] = answer.split("/");
    const n = Number(nRaw) || 5, d = Number(dRaw) || 8;
    return rotate([answer, `${Math.max(1, n - 1)}/${d}`, `${n + 1}/${d}`, `${n}/${Math.max(2, d + 1)}`]);
  }
  const numeric = Number(String(answer).replace(",", "."));
  if (Number.isFinite(numeric)) return rotate([answer, String(numeric + 1), String(Math.max(0, numeric - 1)), String(numeric + 10)]);
  if (subject === "russian") {
    const normalized = answer.trim().toLowerCase();
    const group = russianGroups.find((items) => items.some((item) => normalize(item) === normalize(normalized)));
    if (group) return rotate([answer, ...group.filter((item) => normalize(item) !== normalize(answer))]);
    if (/^[а-яё]$/i.test(answer)) {
      const vowels = ["а", "о", "у", "ы", "э", "я", "ё", "ю", "и", "е"];
      const consonants = ["б", "в", "г", "д", "ж", "з", "к", "л", "м", "н", "п", "р", "с", "т"];
      const bank = vowels.includes(answer.toLowerCase()) ? vowels : consonants;
      return rotate([answer, ...bank.filter((item) => item !== answer.toLowerCase()).slice(0, 5)]);
    }
    return rotate([answer, "другой вариант", "неверно", "нет ответа"]);
  }
  return rotate([answer, "да", "нет", "не знаю"]);
}

const navItems = [
  { id: "path" as View, label: "Учиться", icon: Compass },
  { id: "progress" as View, label: "Мои знания", icon: Books },
  { id: "achievements" as View, label: "Достижения", icon: Medal },
  { id: "profile" as View, label: "Профиль", icon: UserCircle },
];

export function StudentAppRestored({ assetsReady }: { assetsReady: boolean }) {
  const [view, setView] = useState<View>("start");
  const [authMode, setAuthMode] = useState<"create" | "login">("create");
  const [booting, setBooting] = useState(true);
  const [grade, setGrade] = useState(5);
  const [subject, setSubject] = useState<Subject>("math");
  const [sectionId, setSectionId] = useState("");
  const [skill, setSkill] = useState<Skill>({ id: "", title: "", kind: "" });
  const [task, setTask] = useState<Task>({ q: "", a: "", h: "", e: "" });
  const [selected, setSelected] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [taskStartedAt, setTaskStartedAt] = useState(() => Date.now());
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [progress, setProgress] = useState<Record<string, ProgressRecord>>({});
  const [summary, setSummary] = useState<StudentSummary>(emptySummary);
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [notice, setNotice] = useState("");

  const sections = useMemo(() => curriculum(subject, grade), [grade, subject, view, assetsReady]);
  const section = sections.find((item) => item.id === sectionId) || sections[0];

  useEffect(() => {
    if (sections.length && !sections.some((item) => item.id === sectionId)) setSectionId(sections[0].id);
  }, [sections, sectionId]);

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
        try { legacyToken = JSON.parse(localStorage.getItem("edu5_student_v1") || "{}").token || ""; } catch { /* ignore */ }
        const data = legacyToken ? await eduRequest<SessionBootstrap>("adoptLegacySession", { token: legacyToken }) : await eduRequest<SessionBootstrap>("bootstrap");
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

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [view]);

  const goTask = (nextSkill: Skill) => {
    const current = progress[progressKey(nextSkill.id, subject)];
    setSkill(nextSkill);
    setTask(createTask(subject, nextSkill, difficultyOf(current), current?.attempts || 0));
    setTaskStartedAt(Date.now());
    setSelected("");
    setShowHint(false);
    setView("task");
    if (subject === "math") void eduRequest("setCurrentTopic", { topicId: nextSkill.id }).catch(() => setNotice("Не удалось сохранить текущую тему"));
  };

  const checkAnswer = async () => {
    if (!selected) return;
    const correct = normalize(selected) === normalize(task.a);
    setView(correct ? "correct" : "error");
    const current = progress[progressKey(skill.id, subject)];
    try {
      const result = await eduRequest<{ attempt: AttemptResult; summary: StudentSummary }>("saveAttempt", { subject, topicId: skill.id, difficulty: difficultyOf(current), correct, elapsed: Math.round((Date.now() - taskStartedAt) / 1000) });
      const record: ProgressRecord = { subject, topic_id: skill.id, attempts: result.attempt.attempts, correct: result.attempt.correct, mastery: Number(result.attempt.mastery), streak: result.attempt.streak, best_difficulty: result.attempt.best_difficulty, last_practiced_at: new Date().toISOString() };
      setProgress((previous) => ({ ...previous, [progressKey(skill.id, subject)]: record }));
      setSummary(result.summary);
      setProfile((previous) => previous ? { ...previous, xp: result.attempt.xp } : previous);
    } catch {
      setNotice("Ответ показан, но синхронизация не удалась. Проверь подключение.");
    }
  };

  const nextTask = () => {
    const current = progress[progressKey(skill.id, subject)];
    setTask(createTask(subject, skill, difficultyOf(current), current?.attempts || 0));
    setTaskStartedAt(Date.now());
    setSelected("");
    setShowHint(false);
    setView("task");
  };

  const handleAuth = (data: BootstrapData, created: boolean) => { applyBootstrap(data); setView(created ? "class" : "path"); };
  const chooseGrade = (nextGrade: number) => {
    const validGrade = nextGrade === 4 ? 4 : 5;
    setGrade(validGrade);
    setProfile((previous) => previous ? { ...previous, current_grade: validGrade } : previous);
    setView("subject");
    if (profile) void eduRequest("updateProfile", { nickname: profile.nickname, grade: validGrade }).catch(() => setNotice("Класс изменён на устройстве, но пока не синхронизирован"));
  };
  const chooseSubject = (nextSubject: Subject) => { setSubject(nextSubject); setSectionId(curriculum(nextSubject, grade)[0]?.id || ""); setView("path"); };
  const openCourse = (nextSubject: Subject, nextGrade: number) => { setGrade(nextGrade); setSubject(nextSubject); setSectionId(curriculum(nextSubject, nextGrade)[0]?.id || ""); setView("path"); };
  const logout = async () => { try { await eduRequest("logout"); } finally { setProfile(null); setProgress({}); setSummary(emptySummary); setActivity([]); setView("start"); } };

  if (booting || !assetsReady) return <div className="app-loading" role="status"><CircleNotch size={34} /> Загружаем учебное пространство…</div>;
  if (view === "auth") return <AuthScreen initialMode={authMode} onSuccess={handleAuth} onBack={() => setView("start")} />;
  if (view === "start") return <StartScreen profile={profile} onStart={() => { if (profile) setView("class"); else { setAuthMode("create"); setView("auth"); } }} onProfile={() => { if (profile) setView("profile"); else { setAuthMode("login"); setView("auth"); } }} />;

  return <div className="app-shell">
    <aside className="sidebar" aria-label="Основная навигация">
      <Brand compact />
      <nav>
        <button className="nav-item" onClick={() => setView("start")}><House size={22} weight="bold" /><span>Главная</span></button>
        {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${view === id || (["class", "subject", "section", "task", "correct", "error", "complete"].includes(view) && id === "path") ? "active" : ""}`} onClick={() => setView(id === "path" ? "class" : id)}><Icon size={22} weight="bold" /><span>{label}</span></button>)}
      </nav>
      <div style={{ display: "grid", gap: 4, marginTop: 14 }}>
        <button className="nav-item" onClick={() => openCourse("math", 4)}><MathOperations size={20} /><span>Математика · 4</span></button>
        <button className="nav-item" onClick={() => openCourse("math", 5)}><MathOperations size={20} /><span>Математика · 5</span></button>
        <button className="nav-item" onClick={() => openCourse("russian", 4)}><PencilSimple size={20} /><span>Русский · 4</span></button>
        <button className="nav-item" onClick={() => openCourse("russian", 5)}><PencilSimple size={20} /><span>Русский · 5</span></button>
      </div>
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
        {view === "subject" && <SubjectScreen grade={grade} subject={subject} progress={progress} onSubject={chooseSubject} onBack={() => setView("class")} />}
        {view === "path" && <PathScreen subject={subject} grade={grade} sections={sections} progress={progress} summary={summary} onOpen={(id) => { setSectionId(id); setView("section"); }} onCourse={() => setView("class")} />}
        {view === "section" && section && <SectionScreen subject={subject} grade={grade} section={section} progress={progress} onBack={() => setView("path")} onTask={goTask} />}
        {["task", "correct", "error", "complete"].includes(view) && section && <TaskScreen state={view} subject={subject} grade={grade} section={section} skill={skill} task={task} selected={selected} onSelect={setSelected} onCheck={checkAnswer} onHint={() => setShowHint((v) => !v)} showHint={showHint} onNext={nextTask} onComplete={() => setView("complete")} onPath={() => setView("path")} />}
        {view === "progress" && <ProgressScreen subject={subject} grade={grade} sections={sections} progress={progress} summary={summary} activity={activity} onCourse={openCourse} />}
        {view === "achievements" && <AchievementsScreen subject={subject} sections={sections} progress={progress} summary={summary} />}
        {view === "profile" && profile && <ProfileScreen profile={profile} grade={grade} onProfile={setProfile} onGrade={setGrade} onNotice={setNotice} onLogout={logout} onBack={() => setView("path")} />}
      </div>
    </main>
    <nav className="bottom-nav" aria-label="Мобильная навигация">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id === "path" ? "class" : id)}><Icon size={23} weight="bold" /><span>{label}</span></button>)}</nav>
  </div>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <button className={`brand ${compact ? "compact" : ""}`}><Image src="/smart-student-logo-v3.png" alt="Сова — символ Умного ученика" width={compact ? 52 : 88} height={compact ? 52 : 88} priority /><span>Умный<br />ученик</span></button>;
}

function StartScreen({ profile, onStart, onProfile }: { profile: StudentProfile | null; onStart: () => void; onProfile: () => void }) {
  return <main className="start-screen"><header className="start-header"><Brand compact /><button className="button ghost" onClick={onProfile}>{profile ? `Профиль · ${profile.nickname}` : "Уже занимаюсь"}</button></header><section className="start-hero"><div className="hero-copy"><p className="overline">СТУДИЯ РЕШЕНИЙ</p><h1>Знания становятся <span>видимыми</span></h1><p>Математика и русский язык для 4–5 классов. Все разделы и темы доступны сразу — выбирай то, что нужно изучить или повторить.</p><div className="hero-actions"><button className="button primary" onClick={onStart}>{profile ? "Выбрать курс" : "Начать учиться"} <ArrowRight size={20} weight="bold" /></button>{!profile && <button className="button secondary" onClick={onProfile}>Войти по коду</button>}</div></div><div className="knowledge-shelf"><div className="shelf-title"><Sparkle size={22} weight="fill" /><span>Твоя коллекция знаний</span></div><div className="artifact-row"><Artifact icon={<MathOperations />} title="Математика" tone="blue" /><Artifact icon={<PencilSimple />} title="Русский язык" tone="aqua" /><Artifact icon={<Star />} title="Новые навыки" tone="locked" /></div><div className="shelf-line" /></div></section><section className="start-benefits"><div><strong>4 курса</strong><span>доступны сразу</span></div><div><strong>Все темы открыты</strong><span>без последовательной блокировки</span></div><div><strong>Единый прогресс</strong><span>на разных устройствах</span></div></section></main>;
}

function ClassScreen({ grade, onSelect }: { grade: number; onSelect: (grade: number) => void }) {
  return <PageFrame eyebrow="Выбор курса" title="Выбери класс" description="Оба класса доступны сразу. К ним можно возвращаться в любой момент."><div className="class-grid">{[4, 5].map((g) => <button key={g} className={`class-card ${grade === g ? "selected" : ""}`} onClick={() => onSelect(g)}><span className="class-number">{g}</span><strong>{g} класс</strong><small>{g === 4 ? "Школа России" : "Программа 5 класса"}</small><span className="class-action">Выбрать <ArrowRight size={18} /></span></button>)}</div></PageFrame>;
}

function SubjectScreen({ grade, subject, progress, onSubject, onBack }: { grade: number; subject: Subject; progress: Record<string, ProgressRecord>; onSubject: (s: Subject) => void; onBack: () => void }) {
  const mathValue = subjectMastery("math", grade, progress), russianValue = subjectMastery("russian", grade, progress);
  return <PageFrame back={onBack} eyebrow={`${grade} класс`} title="Выбери предмет" description="Математика и русский язык доступны полностью. Прогресс каждого предмета хранится отдельно."><div className="subject-grid"><button className={`subject-card ${subject === "math" ? "selected" : ""}`} onClick={() => onSubject("math")}><MathOperations size={42} weight="duotone" /><h2>Математика</h2><p>{subjectDescription("math")}</p><ProgressBar value={mathValue} label={`${mathValue}% освоено`} /></button><button className={`subject-card ${subject === "russian" ? "selected" : ""}`} onClick={() => onSubject("russian")}><PencilSimple size={42} weight="duotone" /><h2>Русский язык</h2><p>{subjectDescription("russian")}</p><ProgressBar value={russianValue} label={`${russianValue}% освоено`} /></button></div></PageFrame>;
}

function PathScreen({ subject, grade, sections, progress, summary, onOpen, onCourse }: { subject: Subject; grade: number; sections: Section[]; progress: Record<string, ProgressRecord>; summary: StudentSummary; onOpen: (id: string) => void; onCourse: () => void }) {
  const activeThisWeek = Math.min(5, summary.current_day_streak);
  return <PageFrame eyebrow={`${grade} класс · ${subjectName(subject)}`} title="Все разделы" description="Все разделы открыты сразу. Можно идти по порядку или выбрать любую тему для повторения." action={<button className="button ghost small" onClick={onCourse}>Сменить курс</button>}><div className="path-layout"><div className="path-list">{sections.map((item, index) => { const value = sectionMastery(item, progress, subject); const state = value >= 80 ? "done" : "current"; return <button className={`path-node ${state}`} key={item.id} onClick={() => onOpen(item.id)}><span className="node-mark">{state === "done" ? <Check /> : index + 1}</span><span className="node-copy"><strong>{item.title.replace(/^§?\d+\s*·\s*/, "")}</strong><small>{value ? `${value}% освоено` : "Доступно сразу"}</small></span><ArrowRight size={20} /></button>; })}</div><aside className="path-aside"><h3>На этой неделе</h3><div className="weekly-ring"><strong>{activeThisWeek}</strong><span>дней<br />из 5</span></div><p>{activeThisWeek >= 5 ? "Недельная цель выполнена — отличный ритм." : `До недельной цели осталось ${5 - activeThisWeek}.`}</p></aside></div></PageFrame>;
}

function SectionScreen({ subject, grade, section, progress, onBack, onTask }: { subject: Subject; grade: number; section: Section; progress: Record<string, ProgressRecord>; onBack: () => void; onTask: (skill: Skill) => void }) {
  const sectionValue = sectionMastery(section, progress, subject);
  const started = section.skills.filter((item) => progress[progressKey(item.id, subject)]?.attempts).length;
  return <PageFrame back={onBack} eyebrow={`${grade} класс · ${subjectName(subject)}`} title={section.title.replace(/^§?\d+\s*·\s*/, "")} description={section.desc}><div className="section-progress"><ProgressBar value={sectionValue} label={`Раздел освоен на ${sectionValue}%`} /><span>{started} из {section.skills.length} тем начаты</span></div><div className="topic-list">{section.skills.map((item, index) => { const record = progress[progressKey(item.id, subject)]; const mastery = !record?.attempts ? "new" : record.mastery >= 80 ? "confident" : record.mastery >= 50 ? "learning" : "review"; return <button key={item.id} className="topic-row" onClick={() => onTask(item)}><span className={`topic-status ${mastery}`}>{mastery === "confident" ? <Check /> : mastery === "review" ? <Repeat /> : index + 1}</span><span><strong>{item.title.replace(/^\d+\.\s*/, "")}</strong><small>{mastery === "confident" ? `Уверенно · ${Math.round(record.mastery)}%` : mastery === "learning" ? `Изучаю · ${Math.round(record.mastery)}%` : mastery === "review" ? `Стоит повторить · ${Math.round(record.mastery)}%` : "Доступно · не начато"}</small></span><ArrowRight size={20} /></button>; })}</div></PageFrame>;
}

function TaskScreen({ state, subject, grade, section, skill, task, selected, onSelect, onCheck, onHint, showHint, onNext, onComplete, onPath }: { state: View; subject: Subject; grade: number; section: Section; skill: Skill; task: Task; selected: string; onSelect: (v: string) => void; onCheck: () => void; onHint: () => void; showHint: boolean; onNext: () => void; onComplete: () => void; onPath: () => void }) {
  const options = answerOptions(task.a, subject), isFeedback = state === "correct" || state === "error";
  if (state === "complete") return <Completion subject={subject} skill={skill} onPath={onPath} />;
  return <div className="task-page"><div className="task-breadcrumb"><button onClick={onPath}>{grade} класс · {subjectName(subject)}</button><span>›</span><span>{section.title.replace(/^§?\d+\s*·\s*/, "")}</span></div><div className="task-columns"><section className="task-card"><p className="task-kicker">Текущая тема</p><h1>{skill.title}</h1><p className="instruction">Выбери правильный ответ.</p><div className="problem"><LearningExpression value={task.q} /></div><div className="answer-grid">{options.map((option) => { const correct = isFeedback && normalize(option) === normalize(task.a); const wrong = state === "error" && option === selected && !correct; return <button key={option} disabled={isFeedback} className={`answer ${selected === option ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "incorrect" : ""}`} onClick={() => onSelect(option)}>{correct && <Check weight="bold" />}{wrong && <X weight="bold" />}{option}</button>; })}</div>{showHint && !isFeedback && <div className="hint"><Lightbulb size={20} weight="fill" /><span>{task.h}</span></div>}<div className="task-actions"><button className="button ghost" onClick={onHint} disabled={isFeedback}><Lightbulb size={20} /> Подсказка</button><button className="button primary" onClick={onCheck} disabled={!selected || isFeedback}>Проверить <ArrowRight size={19} /></button></div>{state === "correct" && <Feedback type="correct" title="Правильно!" text={task.e} action="Следующее задание" onAction={onNext} secondary="Завершить серию" onSecondary={onComplete} />}{state === "error" && <Feedback type="error" title="Почти получилось" text={`Правильный ответ: ${task.a}. ${task.e}`} action="Попробовать похожее" onAction={onNext} />}</section><KnowledgeShelf subject={subject} /></div></div>;
}

function Feedback({ type, title, text, action, onAction, secondary, onSecondary }: { type: "correct" | "error"; title: string; text: string; action: string; onAction: () => void; secondary?: string; onSecondary?: () => void }) {
  return <div className={`feedback ${type}`} role="status"><div className="feedback-icon">{type === "correct" ? <Check weight="bold" /> : <X weight="bold" />}</div><div><h3>{title}</h3><p>{text}</p><div className="feedback-actions"><button className="button primary small" onClick={onAction}>{action} <ArrowRight size={17} /></button>{secondary && <button className="button ghost small" onClick={onSecondary}>{secondary}</button>}</div></div></div>;
}

function Completion({ subject, skill, onPath }: { subject: Subject; skill: Skill; onPath: () => void }) {
  return <div className="completion"><div className="completion-mark"><Trophy size={58} weight="duotone" /></div><p className="overline">СЕРИЯ ЗАВЕРШЕНА</p><h1>Тренировка завершена</h1><p>Ты закрепил тему «{skill.title}».</p><div className="earned-artifact"><Artifact icon={subject === "math" ? <MathOperations /> : <PencilSimple />} title={subjectName(subject)} tone="blue" /><div><small>УЧЕБНЫЙ АРТЕФАКТ</small><strong>{skill.title}</strong><span>Продолжай практиковаться — сложность будет расти автоматически.</span></div></div><button className="button primary" onClick={onPath}>Вернуться к разделам <ArrowRight size={20} /></button></div>;
}

function ProgressScreen({ subject, grade, sections, progress, summary, activity, onCourse }: { subject: Subject; grade: number; sections: Section[]; progress: Record<string, ProgressRecord>; summary: StudentSummary; activity: ActivityDay[]; onCourse: (subject: Subject, grade: number) => void }) {
  return <PageFrame eyebrow="Мои знания" title="Карта знаний" description="Переключайся между любыми четырьмя курсами — все они доступны сразу." action={<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{([4,5] as const).flatMap((g) => (["math","russian"] as Subject[]).map((s) => <button key={`${s}${g}`} className="button ghost small" onClick={() => onCourse(s,g)}>{subjectIcon(s)} {g}</button>))}</div>}><div className="progress-summary"><div><strong>{summary.total_attempts}</strong><span>заданий решено</span></div><div><strong>{Math.round(summary.accuracy)}%</strong><span>общая точность</span></div><div><strong>{summary.current_day_streak} {summary.current_day_streak === 1 ? "день" : "дней"}</strong><span>текущая серия</span></div></div><section className="knowledge-map"><div className="section-heading"><div><h2>{subjectName(subject)} · {grade} класс</h2><p>Освоение по разделам</p></div><MasteryLegend /></div><div className="mastery-list">{sections.map((item) => { const value = sectionMastery(item, progress, subject); const state = value >= 80 ? "confident" : value >= 50 ? "learning" : value > 0 ? "review" : ""; return <MasteryRow key={item.id} label={item.title.replace(/^§?\d+\s*·\s*/, "")} value={value} state={state} />; })}</div></section><section className="activity-panel"><div><h2>Последние 7 дней</h2><p>Столбец показывает долю верных ответов.</p></div><div className="activity-bars">{activity.map((item) => <div key={item.day} title={`${item.attempts} заданий · ${Math.round(item.accuracy)}%`}><span className={item.attempts ? "" : "empty"} style={{ height: `${Math.max(item.attempts ? 8 : 3, Number(item.accuracy))}%` }} /><small>{new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(new Date(`${item.day}T12:00:00`)).replace(".", "")}</small></div>)}</div></section></PageFrame>;
}

function AchievementsScreen({ subject, sections, progress, summary }: { subject: Subject; sections: Section[]; progress: Record<string, ProgressRecord>; summary: StudentSummary }) {
  const records = Object.values(progress).filter((item) => item.subject === subject), longest = records.reduce((max, item) => Math.max(max, item.streak), 0), bestSection = sections.reduce((max, item) => Math.max(max, sectionMastery(item, progress, subject)), 0);
  const items = [{ icon: <Fire />, title: "Неделя в ритме", text: "Занимайся 7 дней подряд", value: summary.current_day_streak, target: 7, unit: "дней" }, { icon: <Target />, title: "Точный ответ", text: "10 верных ответов подряд", value: longest, target: 10, unit: "ответов" }, { icon: <Brain />, title: "Раздел освоен", text: "Достигни 80% в одном разделе", value: bestSection, target: 80, unit: "%" }, { icon: <Star />, title: "Сотня решений", text: "Реши 100 заданий", value: summary.total_attempts, target: 100, unit: "заданий" }, { icon: <BookOpen />, title: "Исследователь", text: "Начни 5 разных тем", value: records.length, target: 5, unit: "тем" }, { icon: <Trophy />, title: "Уверенный старт", text: "Дай 20 правильных ответов", value: summary.total_correct, target: 20, unit: "ответов" }];
  return <PageFrame eyebrow={`Достижения · ${subjectName(subject)}`} title="Твои достижения" description="Они отмечают привычки и реальные учебные умения."><div className="achievement-grid">{items.map((item) => { const percent = Math.min(100, Math.round(item.value / item.target * 100)); return <article className={`achievement ${percent >= 100 ? "earned" : ""}`} key={item.title}><div className="achievement-icon">{item.icon}</div><h2>{item.title}</h2><p>{item.text}</p><ProgressBar value={percent} label={`${Math.min(item.value, item.target)} из ${item.target} ${item.unit}`} /></article>; })}</div></PageFrame>;
}

function ProfileScreen({ profile, grade, onProfile, onGrade, onNotice, onLogout, onBack }: { profile: StudentProfile; grade: number; onProfile: (profile: StudentProfile) => void; onGrade: (grade: number) => void; onNotice: (message: string) => void; onLogout: () => Promise<void>; onBack: () => void }) {
  const [nickname, setNickname] = useState(profile.nickname), [oldPin, setOldPin] = useState(""), [newPin, setNewPin] = useState(""), [busy, setBusy] = useState(false);
  const saveProfile = async () => { setBusy(true); try { const updated = await eduRequest<{ nickname: string; current_grade: 4 | 5 }>("updateProfile", { nickname, grade }); onProfile({ ...profile, ...updated }); onGrade(updated.current_grade); onNotice("Профиль сохранён"); } catch (error) { onNotice(error instanceof Error ? error.message : "Не удалось сохранить профиль"); } finally { setBusy(false); } };
  const changePin = async () => { setBusy(true); try { await eduRequest("changePin", { oldPin, newPin }); setOldPin(""); setNewPin(""); onNotice("PIN изменён"); } catch (error) { onNotice(error instanceof Error ? error.message : "Не удалось изменить PIN"); } finally { setBusy(false); } };
  const copy = async (value: string, label: string) => { try { await navigator.clipboard.writeText(value); onNotice(`${label} скопирован`); } catch { onNotice(`${label}: ${value}`); } };
  return <PageFrame back={onBack} eyebrow="Профиль" title="Твоё учебное пространство" description="Прогресс математики и русского языка доступен на разных устройствах."><div className="profile-layout"><section className="profile-card"><div className="profile-avatar">{nickname.slice(0, 1).toUpperCase()}</div><label>Имя ученика<input value={nickname} maxLength={40} onChange={(e) => setNickname(e.target.value)} /></label><label>Текущий класс<select value={grade} onChange={(e) => onGrade(Number(e.target.value))}><option value={4}>4 класс</option><option value={5}>5 класс</option></select></label><div className="code-block"><span>Код ученика</span><strong>{profile.student_code}</strong><button className="auth-link inline" onClick={() => copy(profile.student_code, "Код ученика")}>Скопировать</button></div><button className="button secondary" disabled={busy || !nickname.trim()} onClick={saveProfile}>Сохранить изменения</button></section><section className="profile-card"><h2>Безопасность и восстановление</h2><div className="code-block"><span>Родительский код</span><strong>{profile.parent_code}</strong><button className="auth-link inline" onClick={() => copy(profile.parent_code, "Родительский код")}>Скопировать</button></div><label>Текущий PIN<input type="password" inputMode="numeric" maxLength={6} value={oldPin} onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))} /></label><label>Новый PIN<input type="password" inputMode="numeric" maxLength={6} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} placeholder="4–6 цифр" /></label><button className="button primary" disabled={busy || oldPin.length < 4 || newPin.length < 4} onClick={changePin}>Изменить PIN</button><button className="button danger" disabled={busy} onClick={onLogout}>Выйти на этом устройстве</button><p className="security-note">Сохрани оба кода отдельно. Родительский код позволяет восстановить PIN.</p></section></div></PageFrame>;
}

function PageFrame({ eyebrow, title, description, back, action, children }: { eyebrow: string; title: string; description: string; back?: () => void; action?: React.ReactNode; children: React.ReactNode }) {
  return <div className="page-frame"><div className="page-heading">{back && <button className="back-button" onClick={back} aria-label="Назад"><ArrowLeft size={22} /></button>}<div><p className="overline">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{action}</div>{children}</div>;
}
function ProgressBar({ value, label }: { value: number; label: string }) { return <div className="progress-control"><div className="progress-track"><span style={{ width: `${value}%` }} /></div><small>{label}</small></div>; }
function LearningExpression({ value }: { value: string }) { const pieces = value.split(/(\d+\s*\/\s*\d+)/g); return <span className="math-expression" aria-label={value}>{pieces.map((piece, index) => { const match = piece.match(/^(\d+)\s*\/\s*(\d+)$/); if (!match) return <span aria-hidden="true" key={`${piece}-${index}`}>{piece}</span>; return <span className="math-fraction" aria-hidden="true" key={`${piece}-${index}`}><span>{match[1]}</span><span>{match[2]}</span></span>; })}</span>; }
function MasteryLegend() { return <div className="mastery-legend"><span className="confident"><Check /> Уверенно</span><span className="learning"><CircleNotch /> Изучаю</span><span className="review"><Repeat /> Повторить</span></div>; }
function MasteryRow({ label, value, state }: { label: string; value: number; state: string }) { return <div className="mastery-row"><strong>{label}</strong><div className="mastery-cells">{[20, 40, 60, 80, 100].map((threshold) => <span key={threshold} className={value >= threshold ? state : ""} />)}</div><small>{value}%</small></div>; }
function Artifact({ icon, title, tone }: { icon: React.ReactNode; title: string; tone: string }) { return <div className={`artifact ${tone}`}><div>{icon}</div><span>{title}</span></div>; }
function KnowledgeShelf({ subject }: { subject: Subject }) { return <aside className="task-shelf"><div><p className="overline">ТВОЯ КОЛЛЕКЦИЯ</p><h2>{subjectName(subject)}</h2></div><div className="artifact-row vertical">{subject === "math" ? <><Artifact icon={<MathOperations />} title="Вычисления" tone="blue" /><Artifact icon={<TrendUp />} title="Задачи" tone="aqua" /></> : <><Artifact icon={<PencilSimple />} title="Орфография" tone="blue" /><Artifact icon={<BookOpen />} title="Грамматика" tone="aqua" /></>}<Artifact icon={<Sparkle />} title="Новый навык" tone="locked" /></div></aside>; }
