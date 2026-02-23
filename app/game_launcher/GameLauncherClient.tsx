"use client";

import { ComponentPropsWithoutRef, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RufflePlayer from "./RufflePlayer";
import styles from "./GameLauncherClient.module.css";

type GameLauncherClientProps = {
  gameIds: string[];
};

type FormSubmitHandler = NonNullable<ComponentPropsWithoutRef<"form">["onSubmit"]>;

export default function GameLauncherClient({ gameIds }: GameLauncherClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = (searchParams.get("id") ?? "").trim();

  const { selectedGameId, swfPath } = useMemo(() => {
    const fallbackId = gameIds[0] ?? "";
    const hasRequestedId = requestedId.length > 0 && gameIds.includes(requestedId);
    const resolvedId = hasRequestedId ? requestedId : fallbackId;

    return {
      selectedGameId: resolvedId,
      swfPath: resolvedId ? `/swf/${resolvedId}.swf` : null,
    };
  }, [gameIds, requestedId]);

  const [inputGameId, setInputGameId] = useState(selectedGameId);

  useEffect(() => {
    setInputGameId(selectedGameId);
  }, [selectedGameId]);

  useEffect(() => {
    let cancelled = false;
    const windowWithRuffle = window as Window & { __ruffleModuleLoaded?: boolean };

    if (windowWithRuffle.__ruffleModuleLoaded || (window as Window & { RufflePlayer?: unknown }).RufflePlayer) {
      windowWithRuffle.__ruffleModuleLoaded = true;
      return;
    }

    const loadRuffleModule = async () => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[data-ruffle-script="true"]');

      if (existingScript) {
        await new Promise<void>((resolve, reject) => {
          existingScript.addEventListener("load", () => resolve(), { once: true });
          existingScript.addEventListener("error", () => reject(new Error("Failed to load Ruffle script.")), {
            once: true,
          });
        });
      } else {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "/ruffle/ruffle.js";
          script.async = true;
          script.dataset.ruffleScript = "true";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Ruffle script."));
          document.body.appendChild(script);
        });
      }

      if (cancelled || windowWithRuffle.__ruffleModuleLoaded) {
        return;
      }

      windowWithRuffle.__ruffleModuleLoaded = true;
    };

    void loadRuffleModule();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit: FormSubmitHandler = (event) => {
    event.preventDefault();

    if (!inputGameId) {
      router.push("/game_launcher");
      return;
    }

    router.push(`/game_launcher?id=${encodeURIComponent(inputGameId)}`);
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Game Launcher</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="game-id" className={styles.label}>
            Game ID
          </label>
          <select
            id="game-id"
            value={inputGameId}
            onChange={(event) => setInputGameId(event.target.value)}
            className={styles.select}
            disabled={gameIds.length === 0}
          >
            {gameIds.length === 0 ? (
              <option value="">No SWF files found</option>
            ) : (
              gameIds.map((gameId) => (
                <option key={gameId} value={gameId}>
                  {gameId}
                </option>
              ))
            )}
          </select>
          <button
            type="submit"
            className={styles.button}
            disabled={gameIds.length === 0}
          >
            Launch
          </button>
        </form>
        {swfPath ? (
          <RufflePlayer swfPath={swfPath} />
        ) : (
          <p className={styles.emptyState}>
            No SWF files found in /public/swf.
          </p>
        )}
      </main>
    </div>
  );
}