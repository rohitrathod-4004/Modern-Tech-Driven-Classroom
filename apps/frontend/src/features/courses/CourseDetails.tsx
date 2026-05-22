import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseStore } from '../../infrastructure/stores/courseStore';
import { useAuthStore } from '../../infrastructure/stores/authStore';
import { Loader2, ArrowLeft, Settings, Users, Trash2 } from 'lucide-react';

export function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { courses, activeCourse, setActiveCourse, fetchCourseById, deleteCourse, isLoading } = useCourseStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (courseId) {
      if (courses.length > 0) {
        setActiveCourse(courseId);
      } else {
        fetchCourseById(courseId);
      }
    }
  }, [courseId, setActiveCourse, fetchCourseById, courses.length]);

  if (isLoading && !activeCourse) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
      </div>
    );
  }

  if (!activeCourse) {
    return (
      <div className="flex-1 p-8 text-center text-muted-foreground">
        Course not found.
      </div>
    );
  }

  const isTeacher = user?.id === activeCourse.teacherId;

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    try {
      await deleteCourse(activeCourse.id);
      navigate('/courses');
    } catch (err) {
      alert("Failed to delete course.");
    }
  };

  return (
    <div className="flex-1 p-8 pt-6 space-y-8 animate-in fade-in">
      <button onClick={() => navigate('/courses')} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Courses
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{activeCourse.title}</h2>
          <p className="text-muted-foreground mt-1">{activeCourse.description || 'No description provided.'}</p>
        </div>
        {isTeacher && (
          <div className="flex gap-4">
            <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-md">
              <span className="text-xs text-primary uppercase font-bold tracking-wider block mb-1">Enrollment Code</span>
              <span className="font-mono text-lg font-medium text-foreground tracking-widest">{activeCourse.enrollmentCode}</span>
            </div>
            <button
              onClick={handleDelete}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground h-10 px-4 py-2 shadow-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Enrolled Students</h3>
            <span className="ml-auto bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
              {activeCourse.students.length}
            </span>
          </div>
          
          {activeCourse.students.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No students enrolled yet.</p>
          ) : (
            <ul className="space-y-3">
              {activeCourse.students.map((studentId, idx) => (
                <li key={studentId} className="flex items-center justify-between text-sm py-2 px-3 rounded-md bg-background border border-border">
                  <span className="font-mono text-muted-foreground">ID: {studentId}</span>
                  <span className="text-xs text-muted-foreground bg-surface px-2 py-1 rounded border border-border">Student {idx + 1}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
           <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
            <Settings className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Course Settings</h3>
          </div>
          
          <div className="space-y-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="font-medium text-sm">Course Status</p>
                 <p className="text-xs text-muted-foreground">Students can only access active courses.</p>
               </div>
               <div className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full border border-green-500/20">
                 {activeCourse.isActive ? 'Active' : 'Inactive'}
               </div>
             </div>
             {isTeacher && (
               <div className="mt-6">
                 <button 
                   onClick={() => alert('Course settings are managed globally in the Admin dashboard.')}
                   className="px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-surfaceHover text-muted-foreground transition-colors"
                 >
                   Manage Course Access
                 </button>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
