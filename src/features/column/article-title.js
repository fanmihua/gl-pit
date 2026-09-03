export function formatArticleTitle(collectionTitle, articleTitle) {
  const compactCollection = collectionTitle.replace(/\s+/g, "");
  const compactArticle = articleTitle.replace(/\s+/g, "");
  let subject = articleTitle;

  if (compactArticle.startsWith(compactCollection)) {
    let consumed = 0;
    let sourceIndex = 0;
    while (sourceIndex < articleTitle.length && consumed < compactCollection.length) {
      if (!/\s/.test(articleTitle[sourceIndex])) consumed += 1;
      sourceIndex += 1;
    }
    subject = articleTitle.slice(sourceIndex);
  }

  subject = subject
    .replace(/^[-—–:：\s]+/, "")
    .replace(/(repo|ep)(?=\s*\d)/gi, (label) => (label.toLowerCase() === "repo" ? "Repo" : "EP"))
    .replace(/\brepo\b/gi, "Repo")
    .replace(/\bep\b/gi, "EP")
    .replace(/([\p{Script=Han}])(?=(?:Repo|EP)\s*\d)/gu, "$1 ")
    .replace(/([A-Za-z]+)\s*(\d{2}(?:-\d{2})?)/g, "$1 $2")
    .replace(/([\p{Script=Han}])(\d{2})(?=$|[（(])/gu, "$1 $2")
    .replace(/(\d{2})-(\d{2})/g, "$1–$2");

  return subject || articleTitle;
}
