import React, { useState, useEffect } from 'react';
import { api } from '../../infrastructure/api';
import { useNavigate } from 'react-router-dom';
import { Video, Calendar, Clock, Filter, ArrowDownUp } from 'lucide-react';

export const LectureLibrary: React.FC = () => {
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLectures = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `/api/lectures?sort=${sortOrder}&limit=50`;
        if (selectedCourse) {
          url += `&courseId=${selectedCourse}`;
        }
        const { data } = await api.get(url);
        setLectures(data.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch lectures');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLectures();
  }, [sortOrder, selectedCourse]);

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Lecture Library</h2>
        <div className="flex items-center space-x-4">
          
          <div className="flex items-center space-x-2 bg-surfaceHover px-3 py-1.5 rounded-md border border-border">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select 
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-transparent text-sm border-none focus:ring-0 outline-none cursor-pointer"
            >
              <option value="">All Courses</option>
              {/* In a real app we'd populate this with the user's courses from courseStore */}
            </select>
          </div>

          <button 
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center space-x-2 bg-surfaceHover px-3 py-1.5 rounded-md border border-border hover:bg-border transition-colors text-sm"
          >
            <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm">{error}</div>
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 rounded-xl bg-surface/50 border border-border"></div>)}
        </div>
      ) : lectures.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-xl">
          <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No lectures found</h3>
          <p className="text-muted-foreground mt-2">You don't have any lectures in this library yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lectures.map((lecture) => (
            <div 
              key={lecture.id} 
              onClick={() => navigate(`/courses/${lecture.courseId}/lectures/${lecture.id}`)}
              className="group cursor-pointer rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:border-primary/50 hover:shadow-md transition-all flex flex-col overflow-hidden"
            >
              <div className="p-6 pb-4 flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">{lecture.title}</h3>
                  <div className={`px-2 py-1 text-[10px] font-medium uppercase tracking-wider rounded-full shrink-0 ${
                    lecture.status === 'ready' || lecture.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                    lecture.status === 'failed' ? 'bg-destructive/10 text-destructive' :
                    'bg-amber-500/10 text-amber-500'
                  }`}>
                    {lecture.status === 'completed' ? 'ready' : lecture.status}
                  </div>
                </div>
                {lecture.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{lecture.summary}</p>
                )}
              </div>
              <div className="px-6 py-4 border-t border-border bg-surface/30 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="mr-1 h-3 w-3" />
                  {new Date(lecture.startedAt).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Clock className="mr-1 h-3 w-3" />
                  {lecture.durationSeconds ? `${Math.floor(lecture.durationSeconds / 60)}m ${lecture.durationSeconds % 60}s` : 'Unknown'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
