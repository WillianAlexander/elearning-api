import { describe, it, expect } from 'vitest';

import { parseYouTubeUrl, getYouTubeEmbedUrl } from './youtube';

describe('parseYouTubeUrl', () => {
  it('extracts video ID from youtube.com/watch?v=', () => {
    expect(parseYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    );
  });

  it('extracts video ID from youtube.com/watch?v= without www', () => {
    expect(parseYouTubeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    );
  });

  it('extracts video ID from youtu.be/ short URL', () => {
    expect(parseYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    );
  });

  it('extracts video ID from youtube.com/embed/', () => {
    expect(parseYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    );
  });

  it('handles URLs with extra query params after video ID', () => {
    expect(
      parseYouTubeUrl(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf&index=2',
      ),
    ).toBe('dQw4w9WgXcQ');
  });

  it('handles youtu.be with query params', () => {
    expect(parseYouTubeUrl('https://youtu.be/dQw4w9WgXcQ?t=42')).toBe(
      'dQw4w9WgXcQ',
    );
  });

  it('handles http:// (not just https://)', () => {
    expect(parseYouTubeUrl('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    );
  });

  it('handles URL without protocol', () => {
    expect(parseYouTubeUrl('youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    );
  });

  it('returns null for empty string', () => {
    expect(parseYouTubeUrl('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(parseYouTubeUrl('   ')).toBeNull();
  });

  it('returns null for non-YouTube URLs', () => {
    expect(parseYouTubeUrl('https://vimeo.com/123456')).toBeNull();
  });

  it('returns null for random text', () => {
    expect(parseYouTubeUrl('not a url at all')).toBeNull();
  });

  it('returns null for YouTube URL without video ID', () => {
    expect(parseYouTubeUrl('https://www.youtube.com/')).toBeNull();
  });

  it('returns null for YouTube channel URLs', () => {
    expect(parseYouTubeUrl('https://www.youtube.com/@channelname')).toBeNull();
  });

  it('trims whitespace from input', () => {
    expect(
      parseYouTubeUrl('  https://youtu.be/dQw4w9WgXcQ  '),
    ).toBe('dQw4w9WgXcQ');
  });
});

describe('getYouTubeEmbedUrl', () => {
  it('returns a youtube-nocookie.com embed URL', () => {
    expect(getYouTubeEmbedUrl('dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    );
  });
});
