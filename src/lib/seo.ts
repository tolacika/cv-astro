import type { MainHeadProps } from "../components/MainHead.astro";
import type { Content } from "./content";

export function getDefaultSeoProps(content: Content, ogImage: string): MainHeadProps {
  return {
    title: content.seo.defaultTitle,
    postfix: content.seo.defaultTitlePostfix,
    description: content.seo.defaultDescription,
    keywords: content.seo.defaultKeywords,
    author: content.seo.defaultAuthor,
    ogTitle: content.seo.defaultOgTitle,
    ogDesc: content.seo.defaultOgDescription,
    ogImage: content.seo.cannonUrl + ogImage,
    ogUrl: content.seo.cannonUrl,
  } as MainHeadProps;
}