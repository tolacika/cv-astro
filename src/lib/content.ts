import en from '../content/en.json';

export type Content = typeof en;

export type SocialLinksData = Content['socialLinks'];

export type SocialLinksBase = {
  icon: string,
  followable?: boolean,
  target?: string,
}

type RequireAtLeastOne =
  | { link: string; scrollTo?: never }
  | { scrollTo: string; link?: never };

export type SocialLink = SocialLinksBase & RequireAtLeastOne;

export async function getContent(): Promise<Content> {
  return en;
}