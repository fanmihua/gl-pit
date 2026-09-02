import { lazy, Suspense, useEffect, useLayoutEffect, useState } from "react";
import { GlobalFooter } from "./GlobalFooter.jsx";
import { GlobalRadioDock } from "./GlobalRadioDock.jsx";
import { PageLoader } from "./PageLoader.jsx";
import { RouteReadyBoundary } from "./RouteReadyBoundary.jsx";

const HomePage = lazy(() => import("./HomePage.jsx").then((module) => ({ default: module.HomePage })));
const AdminPage = lazy(() => import("./AdminPage.jsx").then((module) => ({ default: module.AdminPage })));
const AboutPage = lazy(() => import("./AboutPage.jsx").then((module) => ({ default: module.AboutPage })));
const ArchivePage = lazy(() => import("./ArchivePage.jsx").then((module) => ({ default: module.ArchivePage })));
const ColumnExperience = lazy(() => import("./Column.jsx").then((module) => ({ default: module.ColumnExperience })));
const PitRadioPage = lazy(() => import("./PitRadioPage.jsx").then((module) => ({ default: module.PitRadioPage })));
const WordsTideLab = lazy(() => import("./WordsTideLab.jsx").then((module) => ({ default: module.WordsTideLab })));

const ROOT_ROUTES = ["about", "admin", "archive", "column", "memes", "radio", "tide-words"];

const ROUTE_LOADING_COPY = {
  home: { kicker: "ENTER THE PIT", label: "正在展开入坑现场" },
  about: { kicker: "ABOUT GLFANS", label: "正在展开坑底说明" },
  admin: { kicker: "COMMUNITY DESK", label: "正在核对管理员身份" },
  archive: { kicker: "PIT ARCHIVE", label: "正在放映年度胶卷" },
  column: { kicker: "REPO", label: "正在整理心动证据" },
  memes: { kicker: "MEME PIT", label: "正在装填表情包" },
  radio: { kicker: "PIT FM", label: "正在接通坑底频率" },
  "tide-words": { kicker: "VOICES FROM THE PIT", label: "正在捞起坑底原话" },
};

function readRootRoute() {
  const rootRoute = window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean)[0];
  if (!rootRoute) return "home";
  return ROOT_ROUTES.includes(rootRoute) ? rootRoute : "home";
}

function readRouteKey() {
  return window.location.hash || "#/";
}

export function App() {
  const [rootRoute, setRootRoute] = useState(readRootRoute);
  const [routeKey, setRouteKey] = useState(readRouteKey);
  const loadingCopy = ROUTE_LOADING_COPY[rootRoute] ?? ROUTE_LOADING_COPY.home;

  useEffect(() => {
    const update = () => {
      setRootRoute(readRootRoute());
      setRouteKey(readRouteKey());
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  useLayoutEffect(() => {
    window.history.scrollRestoration = "manual";
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";

    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();
    const frame = requestAnimationFrame(resetScroll);

    return () => {
      cancelAnimationFrame(frame);
      root.style.scrollBehavior = previousScrollBehavior;
    };
  }, [routeKey]);

  useEffect(() => {
    const currentRoot = window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean)[0];
    if (currentRoot && !ROOT_ROUTES.includes(currentRoot)) {
      window.history.replaceState(null, "", "#/");
    }
  }, []);

  let page;

  if (rootRoute === "home") {
    page = <HomePage />;
  } else if (rootRoute === "admin") {
    page = <AdminPage />;
  } else if (rootRoute === "about") {
    page = <AboutPage key={routeKey} defaultRightsOpen={routeKey.startsWith("#/about/rights")} />;
  } else if (rootRoute === "tide-words") {
    page = <WordsTideLab />;
  } else if (rootRoute === "archive") {
    page = <ArchivePage />;
  } else if (rootRoute === "radio") {
    page = <PitRadioPage />;
  } else {
    page = <ColumnExperience />;
  }

  return (
    <div className={`app-shell${rootRoute === "archive" ? " app-shell--archive" : ""}`}>
      <Suspense fallback={<PageLoader kicker={loadingCopy.kicker} label={loadingCopy.label} />}>
        <RouteReadyBoundary
          routeKey={routeKey}
          kicker={loadingCopy.kicker}
          label={loadingCopy.label}
        >
          {page}
          {rootRoute !== "home" && rootRoute !== "about" && rootRoute !== "admin" && <GlobalFooter />}
        </RouteReadyBoundary>
      </Suspense>
      <GlobalRadioDock hidden={rootRoute === "radio" || rootRoute === "admin"} />
    </div>
  );
}
