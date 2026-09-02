import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight } from "@phosphor-icons/react";
import { HOME_MEDIA_NOTICE } from "./rights.js";
import "./home-page.css";

const withBase = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

const placeholderCards = [
  { id: "namtanfilm", className: "cp-card-one", image: "assets/home/namtanfilm-card-v1.webp", name: "NamtanFilm", width: 1000, height: 1000 },
  { id: "emibonnie", className: "cp-card-two", image: "assets/home/emibonnie-card-v1.webp", name: "EmiBonnie", width: 1000, height: 667 },
  { id: "janjingjing", className: "cp-card-three", image: "assets/home/janjingjing-card-v1.webp", name: "JanJingJing", width: 1000, height: 914 },
  { id: "freenbecky", className: "cp-card-four", image: "assets/home/freenbecky-card-v1.webp", name: "FreenBecky", width: 1000, height: 667 },
  { id: "lingorm", className: "cp-card-five", image: "assets/home/lingorm-card-v1.webp", name: "LingOrm", width: 1000, height: 1000 },
];

const welcomeLinks = [
  { href: "#/tide-words", label: "坑底文学" },
  { href: "#/archive", label: "考古档案" },
  { href: "#/column", label: "REPO 文专栏" },
  { href: "#/memes", label: "来捡表情包" },
  { href: "#/radio", label: "坑底电台" },
  { href: "#/about", label: "关于" },
];

function PitOrbitCurves({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 1672 941" preserveAspectRatio="none" aria-hidden="true">
      <path className="orbit-path orbit-path-one" d="M 1490 118 C 1350 156, 1275 334, 1088 476 C 988 552, 938 612, 852 684" />
      <path className="orbit-path orbit-path-two" d="M 1035 118 C 1024 288, 968 448, 888 598 C 864 642, 850 668, 838 690" />
      <path className="orbit-path orbit-path-three" d="M 1554 430 C 1376 438, 1244 504, 1092 586 C 996 638, 926 664, 858 694" />
      <path className="orbit-path orbit-path-four" d="M 1212 826 C 1102 796, 994 748, 902 716 C 874 706, 852 700, 838 696" />
      <path className="orbit-path orbit-path-five" d="M 118 780 C 308 772, 438 738, 618 716 C 708 706, 774 702, 826 700" />
    </svg>
  );
}

function EyesOrbitCurves() {
  return (
    <svg className="eyes-orbit-lines" viewBox="0 0 1672 941" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <marker id="eyes-curve-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>
      <path className="eyes-orbit-solid" d="M 68 780 C 34 726, 168 691, 332 724 C 560 770, 760 660, 980 548 C 1200 434, 1400 350, 1590 230 C 1660 185, 1650 274, 1600 330" />
      <path className="eyes-orbit-dashed" markerEnd="url(#eyes-curve-arrow)" d="M 1505 230 C 1430 270, 1438 330, 1525 386 C 1635 456, 1634 552, 1538 626 C 1350 770, 1030 708, 720 770 C 560 800, 470 820, 396 838" />
      <circle cx="486" cy="733" r="8" />
    </svg>
  );
}

function WelcomeOrbitCurves() {
  return (
    <svg className="welcome-orbit-lines" viewBox="0 0 1672 941" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <marker id="welcome-curve-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>
      <path className="welcome-route-guide welcome-orbit-pink-desktop" d="M 1120 70 L 1120 172" />
      <path className="welcome-orbit-echo welcome-orbit-pink-desktop" d="M 1094 168 C 1162 168, 1218 172, 1220 205 C 1218 256, 1088 323, 1010 378 C 918 442, 842 505, 836 544" />
      <path
        className="welcome-orbit-pink welcome-orbit-pink-desktop"
        markerEnd="url(#welcome-curve-arrow)"
        d="M 1094 168 C 1162 168, 1218 172, 1220 205 C 1218 256, 1088 323, 1010 378 C 918 442, 842 505, 836 544"
      />
      <path
        className="welcome-orbit-pink welcome-orbit-pink-mobile"
        markerEnd="url(#welcome-curve-arrow)"
        d="M 1240 128 C 1450 146, 1270 222, 1080 262 C 920 296, 838 326, 840 366"
      />
    </svg>
  );
}

function PitPortal({ className = "" }) {
  return (
    <div className={`pit-portal-collage ${className}`} aria-hidden="true">
      <span className="pit-portal-paper-fusion" />
      <img
        className="pit-portal-image"
        src={withBase("assets/home/pit-portal-v1.webp")}
        width="1448"
        height="1086"
        alt=""
        loading="eager"
        decoding="async"
        fetchPriority="high"
        data-page-critical="true"
      />
    </div>
  );
}

function HomeRightsNotice({ className = "" }) {
  return (
    <p className={`home-rights-notice ${className}`}>
      <span>{HOME_MEDIA_NOTICE}</span>
      <a href="#/about/rights">权利说明</a>
    </p>
  );
}

export function HomePage() {
  const heroRef = useRef(null);
  const lastAdvanceRef = useRef(0);
  const [scene, setScene] = useState("cover");

  const advanceJourney = useCallback(() => {
    const now = Date.now();
    if (now - lastAdvanceRef.current < 650) return;
    lastAdvanceRef.current = now;
    setScene((current) => {
      if (current === "cover") return "eyes";
      if (current === "eyes") return "falling";
      if (current === "falling") return "welcome";
      return current;
    });
  }, []);

  useEffect(() => {
    if (!['eyes', 'falling'].includes(scene)) return undefined;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduceMotion ? 500 : scene === "eyes" ? 2300 : 1200;
    const timer = window.setTimeout(() => {
      lastAdvanceRef.current = 0;
      setScene(scene === "eyes" ? "falling" : "welcome");
    }, delay);
    return () => window.clearTimeout(timer);
  }, [scene]);

  const updateGravity = (event) => {
    const hero = heroRef.current;
    if (!hero || scene !== "cover") return;

    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    const pitX = 0.5;
    const pitY = 0.73;
    const distance = Math.hypot(x - pitX, y - pitY);
    const gravity = Math.max(0, Math.min(1, 1 - distance / 0.42));

    hero.style.setProperty("--pointer-x", (x * 2 - 1).toFixed(3));
    hero.style.setProperty("--pointer-y", (y * 2 - 1).toFixed(3));
    hero.style.setProperty("--gravity", gravity.toFixed(3));
    hero.style.setProperty("--orbit-speed", `${Math.max(1.8, 8 - gravity * 6.2).toFixed(2)}s`);
  };

  const resetGravity = () => {
    const hero = heroRef.current;
    if (!hero || scene !== "cover") return;
    hero.style.setProperty("--pointer-x", "0");
    hero.style.setProperty("--pointer-y", "0");
    hero.style.setProperty("--gravity", "0");
    hero.style.setProperty("--orbit-speed", "8s");
  };

  const handleWheel = (event) => {
    if (event.deltaY > 48) advanceJourney();
  };

  return (
    <main className={`pit-home-page is-scene-${scene}`} onWheel={handleWheel}>
      <section
        ref={heroRef}
        className="pit-home-hero"
        aria-label="glfans 入坑首页"
        aria-hidden={scene !== "cover"}
        onPointerMove={updateGravity}
        onPointerLeave={resetGravity}
      >
        <p className="pit-home-ghost" aria-hidden="true">glfans</p>
        <PitOrbitCurves className="pit-home-orbit-lines" />

        <aside className="pit-home-handnote" aria-label="首页旁注">
          <span>Love</span>
          <span>is not a feeling.</span>
          <span>It&apos;s Evidence.</span>
          <img src={withBase("assets/repo-handdrawn-heart-pink.webp")} alt="" aria-hidden="true" data-page-critical="true" />
        </aside>

        <div className="pit-home-copy">
          <h1 aria-label="这次真的不一样">
            <span className="home-title-row home-title-row-one">
              <i>这</i><i>次</i>
            </span>
            <span className="home-title-row home-title-row-two">
              <i className="is-pink">真</i><i className="is-pink">的</i><i>不</i><i>一</i><i>样</i>
            </span>
          </h1>
          <p className="pit-home-proof">心动不是感觉，是证据。</p>
        </div>

        <div className="pit-home-cp-orbit" aria-label="围绕坑口的 CP 入口">
          {placeholderCards.map((card) => (
            <button
              className={`pit-home-cp-card ${card.className}`}
              type="button"
              onClick={advanceJourney}
              aria-label={`从 ${card.name} 开始入坑片头`}
              key={card.id}
            >
              <img
                src={withBase(card.image)}
                width={card.width}
                height={card.height}
                alt={`${card.name} 拼贴照片`}
                loading="eager"
                decoding="async"
                fetchPriority={card.id === "namtanfilm" || card.id === "emibonnie" ? "high" : "auto"}
                data-page-critical="true"
              />
              <span>VIEW THEIR PIT <ArrowRight weight="bold" aria-hidden="true" /></span>
            </button>
          ))}
        </div>

        <button className="pit-home-portal" type="button" onClick={advanceJourney} aria-label="开始入坑片头">
          <PitPortal />
          <span className="pit-home-enter-label">
            <b>ENTER THE PIT</b>
            <ArrowDown weight="bold" aria-hidden="true" />
          </span>
        </button>

        <div className="pit-home-shortcuts" aria-hidden="true">
          <span className="shortcut-repo">REPO 文专栏</span>
          <span className="shortcut-words">坑底文学</span>
          <span className="shortcut-memes">来捡表情包</span>
        </div>

        <p className="pit-home-meta">版面有限 · 仅展示部分 CP · 坑位持续增加</p>
        <p className="pit-home-count"><strong>01</strong><span>CP<br />AND COUNTING</span></p>
        <HomeRightsNotice className="home-rights-cover" />
      </section>

      <section className="pit-journey-scene pit-eyes-scene" aria-hidden={scene !== "eyes"}>
        <p className="pit-scene-index">PIT / 01</p>
        <p className="pit-scene-brand">glfans ARCHIVE <span>⊕</span></p>
        <EyesOrbitCurves />
        <h2 aria-label="两眼一闭就是磕">
          <span className="eyes-title-top"><i>两</i><i>眼</i><i>一</i><i>闭</i></span>
          <strong>就是磕</strong>
        </h2>
        <p className="eyes-moment"><i />glfans<br />MOMENTS</p>
        <img className="eyes-heart" src={withBase("assets/repo-handdrawn-heart-pink.webp")} alt="" aria-hidden="true" />
        <p className="eyes-proof">“心动不是感觉，是证据。”</p>
        <span className="eyes-sparkle eyes-sparkle-one" aria-hidden="true">✦</span>
        <span className="eyes-sparkle eyes-sparkle-two" aria-hidden="true">✧</span>
        <div className="eyes-card-run" aria-hidden="true">
          {placeholderCards.slice(0, 4).map((card, index) => (
            <img
              className={`eyes-card eyes-card-${index + 1}`}
              src={withBase(card.image)}
              width={card.width}
              height={card.height}
              alt=""
              decoding="async"
              key={`eyes-${card.id}`}
            />
          ))}
        </div>
        <HomeRightsNotice className="home-rights-eyes" />
      </section>

      <section className="pit-journey-scene pit-falling-scene" aria-label="坠入坑底的转场" aria-hidden={scene !== "falling"}>
        <PitPortal className="falling-pit" />
        <div className="falling-cards" aria-hidden="true">
          {placeholderCards.map((card, index) => (
            <img
              className={`falling-card falling-card-${index + 1}`}
              src={withBase(card.image)}
              width={card.width}
              height={card.height}
              alt=""
              decoding="async"
              key={`falling-${card.id}`}
            />
          ))}
        </div>
      </section>

      <section className="pit-journey-scene pit-welcome-scene" aria-hidden={scene !== "welcome"}>
        <p className="pit-scene-index">PIT / 03</p>
        <WelcomeOrbitCurves />
        <div className="welcome-route-stops" aria-hidden="true">
          <span className="welcome-route-stop stop-one"><i />心动证据库<i /></span>
          <span className="welcome-route-stop stop-two"><i />深渊放映厅<i /></span>
          <span className="welcome-route-stop stop-three"><i />表情补给站<i /></span>
        </div>
        <aside className="welcome-handnote" aria-hidden="true">
          <span>Love</span><span>is not a feeling.</span><span>It&apos;s Evidence.</span>
          <img src={withBase("assets/repo-handdrawn-heart-pink.webp")} alt="" />
        </aside>
        <h2><span>欢迎来到</span><strong>坑底</strong><i>。</i></h2>
        <p className="welcome-proof">心动不是感觉，是证据。</p>
        <PitPortal className="welcome-pit" />
        <button className="welcome-enter-mark" type="button" onClick={() => setScene("cover")} aria-label="再次入新坑，重看开场">
          再次入新坑 <ArrowDown weight="bold" aria-hidden="true" />
        </button>
        <img
          className="welcome-card welcome-card-left"
          src={withBase(placeholderCards[0].image)}
          width={placeholderCards[0].width}
          height={placeholderCards[0].height}
          alt={`${placeholderCards[0].name} 拼贴照片`}
        />
        <img
          className="welcome-card welcome-card-right"
          src={withBase(placeholderCards[4].image)}
          width={placeholderCards[4].width}
          height={placeholderCards[4].height}
          alt={`${placeholderCards[4].name} 拼贴照片`}
        />
        <nav className="pit-welcome-links" aria-label="选择坑底栏目">
          <div className="pit-welcome-index-label" aria-hidden="true">
            <strong>坑底索引</strong>
            <span>CONTENTS / 06</span>
          </div>
          {welcomeLinks.map((item, index) => (
            <a href={item.href} key={item.href}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.label}</strong>
              <ArrowRight weight="bold" aria-hidden="true" />
            </a>
          ))}
        </nav>
        <HomeRightsNotice className="home-rights-welcome" />
      </section>
    </main>
  );
}
