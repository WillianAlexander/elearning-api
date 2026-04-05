const YOUTUBE_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/;

/**
 * Extracts a YouTube video ID from a URL.
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/
 * With or without www, with or without extra query params.
 *
 * @returns The 11-character video ID, or `null` if the URL is not a valid YouTube URL.
 */
export function parseYouTubeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const match = YOUTUBE_REGEX.exec(trimmed);
  return match?.[1] ?? null;
}

/**
 * Builds a privacy-enhanced YouTube embed URL from a video ID.
 * Uses youtube-nocookie.com to avoid tracking cookies.
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}
