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
type User = { id: number; email: string; displayName: string | null };
type AuthMode = 'login' | 'register';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

function App(): ReactElement {
  const [locale, setLocale] = useState<Locale>('fr');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
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

  const t = messages[locale];
  const canShowContent = useMemo(() => !loading && !error, [loading, error]);

  async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      ...options,
    });
    if (!response.ok) {
      throw new Error(`API error (${response.status})`);
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
      .catch(() => setError(t.apiUnavailable))
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
      .catch(() => setError(t.apiUnavailable))
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
      .catch(() => setError(t.apiUnavailable))
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
      .catch(() => setError(t.apiUnavailable))
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
      .catch(() => setError(t.apiUnavailable))
      .finally(() => setLoading(false));
  }, [user, selectedSubObjectiveCode, locale]);

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
    } catch {
      setAuthError(authMode === 'register' ? t.registerFailed : t.loginFailed);
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

        {canShowContent ? (
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

        {canShowContent ? (
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
      </section>
    </main>
  );
}

export { App };
