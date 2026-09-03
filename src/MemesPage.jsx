import { SiteHeader } from "./SiteHeader.jsx";
import { MemePickupPage } from "./features/memes/MemePickupPage.jsx";
import "./magazine.css";
import "./meme-game.css";

export function MemesPage() {
  return (
    <main className="column-shell">
      <SiteHeader activePath="memes" />
      <MemePickupPage />
    </main>
  );
}
