import { create } from 'zustand';
import { api } from '../api';
import type { CourseDto, CreateCourseDto, UpdateCourseDto, JoinCourseDto } from '@classroom/shared';

interface CourseState {
  courses: CourseDto[];
  activeCourse: CourseDto | null;
  isLoading: boolean;
  error: string | null;

  fetchCourses: () => Promise<void>;
  createCourse: (data: CreateCourseDto) => Promise<CourseDto>;
  updateCourse: (id: string, data: UpdateCourseDto) => Promise<CourseDto>;
  deleteCourse: (id: string) => Promise<void>;
  joinCourse: (data: JoinCourseDto) => Promise<CourseDto>;
  fetchCourseById: (id: string) => Promise<void>;
  setActiveCourse: (id: string) => void;
  clearError: () => void;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  activeCourse: null,
  isLoading: false,
  error: null,

  fetchCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/api/courses');
      set({ courses: data.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to fetch courses', isLoading: false });
    }
  },

  createCourse: async (courseData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/api/courses', courseData);
      const newCourse = data.data;
      set(state => ({
        courses: [newCourse, ...state.courses],
        isLoading: false
      }));
      return newCourse;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to create course', isLoading: false });
      throw err;
    }
  },

  updateCourse: async (id, courseData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.put(`/api/courses/${id}`, courseData);
      const updatedCourse = data.data;
      set(state => ({
        courses: state.courses.map(c => c.id === id ? updatedCourse : c),
        activeCourse: state.activeCourse?.id === id ? updatedCourse : state.activeCourse,
        isLoading: false
      }));
      return updatedCourse;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to update course', isLoading: false });
      throw err;
    }
  },

  deleteCourse: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/courses/${id}`);
      set(state => ({
        courses: state.courses.filter(c => c.id !== id),
        activeCourse: state.activeCourse?.id === id ? null : state.activeCourse,
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to delete course', isLoading: false });
      throw err;
    }
  },

  joinCourse: async (joinData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/api/courses/join', joinData);
      const joinedCourse = data.data;
      set(state => ({
        courses: [joinedCourse, ...state.courses],
        isLoading: false
      }));
      return joinedCourse;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to join course', isLoading: false });
      throw err;
    }
  },

  setActiveCourse: (id) => {
    const { courses } = get();
    const course = courses.find(c => c.id === id) || null;
    set({ activeCourse: course });
  },

  fetchCourseById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/api/courses/${id}`);
      set({ activeCourse: data.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Course not found', isLoading: false });
    }
  },

  clearError: () => set({ error: null })
}));
