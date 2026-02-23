"use client";

import { useEffect, useRef } from "react";

type RufflePlayerProps = {
  swfPath: string;
};

export default function RufflePlayer({ swfPath }: RufflePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let activePlayer: HTMLElement | null = null;
    let cancelled = false;

    const DEFAULT_WIDTH = 550;
    const DEFAULT_HEIGHT = 400;

    const getRuffle = () =>
      (window as Window & { RufflePlayer?: { newest: () => { createPlayer: () => HTMLElement } } }).RufflePlayer?.newest();

    const waitForRuffle = () => {
      return new Promise<{ createPlayer: () => HTMLElement } | null>((resolve) => {
        const pollForRuffle = () => {
          if (cancelled) {
            resolve(null);
            return;
          }

          const ruffle = getRuffle();

          if (ruffle) {
            resolve(ruffle);
            return;
          }

          window.setTimeout(pollForRuffle, 50);
        };

        pollForRuffle();
      });
    };

    const mountPlayer = async () => {
      const ruffle = await waitForRuffle();

      if (cancelled || !ruffle) {
        return;
      }

      const container = containerRef.current;

      if (!container) {
        return;
      }

      const player = ruffle.createPlayer() as HTMLElement & {
        ruffle: () => { load: (path: string) => Promise<void> | void };
      };

      container.innerHTML = "";
      container.appendChild(player);
      activePlayer = player;

      await player.ruffle().load(swfPath);

      requestAnimationFrame(() => {
        if (cancelled) {
          return;
        }

        const measuredWidth = Math.round(player.getBoundingClientRect().width);
        const measuredHeight = Math.round(player.getBoundingClientRect().height);
        const targetWidth = measuredWidth > 0 ? measuredWidth : DEFAULT_WIDTH;
        const targetHeight = measuredHeight > 0 ? measuredHeight : DEFAULT_HEIGHT;

        container.style.width = `${targetWidth}px`;
        container.style.height = `${targetHeight}px`;
        player.style.width = "100%";
        player.style.height = "100%";
      });
    };

    void mountPlayer();

    return () => {
      cancelled = true;
      activePlayer?.remove();
    };
  }, [swfPath]);

  return (
    <div className="w-full overflow-x-auto">
      <div
        ref={containerRef}
        className="mx-auto min-h-[240px] min-w-[320px] max-w-full resize overflow-auto rounded-lg border border-black/10 dark:border-white/20"
        style={{ width: "550px", height: "400px" }}
      />
    </div>
  );
}