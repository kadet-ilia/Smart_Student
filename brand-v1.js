// Brand v1 — applies the project logo consistently to legacy and current UI.
(() => {
  const LOGO = '/smart-student-logo.png';
  let scheduled = false;

  function logoImage(alt = '') {
    const img = document.createElement('img');
    img.src = LOGO;
    img.alt = alt;
    img.className = 'brand-logo-img';
    img.decoding = 'async';
    img.draggable = false;
    return img;
  }

  function applyBrand() {
    document.querySelectorAll('.logo').forEach(lockup => {
      lockup.classList.add('brand-logo-lockup');
      const mark = lockup.querySelector('.mark');
      if (mark && !mark.querySelector('.brand-logo-img')) {
        mark.textContent = '';
        mark.appendChild(logoImage(''));
      }
    });

    const loginLogo = document.querySelector('.login > .logo');
    if (loginLogo && !loginLogo.classList.contains('brand-login')) {
      loginLogo.classList.add('brand-login');
      const line = document.createElement('div');
      line.className = 'brand-tech-line';
      loginLogo.appendChild(line);
    }

    const sideLogo = document.querySelector('.side > .logo');
    if (sideLogo && !sideLogo.dataset.brandLinked) {
      sideLogo.dataset.brandLinked = '1';
      sideLogo.title = 'Умный ученик — на главную';
      sideLogo.setAttribute('role', 'button');
      sideLogo.setAttribute('tabindex', '0');
      const goHome = () => { if (typeof window.nav === 'function') window.nav('home'); };
      sideLogo.addEventListener('click', goHome);
      sideLogo.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goHome(); }
      });
    }

    document.querySelectorAll('.welcome').forEach(welcome => {
      if (welcome.querySelector('.brand-hero-logo')) return;
      const holder = document.createElement('div');
      holder.className = 'brand-hero-logo';
      holder.setAttribute('aria-hidden', 'true');
      holder.appendChild(logoImage(''));
      welcome.appendChild(holder);
    });
  }

  function scheduleBrand() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyBrand();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleBrand, { once: true });
  } else {
    scheduleBrand();
  }

  new MutationObserver(scheduleBrand).observe(document.documentElement, { childList: true, subtree: true });
})();
