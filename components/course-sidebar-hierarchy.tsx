"use client";

import { MathOperations, PencilSimple } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Subject = "math" | "russian";
type Course = { subject: Subject; grade: 4 | 5 };

const SUBJECTS = [
  { id: "math" as const, label: "Математика", icon: MathOperations },
  { id: "russian" as const, label: "Русский язык", icon: PencilSimple },
];

function originalCourseLabel(subject: Subject, grade: 4 | 5) {
  return subject === "math" ? `Математика · ${grade}` : `Русский · ${grade}`;
}

export function CourseSidebarHierarchy() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [active, setActive] = useState<Course>({ subject: "math", grade: 5 });

  useEffect(() => {
    let currentSidebar: HTMLElement | null = null;
    let currentHost: HTMLElement | null = null;
    let hiddenCourses: HTMLElement | null = null;
    let hiddenStudy: HTMLButtonElement | null = null;

    const cleanupCurrent = () => {
      if (hiddenCourses) hiddenCourses.style.removeProperty("display");
      if (hiddenStudy) hiddenStudy.style.removeProperty("display");
      if (currentHost?.parentElement) currentHost.parentElement.removeChild(currentHost);
      hiddenCourses = null;
      hiddenStudy = null;
      currentHost = null;
      currentSidebar = null;
      setHost(null);
    };

    const install = () => {
      const sidebar = document.querySelector<HTMLElement>(".sidebar");
      if (!sidebar) {
        if (currentSidebar) cleanupCurrent();
        return;
      }
      if (sidebar === currentSidebar && currentHost?.isConnected) return;
      if (currentSidebar && sidebar !== currentSidebar) cleanupCurrent();

      const buttons = Array.from(sidebar.querySelectorAll<HTMLButtonElement>("button"));
      const math4 = buttons.find((button) => button.textContent?.replace(/\s+/g, " ").trim() === "Математика · 4");
      const courseContainer = math4?.parentElement as HTMLElement | null;
      if (!courseContainer) return;

      const studyButton = buttons.find((button) => button.textContent?.replace(/\s+/g, " ").trim() === "Учиться") || null;
      courseContainer.style.display = "none";
      if (studyButton) studyButton.style.display = "none";

      const portalHost = document.createElement("div");
      portalHost.dataset.courseHierarchy = "true";
      const quote = sidebar.querySelector("blockquote");
      sidebar.insertBefore(portalHost, quote || null);

      currentSidebar = sidebar;
      currentHost = portalHost;
      hiddenCourses = courseContainer;
      hiddenStudy = studyButton;
      setHost(portalHost);
    };

    install();
    const observer = new MutationObserver(install);
    observer.observe(document.body, { childList: true, subtree: true });

    const sync = window.setInterval(() => {
      const eyebrow = document.querySelector<HTMLElement>(".page-heading .overline")?.textContent || "";
      const grade = eyebrow.includes("4 класс") ? 4 : eyebrow.includes("5 класс") ? 5 : null;
      const subject = eyebrow.includes("Русский язык") ? "russian" : eyebrow.includes("Математика") ? "math" : null;
      if (grade && subject) setActive((previous) => previous.grade === grade && previous.subject === subject ? previous : { grade, subject });
    }, 600);

    return () => {
      observer.disconnect();
      window.clearInterval(sync);
      cleanupCurrent();
    };
  }, []);

  const openCourse = (subject: Subject, grade: 4 | 5) => {
    const sidebar = document.querySelector<HTMLElement>(".sidebar");
    const target = Array.from(sidebar?.querySelectorAll<HTMLButtonElement>("button") || []).find(
      (button) => button.textContent?.replace(/\s+/g, " ").trim() === originalCourseLabel(subject, grade),
    );
    if (target) {
      setActive({ subject, grade });
      target.click();
    }
  };

  if (!host) return null;

  return createPortal(
    <div className="course-hierarchy" aria-label="Предметы и классы">
      <div className="course-hierarchy-title">Учебные курсы</div>
      {SUBJECTS.map(({ id, label, icon: Icon }) => (
        <section className={`course-subject ${active.subject === id ? "active" : ""}`} key={id}>
          <div className="course-subject-title">
            <span className="course-subject-icon"><Icon size={19} weight="bold" /></span>
            <span>{label}</span>
          </div>
          <div className="course-grade-list">
            {([4, 5] as const).map((courseGrade) => (
              <button
                key={courseGrade}
                type="button"
                className={`course-grade ${active.subject === id && active.grade === courseGrade ? "active" : ""}`}
                onClick={() => openCourse(id, courseGrade)}
              >
                <span>{courseGrade} класс</span>
                <span className="course-grade-dot" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      ))}
      <style jsx>{`
        .course-hierarchy{display:grid;gap:10px;margin:14px 0 8px;padding:12px 10px;border-top:1px solid rgba(45,72,108,.10);border-bottom:1px solid rgba(45,72,108,.10)}
        .course-hierarchy-title{padding:0 8px 2px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8491a6}
        .course-subject{display:grid;gap:5px;padding:7px;border-radius:14px;transition:background .18s ease}
        .course-subject.active{background:rgba(70,108,255,.055)}
        .course-subject-title{display:flex;align-items:center;gap:9px;padding:3px 5px;font-size:13px;font-weight:800;color:#26354b}
        .course-subject-icon{display:grid;place-items:center;width:27px;height:27px;border-radius:9px;background:#edf2ff;color:#5068dc}
        .course-subject:nth-of-type(3) .course-subject-icon{background:#f2ebff;color:#7654c7}
        .course-grade-list{display:grid;gap:3px;padding-left:35px}
        .course-grade{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;border:0;background:transparent;padding:7px 10px;border-radius:9px;color:#6c788c;font:inherit;font-size:12px;font-weight:700;text-align:left;cursor:pointer;transition:background .16s ease,color .16s ease,transform .16s ease}
        .course-grade:hover{background:rgba(70,108,255,.07);color:#3e55b8;transform:translateX(1px)}
        .course-grade.active{background:#e9efff;color:#4058c8}
        .course-grade-dot{width:6px;height:6px;border-radius:50%;background:transparent}
        .course-grade.active .course-grade-dot{background:#5b70e8;box-shadow:0 0 0 3px rgba(91,112,232,.14)}
        @media(max-width:900px){.course-hierarchy{padding-left:5px;padding-right:5px}.course-hierarchy-title,.course-subject-title>span:last-child,.course-grade span:first-child{font-size:0}.course-subject-title{justify-content:center}.course-grade-list{padding-left:0}.course-grade{justify-content:center;padding:8px 4px}.course-grade::before{content:attr(data-grade);font-size:12px}.course-grade-dot{display:none}}
      `}</style>
    </div>,
    host,
  );
}
