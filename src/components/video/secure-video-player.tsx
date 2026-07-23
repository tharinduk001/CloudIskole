"use client";

import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

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
            onReady: () => void;
            onStateChange: (event: { data: number }) => void;
          };
        },
      ) => {
        playVideo: () => void;
        pauseVideo: () => void;
        seekTo: (seconds: number, allowSeekAhead: boolean) => void;
        mute: () => void;
        unMute: () => void;
        isMuted: () => boolean;
        getCurrentTime: () => number;
        getDuration: () => number;
        destroy: () => void;
      };
      PlayerState: { PLAYING: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type Player = InstanceType<NonNullable<Window["YT"]>["Player"]>;

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

function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Renders the YouTube embed with its native chrome switched off entirely
 * (`controls: 0`) and covered by a transparent, always-on click-catcher —
 * the mouse never reaches the iframe's own surface, so its share button,
 * watch-later, suggested videos, channel link and (critically) its native
 * right-click "Copy video URL" menu are never reachable. Playback is driven
 * instead through the small custom control bar below, talking to the player
 * only via the JS API — the only surface a student ever actually touches.
 */
export function SecureVideoPlayer({
  youtubeId,
  title,
  className,
}: {
  youtubeId: string;
  title: string;
  className?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const playerRef = React.useRef<Player | null>(null);
  const seekingRef = React.useRef(false);

  const [playing, setPlaying] = React.useState(false);
  const [ended, setEnded] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;
      const player = new window.YT.Player(containerRef.current, {
        videoId: youtubeId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          controls: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          fs: 0,
          disablekb: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => setDuration(player.getDuration()),
          onStateChange: (event) => {
            const state = window.YT!.PlayerState;
            setPlaying(event.data === state.PLAYING);
            setEnded(event.data === state.ENDED);
            setDuration(player.getDuration());
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

  React.useEffect(() => {
    const id = window.setInterval(() => {
      if (seekingRef.current || !playerRef.current) return;
      setCurrentTime(playerRef.current.getCurrentTime());
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  function togglePlay() {
    const player = playerRef.current;
    if (!player) return;
    if (playing) {
      player.pauseVideo();
    } else {
      if (ended) player.seekTo(0, true);
      player.playVideo();
    }
  }

  function toggleMute() {
    const player = playerRef.current;
    if (!player) return;
    if (player.isMuted()) {
      player.unMute();
      setMuted(false);
    } else {
      player.mute();
      setMuted(true);
    }
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void wrapperRef.current?.requestFullscreen();
    }
  }

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "border-line group relative aspect-video overflow-hidden rounded-2xl border bg-black",
        className,
      )}
    >
      <div ref={containerRef} className="size-full" />

      <button
        type="button"
        aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        onClick={togglePlay}
        onContextMenu={(e) => e.preventDefault()}
        className="absolute inset-0 size-full cursor-pointer"
      >
        {!playing ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30">
            <Play className="size-16 fill-white text-white drop-shadow-lg" aria-hidden="true" />
          </span>
        ) : null}
      </button>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 bg-gradient-to-t from-black/85 to-transparent px-3 pt-8 pb-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <input
          type="range"
          aria-label="Seek"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={(e) => setCurrentTime(Number(e.target.value))}
          onMouseDown={() => (seekingRef.current = true)}
          onTouchStart={() => (seekingRef.current = true)}
          onMouseUp={(e) => {
            playerRef.current?.seekTo(Number((e.target as HTMLInputElement).value), true);
            seekingRef.current = false;
          }}
          onTouchEnd={(e) => {
            playerRef.current?.seekTo(Number((e.target as HTMLInputElement).value), true);
            seekingRef.current = false;
          }}
          className="accent-terracotta-500 h-1 w-full cursor-pointer"
        />
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
              className="hover:text-terracotta-300"
            >
              {playing ? (
                <Pause className="size-5 fill-current" aria-hidden="true" />
              ) : (
                <Play className="size-5 fill-current" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              className="hover:text-terracotta-300"
            >
              {muted ? (
                <VolumeX className="size-5" aria-hidden="true" />
              ) : (
                <Volume2 className="size-5" aria-hidden="true" />
              )}
            </button>
            <span className="text-xs tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Fullscreen"
            className="hover:text-terracotta-300"
          >
            <Maximize className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
