import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../infrastructure/api';
import { useAuthStore } from '../../infrastructure/stores/authStore';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.post('/api/auth/register', { name, email, password, role });
      setAuth(data.data.user, data.data.accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Column - Cinematic Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-mesh-gradient opacity-60"></div>
        
        {/* Animated Glow Blobs */}
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '3s' }}></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-16 h-full text-foreground max-w-2xl">
          <div className="animate-fade-in">
            <h1 className="text-5xl font-bold tracking-tight mb-6">
              Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">revolution</span> in education.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Unlock the power of AI to transform how you teach and learn. Get instant transcripts, study materials, and deep insights from every lecture.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-[420px] animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Create Account</h2>
            <p className="text-sm text-muted-foreground">Sign up to get started with your new workspace</p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-2xl p-8 shadow-2xl relative">
            {error && (
              <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <input 
                  type="text" 
                  placeholder="Jane Doe" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-foreground text-[14px] placeholder:text-muted-foreground/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-foreground text-[14px] placeholder:text-muted-foreground/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-foreground text-[14px] placeholder:text-muted-foreground/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>

              <div className="space-y-1.5 pb-2">
                <label className="text-sm font-medium text-foreground">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2 px-3 rounded-lg text-[13px] font-medium border transition-colors ${role === 'student' ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border/60 text-muted-foreground hover:bg-secondary/40'}`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`py-2 px-3 rounded-lg text-[13px] font-medium border transition-colors ${role === 'teacher' ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border/60 text-muted-foreground hover:bg-secondary/40'}`}
                  >
                    Teacher
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-xl text-sm font-medium transition-all hover:bg-primary/90 hover:glow-subtle disabled:opacity-50 disabled:hover:glow-none mt-2 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Creating account...
                  </>
                ) : 'Create Account'}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-[13px] text-muted-foreground">
            Already have an account?{' '}
            <button 
              onClick={() => navigate('/login')}
              className="text-foreground font-medium hover:text-primary transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
