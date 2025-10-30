import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { TakeTest } from './pages/student/TakeTest';

function AppContent() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [testInProgress, setTestInProgress] = useState<{
    testId: string;
    testTitle: string;
    duration: number;
  } | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-slate-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return showLogin ? (
      <Login onToggle={() => setShowLogin(false)} />
    ) : (
      <Signup onToggle={() => setShowLogin(true)} />
    );
  }

  if (testInProgress) {
    return (
      <TakeTest
        testId={testInProgress.testId}
        testTitle={testInProgress.testTitle}
        durationMinutes={testInProgress.duration}
        onComplete={() => setTestInProgress(null)}
      />
    );
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  return (
    <StudentDashboard
      onStartTest={(testId, testTitle, duration) =>
        setTestInProgress({ testId, testTitle, duration })
      }
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
