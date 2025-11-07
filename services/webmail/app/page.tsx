import { PresenceBar } from "../components/layout/presence-bar";
import { ThreePaneExperience } from "../components/layout/three-pane";
import { TopBar } from "../components/layout/top-bar";

const DEFAULT_PRESENCE_IDS = (process.env.MATRIX_TEAM_IDS || "").split(",").filter(Boolean);

export default function HomePage() {
  return (
    <main className="flex h-screen flex-col gap-4 bg-gradient-to-br from-background via-background to-background/80 p-4">
      <TopBar />
      <PresenceBar userIds={DEFAULT_PRESENCE_IDS} />
      <section className="flex-1 overflow-hidden">
        <ThreePaneExperience />
      </section>
    </main>
  );
}
