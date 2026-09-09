// Small copy override: the current release contains only mathematics for grades 4 and 5.
(() => {
  const baseAuth=auth;
  auth=function(){
    baseAuth();
    const root=document.getElementById('auth');
    const h=root?.querySelector('h1');
    if(h)h.textContent='Математика · 4 и 5 класс';
    const p=root?.querySelector('p.small');
    if(p)p.textContent='Выберите или создайте профиль ученика. Прогресс по 4 и 5 классу хранится в Supabase и доступен на любом устройстве после входа по коду ученика и PIN.';
  };
  if(!loc.token)auth();
})();
