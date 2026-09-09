// Auth copy aligned with the subject -> grade navigation.
(() => {
  const baseAuth=auth;
  auth=function(){
    baseAuth();
    const root=document.getElementById('auth');
    const h=root?.querySelector('h1');
    if(h)h.textContent='Умный ученик · 4 и 5 класс';
    const p=root?.querySelector('p.small');
    if(p)p.textContent='Математика и русский язык для 4 и 5 класса. Прогресс по каждому предмету и классу хранится в Supabase и доступен на любом устройстве после входа по коду ученика и PIN.';
  };
  if(!loc.token)auth();
})();
