export type SiteVideo = {
  url: string;
  title: string;
  poster?: string;
  aspect?: string;
};

/** Muted, looping autoplay product video, contained to the page width. */
export function VideoStrip({ video }: { video: SiteVideo }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-secondary">
      <video
        src={video.url}
        poster={video.poster}
        aria-label={video.title}
        muted
        loop
        autoPlay
        playsInline
        controls
        preload="metadata"
        className={`w-full ${video.aspect ?? "aspect-square"} object-cover`}
      />
    </figure>
  );
}
