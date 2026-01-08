# MiniThreads (Node + TS + Express + Postgres + Drizzle + Redis + Kafka + MinIO)

A step-by-step backend project that starts simple and grows into a production-ready system.  
Goal: cement core backend concepts by building a Threads-like API (posts, comments, follow/feed) and incrementally adding caching, background jobs, object storage, search, observability, security, and finally Kubernetes deployment.

---

## What you’re building

**MiniThreads** is a REST-first backend with:

- ✅ Users + Auth (JWT Access + Refresh, refresh rotation)
- ✅ Posts + Comments (replies)
- ✅ Follow graph + Feed (cursor pagination)
- ⏳ Caching (Redis, cache-aside)
- ⏳ Background jobs (Kafka workers, retries, DLQ)
- ⏳ Transactional emails (job-driven)
- ⏳ Object storage (MinIO, presigned uploads)
- ⏳ Search (Elasticsearch for posts)
- ⏳ Observability (logs, metrics, tracing)
- ⏳ Security hardening
- ⏳ Kubernetes deployment

---

## Architecture (high level)

**REST API (Express)**

- Routes → Controllers → Services (business logic) → Repos (Drizzle queries)

**Data stores**

- Postgres: source of truth
- Redis: caching + (later) rate limiting
- Kafka: asynchronous job queue
- MinIO: S3-compatible object storage (large files)
- Elasticsearch: full-text search for posts (later)

---

## Tech stack

- **Node.js + TypeScript**
- **Express**
- **Postgres 17**
- **Drizzle ORM + migrations**
- **Redis 7**
- **Apache Kafka (KRaft single-node via `apache/kafka`)**
- **MinIO (S3-compatible)**
- **Elasticsearch**

---

## SETUP

- Use your docker compose file to boot Postgres, Redis, Kafka (and later MinIO/ES).
  `docker compose up -d`
- Install & run the API
  `npm install`
  `npm run dev`
- App should be up at:
  `GET /health → { ok: true }`
