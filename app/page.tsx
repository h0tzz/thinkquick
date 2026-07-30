"use client";

import { AtSign, Play, Settings, Shuffle } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

type ModeId = "off-the-cuff" | "deep-research";
type TimerState = "idle" | "research" | "ready" | "speech" | "done";

type TopicGroup = {
  id: string;
  label: string;
  emoji: string;
  topics: string[];
};

const GROUPS: TopicGroup[] = [
  {
    id: "general",
    label: "Общее",
    emoji: "✦",
    topics: [
      "Ностальгия",
      "Зона комфорта",
      "Мышечная память",
      "Дорога на работу",
      "Спам-звонок",
      "Голосовая почта",
      "Дверной звонок",
      "Вещь по наследству",
      "Книжная полка",
      "Ящик со всякой всячиной",
      "Брейнрот",
      "Корпоративная жадность",
      "Зеркала",
      "Зал ожидания",
      "Автозамена",
      "Групповой чат",
      "Остатки еды",
      "Светофор",
    ],
  },
  {
    id: "deep-research",
    label: "Deep research",
    emoji: "🔎",
    topics: [
      "Гедонистическая адаптация",
      "Эффект прожектора",
      "Неприятие потерь",
      "Эффект Зейгарник",
      "Теория когнитивной нагрузки",
      "Правило пика и конца",
      "Выученная беспомощность",
      "Эффект Даннинга - Крюгера",
      "Фундаментальная ошибка атрибуции",
      "Память, зависящая от состояния",
      "Парадокс выбора",
      "Эксперимент с двумя щелями",
      "Феномен Баадера - Майнхоф",
      "Эффект Кориолиса",
      "Кембрийский взрыв",
      "Ось кишечник - мозг",
      "Парадокс Ферми",
      "Принцип Парето",
      "Эмоциональная гранулярность",
      "Теория иронических процессов (проблема белого медведя)",
      "Парадокс Соломона",
      "Аффективное прогнозирование (ошибка влияния)",
    ],
  },
  {
    id: "personal-finance",
    label: "Личные финансы",
    emoji: "💰",
    topics: [
      "Резервный фонд",
      "Сложный процент",
      "Инфляция образа жизни",
      "Невозвратные затраты",
      "Альтернативная стоимость",
      "Чистый капитал",
      "Денежный поток",
      "Долг под высокий процент",
      "Фонд на чёрный день",
      "Диверсификация",
      "Усреднение покупки",
      "Ликвидность",
      "Скорость сжигания денег",
      "Финансовая подушка",
      "Кредитный рейтинг",
      "Временная стоимость денег",
      "Толерантность к риску",
      "Свободные деньги без дела",
      "Ловушка подписок",
      "Финансовая взлётная полоса",
      "Отложенное удовольствие",
    ],
  },
  {
    id: "entrepreneurship",
    label: "Предпринимательство",
    emoji: "🚀",
    topics: [
      "Своя шкура на кону",
      "Первый клиент",
      "Деньги - это кислород",
      "Режим основателя",
      "Умение говорить нет",
      "Дистрибуция",
      "Юнит-экономика",
      "Защитный ров",
      "Бутстрэппинг",
      "Product-market fit",
      "Репутационный капитал",
      "Доля за труд",
      "Суета против рычага",
      "Соло-основатель",
      "Строить публично",
      "Быстро ошибаться",
      "Одержимость клиентом",
      "Пивот",
      "Доверие как валюта",
      "Миф об успехе за ночь",
      "Потолок сайд-проекта",
      "Запускать несовершенным",
    ],
  },
  {
    id: "startups",
    label: "Стартапы",
    emoji: "🌱",
    topics: [
      "Минимально жизнеспособный продукт",
      "Runway",
      "Seed-раунд",
      "Growth hacking",
      "Churn",
      "Сетевые эффекты",
      "Burn rate",
      "Тракция",
      "Пивот",
      "Founder-market fit",
      "Пляжный рынок",
      "Виральная петля",
      "Demo day",
      "Продуктовый долг",
      "Ранние пользователи",
      "Преждевременное масштабирование",
      "Acqui-hire",
      "Лунная ставка",
      "От нуля к единице",
    ],
  },
  {
    id: "tech-ai",
    label: "Тех / ИИ",
    emoji: "🤖",
    topics: [
      "Чёрный ящик",
      "Обучающие данные",
      "Промпт-инжиниринг",
      "Галлюцинация",
      "Дрейф модели",
      "Задержка",
      "API-вызов",
      "Открытый исходный код",
      "Дообучение",
      "Контекстное окно",
      "Ошибка автоматизации",
      "Данные как ров",
      "Крайний случай",
      "Технический долг",
      "Единая точка отказа",
      "Облако против локального",
      "Стоимость инференса",
      "Синтетические данные",
      "Петля обратной связи",
      "Zero-shot",
      "Механизм внимания",
      "Агентный workflow",
    ],
  },
  {
    id: "fitness",
    label: "Фитнес",
    emoji: "💪",
    topics: [
      "Прогрессивная перегрузка",
      "День отдыха",
      "Мышечная память",
      "Техника важнее эго",
      "Плато",
      "Разминка",
      "Постоянство важнее интенсивности",
      "Делoad-неделя",
      "Амплитуда движения",
      "Долг восстановления",
      "Личный рекорд",
      "Состав тела",
      "Кардио-база",
      "Мобильность",
      "Боль как сигнал",
      "Просто прийти",
      "Дыхание под нагрузкой",
      "Связь мозг - мышца",
      "Объём против интенсивности",
      "Наслаивание привычек",
      "Страх спортзала",
      "Фаза поддержания",
      "Функциональная сила",
      "Сон как тренировка",
      "Партнёр для ответственности",
      "Новичковые gains",
      "Долгосрочный атлет",
    ],
  },
  {
    id: "nutrition",
    label: "Питание",
    emoji: "🥗",
    topics: [
      "Пустые калории",
      "Белок",
      "Гидратация",
      "Meal prep",
      "Тяга или голод",
      "Микронутриенты",
      "Клетчатка",
      "Скачок сахара в крови",
      "Осознанное питание",
      "Цельные продукты",
      "Здоровье кишечника",
      "Читмилы",
      "Эмоциональное переедание",
      "Устойчивый дефицит",
      "Ритуал завтрака",
      "Поздний перекус",
      "Ультрапереработанные продукты",
      "Есть достаточно",
      "Цвет на тарелке",
      "Еда как социальность",
      "Тайминг приёмов пищи",
      "Добавки",
      "Домашняя готовка",
      "Доступность энергии",
    ],
  },
  {
    id: "productivity",
    label: "Продуктивность",
    emoji: "⚡",
    topics: [
      "Глубокая работа",
      "Переключение контекста",
      "Inbox zero",
      "Time boxing",
      "Закон Паркинсона",
      "Правило двух минут",
      "Батчинг",
      "Управление энергией",
      "Сделано лучше идеального",
      "Открытые петли",
      "Режим фокуса",
      "Налог на встречи",
      "Однозадачность",
      "Утренние страницы",
      "Ритуал завершения дня",
      "Второй мозг",
      "Прокрастинация",
      "Устранение трения",
      "Остаток внимания",
      "Защищённые часы",
      "Результат важнее часов",
      "Диета отвлечений",
    ],
  },
  {
    id: "history",
    label: "История",
    emoji: "📜",
    topics: [
      "Падение Берлинской стены",
      "Высадка на Луну",
      "Изобретение печатного станка",
      "Подписание Великой хартии вольностей",
      "Штурм Бастилии",
      "Первые Олимпийские игры",
      "Открытие пенициллина",
      "Первый полёт братьев Райт",
      "Падение Константинополя",
      "Бостонское чаепитие",
      "Марш на Вашингтон",
      "Открытие Шёлкового пути",
      "Чернобыльская катастрофа",
      "Завершение Великой Китайской стены",
      "Версальский договор",
      "Первая фотография",
      "Открытие Суэцкого канала",
      "Отмена рабства в Британии",
      "Запуск Спутника",
      "Ренессанс во Флоренции",
      "Биржевой крах 1929 года",
      "Освобождение Нельсона Манделы",
      "Строительство пирамид",
      "Первая победа женского избирательного права",
      "Атомная бомбардировка Хиросимы",
      "Плавания Чжэн Хэ",
      "Падение Римской империи",
      "Изобретение интернета",
    ],
  },
  {
    id: "literature",
    label: "Литература",
    emoji: "📚",
    topics: [
      "1984",
      "Моби Дик",
      "Гордость и предубеждение",
      "Сто лет одиночества",
      "Великий Гэтсби",
      "Преступление и наказание",
      "Убить пересмешника",
      "О дивный новый мир",
      "Одиссея",
      "Франкенштейн",
      "Дон Кихот",
      "Возлюбленная",
      "Над пропастью во ржи",
      "Война и мир",
      "Бойня номер пять",
      "Эрнест Хемингуэй",
      "Франц Кафка",
      "Фёдор Достоевский",
      "Эдгар Аллан По",
      "Джеймс Джойс",
      "Эмили Дикинсон",
      "Марк Твен",
    ],
  },
];

const DEEP_RESEARCH_ID = "deep-research";
const OFF_GROUPS = GROUPS.filter((group) => group.id !== DEEP_RESEARCH_ID);
const DEEP_GROUP = getGroup(DEEP_RESEARCH_ID);

const MODES = [
  {
    id: "off-the-cuff" as const,
    label: "Экспромт",
    emoji: "🧠",
    blurb: "Минимум подготовки. Думай быстро, пока говоришь.",
  },
  {
    id: "deep-research" as const,
    label: "Deep research",
    emoji: "🔍",
    blurb:
      "Крути тему, ставь таймер на research, потом запускай речь, когда будешь готов.",
  },
];

const SPEECH_STAGES = ["Что?", "И что?", "Что дальше?"];
const STORAGE_PREFIX = "thinkquick:";
const SPIN_DURATION = 4800;

function getGroup(id: string) {
  return GROUPS.find((group) => group.id === id) ?? GROUPS[0];
}

function randomTopic(topics: string[]) {
  return topics[Math.floor(Math.random() * topics.length)] ?? topics[0] ?? "";
}

function formatDigits(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${(safe % 60).toString().padStart(2, "0")}`;
}

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;

  if (minutes && rest) {
    return `${minutes} мин ${rest} сек`;
  }

  if (minutes) {
    return `${minutes} мин`;
  }

  return rest ? `${rest} сек` : "0 мин";
}

function clampSeconds(seconds: number, minMinutes: number, maxMinutes: number) {
  if (!Number.isFinite(seconds)) {
    return minMinutes * 60;
  }

  const minutes = Math.round(seconds / 60);
  return Math.min(maxMinutes, Math.max(minMinutes, minutes)) * 60;
}

function getSavedSeconds(key: string, fallback: number, min: number, max: number) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (value === null) {
      return fallback;
    }

    return clampSeconds(Number(value), min, max);
  } catch {
    return fallback;
  }
}

function getSavedBoolean(key: string, fallback: boolean) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return value === null ? fallback : value === "true";
  } catch {
    return fallback;
  }
}

function saveValue(key: string, value: number | boolean) {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, String(value));
  } catch {
    // Local settings are nice to have; the app works without storage.
  }
}

function spinPlan(currentIndex: number, topicCount: number) {
  const rounds = 3 + Math.floor(Math.random() * 3);
  const offset = topicCount > 1 ? 1 + Math.floor(Math.random() * (topicCount - 1)) : 0;
  const totalSteps = rounds * topicCount + offset;

  return {
    totalSteps,
    landIndex: (currentIndex + totalSteps) % topicCount,
  };
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

function speechStageCount(remaining: number, total: number, isDone: boolean) {
  if (isDone || total <= 0) {
    return SPEECH_STAGES.length;
  }

  const elapsed = total - remaining;
  const slice = total / SPEECH_STAGES.length;

  if (elapsed >= slice * 2) {
    return 3;
  }

  if (elapsed >= slice) {
    return 2;
  }

  return 1;
}

function timerProgress(remaining: number, total: number) {
  if (total <= 0) {
    return 1;
  }

  return Math.min(1, Math.max(0, 1 - remaining / total));
}

function topicLengthClass(topic: string | null | undefined) {
  const length = topic?.length ?? 0;

  if (length > 42) {
    return "is-extra-long";
  }

  if (length > 24) {
    return "is-long";
  }

  return "";
}

function DurationField({
  label,
  hint,
  minutes,
  min,
  max,
  onChangeMinutes,
}: {
  label: string;
  hint?: string;
  minutes: number;
  min: number;
  max: number;
  onChangeMinutes: (minutes: number) => void;
}) {
  const id = useId();

  return (
    <div className="duration-field">
      <div className="duration-head">
        <label className="duration-label" htmlFor={id}>
          {label}
        </label>
        <span className="duration-value" aria-live="polite">
          {formatDuration(minutes * 60)}
        </span>
      </div>
      <input
        aria-valuemax={max}
        aria-valuemin={min}
        aria-valuenow={minutes}
        aria-valuetext={formatDuration(minutes * 60)}
        className="duration-slider"
        id={id}
        max={max}
        min={min}
        onChange={(event) => onChangeMinutes(Number(event.currentTarget.value))}
        step={1}
        type="range"
        value={minutes}
      />
      <div className="duration-ends" aria-hidden="true">
        <span>{min} мин</span>
        <span>{max} мин</span>
      </div>
      {hint ? <p className="duration-hint">{hint}</p> : null}
    </div>
  );
}

function SettingsDialog({
  speechSeconds,
  researchSeconds,
  muted,
  disabled,
  onChangeSpeech,
  onChangeResearch,
  onChangeMuted,
  onOpenChange,
}: {
  speechSeconds: number;
  researchSeconds: number;
  muted: boolean;
  disabled: boolean;
  onChangeSpeech: (seconds: number) => void;
  onChangeResearch: (seconds: number) => void;
  onChangeMuted: (muted: boolean) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dialogId = useId();
  const titleId = useId();
  const muteId = useId();

  const close = useCallback(() => {
    setOpen(false);
    onOpenChange(false);
    triggerRef.current?.focus();
  }, [onOpenChange]);

  function show() {
    setOpen(true);
    onOpenChange(true);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeydown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    }

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [close, open]);

  useEffect(() => {
    if (disabled && open) {
      setOpen(false);
      onOpenChange(false);
    }
  }, [disabled, onOpenChange, open]);

  useEffect(() => {
    if (open) {
      panelRef.current?.querySelector<HTMLElement>("input, button")?.focus();
    }
  }, [open]);

  const overlay =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="settings-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                close();
              }
            }}
            role="presentation"
          >
            <div
              aria-labelledby={titleId}
              aria-modal="true"
              className="settings-panel"
              id={dialogId}
              ref={panelRef}
              role="dialog"
            >
              <header className="settings-panel-head">
                <h2 className="settings-panel-title" id={titleId}>
                  Настройки
                </h2>
                <p className="settings-panel-blurb">
                  Длительность таймеров в целых минутах.
                </p>
              </header>

              <DurationField
                label="Речь"
                max={10}
                min={1}
                minutes={Math.round(speechSeconds / 60)}
                onChangeMinutes={(minutes) => onChangeSpeech(minutes * 60)}
              />
              <DurationField
                hint="Только для deep research"
                label="Research"
                max={60}
                min={1}
                minutes={Math.round(researchSeconds / 60)}
                onChangeMinutes={(minutes) => onChangeResearch(minutes * 60)}
              />

              <div className="settings-mute">
                <input
                  checked={muted}
                  id={muteId}
                  onChange={(event) => onChangeMuted(event.currentTarget.checked)}
                  type="checkbox"
                />
                <label htmlFor={muteId}>Выключить звуки</label>
              </div>
              <p className="settings-note">Сохраним для следующего раза.</p>
              <button className="btn primary settings-done" onClick={close} type="button">
                Готово
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={`settings ${open ? "is-open" : ""}`}>
      <button
        aria-controls={open ? dialogId : undefined}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Настройки"
        className="settings-trigger"
        disabled={disabled}
        onClick={() => (open ? close() : show())}
        ref={triggerRef}
        title="Настройки"
        type="button"
      >
        <Settings aria-hidden="true" />
      </button>
      {overlay}
    </div>
  );
}

function NicheSelect({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();
  const selectedIndex = Math.max(0, OFF_GROUPS.findIndex((group) => group.id === value));
  const selected = OFF_GROUPS[selectedIndex] ?? OFF_GROUPS[0];

  function close(restoreFocus = false) {
    setOpen(false);

    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }

  function choose(index: number) {
    const next = OFF_GROUPS[index];

    if (!next) {
      return;
    }

    onChange(next.id);
    close(true);
  }

  useEffect(() => {
    if (open) {
      optionRefs.current[activeIndex]?.focus();
    }
  }, [activeIndex, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleMouseDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % OFF_GROUPS.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + OFF_GROUPS.length) % OFF_GROUPS.length);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(OFF_GROUPS.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(activeIndex);
        break;
      case "Escape":
        event.preventDefault();
        close(true);
        break;
    }
  }

  return (
    <div className={`niche-select ${open ? "is-open" : ""}`} ref={rootRef}>
      <button
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="niche-trigger"
        disabled={disabled}
        onClick={() => {
          setActiveIndex(selectedIndex);
          setOpen((current) => !current);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex(selectedIndex);
            setOpen(true);
          }
        }}
        ref={triggerRef}
        type="button"
      >
        <span className="niche-emoji" aria-hidden="true">
          {selected.emoji}
        </span>
        <span className="niche-label">{selected.label}</span>
        <span className="niche-caret" aria-hidden="true" />
      </button>

      {open ? (
        <div
          aria-label="Ниша темы"
          className="niche-menu"
          id={menuId}
          onKeyDown={handleMenuKeyDown}
          role="listbox"
        >
          {OFF_GROUPS.map((group, index) => (
            <button
              aria-selected={group.id === value}
              className={`niche-option ${group.id === value ? "is-active" : ""}`}
              key={group.id}
              onClick={() => choose(index)}
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              role="option"
              tabIndex={index === activeIndex ? 0 : -1}
              type="button"
            >
              <span className="niche-emoji" aria-hidden="true">
                {group.emoji}
              </span>
              <span>{group.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ModeSwitch({
  value,
  disabled,
  onChange,
}: {
  value: ModeId;
  disabled: boolean;
  onChange: (value: ModeId) => void;
}) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = Math.max(0, MODES.findIndex((mode) => mode.id === value));

  function move(nextIndex: number) {
    const normalized = (nextIndex + MODES.length) % MODES.length;
    onChange(MODES[normalized].id);
    optionRefs.current[normalized]?.focus();
  }

  return (
    <div
      aria-label="Режим практики"
      className={`mode-switch ${disabled ? "is-disabled" : ""}`}
      onKeyDown={(event) => {
        switch (event.key) {
          case "ArrowRight":
          case "ArrowDown":
            event.preventDefault();
            move(activeIndex + 1);
            break;
          case "ArrowLeft":
          case "ArrowUp":
            event.preventDefault();
            move(activeIndex - 1);
            break;
        }
      }}
      role="radiogroup"
    >
      <span
        className="mode-thumb"
        aria-hidden="true"
        style={{ "--i": activeIndex } as CSSProperties}
      />
      {MODES.map((mode, index) => {
        const active = mode.id === value;

        return (
          <button
            aria-checked={active}
            className={`mode-option ${active ? "is-active" : ""}`}
            disabled={disabled}
            key={mode.id}
            onClick={() => onChange(mode.id)}
            ref={(node) => {
              optionRefs.current[index] = node;
            }}
            role="radio"
            tabIndex={active ? 0 : -1}
            type="button"
          >
            <span className="mode-emoji" aria-hidden="true">
              {mode.emoji}
            </span>
            <span className="mode-label">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [mode, setMode] = useState<ModeId>("off-the-cuff");
  const [niche, setNiche] = useState("general");
  const [speechSeconds, setSpeechSeconds] = useState(60);
  const [researchSeconds, setResearchSeconds] = useState(600);
  const [muted, setMuted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [displayTopic, setDisplayTopic] = useState(GROUPS[0].topics[0]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isLanded, setIsLanded] = useState(false);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [remaining, setRemaining] = useState(60);
  const [reelKey, setReelKey] = useState(0);
  const topicIndexRef = useRef(0);
  const spinFrameRef = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  const activeTopics = useMemo(
    () => (mode === "deep-research" ? DEEP_GROUP.topics : getGroup(niche).topics),
    [mode, niche],
  );

  const activeMode = MODES.find((item) => item.id === mode) ?? MODES[0];
  const timerOpen = timerState !== "idle";
  const isResearchTimer = timerState === "research";
  const isSpeechTimer = timerState === "speech" || timerState === "done";
  const isBusy = isSpinning || timerOpen;
  const controlsDisabled = isBusy || settingsOpen;
  const currentTotal = isResearchTimer ? researchSeconds : speechSeconds;
  const progress = timerState === "ready" ? 0 : timerOpen ? timerProgress(remaining, currentTotal) : 0;
  const stageHits = speechStageCount(remaining, speechSeconds, timerState === "done");
  const showSpeechStages = mode === "off-the-cuff" && isSpeechTimer;
  const speechClock = formatDigits(speechSeconds);
  const researchClock = formatDigits(researchSeconds);
  const challengeTitle =
    mode === "deep-research"
      ? "Сложная тема. Research. Речь."
      : `${speechClock}. Случайная тема.`;
  const challengeSubtitle =
    mode === "deep-research"
      ? `Сначала ${formatDuration(researchSeconds)} на разбор, потом ${formatDuration(
          speechSeconds,
        )} на объяснение без шпаргалок.`
      : "Без подготовки, без дублей, без безопасной темы заранее.";
  const stakeItems =
    mode === "deep-research"
      ? [
          ["Тема", "сложная"],
          ["Research", researchClock],
          ["Речь", speechClock],
        ]
      : [
          ["Тема", "случайная"],
          ["Подготовка", "0:00"],
          ["Речь", speechClock],
        ];

  useEffect(() => {
    setSpeechSeconds(getSavedSeconds("speech", 60, 1, 10));
    setResearchSeconds(getSavedSeconds("research", 600, 1, 60));
    setMuted(getSavedBoolean("muted", false));
  }, []);

  useEffect(() => {
    saveValue("speech", clampSeconds(speechSeconds, 1, 10));
  }, [speechSeconds]);

  useEffect(() => {
    saveValue("research", clampSeconds(researchSeconds, 1, 60));
  }, [researchSeconds]);

  useEffect(() => {
    saveValue("muted", muted);
  }, [muted]);

  useEffect(() => {
    if (timerState === "idle") {
      setRemaining(speechSeconds);
    }
  }, [speechSeconds, timerState]);

  useEffect(() => {
    if (timerState === "idle" || timerState === "ready") {
      return;
    }

    const interval = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerState]);

  useEffect(() => {
    if (remaining > 0) {
      return;
    }

    if (timerState === "research") {
      finishResearch();
      return;
    }

    if (timerState === "speech") {
      setTimerState("done");
      playFinish();
    }
  }, [remaining, timerState]);

  useEffect(() => {
    return () => {
      if (spinFrameRef.current !== null) {
        window.cancelAnimationFrame(spinFrameRef.current);
      }
    };
  }, []);

  const playNotes = useCallback(
    (notes: number[]) => {
      if (muted || typeof window === "undefined") {
        return;
      }

      const AudioContextCtor =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextCtor) {
        return;
      }

      const context = audioRef.current ?? new AudioContextCtor();
      audioRef.current = context;
      const gain = context.createGain();
      gain.gain.value = 0.16;
      gain.connect(context.destination);

      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const noteGain = context.createGain();
        oscillator.frequency.value = frequency;
        oscillator.type = "triangle";
        noteGain.gain.setValueAtTime(0.0001, context.currentTime + index * 0.08);
        noteGain.gain.exponentialRampToValueAtTime(0.36, context.currentTime + index * 0.08 + 0.01);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + index * 0.08 + 0.28);
        oscillator.connect(noteGain);
        noteGain.connect(gain);
        oscillator.start(context.currentTime + index * 0.08);
        oscillator.stop(context.currentTime + index * 0.08 + 0.3);
      });
    },
    [muted],
  );

  const playSpin = useCallback(() => playNotes([523.25, 659.25, 783.99]), [playNotes]);
  const playFinish = useCallback(() => playNotes([392, 523.25, 659.25, 784]), [playNotes]);

  function resetTopicPool(nextTopics: string[]) {
    const nextTopic = randomTopic(nextTopics);
    topicIndexRef.current = Math.max(0, nextTopics.indexOf(nextTopic));
    setDisplayTopic(nextTopic);
    setSelectedTopic(null);
    setIsLanded(false);
    setReelKey((key) => key + 1);
  }

  function changeMode(nextMode: ModeId) {
    if (isBusy || nextMode === mode) {
      return;
    }

    setMode(nextMode);
    resetTopicPool(nextMode === "deep-research" ? DEEP_GROUP.topics : getGroup(niche).topics);
  }

  function changeNiche(nextNiche: string) {
    if (isBusy) {
      return;
    }

    setNiche(nextNiche);
    resetTopicPool(getGroup(nextNiche).topics);
  }

  function spin() {
    if (isBusy || activeTopics.length === 0) {
      return;
    }

    playSpin();
    setIsSpinning(true);
    setIsLanded(false);
    setSelectedTopic(null);

    if (spinFrameRef.current !== null) {
      window.cancelAnimationFrame(spinFrameRef.current);
    }

    const startedAt = performance.now();
    const startIndex = topicIndexRef.current;
    const plan = spinPlan(startIndex, activeTopics.length);

    const frame = (time: number) => {
      const raw = Math.min(1, (time - startedAt) / SPIN_DURATION);
      const eased = easeOutCubic(raw);
      const step = Math.min(plan.totalSteps, Math.floor(eased * plan.totalSteps));
      const index = (startIndex + step) % activeTopics.length;

      setDisplayTopic(activeTopics[index] ?? activeTopics[0] ?? "");
      setReelKey((key) => key + 1);

      if (raw < 1) {
        spinFrameRef.current = window.requestAnimationFrame(frame);
        return;
      }

      topicIndexRef.current = plan.landIndex;
      const landedTopic = activeTopics[plan.landIndex] ?? activeTopics[0] ?? "";
      setDisplayTopic(landedTopic);
      setSelectedTopic(landedTopic);
      setIsSpinning(false);
      setIsLanded(true);
      playFinish();
      spinFrameRef.current = null;
    };

    spinFrameRef.current = window.requestAnimationFrame(frame);
  }

  function startSpeech() {
    setTimerState("speech");
    setRemaining(speechSeconds);
    playSpin();
  }

  function startTimer() {
    if (!selectedTopic || isBusy) {
      return;
    }

    if (mode === "deep-research") {
      setTimerState("research");
      setRemaining(researchSeconds);
    } else {
      setTimerState("speech");
      setRemaining(speechSeconds);
    }

    playSpin();
  }

  function finishResearch() {
    setTimerState("ready");
    setRemaining(speechSeconds);
    playFinish();
  }

  function closeTimer() {
    setTimerState("idle");
    setRemaining(speechSeconds);
  }

  const timerLabel =
    timerState === "research"
      ? "Research timer"
      : timerState === "ready"
        ? "Готов говорить"
        : "Таймер речи";

  const timerStatus =
    timerState === "research"
      ? "Research."
      : timerState === "ready"
        ? "Research завершён."
        : timerState === "done"
          ? "Время."
          : "Говори.";

  const primaryLabel =
    timerState === "ready"
      ? `Начать речь ${speechClock}`
      : mode === "deep-research"
        ? `Research ${researchClock}`
        : `Старт ${speechClock}`;

  return (
    <main className={`page challenge-page ${mode === "deep-research" ? "is-research-mode" : ""}`}>
      <div className="atmosphere" aria-hidden="true" />

      <header className="brand challenge-brand">
        <div className="brand-lockup">
          <p className="brand-kicker">говорю на рандомную тему</p>
          <h1 className="brand-mark">thinkQuick</h1>
        </div>
        <p className="brand-line">
          <span className="record-pill" aria-label="Челлендж записывается">
            <span className="record-dot" aria-hidden="true" />
            REC challenge
          </span>
          <a className="brand-link" href="https://chatgpt.com">
            <AtSign className="brand-link-icon" aria-hidden="true" />
            практика
          </a>
        </p>
      </header>

      <section className="stage challenge-stage" aria-label="Тренировка речи">
        <div className="challenge-topbar">
          <ModeSwitch value={mode} disabled={controlsDisabled} onChange={changeMode} />
          <SettingsDialog
            disabled={isBusy}
            muted={muted}
            onChangeMuted={setMuted}
            onChangeResearch={(seconds) => setResearchSeconds(clampSeconds(seconds, 1, 60))}
            onChangeSpeech={(seconds) => setSpeechSeconds(clampSeconds(seconds, 1, 10))}
            onOpenChange={setSettingsOpen}
            researchSeconds={researchSeconds}
            speechSeconds={speechSeconds}
          />
        </div>

        <div className="challenge-hero">
          <div className="challenge-copy">
            <p className="challenge-kicker">
              {mode === "deep-research" ? "Deep research mode" : "Off the cuff mode"}
            </p>
            <h2 className="challenge-title">{challengeTitle}</h2>
            <p className="challenge-subtitle">{challengeSubtitle}</p>
          </div>

          <div className="challenge-clock" aria-label={`Время речи ${formatDuration(speechSeconds)}`}>
            <span className="challenge-clock-label">на речь</span>
            <strong>{speechClock}</strong>
            {mode === "deep-research" ? (
              <span className="challenge-clock-note">research {researchClock}</span>
            ) : (
              <span className="challenge-clock-note">без подготовки</span>
            )}
          </div>
        </div>

        <div className="challenge-stakes" aria-label="Условия челленджа">
          {stakeItems.map(([label, value]) => (
            <span className="stake" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </span>
          ))}
        </div>

        <div className="stage-body challenge-body">
          <div className="controls challenge-controls">
            {mode === "off-the-cuff" ? (
              <NicheSelect value={niche} disabled={isBusy} onChange={changeNiche} />
            ) : null}
            <p className="mode-blurb">{activeMode.blurb}</p>
          </div>

          <div
            className={`reel challenge-reel ${isSpinning ? "is-spinning" : ""} ${
              isLanded ? "is-landed" : ""
            }`}
          >
            <p className="reel-eyebrow">
              {isSpinning ? "3... 2... 1..." : selectedTopic ? "Тема выпала" : "Сейчас выпадет"}
            </p>
            <p
              className={`reel-phrase ${topicLengthClass(displayTopic)}`}
              key={reelKey}
            >
              {displayTopic || "Тема"}
            </p>
            <p className="sr-only" aria-live="polite">
              {selectedTopic ? `Твоя тема: ${selectedTopic}` : ""}
            </p>
          </div>

          <div className="actions">
            <div className="actions-main" aria-disabled={isBusy || undefined}>
              <button className="btn primary" disabled={isBusy} onClick={spin} type="button">
                <Shuffle className="btn-icon" aria-hidden="true" />
                {isSpinning ? "Крутится..." : selectedTopic ? "Крутить ещё" : "Крутить"}
              </button>
              <button
                className="btn secondary"
                disabled={!selectedTopic || isBusy}
                onClick={startTimer}
                type="button"
              >
                <Play className="btn-icon" aria-hidden="true" />
                {primaryLabel}
              </button>
            </div>
          </div>
        </div>
      </section>

      {timerOpen ? (
        <div
          aria-label={timerLabel}
          aria-modal="true"
          className={`timer-overlay ${timerState === "done" ? "is-done" : "is-live"} ${
            isResearchTimer ? "is-research" : ""
          } ${
            timerState === "speech" && remaining <= 10
              ? "is-final-seconds"
              : timerState === "speech" && remaining <= 20
                ? "is-warning-seconds"
                : ""
          }`}
          role="dialog"
        >
          <div className="timer-overlay-inner">
            {selectedTopic ? <p className="timer-topic">{selectedTopic}</p> : null}
            {isResearchTimer ? <p className="timer-phase">Исследование</p> : null}

            {showSpeechStages ? (
              <ol className="speech-stages" aria-label="Дуга речи">
                {SPEECH_STAGES.map((stage, index) => (
                  <li
                    className={`speech-stage ${
                      index < stageHits ? "is-hit" : "is-pending"
                    }`}
                    key={stage}
                  >
                    <span className="speech-stage-label">{stage}</span>
                  </li>
                ))}
              </ol>
            ) : null}

            <div
              className="timer-ring"
              role="timer"
              style={{ "--p": progress } as CSSProperties}
            >
              <span className="timer-digits">{formatDigits(remaining)}</span>
            </div>
            <p className="timer-status" aria-live="polite">
              {timerStatus}
            </p>
            {timerState === "ready" ? (
              <p className="timer-next">
                Дальше: {formatDuration(speechSeconds)} речи.
              </p>
            ) : null}
            <div className="timer-actions">
              {isResearchTimer ? (
                <button className="btn primary" onClick={finishResearch} type="button">
                  Закончить research
                </button>
              ) : null}
              {timerState === "ready" ? (
                <button className="btn primary" onClick={startSpeech} type="button">
                  <Play className="btn-icon" aria-hidden="true" />
                  Я готов говорить
                </button>
              ) : null}
              {timerState === "done" ? (
                <button className="btn primary" onClick={closeTimer} type="button">
                  <Shuffle className="btn-icon" aria-hidden="true" />
                  Ещё тема
                </button>
              ) : null}
              <button className="btn ghost" onClick={closeTimer} type="button">
                Закрыть
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
