import { useMemo, useRef } from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { withBase } from "../../lib/assets.js";
import { ArticleDocument } from "./ArticleDocument.jsx";
import { formatArticleTitle } from "./article-title.js";
import { useReadingProgress, useArticleReveal } from "./useArticleEffects.js";

function ArticleMastheadSubject({ subject }) {
  const episodeMatch = subject.match(/^(.*?)(\s+EP\s*\d+(?:[–-]\d+)?)$/i);
  if (!episodeMatch) return subject;

  return (
    <>
      {episodeMatch[1].trim()}
      <span className="article-masthead-episode">{episodeMatch[2].trim()}</span>
    </>
  );
}

export function ArticleView({ collection, article }) {
  const articleRef = useRef(null);
  const progress = useReadingProgress();
  useArticleReveal(articleRef, article.slug);
  const visibleArticles = collection.articles.filter((item) => !item.hidden);
  const articleIndex = visibleArticles.findIndex((item) => item.slug === article.slug);
  const articleNumber = String(articleIndex + 1).padStart(2, "0");
  const articleSubject = formatArticleTitle(collection.title, article.title);
  const nextArticle = visibleArticles[articleIndex + 1];
  const articleImages = useMemo(() => {
    return Array.from(article.xml.matchAll(/<img\b[^>]*\bhref="([^"]+)"/g), (match) => match[1]);
  }, [article.xml]);
  const mastheadImage = articleImages[0] || article.cover || collection.cover;

  return (
    <article className="article-view article-magazine" ref={articleRef}>
      <div className="article-toolbar">
        <a className="article-toolbar-back" href={`#/column/${collection.slug}`} aria-label={`返回${collection.title}合集`}>
          <ArrowLeft aria-hidden="true" />
          <span>返回{collection.title}</span>
        </a>
        <span className="article-toolbar-title">
          <small>ARTICLE / {articleNumber}</small>
          <strong>{articleSubject}</strong>
        </span>
        <span className="article-toolbar-track" aria-hidden="true">
          <i style={{ transform: `scaleX(${Math.max(progress, 0.012)})` }} />
        </span>
        <span className="article-toolbar-percent">阅读进度 {Math.round(progress * 100)}%</span>
      </div>
      <header className="article-masthead">
        <div className="article-masthead-copy">
          <span className="article-masthead-kicker">ARTICLE / {articleNumber}</span>
          <h1 aria-label={article.title}>
            <span>{collection.title}</span>
            <strong><ArticleMastheadSubject subject={articleSubject} /></strong>
          </h1>
          <span className="article-masthead-underline" aria-hidden="true" />
        </div>
        <figure className="article-masthead-still" aria-hidden="true">
          <img src={withBase(mastheadImage)} alt="" decoding="async" fetchPriority="high" data-page-critical="true" />
        </figure>
        <aside className="article-masthead-note">
          <span>EDGE NOTE</span>
          <p>{article.label}</p>
        </aside>
      </header>
      <ArticleDocument xml={article.xml} hideTitle hideLeadHeading />
      {nextArticle && (
        <nav className="article-next-nav" aria-label="下一篇文章">
          <span>NEXT ARTICLE</span>
          <a href={`#/column/${collection.slug}/${nextArticle.slug}`}>
            <small>下一篇</small>
            <strong>{formatArticleTitle(collection.title, nextArticle.title)}</strong>
            <ArrowRight aria-hidden="true" />
          </a>
        </nav>
      )}
    </article>
  );
}
