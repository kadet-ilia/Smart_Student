// Navigation v4: subject -> grade hierarchy and unified section titles.
(() => {
  // Keep stable internal IDs for existing Supabase progress, change only visible titles.
  if (window.EDU_MATH?.byGrade?.[4]) {
    EDU_MATH.byGrade[4].forEach((sec, index) => {
      const clean = String(sec.title).replace(/^S\d+\s*·\s*/i, '').replace(/^§\d+\s*·\s*/i, '');
      sec.title = `§${index + 1} · ${clean}`;
    });
  }

  function injectNavV4() {
    if (document.getElementById('nav-v4-inline')) return;
    const st = document.createElement('style');
    st.id = 'nav-v4-inline';
    st.textContent = `
      .nav-home{margin-bottom:12px}
      .subject-group{margin:10px 0 14px;padding-top:8px;border-top:1px solid #edf1f7}
      .subject-head{display:flex;align-items:center;gap:9px;padding:7px 11px 5px;color:#26375f;font-size:13px;font-weight:900}
      .subject-head .subject-icon{width:23px;text-align:center;font-size:17px}
      .subject-classes{display:grid;gap:3px;padding-left:19px}
      .subject-classes .nav{padding:9px 11px;font-size:13px}
      .subject-classes .nav span:first-child{width:22px;text-align:center;font-weight:900}
      .subject-group.active>.subject-head{color:#1769ff}
      .subject-group.russian .subject-head{color:#6540bf}
      .subject-group.russian.active>.subject-head{color:#6d40df}
      .subject-classes .nav.pending{opacity:.68}
      .nav-separator{height:1px;background:#edf1f7;margin:12px 0}
      .subject-landing{display:grid;grid-template-columns:1fr 1fr;gap:16px}
      .subject-card-v4{padding:24px;min-height:235px;position:relative;overflow:hidden}
      .subject-card-v4.math{background:linear-gradient(145deg,#e8f9ef,#e7f5ff)}
      .subject-card-v4.russian{background:linear-gradient(145deg,#f6edff,#efe9ff)}
      .subject-card-v4 h2{font-size:30px;margin:0 0 8px}
      .subject-card-v4 p{color:#526080;line-height:1.55}
      .subject-symbol{position:absolute;right:18px;bottom:-23px;font-size:150px;font-weight:950;opacity:.07}
      .class-choice-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px}
      .class-choice{padding:22px;min-height:190px;position:relative;overflow:hidden}
      .class-choice .big-class{position:absolute;right:12px;bottom:-24px;font-size:140px;font-weight:950;opacity:.06}
      .coming{display:inline-block;padding:5px 9px;border-radius:999px;background:#f1edf9;color:#6845a8;font-size:11px;font-weight:850}
      @media(max-width:1000px){
        .subject-classes{padding-left:0}.subject-head span:last-child{display:none}.subject-head{justify-content:center}.subject-head .subject-icon{width:auto}
      }
      @media(max-width:700px){
        .side{overflow-x:auto;justify-content:flex-start;gap:2px}
        .nav-home,.nav-separator{display:none}
        .subject-group{display:flex;margin:0;padding:0;border:0;flex:0 0 auto}
        .subject-head{display:none}
        .subject-classes{display:flex;gap:2px;padding:0}
        .subject-classes .nav{min-width:48px;padding:9px 6px}
        .subject-classes .nav span:last-child{display:none}
        .subject-landing,.class-choice-grid{grid-template-columns:1fr}
      }
    `;
    document.head.appendChild(st);
  }

  const mathProgress = (g) => {
    const arr = EDU_MATH.flat(g);
    if (!arr.length) return 0;
    return Math.round(arr.reduce((sum, sk) => {
      const p = getp('math', sk.id);
      return sum + (Number(p.attempts || 0) ? Number(p.mastery || 0) : 0);
    }, 0) / arr.length);
  };
  const mathAttempts = (g) => EDU_MATH.flat(g).reduce((sum, sk) => sum + Number(getp('math', sk.id).attempts || 0), 0);

  function normalizeActive(on) {
    if (on === 'grade4') return 'math4';
    if (on === 'grade5') return 'math5';
    return on;
  }

  function sidebar(active) {
    const a = normalizeActive(active);
    const mathActive = ['math','math4','math5'].includes(a);
    const rusActive = ['russian','russian4','russian5'].includes(a);
    return `
      <div class=logo><div class=mark>📘</div><span>Умный ученик</span></div>
      <button class="nav nav-home ${a==='home'?'on':''}" onclick="nav('home')"><span>⌂</span><span>Главная</span></button>
      <div class="subject-group ${mathActive?'active':''}">
        <div class=subject-head onclick="nav('math')" style="cursor:pointer"><span class=subject-icon>∑</span><span>Математика</span></div>
        <div class=subject-classes>
          <button class="nav ${a==='math4'?'on':''}" onclick="nav('math4')"><span>4</span><span>4 класс</span></button>
          <button class="nav ${a==='math5'?'on':''}" onclick="nav('math5')"><span>5</span><span>5 класс</span></button>
        </div>
      </div>
      <div class="subject-group russian ${rusActive?'active':''}">
        <div class=subject-head onclick="nav('russian')" style="cursor:pointer"><span class=subject-icon>Я</span><span>Русский язык</span></div>
        <div class=subject-classes>
          <button class="nav pending ${a==='russian4'?'on':''}" onclick="nav('russian4')"><span>4</span><span>4 класс</span></button>
          <button class="nav pending ${a==='russian5'?'on':''}" onclick="nav('russian5')"><span>5</span><span>5 класс</span></button>
        </div>
      </div>
      <div class=nav-separator></div>
      <button class="nav ${a==='progress'?'on':''}" onclick="nav('progress')"><span>▥</span><span>Прогресс</span></button>
      <button class="nav ${a==='parent'?'on':''}" onclick="nav('parent')"><span>👤</span><span>Родителю</span></button>`;
  }

  function pageTitle(on) {
    const a = normalizeActive(on);
    return ({
      home:'Главная', math:'Математика', math4:'Математика · 4 класс', math5:'Математика · 5 класс',
      russian:'Русский язык', russian4:'Русский язык · 4 класс', russian5:'Русский язык · 5 класс',
      progress:'Мой прогресс', parent:'Для родителя'
    })[a] || 'Умный ученик';
  }

  shell = function(body, on='home') {
    injectNavV4();
    const a = normalizeActive(on);
    document.getElementById('auth').innerHTML = '';
    document.getElementById('app').innerHTML = `<div class=shell><aside class=side>${sidebar(a)}</aside><main class=main><div class=top><h2 style="margin:0">${pageTitle(a)}</h2><div class=pill>⭐ <b>${prof?.xp||0}</b> · ${prof?.nickname||''}</div></div>${body}</main></div>`;
  };

  function mathGradeCard(g) {
    const p = mathProgress(g), attempts = mathAttempts(g);
    const meta = g === 4 ? `${EDU_MATH.byGrade[4].length} разделов · ${EDU_MATH.flat(4).length} микронавыков` : `${EDU_MATH.byGrade[5].length} разделов · ${EDU_MATH.flat(5).length} тем`;
    return `<section class="card class-choice"><div class=big-class>${g}</div><span class=tag>${g===4?'Школа России · Моро':'Виленкин · Ткачёва'}</span><h2>${g} класс</h2><p class=small>${meta}</p><div class=bar><i style="width:${p}%;background:${g===4?'#13a45a':'#6d40df'}"></i></div><div class=small style="margin:6px 0 14px">Освоение: ${p}% · ${attempts} попыток</div><button class="btn ${g===4?'green':'purple'}" onclick="gradeHome(${g})">Открыть курс →</button></section>`;
  }

  window.subjectHome = function(subject) {
    if (subject === 'math') {
      shell(`<div class=course-head-v3><div><div class=breadcrumb>Математика</div><h1 style="margin:0">Выбери класс</h1><p class=small>Программы 4 и 5 класса разделены. Прогресс и адаптивная сложность ведутся отдельно.</p></div></div><div class=class-choice-grid>${mathGradeCard(4)}${mathGradeCard(5)}</div>`, 'math');
      return;
    }
    shell(`<div class=course-head-v3><div><div class=breadcrumb>Русский язык</div><h1 style="margin:0">Выбери класс</h1><p class=small>Структура предмета уже заложена в навигацию. Наполнение курсов русского языка будет добавлено следующим этапом.</p></div></div><div class=class-choice-grid>${russianGradeCard(4)}${russianGradeCard(5)}</div>`, 'russian');
  };

  function russianGradeCard(g) {
    return `<section class="card class-choice"><div class=big-class>${g}</div><span class=coming>В разработке</span><h2>${g} класс</h2><p class=small>Русский язык · отдельная программа ${g} класса.</p><button class="btn ghost" onclick="showRussianGrade(${g})">Открыть →</button></section>`;
  }

  window.showRussianGrade = function(g) {
    shell(`<section class="card lesson"><span class=coming>В разработке</span><h1>Русский язык · ${g} класс</h1><p class=small>Раздел присутствует в постоянной структуре приложения, но учебное наполнение пока не включено. На текущем этапе полностью реализованы курсы математики 4 и 5 классов.</p><button class="btn ghost" onclick="subjectHome('russian')">← К выбору класса</button></section>`, `russian${g}`);
  };

  nav = function(v) {
    if (v === 'home') return home();
    if (v === 'math') return subjectHome('math');
    if (v === 'math4' || v === 'grade4') return gradeHome(4);
    if (v === 'math5' || v === 'grade5') return gradeHome(5);
    if (v === 'russian') return subjectHome('russian');
    if (v === 'russian4') return showRussianGrade(4);
    if (v === 'russian5') return showRussianGrade(5);
    if (v === 'progress') return stats();
    if (v === 'parent') return parentInfo();
  };

  home = function() {
    injectNavV4();
    const current = [...EDU_MATH.flat(4), ...EDU_MATH.flat(5)].find(x => x.id === prof?.current_math_topic);
    const cont = current ? `<div class=quick-continue><button class="btn blue" onclick="openMathSkill(${current.grade},'${current.id}')">Продолжить математику: ${current.title} →</button></div>` : '';
    shell(`<section class=welcome><h1>Выбери предмет</h1><p>Учебное пособие организовано по предметам, а внутри каждого предмета — по классам. Сейчас полностью наполнена математика 4 и 5 классов.</p>${cont}</section><div class=subject-landing style="margin-top:16px"><section class="card subject-card-v4 math"><div class=subject-symbol>∑</div><span class=tag>4 и 5 классы</span><h2>Математика</h2><p>Полные раздельные маршруты для 4 и 5 класса с адаптивной сложностью и сохранением прогресса.</p><button class="btn green" onclick="subjectHome('math')">Выбрать класс →</button></section><section class="card subject-card-v4 russian"><div class=subject-symbol>Я</div><span class=coming>Следующий этап</span><h2>Русский язык</h2><p>В навигации уже выделены 4 и 5 классы. Учебное наполнение будет подключено отдельно.</p><button class="btn purple" onclick="subjectHome('russian')">Выбрать класс →</button></section></div>`, 'home');
  };

  // Replace the previous grade landing copy so grade 4 uses the same § convention as grade 5.
  const originalGradeHome = gradeHome;
  gradeHome = function(g) {
    originalGradeHome(g);
    const main = document.querySelector('main.main');
    if (g === 4 && main) {
      const intro = [...main.querySelectorAll('p.small')].find(x => x.textContent.includes('13 разделов'));
      if (intro) intro.textContent = '13 разделов §1–§13. Внутри каждого раздела — отдельные микронавыки.';
    }
  };

  injectNavV4();
})();
