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

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

function App(): ReactElement {
  const [locale, setLocale] = useState<Locale>('fr');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function request<T>(path: string): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`API error (${response.status})`);
    }
    return (await response.json()) as T;
  }

  useEffect(() => {
    setLoading(true);
    setError(null);
    request<Exam[]>('/api/catalog/exams')
      .then((data) => {
        setExams(data);
        setSelectedExamCode(data[0]?.code ?? '');
      })
      .catch(() => setError(t.apiUnavailable))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedExamCode) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExamCode, locale]);

  useEffect(() => {
    if (!selectedDomainCode) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDomainCode, locale]);

  useEffect(() => {
    if (!selectedObjectiveCode) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedObjectiveCode, locale]);

  useEffect(() => {
    if (!selectedSubObjectiveCode) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubObjectiveCode, locale]);

  return (
    <main className="container">
      <header className="header">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </header>

      <section className="card">
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
