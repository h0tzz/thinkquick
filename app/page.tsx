"use client";

import { Play, Settings, Shuffle } from "lucide-react";
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

type ModeId = "off-the-cuff" | "deep-research" | "debate";
type DebatePositionId = "pro" | "con";
type TimerState = "idle" | "research" | "ready" | "speech" | "done";
type SpinStage = "idle" | "accelerating" | "cruising" | "locking" | "landed";
type AudioNote = {
  frequency: number;
  at: number;
  duration: number;
  peak: number;
  type?: OscillatorType;
  glideTo?: number;
};

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
    label: "С разбором",
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
      "Тревожное избегание",
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

const DEBATE_TOPICS = [
  "ИИ должен заменить экзамены",
  "Школы должны отменить оценки",
  "Удалёнка лучше офиса",
  "Соцсети должны скрыть лайки",
  "Базовый доход нужен всем",
  "Смартфоны детям до 14 лет нужно запретить",
  "Города должны ограничить личные автомобили",
  "Университет больше не обязателен",
  "Налог на роскошь должен быть выше",
  "Алгоритмы рекомендаций вредят обществу",
  "Домашние задания нужно отменить",
  "Четырёхдневная рабочая неделя должна стать нормой",
  "Анонимность в интернете нужно ограничить",
  "Платное образование мотивирует лучше",
  "Короткие видео ухудшают внимание",
  "Государство должно жёстко регулировать ИИ",
  "Большие города делают людей счастливее",
  "Криптовалюты полезны экономике",
  "Реклама детям должна быть запрещена",
  "Личная эффективность переоценена",
  "Компании должны публиковать зарплатные вилки",
  "Оценивать людей по дипломам устарело",
  "Мясо должно стать дороже из-за экологии",
  "Камеры наблюдения делают город безопаснее",
  "Игры могут быть полноценным образованием",
  "Работа мечты - вредная идея",
  "Электронное голосование лучше бумажного",
  "Нужно вводить налог на роботов",
  "Искусство, созданное ИИ, настоящее искусство",
  "Блогеры влияют сильнее журналистов",
];

const DEBATE_POSITIONS = [
  { id: "pro", label: "За", short: "ЗА", tone: "is-pro" },
  { id: "con", label: "Против", short: "ПРОТИВ", tone: "is-con" },
] as const;

const MODES = [
  {
    id: "deep-research" as const,
    label: "С разбором",
    emoji: "🔍",
    blurb:
      "Крути тему, разбирайся в ней по таймеру, потом объясняй своими словами.",
  },
  {
    id: "off-the-cuff" as const,
    label: "Экспромт",
    emoji: "🧠",
    blurb: "Минимум подготовки. Думай быстро, пока говоришь.",
  },
  {
    id: "debate" as const,
    label: "Дебаты",
    emoji: "⚖️",
    blurb: "Выпадает тема и сторона. Докажи позицию, даже если не согласен.",
  },
];

const STORAGE_PREFIX = "thinkquick:";
const SPIN_DURATION = 2500;
const FORCED_SPIN_TOPIC = "Тревожное избегание";

function getGroup(id: string) {
  return GROUPS.find((group) => group.id === id) ?? GROUPS[0];
}

function topicsForMode(mode: ModeId, nicheId: string) {
  if (mode === "deep-research") {
    return DEEP_GROUP.topics;
  }

  if (mode === "debate") {
    return DEBATE_TOPICS;
  }

  return getGroup(nicheId).topics;
}

function randomTopic(topics: string[]) {
  return topics[Math.floor(Math.random() * topics.length)] ?? topics[0] ?? "";
}

function randomDebatePosition() {
  return DEBATE_POSITIONS[Math.floor(Math.random() * DEBATE_POSITIONS.length)]?.id ?? "pro";
}

function getDebatePosition(id: DebatePositionId | null) {
  return DEBATE_POSITIONS.find((position) => position.id === id) ?? null;
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

function topicAtOffset(topics: string[], topic: string, offset: number) {
  if (topics.length === 0) {
    return "";
  }

  const index = Math.max(0, topics.indexOf(topic));
  return topics[(index + offset + topics.length) % topics.length] ?? "";
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    Boolean(target.closest("[role='textbox']"))
  );
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      "button, a, input, textarea, select, [role='button'], [role='radio'], [role='option'], [role='slider']",
    ),
  );
}

function isSpinShortcutKey(event: globalThis.KeyboardEvent) {
  return event.key === "Enter" || event.key === " " || event.key === "Spacebar";
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
  const progress = ((minutes - min) / (max - min)) * 100;

  return (
    <div className="duration-field">
      <div className="duration-head">
        <div className="duration-copy">
          <label className="duration-label" htmlFor={id}>
            {label}
          </label>
          {hint ? <p className="duration-hint">{hint}</p> : null}
        </div>
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
        style={{ "--progress": `${progress}%` } as CSSProperties}
        type="range"
        value={minutes}
      />
      <div className="duration-ends" aria-hidden="true">
        <span>{min} мин</span>
        <span>{max} мин</span>
      </div>
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
  const soundId = useId();

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
                  Таймеры челленджа и звук рулетки.
                </p>
              </header>

              <div className="settings-list">
                <DurationField
                  hint="Экспромт, дебаты и финальная речь после разбора."
                  label="Время речи"
                  max={10}
                  min={1}
                  minutes={Math.round(speechSeconds / 60)}
                  onChangeMinutes={(minutes) => onChangeSpeech(minutes * 60)}
                />
                <DurationField
                  hint="Только для режима «С разбором»."
                  label="Подготовка"
                  max={60}
                  min={1}
                  minutes={Math.round(researchSeconds / 60)}
                  onChangeMinutes={(minutes) => onChangeResearch(minutes * 60)}
                />

                <label className="settings-toggle" htmlFor={soundId}>
                  <span className="settings-toggle-copy">
                    <span className="settings-toggle-title">Звук рулетки</span>
                    <span className="settings-toggle-hint">
                      Щелчки при прокрутке и финальный акцент.
                    </span>
                  </span>
                  <input
                    checked={!muted}
                    className="sr-only"
                    id={soundId}
                    onChange={(event) => onChangeMuted(!event.currentTarget.checked)}
                    type="checkbox"
                  />
                  <span className="settings-switch" aria-hidden="true">
                    <span />
                  </span>
                </label>
              </div>

              <p className="settings-note">Сохраняется в этом браузере.</p>
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
  const [mode, setMode] = useState<ModeId>("deep-research");
  const [niche, setNiche] = useState("general");
  const [speechSeconds, setSpeechSeconds] = useState(60);
  const [researchSeconds, setResearchSeconds] = useState(600);
  const [muted, setMuted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [displayTopic, setDisplayTopic] = useState(DEEP_GROUP.topics[0]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [debatePosition, setDebatePosition] = useState<DebatePositionId | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isLanded, setIsLanded] = useState(false);
  const [spinStage, setSpinStage] = useState<SpinStage>("idle");
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [remaining, setRemaining] = useState(60);
  const [reelKey, setReelKey] = useState(0);
  const topicIndexRef = useRef(0);
  const spinFrameRef = useRef<number | null>(null);
  const lastSpinStepRef = useRef(0);
  const lastTickAtRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);

  const activeTopics = useMemo(() => topicsForMode(mode, niche), [mode, niche]);
  const currentDebatePosition = getDebatePosition(debatePosition);

  const timerOpen = timerState !== "idle";
  const isResearchTimer = timerState === "research";
  const isBusy = isSpinning || timerOpen;
  const controlsDisabled = isBusy || settingsOpen;
  const currentTotal = isResearchTimer ? researchSeconds : speechSeconds;
  const progress = timerState === "ready" ? 0 : timerOpen ? timerProgress(remaining, currentTotal) : 0;
  const speechClock = formatDigits(speechSeconds);
  const researchClock = formatDigits(researchSeconds);
  const challengeTitle =
    mode === "deep-research"
      ? "Разбери тему. Объясни просто."
      : mode === "debate"
        ? "Тема и позиция выпадут сами."
      : "Сразу в речь.";
  const challengeSubtitle =
    mode === "deep-research"
      ? `${formatDuration(researchSeconds)} на подготовку, затем ${formatDuration(
          speechSeconds,
        )} речи без шпаргалки.`
      : mode === "debate"
        ? `За или против. У тебя ${formatDuration(
            speechSeconds,
          )}, чтобы собрать убедительный аргумент.`
      : `Лёгкая тема, ${formatDuration(speechSeconds)} и никакой подготовки.`;
  const challengeKicker =
    mode === "deep-research" ? "режим с разбором" : mode === "debate" ? "режим дебатов" : "режим экспромта";
  const previousTopic = topicAtOffset(activeTopics, displayTopic, -1);
  const nextTopic = topicAtOffset(activeTopics, displayTopic, 1);
  const spinStageLabel =
    isSpinning
      ? spinStage === "locking"
        ? "фиксируем"
        : spinStage === "cruising"
          ? "выбор"
          : "старт"
      : selectedTopic
        ? mode === "debate"
          ? "позиция"
          : "тема"
        : "клик / enter";
  const selectedTopicLabel =
    selectedTopic && currentDebatePosition
      ? `${currentDebatePosition.label}: ${selectedTopic}`
      : selectedTopic;

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

  const getAudioContext = useCallback(() => {
    if (muted || typeof window === "undefined") {
      return null;
    }

    const AudioContextCtor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) {
      return null;
    }

    const context = audioRef.current ?? new AudioContextCtor();
    audioRef.current = context;
    void context.resume?.();

    return context;
  }, [muted]);

  const playChime = useCallback(
    (notes: AudioNote[]) => {
      if (muted || typeof window === "undefined") {
        return;
      }

      const context = getAudioContext();
      if (!context) {
        return;
      }

      const master = context.createGain();
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 5200;
      filter.Q.value = 0.5;
      master.gain.value = 0.72;
      master.connect(filter);
      filter.connect(context.destination);

      notes.forEach((note) => {
        const start = context.currentTime + note.at;
        const end = start + note.duration;
        const oscillator = context.createOscillator();
        const noteGain = context.createGain();

        oscillator.type = note.type ?? "sine";
        oscillator.frequency.setValueAtTime(note.frequency, start);

        if (note.glideTo) {
          oscillator.frequency.exponentialRampToValueAtTime(note.glideTo, end);
        }

        noteGain.gain.setValueAtTime(0.0001, start);
        noteGain.gain.exponentialRampToValueAtTime(note.peak, start + 0.014);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, end);
        oscillator.connect(noteGain);
        noteGain.connect(master);
        oscillator.start(start);
        oscillator.stop(end + 0.02);
      });
    },
    [getAudioContext, muted],
  );

  const playSpin = useCallback(
    () =>
      playChime([
        { frequency: 392, at: 0, duration: 0.14, peak: 0.11, type: "sine" },
        { frequency: 523.25, at: 0.055, duration: 0.16, peak: 0.1, type: "triangle" },
        { frequency: 659.25, at: 0.12, duration: 0.22, peak: 0.09, type: "sine" },
      ]),
    [playChime],
  );
  const playFinish = useCallback(
    () =>
      playChime([
        { frequency: 523.25, at: 0, duration: 0.22, peak: 0.12, type: "sine" },
        { frequency: 659.25, at: 0.07, duration: 0.24, peak: 0.11, type: "triangle" },
        { frequency: 783.99, at: 0.14, duration: 0.28, peak: 0.1, type: "sine" },
        { frequency: 1046.5, at: 0.25, duration: 0.42, peak: 0.07, type: "sine" },
      ]),
    [playChime],
  );
  const playTick = useCallback(
    (progressValue: number) => {
      const context = getAudioContext();
      if (!context) {
        return;
      }

      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      const clickLength = 0.052 + progressValue * 0.05;
      const volume = 0.04 + progressValue * 0.055;
      const startFrequency = 620 - progressValue * 180;
      const endFrequency = 420 - progressValue * 110;

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(startFrequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + clickLength);
      filter.type = "lowpass";
      filter.frequency.value = 2100 - progressValue * 620;
      filter.Q.value = 0.75;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + clickLength);
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + clickLength + 0.01);
    },
    [getAudioContext],
  );

  function resetTopicPool(nextTopics: string[]) {
    const nextTopic = randomTopic(nextTopics);
    topicIndexRef.current = Math.max(0, nextTopics.indexOf(nextTopic));
    setDisplayTopic(nextTopic);
    setSelectedTopic(null);
    setDebatePosition(null);
    setIsLanded(false);
    setSpinStage("idle");
    setReelKey((key) => key + 1);
  }

  function changeMode(nextMode: ModeId) {
    if (isBusy || nextMode === mode) {
      return;
    }

    setMode(nextMode);
    resetTopicPool(topicsForMode(nextMode, niche));
  }

  function changeNiche(nextNiche: string) {
    if (isBusy) {
      return;
    }

    setNiche(nextNiche);
    resetTopicPool(topicsForMode(mode, nextNiche));
  }

  const spin = useCallback(() => {
    if (isBusy || activeTopics.length === 0) {
      return;
    }

    playSpin();
    setIsSpinning(true);
    setIsLanded(false);
    setSpinStage("accelerating");
    setSelectedTopic(null);
    setDebatePosition(null);

    if (spinFrameRef.current !== null) {
      window.cancelAnimationFrame(spinFrameRef.current);
    }

    const startedAt = performance.now();
    const startIndex = topicIndexRef.current;
    const plan = spinPlan(startIndex, activeTopics.length);
    lastSpinStepRef.current = 0;
    lastTickAtRef.current = startedAt;

    const frame = () => {
      const now = performance.now();
      const raw = Math.min(1, (now - startedAt) / SPIN_DURATION);
      const eased = easeOutCubic(raw);
      const step = Math.min(plan.totalSteps, Math.floor(eased * plan.totalSteps));
      const index = (startIndex + step) % activeTopics.length;
      const nextStage: SpinStage =
        raw > 0.76 ? "locking" : raw > 0.2 ? "cruising" : "accelerating";

      setSpinStage(nextStage);

      if (step !== lastSpinStepRef.current) {
        setDisplayTopic(activeTopics[index] ?? activeTopics[0] ?? "");
        setReelKey((key) => key + 1);

        const minTickGap = raw > 0.78 ? 54 : raw > 0.55 ? 40 : 26;
        if (now - lastTickAtRef.current >= minTickGap) {
          playTick(raw);
          lastTickAtRef.current = now;
        }

        lastSpinStepRef.current = step;
      }

      if (raw < 1) {
        spinFrameRef.current = window.requestAnimationFrame(frame);
        return;
      }

      const forcedTopicIndex = activeTopics.indexOf(FORCED_SPIN_TOPIC);
      const landedIndex = forcedTopicIndex >= 0 ? forcedTopicIndex : plan.landIndex;
      topicIndexRef.current = landedIndex;
      const landedTopic = FORCED_SPIN_TOPIC;
      setDisplayTopic(landedTopic);
      setSelectedTopic(landedTopic);
      setDebatePosition(mode === "debate" ? randomDebatePosition() : null);
      setIsSpinning(false);
      setIsLanded(true);
      setSpinStage("landed");
      playFinish();
      spinFrameRef.current = null;
    };

    spinFrameRef.current = window.requestAnimationFrame(frame);
  }, [activeTopics, isBusy, mode, playFinish, playSpin, playTick]);

  useEffect(() => {
    function handleKeydown(event: globalThis.KeyboardEvent) {
      if (event.defaultPrevented || event.repeat || !isSpinShortcutKey(event)) {
        return;
      }

      if (
        isEditableTarget(event.target) ||
        isInteractiveTarget(event.target) ||
        controlsDisabled ||
        activeTopics.length === 0
      ) {
        return;
      }

      event.preventDefault();
      spin();
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [activeTopics.length, controlsDisabled, spin]);

  function startSpeech() {
    setTimerState("speech");
    setRemaining(speechSeconds);
    playSpin();
  }

  function startTimer() {
    if (!selectedTopic || isBusy || (mode === "debate" && !debatePosition)) {
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
      ? "Таймер разбора"
      : timerState === "ready"
        ? "Готов говорить"
        : mode === "debate"
          ? "Таймер дебатов"
          : "Таймер речи";

  const timerStatus =
    timerState === "research"
      ? "Разбираемся."
      : timerState === "ready"
        ? "Разбор завершён."
        : timerState === "done"
          ? "Время."
          : mode === "debate"
            ? "Держи линию."
            : "Говори.";

  const primaryLabel =
    timerState === "ready"
      ? `Начать речь ${speechClock}`
      : mode === "deep-research"
        ? `Разбор ${researchClock}`
        : mode === "debate"
          ? `Аргументы ${speechClock}`
        : `Старт ${speechClock}`;

  return (
    <main
      className={`page challenge-page ${mode === "deep-research" ? "is-research-mode" : ""} ${
        mode === "debate" ? "is-debate-mode" : ""
      }`}
    >
      <div className="atmosphere" aria-hidden="true" />

      <header className="brand challenge-brand">
        <div className="brand-lockup">
          <h1 className="brand-mark">
            Думай быстро, говори ясно.
          </h1>
        </div>
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
              {challengeKicker}
            </p>
            <h2 className="challenge-title">{challengeTitle}</h2>
            <p className="challenge-subtitle">{challengeSubtitle}</p>
            {mode === "off-the-cuff" ? (
              <div className="controls challenge-controls">
                <NicheSelect value={niche} disabled={isBusy} onChange={changeNiche} />
              </div>
            ) : null}
          </div>
        </div>

      </section>

      <div className="stage-body challenge-body">
        <button
          aria-label={
            isSpinning
              ? "Рулетка крутится"
              : selectedTopic
                ? mode === "debate" && currentDebatePosition
                  ? `Тема выбрана: ${selectedTopic}. Позиция: ${currentDebatePosition.label}. Крутить ещё`
                  : `Тема выбрана: ${selectedTopic}. Крутить ещё`
                : "Крутить тему"
          }
          className={`reel challenge-reel is-${spinStage} ${isSpinning ? "is-spinning" : ""} ${
            isLanded ? "is-landed" : ""
          }`}
          disabled={controlsDisabled}
          onClick={spin}
          aria-keyshortcuts="Enter Space"
          type="button"
        >
          <div className="roulette-status" aria-hidden="true">
            <span className="roulette-dot" />
            <span>{spinStageLabel}</span>
          </div>
          <div className="reveal-stage">
            <span className="reveal-flash" aria-hidden="true" />
            <span className="reel-ghost is-prev" aria-hidden="true">
              {previousTopic}
            </span>
            <p
              className={`reel-phrase ${topicLengthClass(displayTopic)} ${
                mode === "debate" && currentDebatePosition ? "has-debate-position" : ""
              }`}
              key={reelKey}
            >
              {mode === "debate" && currentDebatePosition ? (
                <>
                  <span className="debate-position-meta">Твоя позиция</span>
                  <span className={`debate-side ${currentDebatePosition.tone}`}>
                    {currentDebatePosition.short}
                  </span>
                  <span className="reel-topic-text">{displayTopic || "Тема"}</span>
                </>
              ) : (
                <span className="reel-topic-text">{displayTopic || "Тема"}</span>
              )}
            </p>
            <span className="reel-ghost is-next" aria-hidden="true">
              {nextTopic}
            </span>
          </div>
          {isLanded ? (
            <div className="casino-sparks" aria-hidden="true">
              {Array.from({ length: 10 }, (_, index) => (
                <span key={index} />
              ))}
            </div>
          ) : null}
          <p className="sr-only" aria-live="polite">
            {selectedTopicLabel
              ? mode === "debate"
                ? `Твоя тема и позиция: ${selectedTopicLabel}`
                : `Твоя тема: ${selectedTopicLabel}`
              : ""}
          </p>
        </button>

        {selectedTopic ? (
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
        ) : null}
      </div>

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
            {selectedTopicLabel ? <p className="timer-topic">{selectedTopicLabel}</p> : null}
            {isResearchTimer ? <p className="timer-phase">Разбор</p> : null}

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
                  Закончить разбор
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
