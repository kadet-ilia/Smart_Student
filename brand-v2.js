// Brand v2 — cache-safe primary visual identity for «Умный ученик».
(() => {
  const LOGO = '/smart-student-logo-v2.png';
  let scheduled = false;

  function makeLogoImage(alt = '') {
    const img = document.createElement('img');
    img.src = LOGO;
    img.alt = alt;
    img.className = 'brand-logo-img';
    img.decoding = 'async';
    img.loading = 'eager';
    img.draggable = false;
    return img;
  }

  function decorateLockup(lockup) {
    if (!lockup) return;
    lockup.classList.add('brand-logo-lockup');
    const mark = lockup.querySelector('.mark');
    if (!mark) return;
    let img = mark.querySelector('.brand-logo-img');
    if (!img) {
      mark.textContent = '';
      img = makeLogoImage('');
      mark.appendChild(img);
    } else if (!img.src.includes('smart-student-logo-v2.png')) {
      img.src = LOGO;
    }
  }

  function applyBrand() {
    document.querySelectorAll('.logo').forEach(decorateLockup);

    const loginLogo = document.querySelector('.login > .logo');
    if (loginLogo) {
      loginLogo.classList.add('brand-login');
      if (!loginLogo.querySelector('.brand-tech-line')) {
        const line = document.createElement('div');
        line.className = 'brand-tech-line';
        loginLogo.appendChild(line);
      }
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
      let holder = welcome.querySelector('.brand-hero-logo');
      if (!holder) {
        holder = document.createElement('div');
        holder.className = 'brand-hero-logo';
        holder.setAttribute('aria-hidden', 'true');
        welcome.appendChild(holder);
      }
      if (!holder.querySelector('.brand-logo-img')) holder.appendChild(makeLogoImage(''));
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

  const preload = new Image();
  preload.src = LOGO;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleBrand, { once: true });
  } else {
    scheduleBrand();
  }

  new MutationObserver(scheduleBrand).observe(document.documentElement, { childList: true, subtree: true });
})();
