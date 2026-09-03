import { ArrowLeft, Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";

const STORAGE_KEY = "chord-tulza-survey-v1";
const DISMISS_FOR_MS = 30 * 24 * 60 * 60 * 1000;
const FORM_ACTION = "https://docs.google.com/forms/d/e/1FAIpQLSe9FThlfDRJLOJo9z0lUuEOr52qppMbsv1Eec1QXpKAcxULqg/formResponse";

const FORM_FIELDS = {
  goal: "entry.232382321",
  outcome: "entry.122178230",
  feature: "entry.2012861588",
  purchase: "entry.178919732",
  contact: "entry.1316376898",
} as const;

const QUESTIONS = [
  {
    id: "goal",
    eyebrow: "Пара вопросов",
    title: "Для чего ты открыл Chord Tulza?",
    options: [
      { id: "song", label: "Сочиняю песню" },
      { id: "next-chord", label: "Ищу следующий аккорд" },
      { id: "learning", label: "Учусь играть" },
      { id: "voicings", label: "Подбираю аппликатуры" },
      { id: "exploring", label: "Просто изучаю инструмент" },
    ],
  },
  {
    id: "outcome",
    eyebrow: "Уже почти",
    title: "Получилось сделать то, зачем пришёл?",
    options: [
      { id: "yes", label: "Да" },
      { id: "partly", label: "Частично" },
      { id: "no", label: "Нет" },
    ],
  },
  {
    id: "feature",
    eyebrow: "Что важнее",
    title: "За какую функцию ты мог бы заплатить?",
    options: [
      { id: "save", label: "Сохранение песен и прогрессий" },
      { id: "midi", label: "MIDI‑экспорт в GarageBand или Logic" },
      { id: "pdf", label: "PDF с аккордами и аппликатурами" },
      { id: "backing", label: "Ритмы, барабаны и бас" },
      { id: "ipad", label: "Полноценное приложение для iPad" },
      { id: "none", label: "Ни за одну из этих функций" },
    ],
  },
  {
    id: "purchase",
    eyebrow: "Последний вопрос",
    title: "Chord Tulza Pro навсегда за 990 ₽ — нужен ранний доступ?",
    options: [
      { id: "yes", label: "Да, готов купить" },
      { id: "maybe", label: "Возможно, покажите подробнее" },
      { id: "no", label: "Нет" },
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

export function buildSurveyPayload(answers: Answers, contact = "") {
  const body = new URLSearchParams();
  for (const question of QUESTIONS) {
    const answer = answers[question.id];
    if (answer) body.set(FORM_FIELDS[question.id], answer);
  }
  if (contact.trim()) body.set(FORM_FIELDS.contact, contact.trim());
  return body;
}

async function submitAnswers(answers: Answers, contact = "") {
  await fetch(FORM_ACTION, {
    method: "POST",
    mode: "no-cors",
    body: buildSurveyPayload(answers, contact),
  });
}

export function UserSurvey({ blocked = false, eligible }: Props) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const openedRef = useRef(false);

  useEffect(() => {
    if (!eligible || openedRef.current) return;
    const stored = loadSurveyState();
    const dismissedRecently = stored.dismissedAt && Date.now() - stored.dismissedAt < DISMISS_FOR_MS;
    if (stored.completedAt || dismissedRecently) return;

    openedRef.current = true;
    setVisible(true);
    track("survey_opened");
  }, [eligible]);

  if (!visible || blocked) return null;

  const question = QUESTIONS[step];
  const wantsContact = answers.purchase === "Да, готов купить";
  const isContactStep = step === QUESTIONS.length;

  const dismiss = () => {
    saveSurveyState({ dismissedAt: Date.now() });
    track("survey_dismissed", { step: Math.min(step + 1, QUESTIONS.length) });
    setVisible(false);
  };

  const finish = async (nextAnswers: Answers, nextContact = "") => {
    setSubmitting(true);
    setError(false);
    try {
      await submitAnswers(nextAnswers, nextContact);
      saveSurveyState({ completedAt: Date.now() });
      track("survey_completed", {
        purchase: nextAnswers.purchase === "Да, готов купить" ? "yes" : nextAnswers.purchase === "Возможно, покажите подробнее" ? "maybe" : "no",
      });
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
    track("survey_answered", { question: question.id, answer: option.id });

    if (question.id === "purchase") {
      if (option.id === "yes") setStep(QUESTIONS.length);
      else void finish(nextAnswers);
      return;
    }
    setStep((current) => current + 1);
  };

  return (
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
            <button type="button" className="user-survey-primary" onClick={() => setVisible(false)}>Готово</button>
          </div>
        ) : isContactStep && wantsContact ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void finish(answers, contact);
            }}
          >
            <button type="button" className="user-survey-back" onClick={() => setStep(QUESTIONS.length - 1)} aria-label="Назад">
              <ArrowLeft size={15} />
            </button>
            <span className="user-survey-eyebrow">Ранний доступ</span>
            <h2>Куда тебе написать?</h2>
            <p className="user-survey-copy">Оставь Telegram или e‑mail. Контакт увидит только автор Chord Tulza.</p>
            <input
              className="user-survey-input"
              type="text"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="@telegram или e‑mail"
              autoComplete="email"
              required
            />
            {error && <p className="user-survey-error">Не получилось отправить. Попробуй ещё раз.</p>}
            <button type="submit" className="user-survey-primary" disabled={submitting || !contact.trim()}>
              {submitting ? "Отправляем…" : "Отправить"}
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
  );
}
