# CV-Astro

A modern, open-source static portfolio engine built with Astro + Tailwind v4.

## Features

- **Static HTML output** - SEO + LLM friendly
- **Data-driven from JSON** - CMS-ready
- **View Transitions** - SPA-like UX without SPA complexity
- **Native page navigation** - real URLs, no interception
- **Type-safe** - types derived from JSON schema

## Architecture

```
content (JSON)
        ↓
typed loader (getContent / getPosts)
        ↓
Astro pages (static routes)
        ↓
Astro components (pure renderers)
        ↓
View Transitions (UX enhancement)
        ↓
static HTML output
```

## Philosophy

> One user → one JSON → one schema → one renderer

> Content is static. Navigation is real. Enhancement is optional.

> HTML is the final API.

## Project Structure

```
src/
  content/
    en.json              # content data

  lib/
    content.ts           # content loader
    posts.ts              # posts loader
    renderPost.ts         # markdown renderer

  components/
    Navbar.astro
    Hero.astro
    Intro.astro
    WorkExperience.astro
    Services.astro
    ProjectFeatured.astro
    Perspective.astro
    ContactDetails.astro
    FollowMe.astro
    PostCard.astro
    PostView.astro

  layouts/
    Layout.astro          # includes ViewTransitions

  pages/
    index.astro
    post/
      [slug].astro        # dynamic static pages
```

## Commands

| Command           | Action                                      |
| :---------------- | :------------------------------------------ |
| `npm install`     | Installs dependencies                       |
| `npm run dev`     | Starts local dev server at `localhost:3000` |
| `npm run build`   | Build production site to `./dist/`          |
| `npm run preview` | Preview build locally                       |

## Deployment

Deploys on free hosting (GitHub Pages, Netlify).

## Tech Stack

- Astro
- Tailwind v4
- Markdown rendering

## License

MIT