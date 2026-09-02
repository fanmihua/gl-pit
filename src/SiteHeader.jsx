import { useLayoutEffect, useRef } from "react";
import "./site-header.css";

const withBase = (assetPath) => `${import.meta.env.BASE_URL}${assetPath.replace(/^\//, "")}`;

export function SiteHeader({
  activePath = "column",
  immersive = false,
  dark = false,
  descriptor,
  showHome = true,
  showAbout = true,
  extraAction,
}) {
  const isMemeGame = activePath === "memes";
  const navRef = useRef(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const activeLink = nav?.querySelector('[aria-current="page"]');
    if (!nav || !activeLink || nav.scrollWidth <= nav.clientWidth) return;

    const targetLeft = activeLink.offsetLeft - (nav.clientWidth - activeLink.offsetWidth) / 2;
    nav.scrollTo({ left: Math.max(0, targetLeft), behavior: "auto" });
  }, [activePath, showAbout, showHome]);

  return (
    <header className={`column-header${isMemeGame ? " is-meme-game" : ""}${immersive ? " is-immersive" : ""}${dark ? " is-dark" : ""}`}>
      <a className="brand" href="#/" aria-label="返回 glfans 首页">
        <img
          className="brand-logo"
          src={withBase("assets/gl-pit-logo.webp")}
          width="369"
          height="258"
          alt="glfans"
          decoding="async"
          data-page-critical="true"
        />
        {descriptor && <span className="column-brand-descriptor">{descriptor}</span>}
      </a>
      <nav ref={navRef} className="column-header-nav" aria-label="主导航">
        {showHome && <a href="#/" aria-current={activePath === "home" ? "page" : undefined}>欢迎入坑</a>}
        <a href="#/tide-words" aria-current={activePath === "tide-words" ? "page" : undefined}>坑底文学</a>
        <a href="#/archive" aria-current={activePath === "archive" ? "page" : undefined}>考古档案</a>
        <a href="#/column" aria-current={activePath === "column" ? "page" : undefined}>REPO 文专栏</a>
        <a href="#/memes" aria-current={isMemeGame ? "page" : undefined}>来捡表情包</a>
        <a href="#/radio" aria-current={activePath === "radio" ? "page" : undefined}>坑底电台</a>
        {showAbout && <a className="column-nav-about" href="#/about" aria-current={activePath === "about" ? "page" : undefined}>关于</a>}
        {extraAction && (
          <button type="button" onClick={extraAction.onClick} aria-label={extraAction.ariaLabel || extraAction.label}>
            {extraAction.label}
          </button>
        )}
      </nav>
    </header>
  );
}
