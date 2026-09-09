# Smart Student — «Студия решений»

## Принципы

- Учебная иерархия остаётся неизменной: класс → предмет → раздел → тема → микронавык → задания.
- Мотивация строится вокруг видимого роста: траектория, карта уверенности, серия занятий и коллекция учебных артефактов.
- Экран задания сознательно спокойнее остальных экранов: крупное условие, один способ ответа, мгновенный feedback и однозначный следующий шаг.
- Награды связаны с привычками и освоенными умениями, а не со случайными очками.

## Foundations

Цвета определены CSS-токенами в `app/globals.css`: pearl canvas, white surface, graphite text, ultramarine action/learning, green confident/correct, amber review и red incorrect. Основные пары текста имеют контраст от 4.58:1 до 18.12:1; цвет не является единственным носителем состояния.

Типографика: Manrope для интерфейса, Roboto Mono для чисел и математических выражений. Базовые радиусы: 8, 12, 20 и 28 px. Основные интерактивные цели имеют высоту 44–68 px.

## Components

- Button: primary, secondary, ghost; hover, focus-visible, pressed, disabled.
- Subject Card: default, selected, hover, disabled/coming soon.
- Topic Row: confident, learning, review, new.
- Learning Path Node: done, current, locked.
- Task Container: desktop split layout и mobile focus layout.
- Answer Option: default, hover, focus, selected, correct, incorrect, disabled.
- Input: label, placeholder, focus-visible, password/numeric.
- Progress: linear track, mastery cells, weekly activity bars.
- Mastery Indicator: confident, learning, review с текстовыми подписями.
- Achievement: earned и in-progress.
- Navigation: desktop sidebar, compact tablet rail, mobile bottom navigation.
- Feedback: correct, error/explanation, session completion.

## Screens

Реализованы: старт, выбор класса, выбор предмета, траектория, раздел и темы, задание, правильный ответ, ошибка с объяснением, завершение серии, прогресс, достижения и профиль. Все экраны адаптируются от 1440 px до mobile portrait.

## Accessibility and motion

- Общий `:focus-visible` outline 3 px; интерфейс проходится клавиатурой в порядке DOM.
- Touch target не меньше 44 px.
- Disabled-состояния используют нативный атрибут `disabled`.
- Feedback объявлен через `role="status"`.
- Математическая запись имеет доступное текстовое имя и визуальное дробное представление.
- `prefers-reduced-motion: reduce` отключает значимые переходы и плавную прокрутку.
