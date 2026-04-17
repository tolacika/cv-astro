---
slug: techteamer-microcredit
company: "TechTeamer Kft &\nMikroCredit Zrt"
datePeriod: "between 2018 and 2019"
position: "Backend Developer"
teaser: "Designing the backbone of a digital lending system where identity, risk, and money flow had to align in real time. A microservice-driven architecture turning fragmented financial operations into a coherent, auditable system."
patterns:
  - "data-pipelines"
  - "external-dependencies"
  - "legacy-modernization"
tags:
  - "api"
  - "php"
  - "laravel"
  - "javascript"
  - "react"
  - "mysql"
altLogo: "MicroCredit"
---

At TechTeamer and Microcredit (MiniKölcsön), I worked on systems operating at the intersection of digital identity and online lending. TechTeamer's core product, FaceKom, provided AI-assisted remote identification and video-based verification, enabling financial services to onboard customers without physical presence. This capability was directly integrated into Microcredit's lending platform, where users could apply for small loans entirely online, from identity verification to approval and disbursement.

Microcredit was among the early adopters in Hungary to offer fully digital loan processing, combining document submission, biometric validation, and automated scoring into a streamlined flow. The system had to operate under strict regulatory and security constraints, while still delivering near real-time decisions. This created a unique environment where compliance, fraud prevention, and user experience were tightly coupled and constantly in tension.

My team focused on building a microservice-based backend responsible for customer and loan bookkeeping, forming the core system of record behind the platform. This included designing services to track user states, loan lifecycles, financial events, and audit trails across distributed components. The challenge was not just storing data, but ensuring consistency across asynchronous processes such as verification, scoring, approval, and payout, where each step depended on partially available and externally validated information.

From a systems perspective, the platform functioned as a real-time financial pipeline: identity verification triggered eligibility checks, which fed into risk evaluation and ultimately into monetary transactions. Working on this system provided deep exposure to how digital trust is constructed in practice, where every approved loan is the result of multiple loosely coupled systems agreeing on a single, high-stakes decision.