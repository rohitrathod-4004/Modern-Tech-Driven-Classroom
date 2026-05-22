import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../services/apiClient";

export interface Classroom {
  _id: string;
  name: string;
  code: string;
  faculty_id: string | { name: string; email: string };
  students: string[];
  createdAt: string;
}

export const useClassrooms = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClassrooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<Classroom[]>("/api/classrooms/my");
      setClassrooms(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  const createClassroom = async (name: string): Promise<Classroom> => {
    const classroom = await apiClient.post<Classroom>("/api/classrooms", { name });
    setClassrooms((prev) => [classroom, ...prev]);
    return classroom;
  };

  const joinClassroom = async (code: string): Promise<void> => {
    await apiClient.post("/api/classrooms/join", { code });
    await fetchClassrooms(); // Re-fetch to get the newly joined classroom
  };

  const deleteClassroom = async (id: string): Promise<void> => {
    await apiClient.delete(`/api/classrooms/${id}`);
    setClassrooms((prev) => prev.filter((c) => c._id !== id));
  };

  return { classrooms, loading, error, createClassroom, joinClassroom, deleteClassroom, refetch: fetchClassrooms };
};

