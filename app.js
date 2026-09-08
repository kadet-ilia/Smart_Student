const SB='https://esziorqarbwvoborathp.supabase.co',KEY='sb_publishable_GXKVEQy6B89vQ_Hp00Aegw_zqf2zsbX',LS='edu5_student_v1';
const $=s=>document.querySelector(s),R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a,P=a=>a[R(0,a.length-1)],N=s=>String(s).trim().toLowerCase().replaceAll('ё','е').replace(/\s+/g,' ');
const G=(a,b)=>b?G(b,a%b):Math.abs(a)||1,F=(a,b)=>{let g=G(a,b);return`${a/g}/${b/g}`},fmt=x=>String(Math.round(x*1e6)/1e6).replace('.',',');
const HIST_KEY='edu5_task_history_v1';
let taskHistory=JSON.parse(localStorage.getItem(HIST_KEY)||'{}');
function rememberUnique(group,value,limit=60){
  let a=taskHistory[group]||[];
  a.push(String(value));
  if(a.length>limit)a=a.slice(-limit);
  taskHistory[group]=a;
  localStorage.setItem(HIST_KEY,JSON.stringify(taskHistory));
}
function pickUnique(group,arr,limit=60){
  let used=new Set(taskHistory[group]||[]);
  let candidates=arr.filter(x=>!used.has(String(Array.isArray(x)?x[0]:x)));
  if(!candidates.length){
    // Новый цикл: не выдаём последним словом то же слово, которым закончился предыдущий цикл.
    const last=(taskHistory[group]||[]).slice(-1)[0];
    taskHistory[group]=last?[last]:[];
    candidates=last?arr.filter(x=>String(Array.isArray(x)?x[0]:x)!==last):[...arr];
  }
  let item=P(candidates);
  rememberUnique(group,Array.isArray(item)?item[0]:item,limit);
  return item;
}
function randDigits(digits){
  if(digits<=1)return R(2,9);
  const min=10**(digits-1), max=10**digits-1;
  return R(min,max);
}

function UN(a,b,group='math_numbers',limit=80){
  const used=new Set(taskHistory[group]||[]);
  let n,guard=0;
  do{n=R(a,b);guard++;}while(used.has(String(n))&&guard<250);
  rememberUnique(group,n,limit);
  return n;
}
function multBaseByStage(level, attempts=0){
  // Рост множителя X соответствует постепенному усложнению:
  // средний уровень — однозначный; выше среднего — двузначный;
  // высокий — сначала трёхзначный, затем четырёхзначный после закрепления.
  if(level===1) return R(2,9);
  if(level===2) return R(10,99);
  if(attempts<24) return R(100,999);
  return R(1000,9999);
}
async function rpc(n,a={}){let r=await fetch(`${SB}/rest/v1/rpc/${n}`,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(a)});if(!r.ok)throw Error(await r.text());return r.json()}
const M=[
['m04_num','4 класс','Многозначные числа','Разряды, сравнение и запись чисел','num'],
['m04_units','4 класс','Величины','Длина, масса, время и площадь','units'],
['m04_ops','4 класс','Порядок действий','Скобки и четыре арифметических действия','ops'],
['m04_eq','4→5 класс','Уравнения','Неизвестные компоненты и выражения','eq'],
['m04_word','4→5 класс','Текстовые задачи','Движение, цена и стоимость','word'],
['m05_nat','5 класс','Натуральные числа','Координатный луч и сравнение','nat'],
['m05_round','5 класс','Округление и прикидка','Удобные вычисления','round'],
['m05_div','5 класс','Делимость','Делители, кратные, простые числа','div'],
['m05_frac','5 класс','Обыкновенные дроби','Сокращение и действия','frac'],
['m05_dec','5 класс','Десятичные дроби','Сравнение и вычисления','dec'],
['m05_pct','5 класс','Проценты и доли','Проценты в жизненных задачах','pct'],
['m05_geo','5 класс','Геометрия','Углы, периметр и площадь','geo'],
['m05_vol','5 класс','Объём','Куб и прямоугольный параллелепипед','vol'],
['m05_data','5 класс','Данные и среднее','Таблицы и среднее арифметическое','data'],
['m05_logic','5 класс','Логика и комбинаторика','Перебор и правило произведения','logic'],
['m05_mix','5 класс','Итоговая тренировка','Смешанное повторение','mix']
];
const U=[
['r04_word','4 класс','Состав слова','Корень, приставка, суффикс, окончание','morph'],
['r04_vowel','4 класс','Безударные гласные','Проверяемые гласные в корне','vowel'],
['r04_cons','4 класс','Парные согласные','Звонкие и глухие согласные','cons'],
['r04_parts','4→5 класс','Части речи','Существительное, прилагательное, глагол','parts'],
['r04_sent','4→5 класс','Главные члены предложения','Подлежащее и сказуемое','sent'],
['r05_speech','5 класс','Язык и речь','Диалог, монолог, речевая ситуация','speech'],
['r05_text','5 класс','Текст','Тема, основная мысль, абзац','text'],
['r05_phon','5 класс','Фонетика и графика','Буквы, звуки, слоги и ударение','phon'],
['r05_ortho','5 класс','Орфоэпия','Нормы произношения','ortho'],
['r05_morph','5 класс','Морфемика','Морфемный разбор','morph2'],
['r05_lex','5 класс','Лексика','Синонимы, антонимы, омонимы','lex'],
['r05_noun','5 класс','Имя существительное','Род, число, падеж','noun'],
['r05_adj','5 класс','Имя прилагательное','Значение и согласование','adj'],
['r05_verb','5 класс','Глагол','Время и неопределённая форма','verb'],
['r05_punct','5 класс','Синтаксис и пунктуация','Обращения и однородные члены','punct'],
['r05_spell','5 класс','Орфография','-тся/-ться, НЕ с глаголами','spell'],
['r05_types','5 класс','Виды предложений','Цель высказывания','types'],
['r05_vocab','5 класс','Словарная работа','Непроверяемые написания','vocab']
];
const C={math:M,russian:U};let loc=JSON.parse(localStorage.getItem(LS)||'{}'),prof=null,prog={},sub='math',ti=0,cur=null,started=0;
const t=(q,a,h,e,kind='n')=>({q,a:String(a),h,e,kind});
function gen(k,l,attempts=0){
 let a,b,c,d,x,p,n,s,z;
 if(k==='num'){
  // В задачах вида B = A × X число A всегда не больше 9999.
  // Множитель X растёт вместе со сложностью: 1 цифра → 2 цифры → 3/4 цифры.
  const multTask=()=>{
    const A=UN(1,9999,'math_mult_A',120);
    const X=multBaseByStage(l,attempts);
    return t(`Число B в ${X.toLocaleString('ru')} раз больше числа A = ${A.toLocaleString('ru')}. Найди B.`,
      A*X,
      '«В несколько раз больше» означает умножение: B = A × X.',
      `B = ${A.toLocaleString('ru')} × ${X.toLocaleString('ru')}.`);
  };

  const placeTask=()=>{
    // Для разрядных заданий используем отдельное многозначное число — до сотен тысяч.
    const number=UN(l===1?1000:10000,l===1?99999:999999,'math_place_number',120);
    const places=[10,100,1000,10000,100000].filter(v=>v<=number);
    const place=P(places);
    const names={10:'десятков',100:'сотен',1000:'тысяч',10000:'десятков тысяч',100000:'сотен тысяч'};
    return t(`Сколько полных ${names[place]} содержится в числе ${number.toLocaleString('ru')}?`,
      Math.floor(number/place),
      `Раздели число на ${place.toLocaleString('ru')} и возьми только целую часть.`,
      `Количество полных ${names[place]} равно целой части от ${number.toLocaleString('ru')} : ${place.toLocaleString('ru')}.`);
  };

  const changeTask=()=>{
    const number=UN(1000,999999,'math_change_number',120);
    const delta=l===1?P([R(2,99),R(100,999)]):l===2?P([R(100,999),R(1000,9999)]):P([R(1000,9999),R(10000,90000)]);
    const plus=Math.random()<0.5;
    if(!plus && delta>=number) return changeTask();
    return t(`${plus?'Увеличь':'Уменьши'} число ${number.toLocaleString('ru')} на ${delta.toLocaleString('ru')}.`,
      plus?number+delta:number-delta,
      plus?'Выполни сложение.':'Выполни вычитание.',
      `${number.toLocaleString('ru')} ${plus?'+':'−'} ${delta.toLocaleString('ru')}.`);
  };

  const digitValueTask=()=>{
    const number=UN(10000,999999,'math_digitvalue_number',120);
    const str=String(number);
    let pos=R(0,str.length-1), digit=Number(str[pos]);
    let guard=0; while(digit===0 && guard++<10){pos=R(0,str.length-1);digit=Number(str[pos]);}
    const power=str.length-1-pos;
    const value=digit*(10**power);
    return t(`Какое разрядное значение имеет цифра ${digit} в числе ${number.toLocaleString('ru')}?`,
      value,
      'Определи позицию цифры: единицы, десятки, сотни, тысячи и т. д.',
      `Цифра ${digit} стоит в разряде ${10**power}, поэтому её разрядное значение равно ${value.toLocaleString('ru')}.`);
  };

  const compareTask=()=>{
    let n1=UN(1000,999999,'math_compare_number',120), n2=UN(1000,999999,'math_compare_number',120);
    if(n1===n2)n2++;
    const hi=Math.max(n1,n2),lo=Math.min(n1,n2);
    return t(`На сколько число ${hi.toLocaleString('ru')} больше числа ${lo.toLocaleString('ru')}?`,
      hi-lo,
      'Чтобы узнать, на сколько одно число больше другого, вычти меньшее из большего.',
      `${hi.toLocaleString('ru')} − ${lo.toLocaleString('ru')}.`);
  };

  const variants=l===1
    ? [multTask,placeTask,changeTask]
    : l===2
      ? [multTask,placeTask,changeTask,digitValueTask]
      : [multTask,placeTask,changeTask,digitValueTask,compareTask];
  return P(variants)();
 }
 if(k==='units'){a=R(2,15);b=R(1,999);if(l===1)return t(`${a} км ${b} м = ? м`,a*1000+b,'1 км=1000 м.','Переводим и складываем.');a=R(1,7);b=R(5,55);return l===2?t(`${a} ч ${b} мин = ? мин`,a*60+b,'1 ч=60 мин.','Переводим часы.'):t(`Площадь прямоугольника ${a} м × ${b} м в см²?`,a*b*10000,'1 м²=10000 см².','Сначала площадь в м².') }
 if(k==='ops'){a=R(20,90);b=R(2,9);c=R(5,40);return l===1?t(`${a}+${b}×${c}=?`,a+b*c,'Сначала умножение.','Порядок действий.'):l===2?t(`(${a}+${c})×${b}=?`,(a+c)*b,'Сначала скобки.','Скобки, затем умножение.'):t(`${a}×(${b}+3)−${c}=?`,a*(b+3)-c,'Сначала скобки.','Три действия.') }
 if(k==='eq'){x=R(3,30);a=R(2,9);b=R(5,30);return l===1?t(`x+${b}=${x+b}. Найди x.`,x,'Вычти известное слагаемое.','Обратное действие.'):l===2?t(`${a}x+${b}=${a*x+b}. Найди x.`,x,'Сначала вычти '+b+'.','Затем раздели на '+a+'.'):t(`(${a}x+${b})×2=${(a*x+b)*2}. Найди x.`,x,'Иди обратными действиями.','Делим на 2, вычитаем, делим.') }
 if(k==='word'){a=R(45,80);b=R(2,6);if(l===1)return t(`Машина ехала ${b} ч со скоростью ${a} км/ч. Путь?`,a*b,'S=v×t.','Умножаем скорость на время.');p=R(50,160);n=R(3,8);if(l===2)return t(`${n} тетрадей по ${p} руб. Стоимость?`,n*p,'Цена×количество.','Умножаем.');c=R(50,85);return t(`Две машины едут навстречу со скоростями ${a} и ${c} км/ч. Встретились через ${b} ч. Расстояние?`,(a+c)*b,'Скорости сближения складываются.','Сумма скоростей × время.') }
 if(k==='nat'){a=R(1000,90000);d=R(20,1000);return l===1?t(`Какое число идёт после ${a}?`,a+1,'Прибавь 1.','Следующее натуральное число.'):l===2?t(`A(${a}), B правее на ${d}. Координата B?`,a+d,'Движение вправо увеличивает координату.','A+d.'):t(`A(${a}), B(${a+d}). Найди AB.`,d,'Вычти меньшую координату.','Разность координат.') }
 if(k==='round'){a=R(1000,99999);if(l===1)return t(`Округли ${a} до сотен.`,Math.round(a/100)*100,'Смотри на десятки.','Правило округления.');b=R(11,49);if(l===2)return t(`25×${b}×4=?`,100*b,'Сгруппируй 25×4.','Получаем 100×'+b+'.');c=R(10,30);return t(`36×${b}+36×${c}=?`,36*(b+c),'Вынеси 36 за скобки.','Распределительное свойство.') }
 if(k==='div'){n=R(20,999);if(l===1)return t(`Делится ли ${n} на 2? да/нет`,n%2?'нет':'да','Посмотри на последнюю цифру.','Признак делимости на 2.','txt');s=[...String(n)].reduce((q,w)=>q+ +w,0);if(l===2)return t(`Делится ли ${n} на 3? да/нет`,s%3?'нет':'да','Сложи цифры.','Признак делимости на 3.','txt');a=P([2,3,5,7]);b=P([2,3,5,7]);return t(`Разложи ${a*b} на два простых множителя: a*b`,[a,b].sort((x,y)=>x-y).join('*'),'Проверяй 2,3,5,7.','Находим пару простых множителей.','fac') }
 if(k==='frac'){d=R(3,12);a=R(1,d-1);b=R(1,d-1);if(l===1)return t(`Сократи ${a*2}/${d*2}.`,F(a*2,d*2),'Раздели числитель и знаменатель.','Сокращаем дробь.','fr');if(l===2)return t(`${a}/${d}+${b}/${d}=?`,F(a+b,d),'Сложи числители.','Знаменатель сохраняется.','fr');c=R(2,6);return t(`${a}/${d}+1/${c}=?`,F(a*c+d,d*c),'Приведи к общему знаменателю.','Складываем дроби.','fr') }
 if(k==='dec'){a=R(10,999)/100;b=R(10,999)/100;if(l===1)return t(`${fmt(a)}+${fmt(b)}=?`,fmt(a+b),'Запятая под запятой.','Сложение десятичных дробей.');if(l===2)return t(`${fmt(Math.max(a,b))}−${fmt(Math.min(a,b))}=?`,fmt(Math.abs(a-b)),'Выравни разряды.','Вычитание.');c=R(2,9)/10;return t(`${fmt(a)}×${fmt(c)}=?`,fmt(a*c),'Умножь как целые и верни запятую.','Умножение.') }
 if(k==='pct'){n=P([100,200,300,400,500,800]);p=P([10,20,25,50]);return l===1?t(`${p}% от ${n}=?`,n*p/100,'Умножь на процент и раздели на 100.','Находим долю.'):l===2?t(`Скидка ${p}% от ${n} руб. Сколько рублей?`,n*p/100,'Найди процент от цены.','Скидка.'):t(`Цена ${n} руб., скидка ${p}%. Новая цена?`,n-n*p/100,'Сначала найди скидку.','Вычитаем скидку.') }
 if(k==='geo'){a=R(2,18);b=R(2,18);if(l===1)return t(`Периметр прямоугольника ${a}×${b} см?`,2*(a+b),'P=2(a+b).','Периметр.');z=P([35,90,120,180]);if(l===2)return t(`Угол ${z}°: острый, прямой, тупой или развернутый?`,z<90?'острый':z===90?'прямой':z===180?'развернутый':'тупой','Сравни с 90° и 180°.','Классификация угла.','txt');c=R(2,a);d=R(2,b);return t(`Из прямоугольника ${a+4}×${b+4} вырезали ${c}×${d}. Остаточная площадь?`,(a+4)*(b+4)-c*d,'Площадь большого минус вырезанная.','Вычитаем площади.') }
 if(k==='vol'){a=R(2,10);b=R(2,10);c=R(2,10);return l===1?t(`Объём ${a}×${b}×${c} см?`,a*b*c,'V=a×b×c.','Перемножаем измерения.'):l===2?t(`Объём куба с ребром ${a} см?`,a**3,'V=a³.','Куб ребра.'):t(`Коробка ${a}×${b}×${c} дм. Сколько литров?`,a*b*c,'1 дм³=1 л.','Объём в литрах.') }
 if(k==='data'){a=R(6,18);b=R(6,18);c=R(6,18);return l===1?t(`За 3 дня решено ${a}, ${b}, ${c} задач. Всего?`,a+b+c,'Сложи значения.','Сумма.'):t(`Среднее для ${a}, ${b}, ${c}?`,(a+b+c)/3,'Сумма разделить на 3.','Среднее арифметическое.') }
 if(k==='logic'){a=R(2,6);b=R(2,6);c=R(2,5);return l===1?t(`${a} футболок и ${b} шорт. Сколько комплектов?`,a*b,'Каждая с каждой.','Правило произведения.'):t(`${a} первых блюда, ${b} вторых и ${c} напитка. Сколько обедов?`,a*b*c,'Перемножь варианты.','Независимые выборы.') }
 if(k==='mix')return gen(P(M.slice(0,-1))[4],l,attempts);
 let sets;
 if(k==='morph'){
  // Банк из 265 разных слов. Повторы исключаются до полного прохождения банка.
  const rootWords=[['лес','лес'],['лесной','лес'],['лесник','лес'],['лесок','лес'],['лесистый','лес'],['перелесок','лес'],['вода','вод'],['водный','вод'],['водяной','вод'],['подводный','вод'],['водичка','вод'],['мороз','мороз'],['морозный','мороз'],['морозец','мороз'],['заморозок','мороз'],['морозить','мороз'],['школа','школ'],['школьный','школ'],['школьник','школ'],['дошкольный','школ'],['школьница','школ'],['зима','зим'],['зимний','зим'],['зимовать','зим'],['зимовка','зим'],['зимушка','зим'],['сад','сад'],['садик','сад'],['садовый','сад'],['садовник','сад'],['садовод','сад'],['дождь','дожд'],['дождик','дожд'],['дождливый','дожд'],['дождевой','дожд'],['дождевик','дожд'],['свет','свет'],['светлый','свет'],['светить','свет'],['рассвет','свет'],['подсветка','свет'],['цвет','цвет'],['цветок','цвет'],['цветник','цвет'],['цветной','цвет'],['расцвет','цвет'],['рыба','рыб'],['рыбный','рыб'],['рыбак','рыб'],['рыбка','рыб'],['рыбёшка','рыб'],['гриб','гриб'],['грибной','гриб'],['грибник','гриб'],['грибок','гриб'],['грибочек','гриб'],['хлеб','хлеб'],['хлебный','хлеб'],['хлебница','хлеб'],['хлебушек','хлеб'],['хлебец','хлеб'],['стол','стол'],['столик','стол'],['настольный','стол'],['столовый','стол'],['столешница','стол'],['дом','дом'],['домик','дом'],['домовой','дом'],['бездомный','дом'],['домишко','дом'],['трава','трав'],['травка','трав'],['травяной','трав'],['травинка','трав'],['травянистый','трав'],['гора','гор'],['горный','гор'],['горка','гор'],['пригорок','гор'],['гористый','гор'],['море','мор'],['морской','мор'],['моряк','мор'],['приморский','мор'],['заморский','мор'],['берёза','берёз'],['берёзка','берёз'],['берёзовый','берёз'],['подберёзовик','берёз'],['дуб','дуб'],['дубовый','дуб'],['дубок','дуб'],['дубочек','дуб'],['звезда','звезд'],['звёздный','звёзд'],['звёздочка','звёзд'],['звездопад','звезд'],['луна','лун'],['лунный','лун'],['полулунный','лун'],['город','город'],['городской','город'],['городок','город'],['пригород','город'],['городишко','город'],['работа','работ'],['работать','работ'],['работник','работ'],['работница','работ'],['заработок','работ'],['писать','пис'],['писатель','пис'],['записка','пис'],['переписать','пис'],['подписать','пис'],['читать','чит'],['читатель','чит'],['прочитать','чит'],['перечитать','чит'],['игра','игр'],['игрок','игр'],['игровой','игр'],['играть','игр'],['бег','бег'],['бегать','бег'],['беговой','бег'],['бегун','бег'],['дружба','друж'],['дружный','друж'],['дружить','друж'],['дружеский','друж'],['содружество','друж'],['сила','сил'],['сильный','сил'],['силач','сил'],['усилить','сил'],['силовой','сил'],['быстрый','быстр'],['быстрота','быстр'],['убыстрить','быстр'],['быстрее','быстр'],['тепло','тепл'],['тёплый','тёпл'],['теплота','тепл'],['утеплить','тепл'],['тепловой','тепл'],['холод','холод'],['холодный','холод'],['холодок','холод'],['похолодание','холод'],['холодильник','холод'],['грусть','груст'],['грустный','груст'],['грустить','груст'],['загрустить','груст'],['чистый','чист'],['чистота','чист'],['очистить','чист'],['чистенький','чист'],['чистюля','чист'],['смелый','смел'],['смелость','смел'],['осмелеть','смел'],['смельчак','смел'],['добрый','добр'],['доброта','добр'],['подобреть','добр'],['добряк','добр'],['добродушный','добр'],['мир','мир'],['мирный','мир'],['примирить','мир'],['миролюбивый','мир'],['труд','труд'],['трудный','труд'],['трудиться','труд'],['трудовой','труд'],['трудолюбивый','труд'],['сахар','сахар'],['сахарный','сахар'],['сахарок','сахар'],['сахарница','сахар'],['чай','чай'],['чайник','чай'],['чайный','чай'],['чайная','чай'],['машина','машин'],['машинный','машин'],['машинист','машин'],['машинка','машин'],['спорт','спорт'],['спортивный','спорт'],['спортсмен','спорт'],['спортзал','спорт'],['спортклуб','спорт'],['музыка','музык'],['музыкальный','музык'],['музыкант','музык'],['музыковед','музык'],['картина','картин'],['картинка','картин'],['картинный','картин'],['праздник','праздн'],['праздничный','праздн'],['праздновать','праздн'],['празднование','праздн'],['звон','звон'],['звонок','звон'],['звонить','звон'],['перезвон','звон'],['звонарь','звон'],['радость','рад'],['радостный','рад'],['обрадовать','рад'],['радоваться','рад'],['страшный','страш'],['страшилка','страш'],['бесстрашный','страш'],['устрашить','страш'],['шахматы','шахмат'],['шахматный','шахмат'],['шахматист','шахмат'],['шахматистка','шахмат'],['футбол','футбол'],['футболист','футбол'],['футбольный','футбол'],['футболка','футбол'],['лыжи','лыж'],['лыжник','лыж'],['лыжный','лыж'],['лыжница','лыж'],['компьютер','компьютер'],['компьютерный','компьютер'],['компьютерщик','компьютер'],['телефон','телефон'],['телефонный','телефон'],['телефончик','телефон'],['экран','экран'],['экранный','экран'],['экранчик','экран'],['ягода','ягод'],['ягодный','ягод'],['ягодка','ягод'],['ягодник','ягод'],['малина','малин'],['малиновый','малин'],['малинка','малин'],['малинник','малин'],['билет','билет'],['билетик','билет'],['билетный','билет'],['безбилетный','билет'],['вагон','вагон'],['вагонный','вагон'],['вагончик','вагон'],['ракета','ракет'],['ракетный','ракет'],['ракетчик','ракет'],['планета','планет'],['планетный','планет'],['планетка','планет'],['океан','океан'],['океанский','океан'],['океанолог','океан']];
  [a,b]=pickUnique('russian_root_words_v3',rootWords,rootWords.length);
  return t(`Укажи корень в слове «${a}».`,b,
    'Подбери 2–3 родственных слова и найди общую значимую часть.',
    'Выделяем общую часть родственных слов.',
    'txt');
 }
 if(k==='vowel'){sets=[['л_са','е','лес'],['в_да','о','воды'],['тр_ва','а','травы'],['з_ма','и','зимы']];[a,b,c]=P(sets);return t(`Вставь букву: ${a}`,b,`Проверочное слово: ${c}.`,'Ставим гласную под ударение.','txt')}
 if(k==='cons'){sets=[['ду_','б','дубы'],['гри_','б','грибы'],['зу_','б','зубы'],['хле_','б','хлеба']];[a,b,c]=P(sets);return t(`Вставь согласную: ${a}`,b,`Проверочное слово: ${c}.`,'После согласной должна появиться гласная.','txt')}
 if(k==='parts'){[a,b]=P([['быстрый','прилагательное'],['читает','глагол'],['книга','существительное'],['он','местоимение']]);return t(`Часть речи слова «${a}»?`,b,'Задай вопрос и определи значение.','Определяем часть речи.','txt')}
 if(k==='sent'){[a,b,c]=P([['Птицы летят на юг.','птицы','летят'],['Солнце ярко светит.','солнце','светит'],['Дети читают книгу.','дети','читают']]);return l===1?t(`Подлежащее: «${a}»`,b,'Кто или что выполняет действие?','Главный член.','txt'):t(`Сказуемое: «${a}»`,c,'Что делает подлежащее?','Главный член.','txt')}
 if(k==='speech'){[a,b]=P([['Разговор двух людей — это...','диалог'],['Речь одного человека — это...','монолог']]);return t(a,b,'Вспомни формы речи.','Термин.','txt')}
 if(k==='text'){[a,b]=P([['То, о чём говорится в тексте, — это...','тема'],['Главная мысль автора — это...','основная мысль'],['Часть текста с красной строки — это...','абзац']]);return t(a,b,'Вспомни признаки текста.','Теория текста.','txt')}
 if(k==='phon'){[a,b]=P([['Сколько букв в слове «ёлка»?',4],['Сколько букв в слове «семья»?',5],['Сколько букв в слове «конь»?',4]]);return t(a,b,'Считай буквы в записи.','Количество букв.')}
 if(k==='ortho'){return t('Раздел науки о языке, изучающий нормы произношения?','орфоэпия','Вспомни термин.','Орфоэпия.','txt')}
 if(k==='morph2'){[a,b]=P([['Морфема после корня, образующая новые слова?','суффикс'],['Морфема, изменяющая форму слова?','окончание'],['Главная общая часть родственных слов?','корень']]);return t(a,b,'Вспомни функции морфем.','Морфемика.','txt')}
 if(k==='lex'){[a,b,c]=P([['быстрый','скорый','синонимы'],['смелый','храбрый','синонимы'],['день','ночь','антонимы'],['высокий','низкий','антонимы']]);return t(`«${a}» и «${b}» — синонимы или антонимы?`,c,'Сравни значения.','Лексическое отношение.','txt')}
 if(k==='noun'){[a,b]=P([['книга','женский'],['море','средний'],['стол','мужской'],['тетрадь','женский']]);return t(`Род существительного «${a}»?`,b,'Подставь он/она/оно.','Род существительного.','txt')}
 if(k==='adj'){[a,b]=P([['синее море','синее'],['высокий дом','высокий'],['интересная книга','интересная']]);return t(`Прилагательное в сочетании «${a}»?`,b,'Ищи признак предмета.','Выделяем прилагательное.','txt')}
 if(k==='verb'){[a,b]=P([['читать','неопределенная'],['читает','настоящее'],['читал','прошедшее'],['будет читать','будущее']]);return t(`Форма/время глагола «${a}»?`,b,'Смотри на значение времени.','Грамматическая характеристика.','txt')}
 if(k==='punct'){[a,b]=P([['Мама, я уже дома.','мама'],['Ребята, откройте тетради.','ребята'],['Друзья, начнём урок.','друзья']]);return t(`Найди обращение: «${a}»`,b,'К кому обращаются?','Обращение выделено запятой.','txt')}
 if(k==='spell'){[a,b,c]=P([['учит_ся','т','что делает?'],['учит_ся','ть','что делать?'],['старает_ся','т','что делает?'],['старат_ся','ть','что делать?']]);return t(`Вставь «т» или «ть»: ${a}`,b,`Задай вопрос: ${c}`,'Определяем -тся/-ться.','txt')}
 if(k==='types'){[a,b]=P([['Ты выполнил задание?','вопросительное'],['Открой учебник.','побудительное'],['Сегодня солнечно.','повествовательное']]);return t(`Вид предложения по цели: «${a}»`,b,'Сообщает, спрашивает или побуждает?','Тип предложения.','txt')}
 if(k==='vocab'){[a,b]=P([['к_ртина','а'],['в_кзал','о'],['д_ректор','и'],['к_лендарь','а'],['б_гаж','а'],['г_ризонт','о']]);return t(`Вставь букву: ${a}`,b,'Это словарное слово.','Запоминаем написание.','txt')}
}
function ok(v,t){v=N(v);if(t.kind==='txt')return v===N(t.a);if(t.kind==='fr'){let f=x=>{let[q,w]=x.split('/').map(Number);return q/w};return Math.abs(f(v)-f(t.a))<1e-9}if(t.kind==='fac'){let f=x=>x.replace('×','*').replace('·','*').split('*').map(Number).sort((a,b)=>a-b).join('*');return f(v)===f(t.a)}let a=Number(v.replace(',','.')),b=Number(t.a.replace(',','.'));return Number.isFinite(a)&&Math.abs(a-b)<1e-6}
const key=(s,id)=>s+'|'+id,getp=(s,id)=>prog[key(s,id)]||{attempts:0,mastery:0,streak:0,best_difficulty:1};
function lev(s,id){let p=getp(s,id);return p.attempts>=14&&p.mastery>=82&&p.streak>=3?3:p.attempts>=6&&p.mastery>=74?2:1}
function overall(s){let q=C[s].reduce((x,t)=>x+(+getp(s,t[0]).mastery||0),0);return Math.round(q/C[s].length)}
function save(){localStorage.setItem(LS,JSON.stringify(loc))}
async function load(){try{let a=await rpc('edu_student_profile',{p_student_token:loc.token});prof=a[0];if(!prof)throw 0;let p=await rpc('edu_student_progress',{p_student_token:loc.token});prog={};p.forEach(x=>prog[key(x.subject,x.topic_id)]=x);home()}catch(e){loc={};save();auth()}}
function auth(){app.innerHTML='';auth.innerHTML=`<div class="card login"><div class=logo><div class=mark>📘</div><span>Умный ученик</span></div><h1>Математика и русский язык</h1><p class=small>Повторение 4 класса и программа 5 класса. Сложность повышается автоматически.</p><b>Имя ученика</b><input id=nick placeholder="Например, Алексей"><button class="btn blue" style="width:100%" onclick=create()>Начать обучение</button><br><br><div class=notice>Родителю: для просмотра статистики используйте родительский код.</div><input id=pc placeholder="Родительский код"><button class=btn style="width:100%" onclick=parent()>Открыть статистику</button></div>`}
async function create(){let n=nick.value.trim();if(!n)return;try{let a=await rpc('edu_create_student',{p_nickname:n});loc={token:a[0].student_token,code:a[0].parent_code};save();await load();setTimeout(()=>alert('Сохраните родительский код: '+loc.code),200)}catch(e){alert('Ошибка подключения')}}
function shell(body,on='home'){auth.innerHTML='';app.innerHTML=`<div class=shell><aside class=side><div class=logo><div class=mark>📘</div><span>Умный ученик</span></div>${[['home','⌂','Главная'],['math','∑','Математика'],['russian','Я','Русский язык'],['progress','▥','Прогресс'],['parent','👤','Родителю']].map(x=>`<button class="nav ${on===x[0]?'on':''}" onclick="nav('${x[0]}')"><span>${x[1]}</span><span>${x[2]}</span></button>`).join('')}</aside><main class=main><div class=top><h2 style="margin:0">${on==='home'?'Главная':on==='math'?'Математика':on==='russian'?'Русский язык':on==='progress'?'Мой прогресс':'Для родителя'}</h2><div class=pill>⭐ <b>${prof.xp}</b> · ${prof.nickname}</div></div>${body}</main></div>`}
function nav(v){v==='home'?home():v==='math'||v==='russian'?course(v):v==='progress'?stats():parentInfo()}
function home(){let m=overall('math'),r=overall('russian');shell(`<div class=hero><section class=welcome><h1>Привет, ${prof.nickname}!</h1><p>Короткие регулярные занятия повторяют старые темы и постепенно открывают более сложные задания.</p><button class="btn blue" onclick="course('math')">Продолжить обучение →</button></section><section class="card progress"><h3>Мой прогресс</h3><p>Математика <b>${m}%</b></p><div class=bar><i style="width:${m}%;background:#13a45a"></i></div><p>Русский язык <b>${r}%</b></p><div class=bar><i style="width:${r}%;background:#6d40df"></i></div></section></div><div class=twocol><section class="card subject m"><h2>∑ Математика</h2><p>Натуральные числа, дроби, проценты, геометрия, данные и логика.</p><ul><li>повторение 4 класса</li><li>плавный переход к 5 классу</li><li>адаптивная сложность</li></ul><button class="btn green" onclick="course('math')">Перейти →</button></section><section class="card subject r"><h2>Я Русский язык</h2><p>Орфография, грамматика, синтаксис, лексика и развитие речи.</p><ul><li>правописание</li><li>части речи и предложение</li><li>текст и лексика</li></ul><button class="btn purple" onclick="course('russian')">Перейти →</button></section></div><h3 class=sect>Учебный маршрут</h3><div class=topics>${[...M.slice(5,9).map(x=>card(x,'math')),...U.slice(5,9).map(x=>card(x,'russian'))].join('')}</div>`)}
function card(x,s){let p=getp(s,x[0]);return`<div class="card tc" onclick="openT('${s}','${x[0]}')"><span class=tag>${x[1]}</span><h4>${x[2]}</h4><div class=small>${x[3]}</div><div class=bar style="margin-top:10px"><i style="width:${p.mastery||0}%"></i></div></div>`}
function course(s){sub=s;let arr=C[s],cur=s==='math'?prof.current_math_topic:prof.current_russian_topic;ti=Math.max(0,arr.findIndex(x=>x[0]===cur));shell(`<div class=course><div class="card list">${arr.map((x,i)=>{let p=getp(s,x[0]);return`<div class="tr ${i===ti?'on':''}" onclick="openT('${s}','${x[0]}')"><b>${i+1}. ${x[2]}</b><div class=small>${x[1]} · ${p.attempts?Math.round(p.mastery)+'%':'не начато'}</div></div>`}).join('')}</div><div id=lesson></div></div>`,s);lesson()}
function openT(s,id){sub=s;let arr=C[s];ti=arr.findIndex(x=>x[0]===id);course(s);ti=arr.findIndex(x=>x[0]===id);lesson();rpc('edu_set_current_topic',{p_student_token:loc.token,p_subject:s,p_topic_id:id}).catch(()=>{});if(s==='math')prof.current_math_topic=id;else prof.current_russian_topic=id}
function lesson(){let x=C[sub][ti],p=getp(sub,x[0]),l=lev(sub,x[0]);lesson.innerHTML=`<section class="card lesson"><span class=tag>${x[1]}</span><h2>${x[2]}</h2><p class=small>${x[3]}</p><div class=theory><div class=tb><b>Как работаем</b><br>Сначала вспоминаем правило, затем решаем несколько вариантов.</div><div class=tb><b>Адаптация</b><br>Уровень повышается только после устойчивой серии правильных ответов.</div></div><div id=task></div><p class=small>Текущий уровень: <b>${['','средний','выше среднего','высокий'][l]}</b>. Освоение: ${p.attempts?Math.round(p.mastery)+'%':'нет данных'}.</p></section>`;next()}
function next(){let x=C[sub][ti],l=lev(sub,x[0]);cur=gen(x[4],l,getp(sub,x[0]).attempts);cur.meta={id:x[0],level:l};started=Date.now();task.innerHTML=`<div class=task><div class=small>${x[2]} · ${['','средний','выше среднего','высокий'][l]}</div><div class=q>${cur.q}</div><div class=row><input id=ans placeholder="Введите ответ" onkeydown="if(event.key==='Enter')check()"><button class="btn blue" onclick=check()>Проверить</button></div><div class=row style="margin-top:9px"><button class=btn onclick=hint()>Подсказка</button><button class=btn onclick=next()>Другое задание</button></div><div id=hi class=hint></div><div id=fb class=fb></div></div>`;ans.focus()}
function hint(){hi.textContent=cur.h;hi.classList.add('show')}
async function check(){let v=ans.value;if(!v.trim())return;let good=ok(v,cur);fb.className='fb '+(good?'ok':'bad');fb.innerHTML=good?'Верно. '+cur.e:`Неверно. Правильный ответ: <b>${cur.a}</b>. ${cur.e}`;ans.disabled=true;try{let x=(await rpc('edu_save_attempt',{p_student_token:loc.token,p_subject:sub,p_topic_id:cur.meta.id,p_difficulty:cur.meta.level,p_is_correct:good,p_elapsed_seconds:Math.round((Date.now()-started)/1000)}))[0];if(x){prog[key(sub,cur.meta.id)]=x;prof.xp=x.xp}}catch(e){}fb.innerHTML+=`<br><button class="btn blue" style="margin-top:8px" onclick=next()>Следующее</button>`}
function stats(){let rows=['math','russian'].flatMap(s=>C[s].map(x=>({s,x,p:getp(s,x[0])}))).filter(z=>z.p.attempts);shell(`<div class=kpis><div class="card kpi"><strong>${prof.xp}</strong><span class=small>баллов</span></div><div class="card kpi"><strong>${overall('math')}%</strong><span class=small>математика</span></div><div class="card kpi"><strong>${overall('russian')}%</strong><span class=small>русский язык</span></div><div class="card kpi"><strong>${rows.reduce((q,z)=>q+ +z.p.attempts,0)}</strong><span class=small>заданий</span></div></div><div class=card style="padding:16px;margin-top:14px;overflow:auto"><table class=table><thead><tr><th>Предмет</th><th>Тема</th><th>Попытки</th><th>Освоение</th></tr></thead><tbody>${rows.map(z=>`<tr><td>${z.s==='math'?'Математика':'Русский'}</td><td>${z.x[2]}</td><td>${z.p.attempts}</td><td>${Math.round(z.p.mastery)}%</td></tr>`).join('')||'<tr><td colspan=4>Пока нет данных</td></tr>'}</tbody></table></div>`,'progress')}
function parentInfo(){shell(`<div class=card style="padding:20px;max-width:620px"><h3>Родительский код</h3><p class=small>Откройте сайт на своём устройстве и введите этот код на стартовом экране.</p><div class=code>${prof.parent_code||loc.code}</div><br><button class=btn onclick=logout()>Выйти из профиля на этом устройстве</button></div>`,'parent')}
function logout(){if(confirm('Выйти? Прогресс в базе сохранится.')){loc={};save();location.reload()}}
async function parent(){let c=pc.value.trim();if(!c)return;try{let a=await rpc('edu_parent_profile',{p_parent_code:c});if(!a.length)return alert('Код не найден');let d=await rpc('edu_parent_progress',{p_parent_code:c}),p=a[0],tot=+p.total_attempts||0,cor=+p.total_correct||0;auth.innerHTML='';app.innerHTML=`<div class=main style="max-width:1100px;margin:auto"><div class=top><h2>Статистика: ${p.nickname}</h2><button class=btn onclick="location.reload()">Закрыть</button></div><div class=kpis><div class="card kpi"><strong>${p.xp}</strong><span class=small>баллов</span></div><div class="card kpi"><strong>${tot}</strong><span class=small>заданий</span></div><div class="card kpi"><strong>${tot?Math.round(cor/tot*100):0}%</strong><span class=small>точность</span></div><div class="card kpi"><strong>${p.last_activity?new Date(p.last_activity).toLocaleDateString('ru'):'—'}</strong><span class=small>последняя активность</span></div></div><div class=card style="padding:16px;margin-top:14px;overflow:auto"><table class=table><thead><tr><th>Предмет</th><th>Тема</th><th>Попытки</th><th>Освоение</th></tr></thead><tbody>${d.map(z=>{let x=C[z.subject].find(q=>q[0]===z.topic_id);return`<tr><td>${z.subject==='math'?'Математика':'Русский'}</td><td>${x?x[2]:z.topic_id}</td><td>${z.attempts}</td><td>${Math.round(z.mastery)}%</td></tr>`}).join('')||'<tr><td colspan=4>Пока нет данных</td></tr>'}</tbody></table></div></div>`}catch(e){alert('Ошибка загрузки')}}
loc.token?load():auth();