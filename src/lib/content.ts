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

const navItemSchema = z.object({
  label: z.string(),
  href: z.string(),
});

const navSchema = z.object({
  items: z.array(navItemSchema),
});

const heroSchema = z.object({
  preTitle: z.string(),
  fullName: z.string(),
  subTitle: z.string(),
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

const skillSchema = z.object({
  name: z.string(),
  proficiency: z.number().min(0).max(100),
  learning: z.boolean().optional(),
});

const languageSchema = z.object({
  code: z.string(),
  icon: z.string(),
  label: z.string(),
  greeting: z.string(),
  proficiency: z.number().min(0).max(100),
  learning: z.boolean().optional(),
});

const languagesSchema = z.object({
  title: z.string(),
  items: z.array(languageSchema),
});

const introSchema = z.object({
  title: z.string(),
  subTitle: z.string(),
  paragraph: z.string(),
  skills: z.array(skillSchema),
  langs: languagesSchema,
});

const jobSchema = z.object({
  company: z.string(),
  dates: z.string(),
  position: z.string(),
  description: z.string(),
  logo: z.enum(validLogos).optional(),
});

const workExperienceSchema = z.object({
  title: z.string(),
  subTitle: z.string(),
  jobs: z.array(jobSchema),
});

const serviceSchema = z.object({
  title: z.string(),
  subTitle: z.string(),
  icon: z.enum(validIcons).optional(),
});

const servicesSchema = z.object({
  title: z.string(),
  subTitle: z.string(),
  services: z.array(serviceSchema),
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
  hero: heroSchema,
  socialLinks: socialLinksSchema,
  intro: introSchema,
  workExperience: workExperienceSchema,
  services: servicesSchema,
  contactDetails: contactDetailsSchema,
  followMe: followMeSchema,
  perspective: perspectiveSchema,
  projectFeatured: projectFeaturedSchema,
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

export type Skill = z.infer<typeof skillSchema>;
export type Language = z.infer<typeof languageSchema>;
export type Languages = z.infer<typeof languagesSchema>;
export type Intro = z.infer<typeof introSchema>;

export type Job = z.infer<typeof jobSchema>;
export type WorkExperience = z.infer<typeof workExperienceSchema>;

export type Service = z.infer<typeof serviceSchema>;
export type Services = z.infer<typeof servicesSchema>;

export type ContactItem = z.infer<typeof contactItemSchema>;
export type ContactDetails = z.infer<typeof contactDetailsSchema>;

export type FollowMe = z.infer<typeof followMeSchema>;
export type Perspective = z.infer<typeof perspectiveSchema>;
export type ProjectFeatured = z.infer<typeof projectFeaturedSchema>;

export type Content = z.infer<typeof contentSchema>;

export async function getContent(): Promise<Content> {
  return parsedContent;
}

export function validateContent(data: unknown): Content {
  return contentSchema.parse(data);
}
