"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Key, LockKey, ShieldCheck, UserCircle } from "@phosphor-icons/react";
import { FormEvent, useState } from "react";
import type { BootstrapData } from "@/lib/edu-types";
import { eduRequest } from "@/lib/edu-client";

type Mode = "create" | "login" | "recover";

export function AuthScreen({ initialMode, onSuccess, onBack }: { initialMode: Mode; onSuccess: (data: BootstrapData, created: boolean) => void; onBack: () => void }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [nickname, setNickname] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [parentCode, setParentCode] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "create") {
        const data = await eduRequest<BootstrapData>("create", { nickname, pin });
        onSuccess(data, true);
      } else if (mode === "login") {
        const data = await eduRequest<BootstrapData>("login", { studentCode, pin });
        onSuccess(data, false);
      } else {
        const result = await eduRequest<{ student_code: string }>("recover", { parentCode, pin });
        setStudentCode(result.student_code);
        setPin("");
        setMode("login");
        setMessage(`PIN изменён. Код ученика: ${result.student_code}`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось выполнить операцию");
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-page">
    <button className="back-button auth-back" onClick={onBack} aria-label="Вернуться на старт"><ArrowLeft size={22} /></button>
    <section className="auth-panel">
      <div className="auth-brand"><Image src="/smart-student-logo-v3.png" alt="" width={64} height={64} priority /><div><p className="overline">СТУДИЯ РЕШЕНИЙ</p><strong>Умный ученик</strong></div></div>
      <div className="auth-tabs" role="tablist" aria-label="Способ входа">
        <button role="tab" aria-selected={mode === "create"} className={mode === "create" ? "active" : ""} onClick={() => { setMode("create"); setMessage(""); }}>Новый профиль</button>
        <button role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>Уже занимался</button>
      </div>
      <form onSubmit={submit}>
        {mode === "create" && <><UserCircle size={34} weight="duotone" /><h1>Создай учебное пространство</h1><p>Имя и PIN помогут открыть тот же прогресс на другом устройстве.</p><label>Имя ученика<input required maxLength={40} autoComplete="name" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Например, Алексей" /></label><label>Придумай PIN<input required type="password" inputMode="numeric" pattern="[0-9]{4,6}" maxLength={6} autoComplete="new-password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="4–6 цифр" /></label></>}
        {mode === "login" && <><Key size={34} weight="duotone" /><h1>Продолжи с того же места</h1><p>Введи код ученика и PIN — знания синхронизируются автоматически.</p><label>Код ученика<input required autoCapitalize="characters" autoComplete="username" value={studentCode} onChange={(e) => setStudentCode(e.target.value.toUpperCase())} placeholder="STU-12AB34CD" /></label><label>PIN<input required type="password" inputMode="numeric" maxLength={6} autoComplete="current-password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="4–6 цифр" /></label></>}
        {mode === "recover" && <><LockKey size={34} weight="duotone" /><h1>Задай новый PIN</h1><p>Для восстановления нужен родительский код, выданный при создании профиля.</p><label>Родительский код<input required autoCapitalize="characters" value={parentCode} onChange={(e) => setParentCode(e.target.value.toUpperCase())} placeholder="Родительский код" /></label><label>Новый PIN<input required type="password" inputMode="numeric" pattern="[0-9]{4,6}" maxLength={6} autoComplete="new-password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="4–6 цифр" /></label></>}
        {message && <div className="auth-message" role="status">{message}</div>}
        <button className="button primary auth-submit" disabled={busy}>{busy ? "Подключаем…" : mode === "create" ? "Создать профиль" : mode === "login" ? "Войти" : "Изменить PIN"}<ArrowRight size={19} /></button>
      </form>
      {mode === "login" && <button className="auth-link" onClick={() => { setMode("recover"); setMessage(""); }}>Забыл PIN</button>}
      {mode === "recover" && <button className="auth-link" onClick={() => { setMode("login"); setMessage(""); }}>Вернуться ко входу</button>}
      <div className="auth-security"><ShieldCheck size={22} weight="duotone" /><span>PIN передаётся по защищённому соединению и хранится в виде криптографического хеша.</span></div>
    </section>
  </main>;
}
