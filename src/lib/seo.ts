import type { Props as MainHeadProps } from "../components/MainHead.astro";
import type { PostMeta } from "../content.config";
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

export function getPostSeoProps(content:Content, post: PostMeta):MainHeadProps {
  return {
    ... getDefaultSeoProps(content, ""),
    title: post.title,
    description: post.teaser,
    ogTitle: post.title + content.seo.defaultTitlePostfix,
    ogDesc: post.teaser,
    ogImage: post.image ? content.seo.cannonUrl + post.image.src : "",
    ogUrl: content.seo.cannonUrl + `/post/${post.slug}.html`,
    twitterCard: "summary_large_image",
  } as MainHeadProps;
}