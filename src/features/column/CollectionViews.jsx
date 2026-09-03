import { Fragment, useMemo } from "react";
import { ArrowRight, CalendarDots, DotsNine, HeartStraight, NotePencil, Paperclip, TelevisionSimple, UsersThree } from "@phosphor-icons/react";
import columnData from "../../data/column-data.json";
import { RepoFilmStrip } from "../../RepoFilmStrip.jsx";
import { withBase } from "../../lib/assets.js";

const collectionCoverFocus = {
  "rival-lover": { card: "50% 10%", strip: "50% 18%" },
  us: { strip: "50% 58%" },
  "designing-love": { strip: "50% 41%" },
  "poisonous-love": { strip: "50% 18%" },
  "my-secret-words": { strip: "50% 38%" },
  affair: { strip: "50% 40%" },
};

function CollectionCard({ collection, index }) {
  const visibleArticleCount = collection.articles.filter((article) => !article.hidden).length;
  const coverFocus = collectionCoverFocus[collection.slug];

  return (
    <a
      className={`collection-card collection-card-${index + 1} collection-card-${collection.slug}`}
      href={`#/column/${collection.slug}`}
      style={{ "--collection-card-focus": coverFocus?.card ?? "50% 50%" }}
    >
      {index === 0 && (
        <>
          <span className="card-decoration card-paperclip" aria-hidden="true"><Paperclip /></span>
          <span className="card-decoration card-heart-doodle" aria-hidden="true">
            <img src={withBase("assets/repo-handdrawn-heart-pink.webp")} alt="" decoding="async" />
          </span>
        </>
      )}
      {index === 2 && (
        <span className="card-decoration card-evidence-stamp" aria-hidden="true">
          <span>EVIDENCE</span><HeartStraight weight="fill" /><span>LOVE</span>
        </span>
      )}
      {index === 5 && <span className="card-decoration card-pink-tape" aria-hidden="true" />}
      <div className="collection-cover">
        <img src={withBase(collection.cover)} alt={`${collection.title}合集封面`} loading="lazy" decoding="async" />
        <span>{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="collection-card-copy">
        <span>{collection.issue}</span>
        <h2>{collection.title}</h2>
        <p>{visibleArticleCount} 篇 Repo / 侧写</p>
        <ArrowRight aria-hidden="true" />
      </div>
    </a>
  );
}

const collectionEditorialNotes = {
  "rival-lover": { roman: "ENEMIES WITH BENEFITS" },
  us: { roman: "OUR LOVE" },
  "designing-love": { roman: "DESIGNING LOVE" },
  "poisonous-love": { roman: "POISONOUS LOVE" },
  "my-secret-words": { roman: "MY SECRET WORDS" },
  affair: { roman: "THE AFFAIR" },
};

function CollectionDisplayTitle({ title }) {
  const characters = Array.from(title);

  return (
    <h1 aria-label={title}>
      {characters.map((character, index) => (
        <span className={index === characters.length - 1 ? "is-pink" : undefined} aria-hidden="true" key={`${character}-${index}`}>
          {character === " " ? "\u00a0" : character}
        </span>
      ))}
    </h1>
  );
}

function ArticleCardTitle({ label }) {
  const parts = label.split(/\s*·\s*/).filter(Boolean);
  if (parts.length > 1) {
    return (
      <h3 className="article-card-title article-card-title-split">
        <strong>{parts[0]}</strong>
        <small>{parts.slice(1).map((part, index) => (
          <Fragment key={part}>
            {index > 0 && <i aria-hidden="true">·</i>}
            {part}
          </Fragment>
        ))}</small>
      </h3>
    );
  }

  const pendingMatch = label.match(/^(.*?)(（[^）]+）)$/);
  if (pendingMatch) {
    return (
      <h3 className="article-card-title article-card-title-split">
        <strong>{pendingMatch[1].trim()}</strong>
        <small>{pendingMatch[2]}</small>
      </h3>
    );
  }

  return <h3 className="article-card-title">{label}</h3>;
}

const collectionFactIcons = [CalendarDots, NotePencil, TelevisionSimple, UsersThree];

function CollectionFacts({ xml }) {
  const facts = useMemo(() => {
    const parsed = new DOMParser().parseFromString(`<doc>${xml}</doc>`, "application/xml");
    const infoColumn = Array.from(parsed.querySelectorAll("grid > column")).at(-1);
    if (!infoColumn) return [];

    const paragraphs = Array.from(infoColumn.children).filter((node) => node.tagName.toLowerCase() === "p");
    const findFact = (pattern) => paragraphs.find((node) => pattern.test(node.textContent?.trim() ?? ""));
    const selected = [
      findFact(/首播/),
      findFact(/放送时间|播放时间/),
      findFact(/播出平台|制作公司/),
      findFact(/主要演员/),
    ].filter(Boolean);

    return selected.map((node, index) => {
      let text = node.textContent?.replace(/\s+/g, " ").trim() ?? "";
      if (/主要演员/.test(text)) {
        const list = node.nextElementSibling?.tagName.toLowerCase() === "ul"
          ? Array.from(node.nextElementSibling.querySelectorAll("li")).map((item) => item.textContent?.trim()).filter(Boolean)
          : [];
        if (list.length) text = `${text} ${list.join(" / ")}`;
      }
      const separator = text.search(/[：:]/);
      const label = separator >= 0 ? text.slice(0, separator).trim() : text;
      const value = separator >= 0 ? text.slice(separator + 1).trim() : "";
      const emphasis = node.querySelector("a")?.textContent?.trim() ?? "";
      return { label, value, emphasis, icon: collectionFactIcons[index] };
    });
  }, [xml]);

  return (
    <dl className="collection-facts">
      {facts.map((fact) => {
        const Icon = fact.icon;
        const emphasisIndex = fact.emphasis ? fact.value.indexOf(fact.emphasis) : -1;
        return (
          <div className="collection-fact-row" key={fact.label}>
            <Icon weight="bold" aria-hidden="true" />
            <div className="collection-fact-copy">
              <dt>{fact.label}：</dt>
              <dd>
                {emphasisIndex >= 0 ? (
                  <>
                    {fact.value.slice(0, emphasisIndex)}
                    <strong>{fact.emphasis}</strong>
                    {fact.value.slice(emphasisIndex + fact.emphasis.length)}
                  </>
                ) : fact.value}
              </dd>
            </div>
          </div>
        );
      })}
    </dl>
  );
}

export function ColumnIndex() {
  return (
    <>
      <section className="column-index-hero">
        <img
          className="hero-ghost-word"
          src={withBase("assets/repo-hero-ghost-word.webp")}
          width="1680"
          height="595"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
          data-page-critical="true"
        />
        <div className="hero-hand-note">
          <span>Love is not a feeling.</span>
          <span>It&apos;s Evidence.</span>
          <img src={withBase("assets/repo-handdrawn-heart-pink.webp")} alt="" aria-hidden="true" decoding="async" />
        </div>
        <div className="column-index-title">
          <h1>
            <span><b>Repo</b><i>文</i></span>
            <em aria-label="证据目录">
              {["证", "据", "目", "录"].map((character) => <span aria-hidden="true" key={character}>{character}</span>)}
            </em>
          </h1>
          <p>每一份心动，都有迹可循。</p>
          <span className="hero-title-underline" aria-hidden="true" />
          <span className="hero-title-arrow" aria-hidden="true">↗</span>
          <span className="hero-label hero-label-left">LOVE ARCHIVE / 06 COLLECTIONS</span>
        </div>
        <aside className="hero-reading-note">
          <div>
            <span>READING NOTE</span>
            <strong>这次真的不一样</strong>
            <p>but 理性磕糖</p>
          </div>
        </aside>
        <span className="hero-label hero-note-label">ROMANCE / EVIDENCE / ARCHIVE</span>
        <DotsNine className="hero-pink-grid" weight="bold" aria-hidden="true" />
      </section>

      <RepoFilmStrip critical />

      <section className="collection-index" aria-label="专栏合集">
        {columnData.collections.map((collection, index) => (
          <CollectionCard collection={collection} index={index} key={collection.slug} />
        ))}
      </section>

      <section className="repo-index-note" aria-labelledby="repo-index-note-title">
        <div className="repo-index-note-heading">
          <span>ARCHIVE NOTE</span>
          <h2 id="repo-index-note-title"><span className="repo-index-note-title-line">目前包含已有泰百repo</span><span className="repo-index-note-title-line">及二创类文章<span className="repo-index-note-title-total">共<strong>21</strong>篇：</span></span></h2>
        </div>
        <div className="repo-pending-copy">
          <span>待更新：</span>
          <p><strong>宿敌恋人</strong><small>ep9-ep10</small></p>
          <p><strong>月下之影</strong><small>片段</small></p>
        </div>
      </section>

    </>
  );
}

export function CollectionView({ collection }) {
  const collectionIndex = columnData.collections.findIndex((item) => item.slug === collection.slug);
  const collectionNumber = String(collectionIndex + 1).padStart(2, "0");
  const editorial = collectionEditorialNotes[collection.slug] ?? {
    roman: collection.slug.replaceAll("-", " ").toUpperCase(),
  };
  const visibleArticles = collection.articles.filter((article) => !article.hidden);

  return (
    <>
      <section className={`collection-hero collection-collage collection-collage-${collectionIndex + 1}`}>
        <div className="collection-collage-hero">
          <img
            className="collection-ghost-repo"
            src={withBase("assets/repo-hero-ghost-word.webp")}
            width="1680"
            height="595"
            alt=""
            aria-hidden="true"
            decoding="async"
            data-page-critical="true"
          />
          <a
            className="collection-issue-badge"
            href="#/column"
            aria-label="返回全部合集"
            title="返回全部合集"
          >
            <span>← 返回合集</span>
            <strong>{collectionNumber}</strong>
          </a>
          <div className="collection-title-paper">
            <CollectionDisplayTitle title={collection.title} />
            <p>{editorial.roman}</p>
            <img src={withBase("assets/repo-handdrawn-underline-pink.webp")} alt="" aria-hidden="true" decoding="async" />
          </div>
          <figure className="collection-hero-photo">
            <img className="collection-photo-frame" src={withBase("assets/repo-collection-poster-frame-v1.webp")} alt="" aria-hidden="true" decoding="async" data-page-critical="true" />
            <img className="collection-cover-art" src={withBase(collection.cover)} alt={`${collection.title}合集封面`} decoding="async" fetchPriority="high" data-page-critical="true" />
            <img className="collection-photo-brush" src={withBase("assets/repo-collection-pink-brush-v1.webp")} alt="" aria-hidden="true" decoding="async" data-page-critical="true" />
            <Paperclip aria-hidden="true" />
            <img className="collection-photo-heart collection-photo-heart-top" src={withBase("assets/repo-handdrawn-heart-pink.webp")} alt="" aria-hidden="true" decoding="async" />
            <img className="collection-photo-heart collection-photo-heart-side" src={withBase("assets/repo-handdrawn-heart-pink.webp")} alt="" aria-hidden="true" decoding="async" />
          </figure>
          <div className="collection-title-caption" aria-hidden="true">
            <span>Love is not a feeling.</span>
            <span>It&apos;s <b>Evidence.</b></span>
          </div>
          <div className="collection-dossier">
            <CollectionFacts xml={collection.summaryXml} />
          </div>
          <span className="collection-dossier-repo">ROMANCE / EVIDENCE / ARCHIVE</span>
          <DotsNine className="collection-hero-dots" weight="bold" aria-hidden="true" />
        </div>
      </section>

      <section className="article-index" aria-label={`${collection.title}文章列表`}>
        <div className="article-index-heading">
          <span>EVIDENCE ARCHIVE</span>
          <h2>这一坑的 <em>Repo</em></h2>
        </div>
        <div className={`article-grid article-grid-count-${Math.min(visibleArticles.length, 4)}`}>
          {visibleArticles.map((article, index) => (
            <a
              className={`article-card article-card-${index + 1} article-card-style-${index % 2 === 0 ? "a" : "b"}`}
              href={`#/column/${collection.slug}/${article.slug}`}
              key={article.slug}
            >
              <img
                className="article-card-material"
                src={withBase(index % 2 === 0
                  ? "assets/repo-article-card-frame-a-v1.webp"
                  : "assets/repo-article-card-frame-b-v1.webp")}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
              />
              <div className="article-card-image">
                <img src={withBase(article.cover || collection.cover)} alt="" loading="lazy" decoding="async" />
              </div>
              <div>
                <span>ARTICLE / {String(index + 1).padStart(2, "0")}</span>
                <ArticleCardTitle label={article.label} />
                <ArrowRight aria-hidden="true" />
              </div>
            </a>
          ))}
        </div>
        <div className="collection-detail-end" aria-label={`${collection.title}合集结束`}>
          <span>REPO 文专栏</span>
          <span>LOVE IS EVIDENCE.</span>
        </div>
      </section>
    </>
  );
}
