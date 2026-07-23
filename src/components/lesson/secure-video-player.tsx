"use client";

import { PlayCircle } from "lucide-react";
import * as React from "react";

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId: string;
          host: string;
          playerVars: Record<string, string | number>;
          events: {
            onStateChange: (event: { data: number }) => void;
          };
        },
      ) => { playVideo: () => void; destroy: () => void };
      PlayerState: { PLAYING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoading: Promise<void> | null = null;

/** Loads the YouTube IFrame API script once, however many players are on the page. */
function loadYouTubeApi(): Promise<void> {
  if (window.YT) return Promise.resolve();
  if (apiLoading) return apiLoading;

  apiLoading = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(script);
  });
  return apiLoading;
}

/**
 * Wraps the YouTube embed with a blocking overlay whenever the video is not
 * actively playing. YouTube's own paused/ended screen surfaces its share
 * button, channel link and suggested videos — none of which can be turned
 * off through embed parameters alone. Covering the player except while
 * `PLAYING` keeps only the native progress/volume/fullscreen bar reachable
 * and gives students a single "resume" affordance instead.
 */
export function SecureVideoPlayer({
  youtubeId,
  title,
}: {
  youtubeId: string;
  title: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const playerRef = React.useRef<{ playVideo: () => void; destroy: () => void } | null>(
    null,
  );
  const [blocked, setBlocked] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;
      const player = new window.YT.Player(containerRef.current, {
        videoId: youtubeId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          fs: 1,
          disablekb: 1,
          playsinline: 1,
          controls: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onStateChange: (event) => {
            setBlocked(event.data !== window.YT!.PlayerState.PLAYING);
          },
        },
      });
      playerRef.current = player;
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
    };
  }, [youtubeId]);

  return (
    <div
      className="border-line relative aspect-video overflow-hidden rounded-2xl border bg-black"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div ref={containerRef} className="size-full" />

      {/* Always blocks the title/channel-name strip YouTube overlays at the
          top of the player, playing or not. */}
      <div className="absolute inset-x-0 top-0 h-14" />

      {blocked ? (
        <button
          type="button"
          aria-label={`Resume ${title}`}
          onClick={() => playerRef.current?.playVideo()}
          className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors hover:bg-black/20"
        >
          <PlayCircle className="size-16 text-white drop-shadow-lg" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
