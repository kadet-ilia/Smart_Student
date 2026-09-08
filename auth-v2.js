// Multi-device student access: student code + PIN.
// Loaded after app.js and overrides only authentication/profile functions.
(() => {
  const originalHome = home;

  const addAuthStyles = () => {
    if (document.getElementById('auth-v2-styles')) return;
    const style = document.createElement('style');
    style.id = 'auth-v2-styles';
    style.textContent = '.card input{padding:12px;border:1px solid #ccd6e6;border-radius:11px;margin:6px 0 10px;max-width:100%}.card input:not(.row input){width:100%}.auth-divider{height:1px;background:#e8edf5;margin:20px 0}.credential-note{margin:10px 0 14px}';
    document.head.appendChild(style);
  };

  setupLegacyPin = async function () {
    addAuthStyles();
    document.getElementById('auth').innerHTML = '';
    document.getElementById('app').innerHTML = `<div class="card login"><div class=logo><div class=mark>📘</div><span>Умный ученик</span></div><h2>Защитим существующий профиль</h2><p class=small>Ваш прогресс уже сохранён в Supabase. Задайте PIN один раз, чтобы входить в этот же профиль с любого устройства.</p><div class="notice credential-note">Код ученика: <b>${prof.student_code}</b></div><input id=legacyPin type=password inputmode=numeric maxlength=6 placeholder="PIN (4–6 цифр)" autocomplete="new-password"><button class="btn blue" style="width:100%" onclick=saveLegacyPin()>Сохранить PIN и продолжить</button><p class=small style="margin-top:14px">Сохраните код ученика и PIN. Они понадобятся для входа на другом планшете, телефоне или компьютере.</p></div>`;
  };

  saveLegacyPin = async function () {
    const pin = document.getElementById('legacyPin').value.trim();
    if (!/^\d{4,6}$/.test(pin)) return alert('PIN должен содержать 4–6 цифр');
    try {
      const a = await rpc('edu_ensure_student_credentials', {p_student_token: loc.token, p_pin: pin});
      if (!a.length) return alert('Не удалось настроить профиль');
      loc.studentCode = a[0].student_code;
      loc.code = a[0].parent_code;
      save();
      prof.has_pin = true;
      prof.student_code = a[0].student_code;
      prof.parent_code = a[0].parent_code;
      originalHome();
      setTimeout(() => alert('Код ученика: ' + a[0].student_code + '\nСохраните код и PIN для входа на других устройствах.'), 100);
    } catch (e) {
      alert('Не удалось сохранить PIN');
    }
  };

  home = function () {
    if (prof && prof.has_pin === false) return setupLegacyPin();
    return originalHome();
  };

  load = async function () {
    try {
      const a = await rpc('edu_student_profile', {p_student_token: loc.token});
      prof = a[0];
      if (!prof) throw new Error('profile not found');
      loc.studentCode = prof.student_code || loc.studentCode;
      loc.code = prof.parent_code || loc.code;
      save();
      const p = await rpc('edu_student_progress', {p_student_token: loc.token});
      prog = {};
      p.forEach(x => prog[key(x.subject, x.topic_id)] = x);
      if (prof.has_pin === false) return setupLegacyPin();
      home();
    } catch (e) {
      loc = {};
      save();
      auth();
    }
  };

  auth = function () {
    addAuthStyles();
    document.getElementById('app').innerHTML = '';
    document.getElementById('auth').innerHTML = `<div class="card login"><div class=logo><div class=mark>📘</div><span>Умный ученик</span></div><h1>Математика и русский язык</h1><p class=small>Прогресс хранится в Supabase и доступен на любом устройстве после входа по коду ученика и PIN.</p><h3>Уже занимался?</h3><input id=scode placeholder="Код ученика, например STU-12AB34CD" autocomplete="username" autocapitalize="characters"><input id=spin type=password inputmode=numeric maxlength=6 placeholder="PIN (4–6 цифр)" autocomplete="current-password"><button class="btn blue" style="width:100%" onclick=loginStudent()>Войти в существующий профиль</button><div class=auth-divider></div><h3>Впервые здесь?</h3><input id=nick placeholder="Имя ученика, например Алексей"><input id=npin type=password inputmode=numeric maxlength=6 placeholder="Придумайте PIN (4–6 цифр)" autocomplete="new-password"><button class="btn green" style="width:100%" onclick=create()>Создать профиль</button><div class=auth-divider></div><div class=notice><b>Забыли PIN?</b> Родитель может задать новый PIN по родительскому коду.</div><input id=rpcd placeholder="Родительский код"><input id=rpin type=password inputmode=numeric maxlength=6 placeholder="Новый PIN (4–6 цифр)"><button class=btn style="width:100%" onclick=resetPin()>Восстановить доступ</button><div class=auth-divider></div><div class=notice>Для просмотра статистики без входа ребёнка используйте родительский код.</div><input id=pc placeholder="Родительский код"><button class=btn style="width:100%" onclick=parent()>Открыть статистику</button></div>`;
  };

  create = async function () {
    const n = document.getElementById('nick').value.trim();
    const pin = document.getElementById('npin').value.trim();
    if (!n) return alert('Введите имя ученика');
    if (!/^\d{4,6}$/.test(pin)) return alert('PIN должен содержать 4–6 цифр');
    try {
      const a = await rpc('edu_create_student_v2', {p_nickname: n, p_pin: pin});
      const x = a[0];
      loc = {token: x.student_token, code: x.parent_code, studentCode: x.student_code};
      save();
      await load();
      setTimeout(() => alert('Профиль создан.\nКод ученика: ' + x.student_code + '\nРодительский код: ' + x.parent_code + '\nСохраните оба кода и PIN.'), 200);
    } catch (e) {
      alert('Не удалось создать профиль');
    }
  };

  loginStudent = async function () {
    const code = document.getElementById('scode').value.trim().toUpperCase();
    const pin = document.getElementById('spin').value.trim();
    if (!code || !pin) return alert('Введите код ученика и PIN');
    try {
      const a = await rpc('edu_login_student', {p_student_code: code, p_pin: pin});
      if (!a.length) return alert('Неверный код ученика или PIN');
      loc = {token: a[0].student_token, studentCode: a[0].student_code};
      save();
      await load();
    } catch (e) {
      alert('Неверный код ученика или PIN');
    }
  };

  resetPin = async function () {
    const code = document.getElementById('rpcd').value.trim();
    const pin = document.getElementById('rpin').value.trim();
    if (!code) return alert('Введите родительский код');
    if (!/^\d{4,6}$/.test(pin)) return alert('PIN должен содержать 4–6 цифр');
    try {
      const a = await rpc('edu_reset_student_pin_by_parent', {p_parent_code: code, p_new_pin: pin});
      if (!a.length) return alert('Родительский код не найден');
      alert('PIN изменён. Код ученика: ' + a[0].student_code);
    } catch (e) {
      alert('Не удалось восстановить доступ');
    }
  };

  parentInfo = function () {
    addAuthStyles();
    shell(`<div class=card style="padding:20px;max-width:680px"><h3>Доступ с разных устройств</h3><p class=small>Для входа ребёнка на другом устройстве нужны код ученика и PIN. Прогресс загрузится из Supabase.</p><div class=small>Код ученика</div><div class=code>${prof.student_code || loc.studentCode || '—'}</div><br><button class=btn onclick=copyStudentCode()>Скопировать код ученика</button><br><br><div class=small>Родительский код</div><div class=code>${prof.parent_code || loc.code || '—'}</div><p class=small>Родительский код используется для статистики и восстановления PIN.</p><h3>Сменить PIN</h3><input id=oldPin type=password inputmode=numeric maxlength=6 placeholder="Текущий PIN"><input id=newPin type=password inputmode=numeric maxlength=6 placeholder="Новый PIN (4–6 цифр)"><button class=btn onclick=changePin()>Изменить PIN</button><br><br><button class=btn onclick=logout()>Выйти из профиля на этом устройстве</button></div>`, 'parent');
  };

  copyStudentCode = async function () {
    const c = prof.student_code || loc.studentCode;
    if (!c) return;
    try {
      await navigator.clipboard.writeText(c);
      alert('Код ученика скопирован: ' + c);
    } catch (e) {
      alert('Код ученика: ' + c);
    }
  };

  changePin = async function () {
    const oldp = document.getElementById('oldPin').value.trim();
    const newp = document.getElementById('newPin').value.trim();
    if (!/^\d{4,6}$/.test(newp)) return alert('Новый PIN должен содержать 4–6 цифр');
    try {
      const result = await rpc('edu_change_student_pin', {p_student_token: loc.token, p_old_pin: oldp, p_new_pin: newp});
      if (result === true) return alert('PIN изменён');
      alert('Текущий PIN указан неверно');
    } catch (e) {
      alert('Не удалось изменить PIN');
    }
  };

  addAuthStyles();
  if (loc.token) load(); else auth();
})();
