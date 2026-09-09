import { NextRequest, NextResponse } from "next/server";
import { supabaseRpc } from "@/lib/supabase-server";
import type { ActivityDay, AttemptResult, BootstrapData, ProgressRecord, StudentProfile, StudentSummary } from "@/lib/edu-types";

const COOKIE = "smart_student_session";
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 365 };
const pinPattern = /^\d{4,6}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Body = { action?: string; [key: string]: unknown };

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function pin(value: unknown) {
  const result = text(value, 6);
  if (!pinPattern.test(result)) throw new Error("PIN должен содержать 4–6 цифр");
  return result;
}

async function bootstrap(token: string): Promise<BootstrapData> {
  const [profiles, progress, summaries, activity] = await Promise.all([
    supabaseRpc<StudentProfile[]>("edu_student_profile", { p_student_token: token }),
    supabaseRpc<ProgressRecord[]>("edu_student_progress", { p_student_token: token }),
    supabaseRpc<StudentSummary[]>("edu_student_summary", { p_student_token: token }),
    supabaseRpc<ActivityDay[]>("edu_recent_activity", { p_student_token: token }),
  ]);
  if (!profiles[0]) throw new Error("Профиль не найден");
  return { profile: profiles[0], progress, summary: summaries[0], activity };
}

function ok(data: unknown, token?: string) {
  const response = NextResponse.json({ ok: true, data });
  if (token) response.cookies.set(COOKIE, token, cookieOptions);
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && new URL(origin).host !== host) {
      return NextResponse.json({ ok: false, error: "Запрос отклонён" }, { status: 403 });
    }
    const body = await request.json() as Body;
    const action = text(body.action, 40);
    const sessionToken = request.cookies.get(COOKIE)?.value || "";

    if (action === "bootstrap") {
      if (!sessionToken) return ok(null);
      try { return ok(await bootstrap(sessionToken)); }
      catch { const response = ok(null); response.cookies.delete(COOKIE); return response; }
    }

    if (action === "adoptLegacySession") {
      const token = text(body.token, 36);
      if (!uuidPattern.test(token)) throw new Error("Некорректная сессия");
      return ok(await bootstrap(token), token);
    }

    if (action === "create") {
      const nickname = text(body.nickname, 40);
      if (!nickname) throw new Error("Введите имя ученика");
      const created = await supabaseRpc<Array<{ student_token: string }>>("edu_create_student_v2", { p_nickname: nickname, p_pin: pin(body.pin) });
      if (!created[0]) throw new Error("Не удалось создать профиль");
      return ok(await bootstrap(created[0].student_token), created[0].student_token);
    }

    if (action === "login") {
      const code = text(body.studentCode, 20).toUpperCase();
      const logged = await supabaseRpc<Array<{ student_token: string }>>("edu_login_student", { p_student_code: code, p_pin: pin(body.pin) });
      if (!logged[0]) throw new Error("Неверный код ученика или PIN");
      return ok(await bootstrap(logged[0].student_token), logged[0].student_token);
    }

    if (action === "recover") {
      const parentCode = text(body.parentCode, 20).toUpperCase();
      const result = await supabaseRpc<Array<{ student_code: string; nickname: string }>>("edu_reset_student_pin_by_parent", { p_parent_code: parentCode, p_new_pin: pin(body.pin) });
      return ok(result[0]);
    }

    if (action === "logout") {
      const response = ok(null);
      response.cookies.delete(COOKIE);
      return response;
    }

    if (!sessionToken) return NextResponse.json({ ok: false, error: "Требуется вход" }, { status: 401 });

    if (action === "saveAttempt") {
      const subject = body.subject === "russian" ? "russian" : "math";
      const topicId = text(body.topicId, 120);
      const difficulty = Math.max(0, Math.min(5, Number(body.difficulty) || 0));
      const elapsed = Math.max(0, Math.min(3600, Number(body.elapsed) || 0));
      if (!topicId) throw new Error("Некорректная тема");
      const result = await supabaseRpc<AttemptResult[]>("edu_save_attempt", { p_student_token: sessionToken, p_subject: subject, p_topic_id: topicId, p_difficulty: difficulty, p_is_correct: Boolean(body.correct), p_elapsed_seconds: elapsed });
      return ok({ attempt: result[0], summary: (await supabaseRpc<StudentSummary[]>("edu_student_summary", { p_student_token: sessionToken }))[0] });
    }

    if (action === "setCurrentTopic") {
      const topicId = text(body.topicId, 120);
      const changed = await supabaseRpc<boolean>("edu_set_current_topic", { p_student_token: sessionToken, p_subject: "math", p_topic_id: topicId });
      return ok(changed);
    }

    if (action === "updateProfile") {
      const nickname = text(body.nickname, 40);
      const grade = Number(body.grade) === 4 ? 4 : 5;
      const updated = await supabaseRpc<Array<{ nickname: string; current_grade: 4 | 5 }>>("edu_update_student_profile", { p_student_token: sessionToken, p_nickname: nickname, p_current_grade: grade });
      return ok(updated[0]);
    }

    if (action === "changePin") {
      const changed = await supabaseRpc<boolean>("edu_change_student_pin", { p_student_token: sessionToken, p_old_pin: pin(body.oldPin), p_new_pin: pin(body.newPin) });
      if (!changed) throw new Error("Текущий PIN указан неверно");
      return ok(true);
    }

    if (action === "refresh") return ok(await bootstrap(sessionToken));
    return NextResponse.json({ ok: false, error: "Неизвестная операция" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось выполнить операцию";
    const safe = message.startsWith("Supabase RPC") ? "Сервис временно недоступен" : message;
    return NextResponse.json({ ok: false, error: safe }, { status: 400 });
  }
}
