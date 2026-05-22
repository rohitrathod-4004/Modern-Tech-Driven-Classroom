import React, { useState } from 'react';
import { useAuthStore } from '../../infrastructure/stores/authStore';
import { User, Palette, Shield, LogOut, CheckCircle2 } from 'lucide-react';
import { cn } from '../../design-system/utils';

export const SettingsPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'account'>('profile');
  
  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    try {
      // Simulate API call for now (can hook up to real API later)
      await new Promise(resolve => setTimeout(resolve, 800));
      setSuccessMsg('Profile updated successfully');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-full flex flex-col">
      <div className="mb-10 pb-6 border-b border-border/40">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-[15px] text-muted-foreground mt-2">Manage your account preferences and application settings.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-1">
        {/* Sidebar Nav */}
        <nav className="flex flex-col gap-1 w-full md:w-64 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
              activeTab === 'profile' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-surfaceHover hover:text-foreground"
            )}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
              activeTab === 'appearance' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-surfaceHover hover:text-foreground"
            )}
          >
            <Palette className="w-4 h-4" />
            Appearance
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
              activeTab === 'account' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-surfaceHover hover:text-foreground"
            )}
          >
            <Shield className="w-4 h-4" />
            Account Security
          </button>
        </nav>

        {/* Content Area */}
        <div className="flex-1 max-w-2xl">
          {activeTab === 'profile' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Public Profile
              </h2>
              
              <form onSubmit={handleSaveProfile} className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 pt-4 border-t border-border/40">
                  <div className="md:w-1/3">
                    <label className="text-[14px] font-medium text-foreground block">Email Address</label>
                    <p className="text-[13px] text-muted-foreground mt-1">Your email is used for authentication.</p>
                  </div>
                  <div className="md:w-2/3">
                    <input 
                      type="email" 
                      disabled 
                      value={user?.email || ''} 
                      className="w-full px-3 py-2 bg-secondary/20 border border-border/40 rounded-md text-[14px] text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 pt-6 border-t border-border/40">
                  <div className="md:w-1/3">
                    <label className="text-[14px] font-medium text-foreground block">Display Name</label>
                    <p className="text-[13px] text-muted-foreground mt-1">Your name as it appears across the workspace.</p>
                  </div>
                  <div className="md:w-2/3">
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-background border border-border/60 rounded-md text-[14px] text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-colors"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-border/40 flex items-center justify-end gap-4">
                  {successMsg && (
                    <span className="text-[13px] text-emerald-500 flex items-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4" />
                      {successMsg}
                    </span>
                  )}
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="px-5 py-2 bg-primary text-primary-foreground rounded-md text-[13px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

              </form>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Appearance
              </h2>
              <div className="pt-4 border-t border-border/40 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                <div>
                  <h4 className="text-[14px] font-medium text-foreground block">Theme Preference</h4>
                  <p className="text-[13px] text-muted-foreground mt-1">Choose your preferred color theme.</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-1.5 text-[13px] rounded-md border border-primary bg-primary/10 text-primary font-medium">Light</button>
                  <button className="px-4 py-1.5 text-[13px] rounded-md border border-border/60 hover:bg-secondary/40 text-muted-foreground">Dark</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Account Security
              </h2>
              
              <div className="space-y-6">
                <div className="pt-4 border-t border-border/40 flex flex-col md:flex-row gap-4 justify-between md:items-center">
                  <div>
                    <h4 className="text-[14px] font-medium text-foreground block">Change Password</h4>
                    <p className="text-[13px] text-muted-foreground mt-1">Update your password to keep your account secure.</p>
                  </div>
                  <button className="px-4 py-1.5 bg-background hover:bg-secondary/20 border border-border/60 rounded-md text-[13px] font-medium transition-colors">
                    Update Password
                  </button>
                </div>

                <div className="pt-4 border-t border-destructive/20 flex flex-col md:flex-row gap-4 justify-between md:items-center">
                  <div>
                    <h4 className="text-[14px] font-medium text-destructive block">Danger Zone</h4>
                    <p className="text-[13px] text-muted-foreground mt-1">Log out of your current session across the platform.</p>
                  </div>
                  <button 
                    onClick={logout}
                    className="px-4 py-1.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-[13px] font-medium hover:bg-destructive/20 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
