import { ArrowLeft, Check, MessageCircleQuestion, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";

const STORAGE_KEY = "chord-tulza-survey-v2";
const DISMISS_FOR_MS = 30 * 24 * 60 * 60 * 1000;
const FORM_ACTION = "https://docs.google.com/forms/d/e/1FAIpQLSe9FThlfDRJLOJo9z0lUuEOr52qppMbsv1Eec1QXpKAcxULqg/formResponse";

const FORM_FIELDS = {
  frequency: "entry.232382321",
  goal: "entry.122178230",
  friction: "entry.2012861588",
  feature: "entry.178919732",
  payment: "entry.1168274726",
  price: "entry.913441010",
  details: "entry.1316376898",
  contact: "entry.1575555321",
} as const;

const QUESTIONS = [
  {
    id: "frequency",
    eyebrow: "Твой опыт",
    title: "Как часто ты сейчас пользуешься Chord Tulza?",
    options: [
      { id: "daily", label: "Почти каждый день" },
      { id: "weekly", label: "Несколько раз в неделю" },
      { id: "monthly", label: "Несколько раз в месяц" },
      { id: "tried", label: "Попробовал пару раз" },
      { id: "stopped", label: "Перестал пользоваться" },
    ],
  },
  {
    id: "goal",
    eyebrow: "Главный сценарий",
    title: "Для чего ты чаще всего её открываешь?",
    options: [
      { id: "progression", label: "Сочинить прогрессию" },
      { id: "next-chord", label: "Найти следующий аккорд" },
      { id: "voicing", label: "Подобрать аппликатуру" },
      { id: "learning", label: "Учиться играть" },
      { id: "exploring", label: "Просто экспериментировать" },
    ],
  },
  {
    id: "friction",
    eyebrow: "Что мешает",
    title: "Что больше всего мешает пользоваться чаще?",
    options: [
      { id: "saving", label: "Нельзя сохранять проекты" },
      { id: "sound", label: "Не хватает звучания, ритмов и баса" },
      { id: "midi", label: "Нужен MIDI‑экспорт" },
      { id: "device", label: "Неудобно на телефоне или планшете" },
      { id: "value", label: "Пока не вижу достаточной пользы" },
      { id: "other", label: "Другое" },
    ],
  },
  {
    id: "feature",
    eyebrow: "Платная ценность",
    title: "Какая одна функция сделала бы платную версию полезной лично для тебя?",
    options: [
      { id: "save", label: "Сохранение песен и прогрессий" },
      { id: "midi", label: "MIDI‑экспорт в GarageBand или Logic" },
      { id: "backing", label: "Ритмы, барабаны и бас" },
      { id: "pdf", label: "PDF с аккордами" },
      { id: "ipad", label: "Полноценная версия для iPad" },
      { id: "other", label: "Другое" },
    ],
  },
  {
    id: "payment",
    eyebrow: "Модель оплаты",
    title: "Как тебе было бы комфортнее заплатить?",
    options: [
      { id: "lifetime", label: "Один раз навсегда" },
      { id: "subscription", label: "Небольшая подписка" },
      { id: "features", label: "Только за отдельные функции" },
      { id: "free", label: "Не готов платить" },
    ],
  },
  {
    id: "price",
    eyebrow: "Последний вопрос",
    title: "Сколько ты реально готов заплатить за полезную тебе версию?",
    options: [
      { id: "490-once", label: "490 ₽ один раз" },
      { id: "990-once", label: "990 ₽ один раз" },
      { id: "1990-once", label: "1 990 ₽ один раз" },
      { id: "199-month", label: "199 ₽ в месяц" },
      { id: "399-month", label: "399 ₽ в месяц" },
      { id: "zero", label: "Пока нисколько" },
    ],
  },
] as const;

type QuestionId = typeof QUESTIONS[number]["id"];
type Answers = Partial<Record<QuestionId, string>>;

type StoredSurveyState = {
  completedAt?: number;
  dismissedAt?: number;
};

type Props = {
  blocked?: boolean;
  eligible: boolean;
};

function loadSurveyState(): StoredSurveyState {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as StoredSurveyState;
  } catch {
    return {};
  }
}

function saveSurveyState(state: StoredSurveyState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The survey can still work when storage is unavailable.
  }
}

export function buildSurveyPayload(answers: Answers, details = "", contact = "") {
  const body = new URLSearchParams();
  for (const question of QUESTIONS) {
    const answer = answers[question.id];
    if (answer) body.set(FORM_FIELDS[question.id], answer);
  }
  if (details.trim()) body.set(FORM_FIELDS.details, details.trim());
  if (contact.trim()) body.set(FORM_FIELDS.contact, contact.trim());
  return body;
}

async function submitAnswers(answers: Answers, details = "", contact = "") {
  await fetch(FORM_ACTION, {
    method: "POST",
    mode: "no-cors",
    body: buildSurveyPayload(answers, details, contact),
  });
}

export function isSurveyPreview(search: string) {
  return new URLSearchParams(search).get("survey") === "preview";
}

export function UserSurvey({ blocked = false, eligible }: Props) {
  const previewMode = isSurveyPreview(typeof window === "undefined" ? "" : window.location.search);
  const [visible, setVisible] = useState(previewMode);
  const [available, setAvailable] = useState(() => previewMode || !loadSurveyState().completedAt);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [details, setDetails] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    if (previewMode) {
      setAvailable(true);
      setVisible(true);
      return;
    }
    const stored = loadSurveyState();
    if (stored.completedAt) {
      setAvailable(false);
      return;
    }
    if (!eligible || autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    const dismissedRecently = stored.dismissedAt && Date.now() - stored.dismissedAt < DISMISS_FOR_MS;
    if (dismissedRecently) return;

    setVisible(true);
    track("survey_opened", { source: "automatic" });
  }, [eligible, previewMode]);

  if (!available || blocked) return null;

  const question = QUESTIONS[step];
  const isContactStep = step === QUESTIONS.length;

  const dismiss = () => {
    if (previewMode) {
      setVisible(false);
      return;
    }
    if (submitted) {
      setVisible(false);
      setAvailable(false);
      return;
    }
    saveSurveyState({ ...loadSurveyState(), dismissedAt: Date.now() });
    track("survey_dismissed", { step: Math.min(step + 1, QUESTIONS.length) });
    setVisible(false);
  };

  const openManually = () => {
    setVisible(true);
    if (!previewMode) track("survey_opened", { source: "launcher" });
  };

  const finish = async (nextAnswers: Answers, nextDetails = "", nextContact = "") => {
    setSubmitting(true);
    setError(false);
    try {
      if (!previewMode) {
        await submitAnswers(nextAnswers, nextDetails, nextContact);
        saveSurveyState({ ...loadSurveyState(), completedAt: Date.now() });
        track("survey_completed", {
          payment: nextAnswers.payment ?? "unknown",
          price: nextAnswers.price ?? "unknown",
        });
      }
      setSubmitted(true);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const answerQuestion = (option: { id: string; label: string }) => {
    if (!question) return;
    const nextAnswers = { ...answers, [question.id]: option.label };
    setAnswers(nextAnswers);
    if (!previewMode) track("survey_answered", { question: question.id, answer: option.id });

    setStep((current) => current + 1);
  };

  return (
    <div className="user-survey-widget">
      {visible && (
        <aside className="user-survey-shell" aria-live="polite">
          <section className="user-survey" aria-label="Опрос Chord Tulza">
            <button type="button" className="user-survey-close" onClick={dismiss} aria-label="Закрыть опрос">
              <X size={17} />
            </button>

            {submitted ? (
              <div className="user-survey-thanks">
                <span className="user-survey-check"><Check size={22} /></span>
                <h2>Спасибо!</h2>
                <p>Это правда поможет решить, что делать дальше.</p>
                <button
                  type="button"
                  className="user-survey-primary"
                  onClick={() => {
                    setVisible(false);
                    if (previewMode) {
                      setSubmitted(false);
                      setAnswers({});
                      setDetails("");
                      setContact("");
                      setStep(0);
                    } else {
                      setAvailable(false);
                    }
                  }}
                >
                  Готово
                </button>
              </div>
            ) : isContactStep ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void finish(answers, details, contact);
                }}
              >
                <button type="button" className="user-survey-back" onClick={() => setStep(QUESTIONS.length - 1)} aria-label="Назад">
                  <ArrowLeft size={15} />
                </button>
                <span className="user-survey-eyebrow">Можно подробнее</span>
                <h2>Хочешь что-то добавить?</h2>
                <p className="user-survey-copy">Оба поля необязательные. Их увидит только автор Chord Tulza.</p>
                <textarea
                  className="user-survey-input user-survey-textarea"
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder="Чего не хватает или что раздражает?"
                  rows={3}
                />
                <input
                  className="user-survey-input"
                  type="text"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder="@telegram или e‑mail — если можно написать"
                  autoComplete="email"
                />
                {error && <p className="user-survey-error">Не получилось отправить. Попробуй ещё раз.</p>}
                <button type="submit" className="user-survey-primary" disabled={submitting}>
                  {submitting ? "Отправляем…" : "Отправить ответы"}
                </button>
              </form>
            ) : question ? (
              <>
                {step > 0 && (
                  <button type="button" className="user-survey-back" onClick={() => setStep((current) => current - 1)} aria-label="Назад">
                    <ArrowLeft size={15} />
                  </button>
                )}
                <span className="user-survey-eyebrow">{question.eyebrow} · {step + 1}/{QUESTIONS.length}</span>
                <h2>{question.title}</h2>
                <div className="user-survey-options">
                  {question.options.map((option) => (
                    <button type="button" key={option.id} disabled={submitting} onClick={() => answerQuestion(option)}>
                      {option.label}
                    </button>
                  ))}
                </div>
                {submitting && <p className="user-survey-status">Отправляем…</p>}
                {error && <p className="user-survey-error">Не получилось отправить. Выбери ответ ещё раз.</p>}
              </>
            ) : null}
          </section>
        </aside>
      )}
      {!visible && (
        <button type="button" className="user-survey-launcher" onClick={openManually} aria-label="Открыть короткий опрос">
          <MessageCircleQuestion size={21} />
          <span className="user-survey-badge" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
