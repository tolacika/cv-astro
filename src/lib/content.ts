import { z } from "zod";
import en from "../content/en.json";

const logoGlob = import.meta.glob<{ default: string }>(
  "../assets/img/logo-*.png",
  { eager: true }
);
const logoMap = Object.fromEntries(
  Object.entries(logoGlob).map(([path, mod]) => {
    const name = path.split("/logo-")[1]?.replace(".png", "") ?? "";
    return [name, mod.default];
  })
);

const iconGlob = import.meta.glob<{ default: string }>(
  "../assets/img/icon-*-*.svg",
  { eager: true }
);
const iconMap = Object.fromEntries(
  Object.entries(iconGlob).map(([path, mod]) => {
    const filename = path.split("/icon-")[1]?.replace(".svg", "") ?? "";
    const [name, color] = filename.split("-").slice(-2);
    return [`${name}/${color}`, mod.default];
  })
);

const validLogos = Object.keys(logoMap) as [string, ...string[]];
const validIcons = [
  ...new Set(
    Object.keys(iconMap).map((k) => k.split("/")[0])
  ),
] as [string, ...string[]];

const imagesSchema = z.object({
  logos: z.array(z.string()),
  icons: z.array(z.string()),
});

const navItemBaseSchema = z.object({
  label: z.string(),
});

const navItemWithHrefSchema = navItemBaseSchema.extend({
  href: z.string(),
  target: z.string().optional(),
  action: z.undefined(),
});

const navItemWithActionSchema = navItemBaseSchema.extend({
  action: z.enum(["openModal", "scroll"]),
  target: z.string(),
  href: z.undefined(),
});

const navItemSchema = z.union([
  navItemWithHrefSchema,
  navItemWithActionSchema,
]);

const navSchema = z.object({
  items: z.array(navItemSchema),
});

const seoSchema = z.object({
  cannonUrl: z.string(),
  defaultTitle: z.string(),
  defaultTitlePostfix: z.string(),
  defaultDescription: z.string(),
  defaultKeywords: z.string(),
  defaultAuthor: z.string(),
  defaultOgTitle: z.string(),
  defaultOgDescription: z.string(),
})

const heroSchema = z.object({
  preTitle: z.string(),
  fullName: z.string(),
  subTitle: z.string(),
  imageAlt: z.string(),
  bgAlt: z.string(),
});

const socialLinkBaseSchema = z.object({
  icon: z.string(),
  followable: z.boolean().optional(),
  target: z.string().optional(),
});

const socialLinkWithLinkSchema = socialLinkBaseSchema.extend({
  link: z.string(),
  scrollTo: z.undefined(),
});

const socialLinkWithScrollToSchema = socialLinkBaseSchema.extend({
  scrollTo: z.string(),
  link: z.undefined(),
});

const socialLinkSchema = z.union([
  socialLinkWithLinkSchema,
  socialLinkWithScrollToSchema,
]);

const socialLinksSchema = z.object({
  actionText: z.string(),
  followText: z.string(),
  links: z.array(socialLinkSchema),
});

const skillItemSchema = z.object({
  tags: z.array(z.string()),
  comment: z.string(),
});

const skillGroupSchema = z.object({
  label: z.string(),
  items: z.array(skillItemSchema),
});

const skillsSchema = z.object({
  title: z.string(),
  subTitle: z.string(),
  groups: z.array(skillGroupSchema),
});

const languageSchema = z.object({
  code: z.string(),
  icon: z.string(),
  label: z.string(),
  greeting: z.string(),
  proficiency: z.string(),
  comment: z.string(),
});

const languagesSchema = z.object({
  title: z.string(),
  items: z.array(languageSchema),
});

const introSchema = z.object({
  title: z.string(),
  subTitle: z.string(),
  paragraph: z.string(),
  skills: skillsSchema,
  langs: languagesSchema,
});

const jobBaseSchema = z.object({
  slug: z.string(),
  company: z.string(),
  dates: z.string(),
  position: z.string(),
  description: z.string(),
  readMore: z.array(z.string()).optional(),
  patterns: z.array(z.string()),
  tags: z.array(z.string()),
});

const jobWithLogoSchema = jobBaseSchema.extend({
  logo: z.enum(validLogos),
  altLogo: z.string().optional(),
});

const jobWithAltLogoSchema = jobBaseSchema.extend({
  logo: z.undefined(),
  altLogo: z.string(),
});

const jobSchema = z.union([
  jobWithLogoSchema,
  jobWithAltLogoSchema,
]);

const workExperienceSchema = z.object({
  title: z.string(),
  subTitle: z.string(),
  jobs: z.array(jobSchema),
});

const postScriptumSchema = z.object({
  title: z.string(),
  subTitle: z.string(),
  content: z.array(z.string()),
});

const educationSchema = z.object({
  title: z.string(),
  subTitle: z.string(),
  content: z.array(z.string()),
});

const seeAlsoSchema = z.object({
  type: z.enum(["external", "tag", "pattern", "experience", "post"]),
  label: z.string(),
  comment: z.string().optional(),
  link: z.string(),
})

const tagSchema = z.object({
  slug: z.string(),
  label: z.string(),
  teaser: z.string(),
  explanation: z.array(z.string()),
  seeAlso: z.array(seeAlsoSchema).optional(),
  icon: z.enum(validIcons).optional(),
});

const servicesSchema = z.object({
  title: z.string(),
  subTitle: z.string(),
  patterns: z.array(z.string()),
});

const contactItemSchema = z.object({
  icon: z.string(),
  head: z.string(),
  text: z.string(),
  link: z.string().optional(),
});

const contactDetailsSchema = z.object({
  title: z.string(),
  subTitle: z.string(),
  description: z.string(),
  items: z.array(contactItemSchema),
});

const followMeSchema = z.object({
  title: z.string(),
});

const perspectiveSchema = z.object({
  title: z.string(),
  subTitle: z.string(),
});

const projectFeaturedSchema = z.object({
  title: z.string(),
  subTitle: z.string(),
});

const contentSchema = z.object({
  images: imagesSchema,
  nav: navSchema,
  seo: seoSchema,
  hero: heroSchema,
  socialLinks: socialLinksSchema,
  intro: introSchema,
  workExperience: workExperienceSchema,
  postScriptum: postScriptumSchema,
  education: educationSchema,
  services: servicesSchema,
  contactDetails: contactDetailsSchema,
  followMe: followMeSchema,
  perspective: perspectiveSchema,
  projectFeatured: projectFeaturedSchema,
  tags: z.array(tagSchema),
});

const parsedContent = contentSchema.parse(en);

export type ImageType = {
  src: string,
  width: number,
  height: number,
  format: "png" | "svg",
};

export type IconImageType = {
  black: ImageType | null,
  white: ImageType | null,
}

export const logoSet = logoMap as unknown as Record<string, ImageType>;
export type LogoKey = (typeof validLogos)[number];

export const servicesIconSet = (Object.entries(iconMap).reduce(
  (acc, [key, src]) => {
    const [name, color] = key.split("/");
    if (!acc[name]) acc[name] = { black: null, white: null };
    acc[name][color as "black" | "white"] = src as unknown as ImageType;
    return acc;
  },
  {} as Record<string, IconImageType>
)) as Record<string, IconImageType>;

export type ServicesIconKey = (typeof validIcons)[number];

export type NavItem = z.infer<typeof navItemSchema>;
export type Nav = z.infer<typeof navSchema>;

export type Hero = z.infer<typeof heroSchema>;

export type SocialLink = z.infer<typeof socialLinkSchema>;
export type SocialLinksData = z.infer<typeof socialLinksSchema>;

export type SkillItem = z.infer<typeof skillItemSchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type Skills = z.infer<typeof skillsSchema>;
export type Language = z.infer<typeof languageSchema>;
export type Languages = z.infer<typeof languagesSchema>;
export type Intro = z.infer<typeof introSchema>;

export type Job = z.infer<typeof jobSchema>;
export type WorkExperience = z.infer<typeof workExperienceSchema>;

export type Services = z.infer<typeof servicesSchema>;

export type PostScriptum = z.infer<typeof postScriptumSchema>;
export type Education = z.infer<typeof educationSchema>;

export type ContactItem = z.infer<typeof contactItemSchema>;
export type ContactDetails = z.infer<typeof contactDetailsSchema>;

export type FollowMe = z.infer<typeof followMeSchema>;
export type Perspective = z.infer<typeof perspectiveSchema>;
export type ProjectFeatured = z.infer<typeof projectFeaturedSchema>;

export type SeeAlso = z.infer<typeof seeAlsoSchema>;
export type Tag = z.infer<typeof tagSchema>;
export type SEO = z.infer<typeof seoSchema>;

export type Content = z.infer<typeof contentSchema>;

export function getContent(): Content {
  return parsedContent;
}

export function validateContent(data: unknown): Content {
  return contentSchema.parse(data);
}

const missingTag: Tag = {
  slug: "",
  label: "Missing tag: ",
  teaser: "",
  explanation: [],
}

export const getTagBySlug = (slug: string): Tag => parsedContent.tags.find(t => t.slug == slug) ?? {...missingTag, slug: slug, label: missingTag.label + slug};