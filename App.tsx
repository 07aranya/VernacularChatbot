import React, { useState, useEffect } from 'react';
import { UserContext } from './types';
import Onboarding from './components/Onboarding';
import ChatInterface from './components/ChatInterface';
import LandingPage from './components/LandingPage';
import TeacherDashboard from './components/TeacherDashboard';

const THEME_STORAGE_KEY = 'yourbuddy_theme';

const App: React.FC = () => {
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [view, setView] = useState<'landing' | 'onboarding' | 'chat' | 'dashboard'>('landing');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage failures
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleStart = () => {
    setView('onboarding');
  };

  const handleTeacherDashboard = () => {
    setView('dashboard');
  };

  const handleOnboardingComplete = (context: UserContext) => {
    setUserContext(context);
    setView('chat');
  };

  const handleBackToLanding = () => {
    setUserContext(null);
    setView('landing');
  };

  if (view === 'landing') {
    return (
      <LandingPage
        onStart={handleStart}
        onTeacherDashboard={handleTeacherDashboard}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
    );
  }

  if (view === 'dashboard') {
    return (
      <TeacherDashboard
        onBack={() => setView('landing')}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="antialiased text-slate-900 dark:text-slate-100 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {view === 'onboarding' ? (
        <Onboarding
          onComplete={handleOnboardingComplete}
          onBack={handleBackToLanding}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      ) : (
        userContext && (
          <ChatInterface
            context={userContext}
            onBack={handleBackToLanding}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
        )
      )}
    </div>
  );
};

export default App;
