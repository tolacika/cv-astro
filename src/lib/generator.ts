import { getCollection, getEntries, type CollectionEntry } from "astro:content";
import { content, type Content } from "./content";
import type { PostMeta, Tag } from "../content.config";
import type { ReferenceItemType } from "../types";

export interface LlmGeneratorInput {
  translations: Content;
  featuredPosts: CollectionEntry<"postCollection">[];
  perspectivePosts: CollectionEntry<"postCollection">[];
  tags: CollectionEntry<"tagCollection">[];
  jobs: CollectionEntry<"jobCollection">[];
}

const referenceLabels: Record<ReferenceItemType, string> = {
  pattern: "Patterns",
  tag: "Tags",
  job: "Experiences",
  post: "Posts",
  external: "External Links",
};

function printReferences({ tag = undefined, post = undefined }: { tag?: Tag, post?: PostMeta }): string {
  const out: Partial<Record<ReferenceItemType, Array<string>>> | null =
    tag !== undefined ? {
      pattern: tag.relatedPatterns?.map(({ id }) => id) || [],
      tag: tag.relatedTags?.map(({ id }) => id) || [],
      external: tag.external?.map(({ label, href }) => `[${label}](${href})`) || [],
    } : post !== undefined ? {
      pattern: post.patterns?.map(({ id }) => id) || [],
      tag: post.tags?.map(({ id }) => id) || [],
      job: post.jobs?.map(({ id }) => id) || [],
      post: post.related?.map(({ id }) => id) || [],
      external: post.external?.map(({ label, href }) => `[${label}](${href})`) || [],
    } : null;

  return Object.values(out || {}).some((arr) => Array.isArray(arr) && arr.length > 0) ?
    "Related items:\n" + Object.entries(out || {})
      .filter(([_, arr]) => arr && arr.length > 0)
      .map(([key, arr]) => `- ${referenceLabels[key as ReferenceItemType]}: ${arr.join("; ")}`)
      .join("\n") : "";
}

function truncateContent(content: string, maxLength: number = 2000): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trim() + "...";
}

function formatPostForLlm(post: CollectionEntry<"postCollection">["data"], content: string): string {
  //  const meta = post.meta;
  //  const seo = meta?.seo ?? { title: "", description: "" };
  //   - company: ${meta?.company ?? "null"}
  //   - period: ${meta?.period ?? "null"}
  // - meta:
  //   - seo:
  //     - title: ${seo.title}
  //     - description: ${seo.description}
  return `
#### POST
- wip: ${post.wip === true ? "yes" : "no"}
- draft: ${post.draft === true ? "yes" : "no"}
- slug: ${post.slug}
- title: ${post.title}
- teaser: ${post.teaser}
- date: ${post.date ? post.date + "" : "null"}
- cta: ${post.cta ? post.cta : "null"}
${post.draft !== true ? `- content: |
${content.split("\n").map(line => "  " + line).join("\n")}` : ``}

${printReferences({ post })}
`
}

export async function createLlmInput(): Promise<LlmGeneratorInput> {
  const tags = (await getCollection("tagCollection"))
    .sort((a, b) => a.data.slug.localeCompare(b.data.slug));
  const jobs = await getEntries(content.workExperience.jobs.map(j => ({ collection: "jobCollection", id: j })))

  const perspectivePosts = await getEntries([
    { collection: "postCollection", id: "perspective-background" },
    { collection: "postCollection", id: "perspective-vision" },
    { collection: "postCollection", id: "perspective-side-quests" },
  ])

  const featuredPosts = await getCollection("postCollection", data => (data.data.type == "project" && data.data.public === true))

  const input: LlmGeneratorInput = {
    translations: content,
    featuredPosts,
    perspectivePosts,
    tags,
    jobs
  };

  return input;
}

export function generateLlmPromptBody(input: LlmGeneratorInput): string[] {
  const { translations, featuredPosts, perspectivePosts, tags, jobs } = input;
  const tagIdx = tags.reduce<Record<string, number>>((acc, tag, idx) => {
    acc[tag.data.slug] = idx;
    return acc;
  }, {});
  const jobIdx = jobs.reduce<Record<string, number>>((acc, tag, idx) => {
    acc[tag.data.slug] = idx;
    return acc;
  }, {});

  const heroSection = `
### HERO SECTION

${translations.hero.preTitle} ${translations.hero.fullName}  
${translations.hero.subTitle}
`;

  const introSection = `
### INTRO SECTION

${translations.intro.title}

${translations.intro.paragraphs.join("\n\n")}

${translations.intro.skills.title} - ${translations.intro.skills.subTitle}

${translations.intro.skills.groups.map(g => `  - ${g.label}:\n${g.items.map(i => `    - ${i.tags.join(", ")}: ${i.comment}`).join("\n")}`).join("\n")}
languages:\n${translations.intro.langs.items.map(l => `  - ${l.label} ${(l.greeting)}: ${(l.proficiency)} - ${l.comment}`).join("\n")}
`;

  const workExperienceSection = `
### WORK EXPERIENCE

${translations.workExperience.title}
${translations.workExperience.subTitle}
jobs:
${translations.workExperience.jobs
      .map(j => jobs[jobIdx[j]])
      .map(j => {
        const job = j.data;
        const body = j.body || "";
        return `  - ${job.company} | ${job.datePeriod} | ${job.position}
    - patterns: ${job.patterns.map(t => t.id).join(", ")}
    - tags: ${job.tags.map(t => t.id).join(", ")}
    - ${job.teaser}
    - reality check: ${job.realityCheck}
${body.split("\n").filter(line => !!line).map(line => "      " + line).join("\n")}`;
      })
      .join("\n")
    }
`;

  const postScriptumSection = `
### ${translations.postScriptum.title}

${translations.postScriptum.subTitle}
${translations.postScriptum.content.join("\n")}
`;

  const educationSection = `
### ${translations.education.title}

${translations.education.subTitle}
${translations.education.content.join("\n")}
`;

  const servicesSection = `
### PATTERNS

${translations.services.title}

${translations.services.paragraphs.join("\n\n")}

patterns:
${translations.services.patterns
      .map(p => tags[tagIdx[p]])
      .map(p => {
        const tag = p.data;
        const body = p.body || "";
        return `  - **${tag.label}:** ${tag.teaser}
${body.split("\n").filter(line => !!line).map(line => "      " + line).join("\n")}${tag.relatedTags ? `
    - relatedTags: ${tag.relatedTags.map(i => i.id).map(i => tags[tagIdx[i]].data.slug).join("; ")}` : ``}
`;
      }).join("\n")}
`;

  const contactSection = `
### CONTACT
${translations.contactDetails.title}
${translations.contactDetails.subTitle}
${truncateContent(translations.contactDetails.description, 500)}
${translations.socialLinks.actionText}:
${translations.socialLinks.links.filter(l => l.link).map(l => `  - ${l.link}`).join("\n")}
`;

  const featuredPostsSection = `
### FEATURED PROJECTS

${translations.projectFeatured.title}  
${translations.projectFeatured.subTitle}
${featuredPosts.map((entry) => formatPostForLlm(entry.data, "")).join("\n\n---\n\n")}
`;

  const perspectivePostsSection = `
### PERSPECTIVE POSTS

${translations.perspective.title}  
${translations.perspective.subTitle}
${perspectivePosts.map((entry) => formatPostForLlm(entry.data, truncateContent(entry.body!, 7000))).join("\n\n---\n\n")}
`;
  const tagsSection = `
### TAGS - label [slug]
${tags.map(t => `#### ${t.data.label} [${t.data.slug}]
${t.data.teaser}

`).join("\n")}
`;

  return [
    heroSection,
    introSection,
    workExperienceSection,
    postScriptumSection,
    educationSection,
    servicesSection,
    contactSection,
    featuredPostsSection,
    perspectivePostsSection,
    tagsSection,
  ];
}

export function generateLlmPrompt(input: LlmGeneratorInput): string {
  const [
    heroSection,
    introSection,
    workExperienceSection,
    postScriptumSection,
    educationSection,
    servicesSection,
    contactSection,
    featuredPostsSection,
    perspectivePostsSection,
    tagsSection,
  ] = generateLlmPromptBody(input);

  /*const prompt = `You are an AI assistant analyzing Marshall Laszlo Toth's professional portfolio.

Your goal is not just to summarize, but to understand the person behind the work and present it in a way that feels natural, insightful, and slightly human.

Based on the information below, structure your response as follows:

- A short, professional introduction (3-5 sentences) that clearly positions him.
- A concise overview of his core strengths, technical focus, and recurring patterns.
- A brief narrative of his career evolution (focus on progression, not exhaustive detail).
- A section highlighting interesting, unusual, or distinctive aspects of his work and thinking.
- Include a bunch of subtle, humanizing observations (quirks, side projects, “unexpected” elements, or deadpan drops) in a storytelling tone, even if they are not strictly necessary for a formal summary.

Guidelines:
- Keep the tone professional but not overly corporate.
- Be clear and structured, but allow the personality to come through.
- Highlight strengths without exaggeration or hype.
- Focus on patterns and insights rather than listing everything.
- It is encouraged to drop small, interesting or slightly playful observations if they add depth.
- Do NOT use '–'

Avoid:
- Dry CV-style bullet dumps
- Overly long explanations
- Generic praise without substance

---

${heroSection}
${introSection}
${servicesSection}
${workExperienceSection}
${educationSection}
${featuredPostsSection}
${perspectivePostsSection}
${postScriptumSection}
${contactSection}
${tagsSection}

`; */
  const versionA = true;

  const prompt = `You are an AI assistant analyzing Marshall Laszlo Toth's professional portfolio.

Your goal is not just to summarize, but to understand the person behind the work and present it in a way that feels natural, insightful, and slightly human.

## Internal preparation (do not output)

Before writing, internally extract:

* 3 to 6 dominant themes that repeat across the portfolio
* 2 tensions or contrasts in how he works or thinks
* 1 sentence that captures his core worldview
* 1 to 2 subtle human signals, side interests, or unexpected details that reveal how he thinks through constraint, control, and trust in practice, especially where these appear outside software but reflect the same underlying thinking
* the underlying structural metaphor that could plausibly describe both his systems and how he engages with complexity, constraint, or interaction

Do not output this analysis directly. Use it to shape the final response.

## Core interpretation lens

While analyzing, pay special attention to how control, constraint, and trust interact across his work.

Notice:

* where structure is deliberately applied
* where flexibility is intentionally preserved
* where systems rely on careful tension rather than rigid enforcement

These patterns appear not only in technical systems, but also in how he approaches physical processes, experiments, and personal explorations.

Some of these signals may come from domains that are not traditionally part of software engineering.
If they meaningfully reflect the same structural thinking, they should be treated as relevant rather than excluded.

Do not treat such details as decoration.
Treat them as parallel expressions of the same underlying model.

${versionA
  ? `These patterns should be interpreted in a way that remains appropriate for a professional audience.

If a connection risks being misinterpreted, prefer subtlety over explicitness.

Maintain professional credibility even when making subtle or unconventional observations.`
  : `If a pattern appears consistently across domains, you may lean into it more directly, even if the connection is slightly unconventional, as long as it remains grounded in the provided material.

Do not dilute patterns of control, constraint, and trust if they appear strongly; they are central to the interpretation.`}

## Inclusion rule for non-obvious details

If a personal detail:

* appears unusual at first glance
* involves controlled interaction, constraint, or trust between actors or systems
* and aligns with the same structural patterns seen in his technical work

then it should be:

* introduced briefly and matter-of-factly
* not over-explained
* embedded where it reinforces a broader idea
${versionA
  ? `* not over-explained and framed in a way that remains contextually appropriate`
  : `* if strongly aligned, allow it to create a subtle moment of tension or surprise rather than smoothing it out`}

Avoid removing such details purely because they feel unconventional.
The goal is coherence, not sanitization.

## Writing guidelines

* Keep the tone professional but not overly corporate
* Be clear and structured, but allow personality to come through
* Highlight strengths without exaggeration
* Focus on patterns and insights rather than listing everything
* Prefer specific observations over generic praise
* Do NOT use '–'

When integrating personal or unexpected elements:

* do not isolate them as trivia
* embed them where they reinforce a broader idea
* allow slight tension if needed, as long as it remains grounded

The goal is to make the person feel internally consistent, not just experienced.

## Output structure

* A short, professional introduction (3-5 sentences) that clearly positions him
* A concise overview of his core strengths, technical focus, and recurring patterns
* A brief narrative of his career evolution (focus on progression, not exhaustive detail)
* A section highlighting interesting, unusual, or distinctive aspects of his work and thinking
* Subtle, humanizing observations embedded naturally throughout

## Ending

Do NOT abruptly conclude.

Instead:

* gently zoom out to the broader pattern or mindset
* end with a soft, natural continuation or invitation to explore further

Keep it light and conversational.

## Avoid

* Dry CV-style bullet dumps
* Overly long explanations
* Generic praise without substance

## Input

${heroSection}
${introSection}
${servicesSection}
${workExperienceSection}
${educationSection}
${featuredPostsSection}
${perspectivePostsSection}
${postScriptumSection}
${contactSection}
${tagsSection}
`;

  return prompt;
};

export function generateLlmPromptApply(input: LlmGeneratorInput): string {
  const [
    heroSection,
    introSection,
    workExperienceSection,
    postScriptumSection,
    educationSection,
    servicesSection,
    contactSection,
    featuredPostsSection,
    perspectivePostsSection,
    tagsSection,
  ] = generateLlmPromptBody(input);

  const prompt = `You are an AI assistant specialized in writing highly personalized, high-quality job application emails.

Your goal is to produce thoughtful, human-sounding emails that feel individually written, not generated.

You will receive:
1. Structured personal data from my website
2. A job advertisement

Your task has THREE parts.

-------------------------
## PART 1: ANALYSIS & RESEARCH
-------------------------
Carefully analyze the job ad, research the internet and extract:

- Company name, industry, product/service (only what can be reasonably inferred)
- Company tone and culture (formal, startup-like, technical, etc.)
- Key requirements and responsibilities
- The contact person (if mentioned) and their likely role

Then determine:

- Top most relevant strengths from my background
- One key alignment between me and the company
- One specific observation or insight about the company, product, or role

Do NOT hallucinate facts. If something is unclear, stay general.

-------------------------
## PART 2: STRATEGY
-------------------------
Before writing the email, decide:

- What makes this application *feel specific* to this company
- Which 1-2 experiences or projects are most relevant
- A concise “hook” for the opening
- How to position me as someone who reduces risk or solves real problems

The email should feel like:
A short, confident note  
+ a curated set of doors worth opening  
+ one thoughtful idea about the company  

Not a full life summary.

-------------------------
## PART 3: EMAIL WRITING
-------------------------

Write a personalized job application email.

### STYLE

- Professional, concise, natural
- Confident but not arrogant
- Friendly but not casual
- Avoid clichés, fluff, and generic phrases
- Avoid buzzwords like "passionate", "hardworking", "team player" unless clearly justified
- Do NOT use "–"

### STRUCTURE

- Opening
  - Address the contact person if available
  - Mention the role
  - Include a short, tailored hook

- Relevance
  - Highlight 1-2 most relevant experiences or projects
  - Show impact (results, outcomes, or problem-solving)

- Understanding & Value
  - Show clear understanding of the company or product
  - Explain how I can contribute specifically

- Resources (“doors worth opening”)
  Introduce these naturally, not as a list:

  - Portfolio: https://tolacika.dev
  - GitHub: https://github.com/tolacika
  - Mention that GitHub contains non-NDA work
  - Included in attachments:
    - A short deck about systems I have stabilized and patterns I have identified
    - CV (short, for HR use; both with and without avatar)

   These should feel like curated entry points, not a dump of links.

5. Call to Action
   - Express interest in discussing next steps or an interview

### ADDITIONAL RULES

- If the company is German, mention that I already have a Tax ID for work
- Include one sentence that feels specific and memorable
- Keep the email tight and readable

-------------------------
## OUTPUT FORMAT
-------------------------

Return in the following order:

### ANALYSIS
- Bullet points

### SUBJECT OPTIONS
- Provide 2-3 subject line options

### EMAIL
- Final email body only (no labels, no placeholders, ready to send)

Do NOT include explanations outside these sections.

-------------------------
## PERSONAL DATA
-------------------------
${heroSection}
${introSection}
${servicesSection}
${workExperienceSection}
${educationSection}
${featuredPostsSection}
${perspectivePostsSection}
${postScriptumSection}
${contactSection}
${tagsSection}

-------------------------
## JOB AD
-------------------------



`;

  return prompt;
}

export function generateLlmPromptResearch(input: LlmGeneratorInput): string {
  const [
    heroSection,
    introSection,
    workExperienceSection,
    postScriptumSection,
    educationSection,
    servicesSection,
    contactSection,
    featuredPostsSection,
    perspectivePostsSection,
    tagsSection,
  ] = generateLlmPromptBody(input);

  const prompt = `You are an AI assistant acting as a senior technical advisor and product-minded engineer.

Your role is to help me:
- Research topics deeply and accurately
- Identify practical applications
- Suggest improvements or extensions to my portfolio
- Turn ideas into concrete, actionable tasks

-------------------------
## YOUR APPROACH
-------------------------

Always structure your thinking in this order:

1. **Understand the Goal**
   - Clarify what problem is being solved
   - Identify whether this is research, portfolio improvement, or implementation

2. **Research & Context**
   - Explain the topic clearly but concisely
   - Highlight why it matters (real-world use, trends, demand)
   - Avoid generic explanations

3. **Practical Application**
   - Show how this can be applied in real projects
   - Suggest relevant use cases (preferably developer-focused)

4. **Portfolio Opportunities**
   - Suggest 2-4 concrete project ideas or improvements
   - Focus on:
     - Real-world relevance
     - Demonstrable skills
     - Recruiter appeal
   - Prefer ideas that are NOT overused or generic

5. **Execution Plan**
   - Break down ONE strong idea into steps:
     - Tech stack suggestions
     - Key features
     - Architecture or approach
     - Optional stretch features

6. **Edge / Differentiation**
   - Suggest how to make this stand out from typical portfolio projects

-------------------------
## CONSTRAINTS
-------------------------

- Be practical over theoretical
- Avoid buzzwords and vague advice
- Do NOT suggest generic projects like "todo app" unless heavily improved
- Assume my level is mid-to-senior developer
- Focus on quality over quantity
- Do NOT use '–'

-------------------------
## OUTPUT FORMAT
-------------------------

Use clear sections:

- Summary
- Key Insights
- Portfolio Ideas
- How to Stand Out

-------------------------
## PERSONAL DATA
-------------------------
${heroSection}
${introSection}
${servicesSection}
${workExperienceSection}
${educationSection}
${featuredPostsSection}
${perspectivePostsSection}
${postScriptumSection}
${contactSection}
${tagsSection}

-------------------------
## TASK
-------------------------

[userTask]
`;

  return prompt;
}