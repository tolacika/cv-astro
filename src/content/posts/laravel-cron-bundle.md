---
public: true
wip: true
draft: false
featured: true
type: "project"
slug: "laravel-cron-bundle"
title: "Laravel Cron Bundle — Retrospective"
teaser: "A 2017 side-project that replaced Laravel’s static scheduler with a database-driven cron manager + admin panel and Supervisor support"
date: "2026-04-16 14:00:00"
image: "coming-soon-placeholder.jpg"
---

**Laravel Cron Bundle** was one of my first proper open-source packages (2017–2019).

Instead of managing cron jobs in a static crontab or Laravel’s `schedule()` method, it let you store every scheduled task in the database, manage them through a clean admin dashboard (`/CronBundle`), and run them reliably with Supervisor (or as a daemon).

Key features I shipped:
- Full CRUD via Artisan commands and web UI
- Run history + change logs
- Supervisor-ready worker (`php artisan cron:start --blocking`)
- Configurable authentication and user attribution for logs
- Zero-dependency on the traditional Linux crontab

It was built for real production environments where you need dynamic, auditable, centrally managed background jobs. At the time it was a pretty niche but very practical solution — especially for teams that hated touching server crontabs.

Still online on GitHub (8 stars, MIT license). A small but solid example of how I used to solve “infrastructure pain” problems with clean Laravel packages.