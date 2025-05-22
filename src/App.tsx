//swarupplay/src/App.tsx
import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorScreen } from './components/ErrorScreen';
import { RelatedVideos } from './components/RelatedVideos';
import { VideoPlayer } from './components/VideoPlayer';
import { YouTubeSuggestions } from './components/YouTubeSuggestions';
import { useVideoMetadata } from './hooks/useVideoMetadata';
import { useRelatedVideos } from './hooks/useRelatedVideos';
import { useYouTubeVideos } from './hooks/useYouTubeVideos';
import { VideoMetadata } from './types';
import { formatFileSize, formatDuration } from './utils/format';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Watch from './pages/Watch'

export default function App() {
  const [fileId, setFileId] = useState<string | null>(null);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);

  const { metadata, isLoading: loadingMeta, error: metaError } = useVideoMetadata(fileId);
  const { videos: localVids, isLoading: loadingLocal } = useRelatedVideos();

  const { isAuthenticated, isLoading } = useAuth();

  // Generate a better search query from the video metadata
  const getSearchQuery = (metadata: VideoMetadata | null): string => {
    if (!metadata) return '';

    // Extract the base filename without extension
    let searchText = metadata.file_name
      .replace(/\.(mp4|avi|mov|wmv|mkv|flv|webm)$/i, '')  // Remove video extensions
      .replace(/[-_.]/g, ' ')  // Replace dashes, dots, and underscores with spaces
      .replace(/\([^)]*\)/g, '')  // Remove content in parentheses
      .replace(/\[[^\]]*\]/g, '')  // Remove content in square brackets
      .replace(/\{[^}]*\}/g, '')   // Remove content in curly braces
      .replace(/\b\d{3,}\b/g, '')  // Remove numbers with 3 or more digits
      .replace(/\b(480p|720p|1080p|2160p|4k|uhd|hd|full\s*hd)\b/gi, '')  // Remove quality indicators
      .replace(/\b(x264|x265|hevc|avc|xvid|divx)\b/gi, '')  // Remove codec info
      .replace(/\b(bluray|brrip|dvdrip|webrip|web-dl)\b/gi, '')  // Remove source info
      .replace(/\b(s\d{2}e\d{2}|season\s*\d+|episode\s*\d+)\b/gi, '')  // Remove TV episode info
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .trim();

    // Split into words and process
    const words = searchText.split(' ')
      .filter(word => {
        const cleaned = word.toLowerCase();
        // Filter out common filler words and very short words
        return word.length > 2 && 
          !['the', 'and', 'for', 'from', 'with', 'that', 'this'].includes(cleaned);
      })
      .slice(0, 5);  // Take only first 5 meaningful words

    return words.join(' ');
  };

  const searchQuery = getSearchQuery(metadata);
  const { videos: ytVids, isLoading: loadingYT } = useYouTubeVideos(searchQuery);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const play = params.get('play');
    if (play) setFileId(play);
  }, []);

  const handleVideoSelect = (id: string, isYouTube = false) => {
    if (isYouTube) {
      setYoutubeId(id);
      setFileId(null);
    } else {
      setFileId(id);
      setYoutubeId(null);
    }
    const newUrl = `${window.location.pathname}?play=${id}`;
    window.history.replaceState({}, '', newUrl);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  // public vs. protected routing
  return (
    <Routes>
      {/* root → login or dashboard */}
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Navigate to="/dashboard" replace />
            : <Navigate to="/login" replace />
        }
      />

      {/* login & register only when NOT authenticated */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
        }
      />

      {/* dashboard → your existing video UI */}
      <Route
        path="/dashboard"
        element={
          isAuthenticated
            ? <Dashboard />
            : <Navigate to="/login" replace />
        }
      />

      {/* watch page */}
      <Route path="/watch" element={<Watch />} />

      {/* catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
