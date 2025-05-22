import { useState, useEffect } from 'react';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
}

export function useYouTubeVideos(query: string) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!query.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `http://localhost:7001/api/youtube?query=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch YouTube videos');
        }

        const data = await response.json();
        
        const formattedVideos: YouTubeVideo[] = data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.high.url,
        }));

        setVideos(formattedVideos);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('YouTube search error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [query]);

  return { videos, isLoading, error };
}