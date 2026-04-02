import en from "../content/en.json";

import logoOrdioImage from '../assets/img/logo-ordio.png';
import logoDiligentImage from '../assets/img/logo-diligent.png';
import logoRisskovImage from '../assets/img/logo-risskov.png';
import logoWebshippyImage from '../assets/img/logo-webshippy.png';
import logoMannaImage from '../assets/img/logo-manna.png';

import iconDevelopmentWhite from '../assets/img/icon-development-white.svg';
import iconDevelopmentBlack from '../assets/img/icon-development-black.svg';
import iconContentWhite from '../assets/img/icon-content-white.svg';
import iconContentBlack from '../assets/img/icon-content-black.svg';
import iconMobileWhite from '../assets/img/icon-mobile-white.svg';
import iconMobileBlack from '../assets/img/icon-mobile-black.svg';
import iconEmailWhite from '../assets/img/icon-email-white.svg';
import iconEmailBlack from '../assets/img/icon-email-black.svg';
import iconDesignWhite from '../assets/img/icon-design-white.svg';
import iconDesignBlack from '../assets/img/icon-design-black.svg';
import iconGraphicsWhite from '../assets/img/icon-graphics-white.svg';
import iconGraphicsBlack from '../assets/img/icon-graphics-black.svg';

/**
 * 🔑 Source of truth
 */
export type Content = typeof en;

/**
 * 📦 Loader (future: replace with CMS)
 */
export async function getContent(): Promise<Content> {
  return en;
}

/**
 * 🌍 Social Links
 */
export type SocialLinksData = Content["socialLinks"];
export type SocialLinkRaw = SocialLinksData["links"][number];

export type SocialLinksBase = {
  icon: string;
  followable?: boolean;
  target?: string;
};

type RequireAtLeastOne =
  | { link: string; scrollTo?: never }
  | { scrollTo: string; link?: never };

export type SocialLink = SocialLinksBase & RequireAtLeastOne;

/**
 * 🏢 Work Experience
 */

// 🎯 Define logos ONCE (used by components too)
export const logoSet = {
  ordio: logoOrdioImage,
  diligent: logoDiligentImage,
  risskov: logoRisskovImage,
  webshippy: logoWebshippyImage,
  manna: logoMannaImage,
} as const;

export type LogoKey = keyof typeof logoSet;

// Raw type from JSON
export type WorkExperience = Content["workExperience"];
export type JobRaw = WorkExperience["jobs"][number];

// 🔒 Safe override (tighten logo typing)
export type Job = Omit<JobRaw, "logo"> & {
  logo?: LogoKey;
};

/**
 * 🌍 Languages
 */
export type Languages = Content["intro"]["langs"];
export type Language = Languages["items"][number];

/**
 * ⚙️ Intro / Skills
 */
export type Intro = Content["intro"];
export type Skill = Intro["skills"][number];

/**
 * 🎨 Services Icons
 */

export const servicesIconSet = {
  development: {
    black: iconDevelopmentBlack,
    white: iconDevelopmentWhite,
  },
  content: {
    black: iconContentBlack,
    white: iconContentWhite,
  },
  mobile: {
    black: iconMobileBlack,
    white: iconMobileWhite,
  },
  email: {
    black: iconEmailBlack,
    white: iconEmailWhite,
  },
  design: {
    black: iconDesignBlack,
    white: iconDesignWhite,
  },
  graphics: {
    black: iconGraphicsBlack,
    white: iconGraphicsWhite,
  },
} as const;

export type ServicesIconKey = keyof typeof servicesIconSet;

export type Services = Content["services"];
export type ServiceRaw = Services["services"][number];

// 🔒 Safe override (tighten icon typing)
export type Service = Omit<ServiceRaw, "icon"> & {
  icon?: ServicesIconKey;
};

/**
 * 🧭 Navigation
 */
export type Nav = Content["nav"];
export type NavItem = Nav["items"][number];

/**
 * 🦸 Hero
 */
export type Hero = Content["hero"];

/**
 * 📧 Contact Details
 */
export type ContactDetails = Content["contactDetails"];
export type ContactItem = ContactDetails["items"][number];

/**
 * 👋 Follow Me
 */
export type FollowMe = Content["followMe"];

/**
 * 🔭 Perspective
 */
export type Perspective = Content["perspective"];

/**
 * 🚀 Project Featured
 */
export type ProjectFeatured = Content["projectFeatured"];

/**
 * 📝 Posts (Discriminated Union)
 */
export type PostType = "perspective" | "project";

export type PostBase = {
  type: PostType;
  title: string;
  teaser: string;
  image: string;
  href: string;
};

export type PerspectivePost = PostBase & {
  type: "perspective";
  cta?: string;
  featured?: never;
};

export type ProjectPost = PostBase & {
  type: "project";
  featured?: boolean;
  cta?: never;
};

export type Post = PerspectivePost | ProjectPost;

export type Posts = Content["posts"];
