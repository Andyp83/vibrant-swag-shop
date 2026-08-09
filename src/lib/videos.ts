import compadreSquare from "@/assets/video/compadre-square.mp4.asset.json";
import compadreStory from "@/assets/video/compadre-story.mp4.asset.json";
import type { SiteVideo } from "@/components/site/VideoStrip";

export const videos = {
  compadreSquare: {
    url: compadreSquare.url,
    title: "Compadre vacuum bottle in 17 colours",
    aspect: "aspect-square",
  },
  compadreStory: {
    url: compadreStory.url,
    title: "Compadre vacuum bottle story film",
    aspect: "aspect-[9/16]",
  },
} satisfies Record<string, SiteVideo>;

/** Videos shown on each category page, keyed by category slug. */
export const categoryVideos: Record<string, SiteVideo[]> = {
  drinkware: [videos.compadreSquare],
};
