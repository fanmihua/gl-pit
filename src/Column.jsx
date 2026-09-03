import columnData from "./data/column-data.json";
import { SiteHeader } from "./SiteHeader.jsx";
import { useHashRoute } from "./hooks/useHashRoute.js";
import { ColumnIndex, CollectionView } from "./features/column/CollectionViews.jsx";
import { ArticleView } from "./features/column/ArticleView.jsx";
import "./magazine-layout.css";

export { ArticleDocument } from "./features/column/ArticleDocument.jsx";

export function ColumnExperience() {
  const route = useHashRoute();
  const collection = columnData.collections.find((item) => item.slug === route[1]);
  const article = collection?.articles.find((item) => item.slug === route[2] && !item.hidden);

  return (
    <main className="column-shell">
      <SiteHeader activePath="column" />
      {!collection && <ColumnIndex />}
      {collection && !article && <CollectionView collection={collection} />}
      {collection && article && <ArticleView collection={collection} article={article} />}
    </main>
  );
}
