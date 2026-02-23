import { readdir } from "node:fs/promises";
import path from "node:path";
import { Suspense } from "react";
import GameLauncherClient from "./GameLauncherClient";

async function getAvailableGameIds() {
  try {
    const swfDirectory = path.join(process.cwd(), "public", "swf");
    const files = await readdir(swfDirectory);

    return files
      .filter((fileName) => fileName.toLowerCase().endsWith(".swf"))
      .map((fileName) => fileName.replace(/\.swf$/i, ""))
      .sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
}

export default async function GameLauncherPage() {
  const gameIds = await getAvailableGameIds();

  return (
    <Suspense fallback={null}>
      <GameLauncherClient gameIds={gameIds} />
    </Suspense>
  );
}