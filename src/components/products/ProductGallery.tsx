"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { StickyPane } from "@/components/ui/StickyPane";

export interface ProductMediaItem {
  type: "image" | "video";
  /** Omit for a video whose clip hasn't been shot yet — shows `poster` with a "coming soon" badge instead. */
  src?: string;
  alt: string;
  poster?: string;
}

// Stable identity for a media item — its src/poster/alt are unique across a product's gallery,
// so this survives any future reorder/filter without colliding the way an array index would.
function mediaKey(item: ProductMediaItem) {
  return `${item.type}:${item.src ?? item.poster ?? item.alt}`;
}

function MediaFrame({
  item,
  eager,
  sizes,
  videoRef,
}: {
  item: ProductMediaItem;
  eager: boolean;
  sizes: string;
  videoRef?: (el: HTMLVideoElement | null) => void;
}) {
  if (item.type === "video") {
    if (item.src) {
      return (
        <video
          ref={videoRef}
          src={item.src}
          poster={item.poster}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />
      );
    }
    return (
      <>
        {item.poster && (
          <Image
            src={item.poster}
            alt={item.alt}
            fill
            loading={eager ? "eager" : "lazy"}
            sizes={sizes}
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/25">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-white/20 backdrop-blur-md">
            <Play size={18} className="ml-0.5 fill-beige-light text-beige-light" />
          </span>
          <span className="font-heading text-[11px] uppercase tracking-[0.16em] text-beige-light">
            Video Coming Soon
          </span>
        </div>
      </>
    );
  }

  return (
    <Image
      src={item.src ?? ""}
      alt={item.alt}
      fill
      loading={eager ? "eager" : "lazy"}
      sizes={sizes}
      className="object-cover"
    />
  );
}

function Thumbnail({
  item,
  index,
  active,
  onClick,
}: {
  item: ProductMediaItem;
  index: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Go to ${item.type} ${index + 1}`}
      aria-pressed={active}
      onClick={onClick}
      className={`cursor-pointer relative h-20 w-20 shrink-0 overflow-hidden border bg-neutral-50 transition-colors ${
        active ? "border-brown" : "border-neutral-100 hover:border-neutral-200"
      }`}
    >
      {item.type === "video" ? (
        <>
          {item.poster ? (
            <Image src={item.poster} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            item.src && (
              <video src={item.src} muted playsInline className="absolute inset-0 h-full w-full object-cover" />
            )
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/25">
            <Play size={14} className="fill-beige-light text-beige-light" />
          </span>
        </>
      ) : (
        <Image src={item.src ?? ""} alt="" fill sizes="80px" className="object-cover" />
      )}
    </button>
  );
}

// Plays the video nearest full visibility within `root` and pauses the rest; reports the most
// visible slide's index back to `onActiveChange` so the thumbnail rail stays in sync.
function useVisibilityTracking({
  rootRef,
  frameRefs,
  videoRefs,
  onActiveChange,
  length,
}: {
  rootRef?: React.RefObject<HTMLDivElement | null>;
  frameRefs: React.RefObject<(HTMLDivElement | null)[]>;
  videoRefs: React.RefObject<(HTMLVideoElement | null)[]>;
  onActiveChange: (index: number) => void;
  length: number;
}) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = frameRefs.current.findIndex((el) => el === entry.target);
          const video = videoRefs.current[index];
          if (!video) return;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });

        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!mostVisible) return;
        const index = frameRefs.current.findIndex((el) => el === mostVisible.target);
        if (index !== -1) onActiveChange(index);
      },
      { root: rootRef?.current ?? undefined, threshold: 0.6 }
    );

    frameRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length]);
}

export function ProductGallery({ media }: { media: ProductMediaItem[] }) {
  const [mobileActive, setMobileActive] = useState(0);
  const [desktopActive, setDesktopActive] = useState(0);

  const mobileScrollRef = useRef<HTMLDivElement | null>(null);
  const mobileFrameRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mobileVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const desktopFrameRefs = useRef<(HTMLDivElement | null)[]>([]);
  const desktopVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useVisibilityTracking({
    rootRef: mobileScrollRef,
    frameRefs: mobileFrameRefs,
    videoRefs: mobileVideoRefs,
    onActiveChange: setMobileActive,
    length: media.length,
  });

  useVisibilityTracking({
    frameRefs: desktopFrameRefs,
    videoRefs: desktopVideoRefs,
    onActiveChange: setDesktopActive,
    length: media.length,
  });

  function scrollToMobileItem(index: number) {
    mobileFrameRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }

  function scrollToDesktopItem(index: number) {
    desktopFrameRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div>
      {/* Below lg: a swipeable, snap-scrolling image strip (one photo per screen, swipe to browse)
          with a thumbnail rail underneath that stays in sync — the familiar mobile-app gallery feel. */}
      <div className="flex flex-col gap-4 lg:hidden">
        <div
          ref={mobileScrollRef}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        >
          {media.map((item, index) => (
            <div
              key={mediaKey(item)}
              ref={(el) => {
                mobileFrameRefs.current[index] = el;
              }}
              className="relative aspect-4/5 w-full shrink-0 snap-center overflow-hidden bg-neutral-50"
            >
              <MediaFrame
                item={item}
                eager={index === 0}
                sizes="100vw"
                videoRef={(el) => {
                  mobileVideoRefs.current[index] = el;
                }}
              />
            </div>
          ))}
        </div>

        {media.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {media.map((item, index) => (
              <Thumbnail
                key={mediaKey(item)}
                item={item}
                index={index}
                active={mobileActive === index}
                onClick={() => scrollToMobileItem(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* lg and up: scroll-linked stacked gallery with a sticky thumbnail rail. */}
      <div className="hidden gap-4 lg:flex lg:flex-row-reverse">
        <div className="flex flex-1 flex-col gap-4">
          {media.map((item, index) => (
            <div
              key={mediaKey(item)}
              ref={(el) => {
                desktopFrameRefs.current[index] = el;
              }}
              className="relative aspect-4/5 w-full overflow-hidden bg-neutral-50"
            >
              <MediaFrame
                item={item}
                eager={index === 0}
                sizes="700px"
                videoRef={(el) => {
                  desktopVideoRefs.current[index] = el;
                }}
              />
            </div>
          ))}
        </div>

        {media.length > 1 && (
          <StickyPane className="flex h-fit gap-3 self-start lg:flex-col">
            {media.map((item, index) => (
              <Thumbnail
                key={mediaKey(item)}
                item={item}
                index={index}
                active={desktopActive === index}
                onClick={() => scrollToDesktopItem(index)}
              />
            ))}
          </StickyPane>
        )}
      </div>
    </div>
  );
}
