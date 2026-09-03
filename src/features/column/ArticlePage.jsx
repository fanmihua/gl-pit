import columnData from "../../data/column-data.json";
import { ArticleView } from "./ArticleView.jsx";

export default function ArticlePage({ collectionSlug, articleSlug }) {
  const collection = columnData.collections.find((item) => item.slug === collectionSlug);
  const article = collection?.articles.find((item) => item.slug === articleSlug && !item.hidden);
  return collection && article ? <ArticleView collection={collection} article={article} /> : null;
}
