import { getCollection, getEntries, type CollectionEntry } from "astro:content";
import { getContent, type Content, type SeeAlso } from "./content";

export interface LlmGeneratorInput {
  translations: Content;
  featuredPosts: CollectionEntry<"postCollection">[];
  perspectivePosts: CollectionEntry<"postCollection">[];
  tags: CollectionEntry<"tagCollection">[];
  jobs: CollectionEntry<"jobCollection">[];
}

function escapeForJson(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
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
  //     - title: ${escapeForJson(seo.title)}
  //     - description: ${escapeForJson(seo.description)}
  return `
#### POST
- slug: ${escapeForJson(post.slug)}
- title: ${escapeForJson(post.title)}
- teaser: ${escapeForJson(post.teaser)}
- date: ${post.date ? escapeForJson(post.date + "") : "null"}
- cta: ${post.cta ? escapeForJson(post.cta) : "null"}
- content: |
${content.split("\n").map(line => "  " + escapeForJson(line)).join("\n")}
`;
}

function formatSeeAlso(also: SeeAlso[]): string[] {
  return also.map(s => escapeForJson(`${s.type}:${s.link} - ${s.label}${s.comment ? ` (${s.comment})` : ``}`));
}

export async function createLlmInput(): Promise<LlmGeneratorInput> {
  const content = getContent() as Content;

  const tags = (await getCollection("tagCollection"))
    .sort((a, b) => a.data.slug.localeCompare(b.data.slug));
  const jobs = await getEntries(content.workExperience.jobs.map(j => ({ collection: "jobCollection", id: j })))

  const perspectivePosts = await getEntries([
    { collection: "postCollection", id: "perspective-background" },
    { collection: "postCollection", id: "perspective-vision" },
    { collection: "postCollection", id: "perspective-side-quests" },
  ])

  const input: LlmGeneratorInput = {
    translations: content,
    featuredPosts: [],
    perspectivePosts: perspectivePosts,
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

${escapeForJson(translations.hero.preTitle)} ${escapeForJson(translations.hero.fullName)}  
${escapeForJson(translations.hero.subTitle)}
`;

  const introSection = `
### INTRO SECTION

${escapeForJson(translations.intro.title)}
${escapeForJson(translations.intro.subTitle)}

${truncateContent(translations.intro.paragraph, 500)}
${escapeForJson(translations.intro.skills.title)} - ${escapeForJson(translations.intro.skills.subTitle)}
${translations.intro.skills.groups.map(g => `  - ${escapeForJson(g.label)}:\n${g.items.map(i => `    - ${i.tags.join(", ")}: ${escapeForJson(i.comment)}`).join("\n")}`).join("\n")}
languages:\n${translations.intro.langs.items.map(l => `  - ${escapeForJson(l.label)} ${(l.greeting)}: ${(l.proficiency)} - ${escapeForJson(l.comment)}`).join("\n")}
`;

  const workExperienceSection = `
### WORK EXPERIENCE

${escapeForJson(translations.workExperience.title)}
${escapeForJson(translations.workExperience.subTitle)}
jobs:
${translations.workExperience.jobs
      .map(j => jobs[jobIdx[j]])
      .map(j => {
        const job = j.data;
        const body = j.body || "";
        return `  - ${escapeForJson(job.company)} | ${job.datePeriod} | ${escapeForJson(job.position)}
    - patterns: ${job.patterns.map(t => escapeForJson(t.id)).join(", ")}
    - tags: ${job.tags.map(t => escapeForJson(t.id)).join(", ")}
    - ${escapeForJson(job.teaser)}
${body.split("\n").filter(line => !!line).map(line => "      " + escapeForJson(line)).join("\n")}`;
      })
      .join("\n")
    }
`;

  const postScriptumSection = `
### ${escapeForJson(translations.postScriptum.title)}

${escapeForJson(translations.postScriptum.subTitle)}
${translations.postScriptum.content.map(escapeForJson).join("\n")}
`;

  const educationSection = `
### ${escapeForJson(translations.education.title)}

${escapeForJson(translations.education.subTitle)}
${translations.education.content.map(escapeForJson).join("\n")}
`;

  const servicesSection = `
### PATTERNS

${escapeForJson(translations.services.title)}
${escapeForJson(translations.services.subTitle)}
patterns:
${translations.services.patterns
      .map(p => tags[tagIdx[p]])
      .map(p => {
        const tag = p.data;
        const body = p.body || "";
        return `  - **${escapeForJson(tag.label)}:** ${escapeForJson(tag.teaser)}
${body.split("\n").filter(line => !!line).map(line => "      " + escapeForJson(line)).join("\n")}${tag.relatedTags ? `
    - relatedTags: ${tag.relatedTags.map(i => i.id).map(i => escapeForJson(tags[tagIdx[i]].data.slug)).join("; ")}` : ``}
`;
      })}`;

  const contactSection = `
### CONTACT
${escapeForJson(translations.contactDetails.title)}
${escapeForJson(translations.contactDetails.subTitle)}
${truncateContent(translations.contactDetails.description, 500)}
${escapeForJson(translations.socialLinks.actionText)}:
${translations.socialLinks.links.filter(l => l.link).map(l => `  - ${l.link}`).join("\n")}
`;

  const featuredPostsSection = `
### FEATURED PROJECTS

${escapeForJson(translations.projectFeatured.title)}  
${escapeForJson(translations.projectFeatured.subTitle)}
${featuredPosts.map((entry) => formatPostForLlm(entry.data, truncateContent(entry.body!, 1500))).join("\n\n---\n\n")}
`;

  const perspectivePostsSection = `
### PERSPECTIVE POSTS

${escapeForJson(translations.perspective.title)}  
${escapeForJson(translations.perspective.subTitle)}
${perspectivePosts.map((entry) => formatPostForLlm(entry.data, truncateContent(entry.body!, 7000))).join("\n\n---\n\n")}
`;
  const tagsSection = `
### TAGS
${tags.map(t => {
  const tag = t.data;
  const body = t.body || "";
    return `
#### ${escapeForJson(tag.label)} [${escapeForJson(tag.slug)}]

${escapeForJson(tag.teaser)}

${body.split("\n").filter(line => !!line).map(line => escapeForJson(line)).join("\n")}`;
  }).join("\n")}
`;
  //  ${t.explanation.map(e => escapeForJson(e)).join("\n")}${t.seeAlso ? `
  //    - see also: ${formatSeeAlso(t.seeAlso).join("; ")}` : ``}

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

  const prompt = `You are an AI assistant analyzing Marshall Laszlo Toth's professional portfolio. Below is structured data from his personal website.

${heroSection}
${introSection}
${workExperienceSection}
${educationSection}
${servicesSection}
${contactSection}
${featuredPostsSection}
${perspectivePostsSection}
${postScriptumSection}
${tagsSection}

Based on the above information, provide a comprehensive summary of Marshall Laszlo Toth's professional profile, skills, work history, and the specific projects outlined.`;

  return prompt;
};

export function generateLlmPromptDev(input: LlmGeneratorInput): string {
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

You will receive:
1. Structured personal data from my website
2. A job advertisement

Your task has TWO phases:

-------------------------
## PHASE 1: RESEARCH
-------------------------
Carefully analyze the job ad and infer:
- Company name, industry, and likely product/service
- Company culture, values, and tone (formal, startup-like, etc.)
- Key requirements and responsibilities
- The contact person (if mentioned) and their likely role

Do NOT hallucinate specific facts. Only infer reasonably from the provided job ad.

-------------------------
## PHASE 2: EMAIL WRITING
-------------------------
Write a personalized job application email using my background data.

### STRICT REQUIREMENTS

The email MUST:
- Be professional, concise, and natural (no clichés, no fluff)
- Sound like a real human wrote it (not generic AI output)
- Be tailored to THIS specific company and role
- Clearly connect my experience to the job requirements
- Demonstrate understanding of what the company does
- Do NOT use '–'

### MUST INCLUDE

1. **Personalized Opening**
   - Address the contact person if available
   - Mention the specific role
   - Include a short, tailored hook about co-operation

2. **Relevant Experience/Project/Post**
   - Select ONLY the most relevant parts from my background
   - Show impact (results, outcomes, or strengths)
   - Avoid listing everything

3. **Value Proposition**
   - Explain how I can contribute to THIS company specifically
   - Align my skills with their needs

4. **Portfolio & Work**
   Include naturally in the text:
   - Portfolio: https://tolacika.dev - refer to relevant content
   - GitHub: https://github.com/tolacika - all of my non-NDA works is available for showcasing
   - If the company is German also include that I already have Tax ID for work.

   Mention that these contain deeper details and projects what does not covers NDA.

5. **CV Mention**
   - Clearly state: I am attaching a **single-page CV for HR use**

6. **Call to Action**
   - Express interest in discussing next steps or an interview

7. **Tone**
   - Confident but not arrogant
   - Friendly but not casual
   - No buzzwords like "passionate", "hardworking", "team player" unless justified


Before writing, internally decide:
- Top 3 most relevant strengths
- One key alignment with the company
- One sentence that makes this email feel unique

-------------------------
## OUTPUT FORMAT
-------------------------

Return with the result of the contact search.
Return with ONLY the email subject and body.
Do NOT include:
- Explanations
- Notes
- Subject line
- Placeholders like [Your Name]

The result must be clean and ready to copy-paste into a new conversation or email client.

-------------------------
## PERSONAL DATA
-------------------------
${heroSection}
${introSection}
${workExperienceSection}
${educationSection}
${servicesSection}
${contactSection}
${featuredPostsSection}
${perspectivePostsSection}
${postScriptumSection}
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
${workExperienceSection}
${educationSection}
${servicesSection}
${contactSection}
${featuredPostsSection}
${perspectivePostsSection}
${postScriptumSection}
${tagsSection}

-------------------------
## TASK
-------------------------

[userTask]
`;

  return prompt;
}