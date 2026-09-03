import { lazy } from "react";
import columnData from "./data/column-index.json";
import { SiteHeader } from "./SiteHeader.jsx";
import { useHashRoute } from "./hooks/useHashRoute.js";
import { ColumnIndex, CollectionView } from "./features/column/CollectionViews.jsx";
import "./magazine-layout.css";

const ArticlePage = lazy(() => import("./features/column/ArticlePage.jsx"));

export function ColumnExperience() {
  const route = useHashRoute();
  const collection = columnData.collections.find((item) => item.slug === route[1]);
  const article = collection?.articles.find((item) => item.slug === route[2] && !item.hidden);

  return (
    <main className="column-shell">
      <SiteHeader activePath="column" />
      {!collection && <ColumnIndex />}
      {collection && !article && <CollectionView collection={collection} />}
      {collection && article && <ArticlePage collectionSlug={collection.slug} articleSlug={article.slug} />}
    </main>
  );
}
