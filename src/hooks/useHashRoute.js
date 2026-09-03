import { useEffect, useState } from "react";
import { parseHashRoute } from "../app/routes.js";

export function readHashRoute() {
  return parseHashRoute(window.location.hash);
}

export function useHashRoute() {
  const [route, setRoute] = useState(readHashRoute);
  useEffect(() => {
    const update = () => setRoute(readHashRoute());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return route;
}
