import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';

import { messages } from '../i18n/messages';

type Locale = 'fr' | 'en';
type CatalogItem = { id: number; code: string };
type Exam = CatalogItem & { title: string };
type Domain = CatalogItem & { name: string };
type Objective = CatalogItem & { title: string };
type SubObjective = CatalogItem & { title: string };
type Topic = CatalogItem & { name: string };
type Choice = { id: number; choiceText: string; isCorrect: boolean };
type QuizQuestion = {
  id: number;
  questionText: string;
  explanation: string;
  choices: Choice[];
};
type User = { id: number; email: string; displayName: string | null };
type AuthMode = 'login' | 'register';
type AppView = 'study' | 'dashboard';
type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'TOO_MANY_REQUESTS'
  | 'BAD_GATEWAY'
  | 'INTERNAL_SERVER_ERROR'
  | 'INVALID_QUERY_PARAM'
  | 'INVALID_BODY'
  | 'INVALID_EMAIL'
  | 'EMAIL_REQUIRED'
  | 'INVALID_PASSWORD'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_ALREADY_USED'
  | 'DAILY_GENERATION_QUOTA_EXCEEDED'
  | 'TOO_MANY_GENERATION_REQUESTS'
  | 'QUESTION_NOT_FOUND'
  | 'SUB_OBJECTIVE_NOT_FOUND'
  | 'INVALID_CHOICE'
  | 'OPENAI_API_KEY_MISSING'
  | 'OPENAI_EMPTY_RESPONSE'
  | 'OPENAI_INVALID_FORMAT'
  | 'OPENAI_API_FAILED'
  | 'ADMIN_INVALID_PAYLOAD';
type DashboardSummary = {
  answered: number;
  correct: number;
  accuracy: number;
  averageMastery: number;
  streak: number;
};
type DashboardDay = { day: string; answered: number; correct: number };
type DashboardWeakArea = {
  subObjectiveId: number;
  subObjectiveCode: string;
  title: string;
  masteryScore: number;
};
type DashboardNextBest = {
  subObjectiveId: number;
  subObjectiveCode: string;
  title: string;
  rationale: string;
} | null;
type DashboardData = {
  summary: DashboardSummary;
  byDomain: Array<{ domainCode: string; name: string; masteryScore: number }>;
  bySubObjective: Array<{
    subObjectiveId: number;
    subObjectiveCode: string;
    title: string;
    masteryScore: number;
    streak: number;
    lastActivityAt: string;
  }>;
  daily: DashboardDay[];
  weakAreas: DashboardWeakArea[];
  nextBest: DashboardNextBest;
};

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const KNOWN_API_CODES: ApiErrorCode[] = [
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'TOO_MANY_REQUESTS',
  'BAD_GATEWAY',
  'INTERNAL_SERVER_ERROR',
  'INVALID_QUERY_PARAM',
  'INVALID_BODY',
  'INVALID_EMAIL',
  'EMAIL_REQUIRED',
  'INVALID_PASSWORD',
  'INVALID_CREDENTIALS',
  'EMAIL_ALREADY_USED',
  'DAILY_GENERATION_QUOTA_EXCEEDED',
  'TOO_MANY_GENERATION_REQUESTS',
  'QUESTION_NOT_FOUND',
  'SUB_OBJECTIVE_NOT_FOUND',
  'INVALID_CHOICE',
  'OPENAI_API_KEY_MISSING',
  'OPENAI_EMPTY_RESPONSE',
  'OPENAI_INVALID_FORMAT',
  'OPENAI_API_FAILED',
  'ADMIN_INVALID_PAYLOAD',
];

class ApiError extends Error {
  readonly status: number;
  readonly code?: ApiErrorCode;

  constructor(status: number, message: string, code?: ApiErrorCode) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function isKnownApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === 'string' && KNOWN_API_CODES.includes(value as ApiErrorCode);
}

function errorMessageForCode(code: ApiErrorCode, t: Record<string, string>): string {
  switch (code) {
    case 'UNAUTHORIZED':
      return t.errorUnauthorized;
    case 'FORBIDDEN':
      return t.errorForbidden;
    case 'CONFLICT':
    case 'EMAIL_ALREADY_USED':
      return t.errorConflict;
    case 'TOO_MANY_REQUESTS':
    case 'DAILY_GENERATION_QUOTA_EXCEEDED':
    case 'TOO_MANY_GENERATION_REQUESTS':
      return t.errorRateLimited;
    case 'BAD_GATEWAY':
    case 'OPENAI_API_FAILED':
    case 'OPENAI_EMPTY_RESPONSE':
    case 'OPENAI_INVALID_FORMAT':
    case 'OPENAI_API_KEY_MISSING':
      return t.errorExternalService;
    case 'NOT_FOUND':
    case 'QUESTION_NOT_FOUND':
    case 'SUB_OBJECTIVE_NOT_FOUND':
      return t.errorNotFound;
    case 'BAD_REQUEST':
    case 'INVALID_QUERY_PARAM':
    case 'INVALID_BODY':
    case 'INVALID_EMAIL':
    case 'EMAIL_REQUIRED':
    case 'INVALID_PASSWORD':
    case 'INVALID_CHOICE':
    case 'ADMIN_INVALID_PAYLOAD':
      return t.errorBadRequest;
    case 'INVALID_CREDENTIALS':
      return t.errorInvalidCredentials;
    default:
      return t.errorGeneric;
  }
}

function getFriendlyApiErrorMessage(error: unknown, t: Record<string, string>): string {
  if (error instanceof ApiError) {
    if (error.code) {
      return errorMessageForCode(error.code, t);
    }
    if (error.message) {
      return error.message;
    }
  }
  return t.errorGeneric;
}

function App(): ReactElement {
  const [locale, setLocale] = useState<Locale>('fr');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [view, setView] = useState<AppView>('study');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [exams, setExams] = useState<Exam[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [subObjectives, setSubObjectives] = useState<SubObjective[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [selectedExamCode, setSelectedExamCode] = useState<string>('');
  const [selectedDomainCode, setSelectedDomainCode] = useState<string>('');
  const [selectedObjectiveCode, setSelectedObjectiveCode] = useState<string>('');
  const [selectedSubObjectiveCode, setSelectedSubObjectiveCode] = useState<string>('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [quizMastery, setQuizMastery] = useState<number | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const t = messages[locale];
  const canShowContent = useMemo(() => !loading && !error, [loading, error]);
  const currentSubObjective = useMemo(
    () => subObjectives.find((item) => item.code === selectedSubObjectiveCode) ?? null,
    [subObjectives, selectedSubObjectiveCode],
  );
  const dailyMax = useMemo(
    () => Math.max(1, ...(dashboard?.daily.map((day) => day.answered) ?? [1])),
    [dashboard],
  );

  function masteryClass(value: number): string {
    if (value >= 80) {
      return 'heat-good';
    }
    if (value >= 50) {
      return 'heat-mid';
    }
    return 'heat-low';
  }

  async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      ...options,
    });
    if (!response.ok) {
      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      const codeRaw =
        payload && typeof payload === 'object' ? (payload as Record<string, unknown>).code : undefined;
      const messageRaw =
        payload && typeof payload === 'object' ? (payload as Record<string, unknown>).message : undefined;
      const code = isKnownApiErrorCode(codeRaw) ? codeRaw : undefined;
      const message = typeof messageRaw === 'string' ? messageRaw : `API error (${response.status})`;
      throw new ApiError(response.status, message, code);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  useEffect(() => {
    request<{ user: User }>('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user) {
      setExams([]);
      setDomains([]);
      setObjectives([]);
      setSubObjectives([]);
      setTopics([]);
      return;
    }

    setLoading(true);
    setError(null);
    request<Exam[]>('/api/catalog/exams')
      .then((data) => {
        setExams(data);
        setSelectedExamCode(data[0]?.code ?? '');
      })
      .catch((error: unknown) => setError(getFriendlyApiErrorMessage(error, t)))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user || !selectedExamCode) {
      setDomains([]);
      return;
    }
    setLoading(true);
    setError(null);
    request<Domain[]>(`/api/catalog/domains?examCode=${encodeURIComponent(selectedExamCode)}&lang=${locale}`)
      .then((data) => {
        setDomains(data);
        setSelectedDomainCode(data[0]?.code ?? '');
      })
      .catch((error: unknown) => setError(getFriendlyApiErrorMessage(error, t)))
      .finally(() => setLoading(false));
  }, [user, selectedExamCode, locale]);

  useEffect(() => {
    if (!user || !selectedDomainCode) {
      setObjectives([]);
      return;
    }
    setLoading(true);
    setError(null);
    request<Objective[]>(
      `/api/catalog/objectives?domainCode=${encodeURIComponent(selectedDomainCode)}&lang=${locale}`,
    )
      .then((data) => {
        setObjectives(data);
        setSelectedObjectiveCode(data[0]?.code ?? '');
      })
      .catch((error: unknown) => setError(getFriendlyApiErrorMessage(error, t)))
      .finally(() => setLoading(false));
  }, [user, selectedDomainCode, locale]);

  useEffect(() => {
    if (!user || !selectedObjectiveCode) {
      setSubObjectives([]);
      return;
    }
    setLoading(true);
    setError(null);
    request<SubObjective[]>(
      `/api/catalog/sub-objectives?objectiveCode=${encodeURIComponent(selectedObjectiveCode)}&lang=${locale}`,
    )
      .then((data) => {
        setSubObjectives(data);
        setSelectedSubObjectiveCode(data[0]?.code ?? '');
      })
      .catch((error: unknown) => setError(getFriendlyApiErrorMessage(error, t)))
      .finally(() => setLoading(false));
  }, [user, selectedObjectiveCode, locale]);

  useEffect(() => {
    if (!user || !selectedSubObjectiveCode) {
      setTopics([]);
      return;
    }
    setLoading(true);
    setError(null);
    request<Topic[]>(
      `/api/catalog/topics?subObjectiveCode=${encodeURIComponent(selectedSubObjectiveCode)}&lang=${locale}`,
    )
      .then((data) => setTopics(data))
      .catch((error: unknown) => setError(getFriendlyApiErrorMessage(error, t)))
      .finally(() => setLoading(false));
  }, [user, selectedSubObjectiveCode, locale]);

  useEffect(() => {
    setQuizQuestions([]);
    setQuizIndex(0);
    setQuizFeedback(null);
    setQuizMastery(null);
  }, [selectedSubObjectiveCode, locale]);

  useEffect(() => {
    if (!user) {
      setDashboard(null);
      return;
    }
    request<DashboardData>(`/api/progress/dashboard?lang=${locale}`)
      .then((data) => setDashboard(data))
      .catch(() => setDashboard(null));
  }, [user, locale]);

  async function submitAuth(): Promise<void> {
    setAuthError(null);
    try {
      const payload = authMode === 'register' ? { email, password, displayName } : { email, password };
      const data = await request<{ user: User }>(
        authMode === 'register' ? '/api/auth/register' : '/api/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      setUser(data.user);
      setPassword('');
    } catch (error: unknown) {
      setAuthError(getFriendlyApiErrorMessage(error, t));
    }
  }

  async function handleLogout(): Promise<void> {
    await request<void>('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
    setEmail('');
    setPassword('');
    setDisplayName('');
    setSelectedExamCode('');
    setSelectedDomainCode('');
    setSelectedObjectiveCode('');
    setSelectedSubObjectiveCode('');
    setQuizQuestions([]);
    setQuizIndex(0);
    setQuizFeedback(null);
    setQuizMastery(null);
    setView('study');
  }

  async function generateQuiz(): Promise<void> {
    if (!currentSubObjective) {
      return;
    }
    setQuizFeedback(null);
    setLoading(true);
    try {
      await request<QuizQuestion[]>('/api/qcm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subObjectiveId: currentSubObjective.id,
          lang: locale,
          difficulty: 2,
          count: 5,
        }),
      });
      const questions = await request<QuizQuestion[]>(
        `/api/qcm/questions?subObjectiveId=${currentSubObjective.id}&lang=${locale}`,
      );
      setQuizQuestions(questions.slice(0, 5));
      setQuizIndex(0);
      setQuizMastery(null);
    } catch (error: unknown) {
      setQuizFeedback(getFriendlyApiErrorMessage(error, t));
    } finally {
      setLoading(false);
    }
  }

  async function answerQuestion(choiceId: number): Promise<void> {
    const question = quizQuestions[quizIndex];
    if (!question) {
      return;
    }
    try {
      const result = await request<{ isCorrect: boolean; explanation: string; masteryScore: number }>(
        '/api/qcm/answer',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: question.id, choiceId }),
        },
      );
      setQuizFeedback(
        `${result.isCorrect ? t.correctAnswer : t.wrongAnswer} ${result.explanation}`,
      );
      setQuizMastery(result.masteryScore);
      const freshDashboard = await request<DashboardData>(`/api/progress/dashboard?lang=${locale}`);
      setDashboard(freshDashboard);
    } catch (error: unknown) {
      setQuizFeedback(getFriendlyApiErrorMessage(error, t));
    }
  }

  function nextQuestion(): void {
    setQuizFeedback(null);
    setQuizIndex((value) => Math.min(value + 1, quizQuestions.length - 1));
  }

  if (!user) {
    return (
      <main className="container">
        <header className="header">
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </header>

        <section className="card">
          <h2>{t.authTitle}</h2>
          <p>{t.authSubtitle}</p>
          <div className="actions">
            <button
              type="button"
              className={authMode === 'login' ? 'btn active' : 'btn'}
              onClick={() => setAuthMode('login')}
            >
              {t.login}
            </button>
            <button
              type="button"
              className={authMode === 'register' ? 'btn active' : 'btn'}
              onClick={() => setAuthMode('register')}
            >
              {t.register}
            </button>
          </div>

          <div className="form-grid">
            {authMode === 'register' ? (
              <label>
                {t.displayName}
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
              </label>
            ) : null}
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              {t.password}
              <input
                type="password"
                autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button type="button" className="btn active" onClick={() => void submitAuth()}>
              {authMode === 'register' ? t.createAccount : t.signIn}
            </button>
          </div>

          {authError ? <p className="status error">{authError}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <header className="header">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </header>

      <section className="card">
        <div className="userbar">
          <p>
            {t.connectedAs}: <strong>{user.displayName || user.email}</strong>
          </p>
          <button type="button" className="btn" onClick={() => void handleLogout()}>
            {t.logout}
          </button>
        </div>

        <h2>{t.catalogExplorer}</h2>
        <p>{t.catalogHelper}</p>

        <div className="actions">
          <button
            type="button"
            className={view === 'study' ? 'btn active' : 'btn'}
            onClick={() => setView('study')}
          >
            {t.studyTab}
          </button>
          <button
            type="button"
            className={view === 'dashboard' ? 'btn active' : 'btn'}
            onClick={() => setView('dashboard')}
          >
            {t.dashboardTab}
          </button>
          <button
            type="button"
            className={locale === 'fr' ? 'btn active' : 'btn'}
            onClick={() => setLocale('fr')}
          >
            FR
          </button>
          <button
            type="button"
            className={locale === 'en' ? 'btn active' : 'btn'}
            onClick={() => setLocale('en')}
          >
            EN
          </button>
        </div>

        {loading ? <p className="status">{t.loading}</p> : null}
        {error ? <p className="status error">{error}</p> : null}

        {canShowContent && view === 'study' ? (
          <div className="catalog-grid">
            <label>
              {t.exam}
              <select value={selectedExamCode} onChange={(event) => setSelectedExamCode(event.target.value)}>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.code}>
                    {exam.code} - {exam.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t.domain}
              <select value={selectedDomainCode} onChange={(event) => setSelectedDomainCode(event.target.value)}>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.code}>
                    {domain.code} - {domain.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t.objective}
              <select value={selectedObjectiveCode} onChange={(event) => setSelectedObjectiveCode(event.target.value)}>
                {objectives.map((objective) => (
                  <option key={objective.id} value={objective.code}>
                    {objective.code} - {objective.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t.subObjective}
              <select
                value={selectedSubObjectiveCode}
                onChange={(event) => setSelectedSubObjectiveCode(event.target.value)}
              >
                {subObjectives.map((subObjective) => (
                  <option key={subObjective.id} value={subObjective.code}>
                    {subObjective.code} - {subObjective.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {canShowContent && view === 'dashboard' ? (
          <div className="dashboard-block standalone">
            <h3>{t.dashboardTitle}</h3>
            {dashboard ? (
              <>
                <div className="dashboard-grid">
                  <div className="metric-card">
                    <p>{t.metricAnswered}</p>
                    <strong>{dashboard.summary.answered}</strong>
                  </div>
                  <div className="metric-card">
                    <p>{t.metricAccuracy}</p>
                    <strong>{dashboard.summary.accuracy}%</strong>
                  </div>
                  <div className="metric-card">
                    <p>{t.metricMastery}</p>
                    <strong>{dashboard.summary.averageMastery}%</strong>
                  </div>
                  <div className="metric-card">
                    <p>{t.metricStreak}</p>
                    <strong>{dashboard.summary.streak}</strong>
                  </div>
                </div>

                <div className="dashboard-two-cols">
                  <div>
                    <h4>{t.weakAreasTitle}</h4>
                    {dashboard.weakAreas.length === 0 ? (
                      <p>{t.noWeakAreas}</p>
                    ) : (
                      <ul>
                        {dashboard.weakAreas.map((area) => (
                          <li key={area.subObjectiveId}>
                            {area.subObjectiveCode} - {area.title} ({area.masteryScore}%)
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4>{t.nextBestTitle}</h4>
                    {dashboard.nextBest ? (
                      <p>
                        <strong>
                          {dashboard.nextBest.subObjectiveCode} - {dashboard.nextBest.title}
                        </strong>{' '}
                        {dashboard.nextBest.rationale}
                      </p>
                    ) : (
                      <p>{t.noNextBest}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4>{t.dailyStatsTitle}</h4>
                  <div className="daily-bars">
                    {dashboard.daily.map((day) => (
                      <div key={day.day} className="daily-bar-row">
                        <span className="daily-label">{day.day.slice(5)}</span>
                        <div className="daily-track">
                          <div className="daily-fill" style={{ width: `${(day.answered / dailyMax) * 100}%` }} />
                        </div>
                        <span className="daily-value">
                          {day.correct}/{day.answered}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4>{t.masteryHeatmapTitle}</h4>
                  {dashboard.bySubObjective.length === 0 ? (
                    <p>{t.noMasteryData}</p>
                  ) : (
                    <div className="heatmap-list">
                      {dashboard.bySubObjective.map((item) => (
                        <div key={item.subObjectiveId} className={`heatmap-item ${masteryClass(item.masteryScore)}`}>
                          <span>
                            {item.subObjectiveCode} - {item.title}
                          </span>
                          <strong>{item.masteryScore}%</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p>{t.dashboardUnavailable}</p>
            )}
          </div>
        ) : null}

        {canShowContent && view === 'study' ? (
          <div className="topics">
            <h3>{t.topics}</h3>
            {topics.length === 0 ? (
              <p>{t.noTopics}</p>
            ) : (
              <ul>
                {topics.map((topic) => (
                  <li key={topic.id}>
                    {topic.code} - {topic.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {canShowContent && view === 'study' ? (
          <div className="quiz-block">
            <h3>{t.quizTitle}</h3>
            <p>{t.quizHelp}</p>
            <button type="button" className="btn active" onClick={() => void generateQuiz()}>
              {t.generateQuiz}
            </button>

            {quizQuestions.length > 0 ? (
              <div className="quiz-card">
                <p className="quiz-step">
                  {t.questionLabel} {quizIndex + 1}/{quizQuestions.length}
                </p>
                <p>{quizQuestions[quizIndex]?.questionText}</p>
                <div className="quiz-choices">
                  {quizQuestions[quizIndex]?.choices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      className="btn"
                      onClick={() => void answerQuestion(choice.id)}
                    >
                      {choice.choiceText}
                    </button>
                  ))}
                </div>
                {quizFeedback ? <p className="status">{quizFeedback}</p> : null}
                {quizMastery !== null ? (
                  <p className="status">
                    {t.masteryLabel}: {quizMastery}%
                  </p>
                ) : null}
                {quizIndex < quizQuestions.length - 1 ? (
                  <button type="button" className="btn" onClick={nextQuestion}>
                    {t.nextQuestion}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export { App };
