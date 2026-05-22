import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../../../infrastructure/api';
import { Plus, Trash2 } from 'lucide-react';

export const NotesPanel: React.FC = () => {
  const { lectureId } = useParams<{ lectureId: string }>();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');

  const fetchNotes = async () => {
    try {
      const res = await api.get(`/api/lectures/${lectureId}/notes`);
      setNotes(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lectureId) fetchNotes();
  }, [lectureId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      // Just hardcode timestamp to 0 for general lecture note, or we could grab the current player time if we had it
      await api.post(`/api/lectures/${lectureId}/notes`, {
        timestamp: 0,
        content: newNote
      });
      setNewNote('');
      fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await api.delete(`/api/notes/${noteId}`);
      setNotes(notes.filter(n => n._id !== noteId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-4 text-muted-foreground text-sm">Loading notes...</div>;

  return (
    <div className="flex flex-col h-full gap-4">
      <form onSubmit={handleAddNote} className="flex gap-2">
        <input 
          type="text" 
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a new note..."
          className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button 
          type="submit"
          disabled={!newNote.trim()}
          className="inline-flex items-center justify-center rounded-md p-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No notes yet. Add one above.</p>
        ) : (
          notes.map(note => (
            <div key={note._id} className="p-4 border border-border bg-card rounded-xl relative group">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">
                  {Math.floor(note.timestamp / 60)}:{(note.timestamp % 60).toString().padStart(2, '0')}
                </span>
                <button 
                  onClick={() => handleDelete(note._id)}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-foreground m-0">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
