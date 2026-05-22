import { useState, useCallback } from "react";
import { apiClient } from "../services/apiClient";
import {
  saveBookmarkOffline,
  loadAllOfflineBookmarks,
  removeBookmarkOffline,
} from "../services/indexedDb";

export interface BookmarkData {
  _id: string;
  session_id: string;
  chunk_index: number;
  text: string;
  start_time: number;
  note?: string;
  createdAt: string;
  lecture_title: string;
  classroom_name: string;
  classroom_id?: string;
}

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Try to fetch from server
      const data = await apiClient.get<BookmarkData[]>("/api/bookmarks");
      setBookmarks(data);
      // 2. Cache in IndexedDB for offline access
      for (const b of data) {
        await saveBookmarkOffline(b);
      }
    } catch (err: any) {
      console.warn("[Bookmarks Hook] Server fetch failed. Loading offline backup...", err);
      // Fallback to IndexedDB
      try {
        const offlineData = await loadAllOfflineBookmarks();
        setBookmarks(offlineData);
      } catch (dbErr: any) {
        setError(err.message || "Failed to load bookmarks");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const addBookmark = async (
    session_id: string,
    chunk_index: number,
    text: string,
    start_time: number,
    note?: string
  ): Promise<BookmarkData> => {
    setError(null);
    try {
      const newBookmark = await apiClient.post<BookmarkData>("/api/bookmarks", {
        session_id,
        chunk_index,
        text,
        start_time,
        note
      });
      // Update local state and IndexedDB cache
      setBookmarks((prev) => [newBookmark, ...prev]);
      await saveBookmarkOffline(newBookmark);
      return newBookmark;
    } catch (err: any) {
      setError(err.message || "Failed to add bookmark");
      throw err;
    }
  };

  const deleteBookmark = async (id: string): Promise<void> => {
    setError(null);
    try {
      await apiClient.delete(`/api/bookmarks/${id}`);
      // Update local state and IndexedDB cache
      setBookmarks((prev) => prev.filter((b) => b._id !== id));
      await removeBookmarkOffline(id);
    } catch (err: any) {
      setError(err.message || "Failed to delete bookmark");
      throw err;
    }
  };

  return { bookmarks, loading, error, fetchBookmarks, addBookmark, deleteBookmark };
};
