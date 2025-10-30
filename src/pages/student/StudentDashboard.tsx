import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { LogOut, Clock, Award, History, Play, CheckCircle } from 'lucide-react';

interface Test {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  total_marks: number;
  is_active: boolean;
}

interface Attempt {
  id: string;
  test_id: string;
  score: number;
  total_marks: number;
  time_taken_seconds: number | null;
  status: string;
  submitted_at: string | null;
  tests: {
    title: string;
  };
}

export const StudentDashboard = ({
  onStartTest,
}: {
  onStartTest: (testId: string, testTitle: string, duration: number) => void;
}) => {
  const { user, signOut } = useAuth();
  const [activeTests, setActiveTests] = useState<Test[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'active' | 'history'>('active');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const [testsResult, attemptsResult] = await Promise.all([
      supabase.from('tests').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      supabase
        .from('test_attempts')
        .select(`
          *,
          tests:test_id (
            title
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false }),
    ]);

    if (testsResult.data) {
      setActiveTests(testsResult.data);
    }

    if (attemptsResult.data) {
      const formatted = attemptsResult.data.map(item => ({
        ...item,
        tests: Array.isArray(item.tests) ? item.tests[0] : item.tests
      }));
      setAttempts(formatted);
    }

    setLoading(false);
  };

  const hasAttempted = (testId: string) => {
    return attempts.some(a => a.test_id === testId && a.status !== 'in_progress');
  };

  const getAttemptForTest = (testId: string) => {
    return attempts.find(a => a.test_id === testId && a.status !== 'in_progress');
  };

  const handleStartTest = async (test: Test) => {
    const existingAttempt = attempts.find(
      a => a.test_id === test.id && a.status === 'in_progress'
    );

    if (existingAttempt) {
      onStartTest(test.id, test.title, test.duration_minutes);
      return;
    }

    const { data, error } = await supabase
      .from('test_attempts')
      .insert([
        {
          test_id: test.id,
          user_id: user?.id,
          total_marks: test.total_marks,
          status: 'in_progress',
        },
      ])
      .select()
      .single();

    if (!error && data) {
      onStartTest(test.id, test.title, test.duration_minutes);
    }
  };

  const getPercentage = (score: number, total: number) => {
    return ((score / total) * 100).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">ASKGenix</h1>
              <p className="text-sm text-slate-600">JNTUH UCES Placement Portal</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user?.full_name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <button
                onClick={signOut}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 border-b border-slate-200">
          <div className="flex gap-4">
            <button
              onClick={() => setView('active')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                view === 'active'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Tests
            </button>
            <button
              onClick={() => setView('history')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                view === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Test History
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : view === 'active' ? (
          <div>
            {activeTests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <p className="text-slate-600 text-lg">No active tests available</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {activeTests.map((test) => {
                  const attempted = hasAttempted(test.id);
                  const attempt = getAttemptForTest(test.id);

                  return (
                    <div
                      key={test.id}
                      className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-slate-900">{test.title}</h3>
                            {attempted && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                Completed
                              </span>
                            )}
                          </div>
                          {test.description && (
                            <p className="text-slate-600 mb-4">{test.description}</p>
                          )}
                          <div className="flex gap-6 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {test.duration_minutes} minutes
                            </span>
                            <span className="flex items-center gap-1">
                              <Award className="w-4 h-4" />
                              {test.total_marks} marks
                            </span>
                          </div>

                          {attempted && attempt && (
                            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                              <div className="flex gap-6 text-sm">
                                <div>
                                  <span className="text-slate-600">Your Score: </span>
                                  <span className="font-semibold text-slate-900">
                                    {attempt.score}/{attempt.total_marks}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-600">Percentage: </span>
                                  <span className="font-semibold text-slate-900">
                                    {getPercentage(attempt.score, attempt.total_marks)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleStartTest(test)}
                          disabled={attempted}
                          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                            attempted
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {attempted ? (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              Completed
                            </>
                          ) : (
                            <>
                              <Play className="w-5 h-5" />
                              Start Test
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            {attempts.filter(a => a.status !== 'in_progress').length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">No test history yet</p>
                <p className="text-slate-500 text-sm mt-2">Start taking tests to see your history</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-6 font-semibold text-slate-900">Test</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900">Score</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900">Percentage</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900">Time Taken</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900">Status</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts
                      .filter(a => a.status !== 'in_progress')
                      .map((attempt) => (
                        <tr key={attempt.id} className="border-t border-slate-100">
                          <td className="py-4 px-6 font-medium text-slate-900">
                            {attempt.tests.title}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="font-semibold">
                              {attempt.score}/{attempt.total_marks}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                parseFloat(getPercentage(attempt.score, attempt.total_marks)) >= 60
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {getPercentage(attempt.score, attempt.total_marks)}%
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center text-slate-600">
                            {attempt.time_taken_seconds
                              ? `${Math.round(attempt.time_taken_seconds / 60)} min`
                              : 'N/A'}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                attempt.status === 'submitted'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              {attempt.status === 'auto_submitted' ? 'Auto Submitted' : 'Submitted'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center text-slate-600">
                            {attempt.submitted_at
                              ? new Date(attempt.submitted_at).toLocaleDateString()
                              : 'N/A'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
