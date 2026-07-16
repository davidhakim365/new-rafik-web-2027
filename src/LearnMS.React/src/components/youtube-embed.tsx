import { getYoutubeEmbedUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";

type YoutubeEmbedProps = {
  url?: string | null;
  title?: string;
  className?: string;
};

/** Responsive in-app YouTube player with native fullscreen support. */
export function YoutubeEmbed({
  url,
  title = "YouTube video",
  className,
}: YoutubeEmbedProps) {
  const embedUrl = getYoutubeEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-lg border border-border/50 bg-black/5 shadow-sm",
        className
      )}
    >
      <div className="relative w-full aspect-video">
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}
