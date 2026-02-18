# Comptia Learning Monorepo

Base du projet conforme au brief `instructions.md`:

- Monorepo `apps/api`, `apps/web`, `packages/shared`, `packages/ui`
- API Express + TypeScript (point d'entree pret)
- Frontend React + Vite + TypeScript (point d'entree pret)
- Docker Compose pour PostgreSQL
- Setup initial ESLint/Prettier
- Catalogue API Phase 1 (exams/domains/objectives/sub-objectives/topics + i18n FR/EN)

## Prerequis

- Node.js 20+
- npm 10+
- Docker + Docker Compose

## Installation

```bash
npm install
```

## Demarrage en local

API:

```bash
npm run dev:api
```

Web:

```bash
npm run dev:web
```

Base PostgreSQL:

```bash
docker compose -f infra/docker-compose.yml up -d
```

Synchroniser le schema puis injecter un seed de base:

```bash
npm run db:sync -w @comptia/api
npm run db:seed -w @comptia/api
```

## Variables d'environnement

- API: copier `apps/api/env.template` vers `apps/api/.env`
- Web: copier `apps/web/env.template` vers `apps/web/.env`

## Endpoints disponibles (catalog)

- `GET /api/catalog/exams`
- `GET /api/catalog/domains?examCode=SY0-701&lang=fr`
- `GET /api/catalog/objectives?domainCode=1.0&lang=fr`
- `GET /api/catalog/sub-objectives?objectiveCode=1.1&lang=fr`
- `GET /api/catalog/topics?subObjectiveCode=1.1.1&lang=fr`

## Endpoints disponibles (auth cookie httpOnly)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Prochaines phases

- Phase 3: UI catalogue mobile-first plus ergonomie (cards, nav mobile, ecrans dedies)
- Phase 4: moteur QCM (questions, choices, answer, user_answers, user_mastery)
