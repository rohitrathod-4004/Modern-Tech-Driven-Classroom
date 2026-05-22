import { useEffect, useState } from 'react';
import { useCourseStore } from '../../infrastructure/stores/courseStore';
import { useAuthStore } from '../../infrastructure/stores/authStore';
import { Plus, Link as LinkIcon, BookOpen, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateCourseModal } from './components/CreateCourseModal';
import { JoinCourseModal } from './components/JoinCourseModal';

export function CourseList() {
  const { courses, isLoading, error, fetchCourses } = useCourseStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const isTeacher = user?.role === 'teacher';

  return (
    <div className="flex-1 p-8 pt-6 space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Courses</h2>
          <p className="text-muted-foreground mt-1">Manage and access all your registered courses.</p>
        </div>
        <div className="flex items-center gap-4">
          {isTeacher && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Course
            </button>
          )}
          <button
            onClick={() => setIsJoinOpen(true)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-input bg-background hover:bg-surfaceHover text-foreground h-10 px-4 py-2 gap-2 shadow-sm"
          >
            <LinkIcon className="w-4 h-4" />
            Join via Code
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm border border-destructive/20">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl bg-surface/50">
          <BookOpen className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No courses found</h3>
          <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
            {isTeacher 
              ? "You haven't created any courses yet. Click 'Create Course' to get started."
              : "You haven't joined any courses yet. Ask your teacher for an enrollment code."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div 
              key={course.id} 
              onClick={() => navigate(`/courses/${course.id}`)}
              className="group flex flex-col bg-surface border border-border rounded-xl p-6 hover:shadow-md transition-all hover:border-primary/50 cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                {isTeacher && (
                  <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">Code: {course.enrollmentCode}</span>
                )}
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground line-clamp-1">{course.title}</h3>
                  <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2">
                    <Clock className="w-3 h-3" />
                    <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              {course.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-6">
                  {course.description}
                </p>
              )}

              <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                <div className="text-sm font-medium text-muted-foreground">
                  {course.students.length} {course.students.length === 1 ? 'Student' : 'Students'}
                </div>
                <div className="text-sm font-medium text-primary flex items-center group-hover:translate-x-1 transition-transform">
                  View details &rarr;
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateCourseModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <JoinCourseModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
    </div>
  );
}
