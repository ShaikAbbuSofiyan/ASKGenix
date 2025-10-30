import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { LogOut, Plus, Edit, Trash2, Power, PowerOff, BarChart3 } from 'lucide-react';
import { CreateTestModal } from '../../components/admin/CreateTestModal';
import { EditTestModal } from '../../components/admin/EditTestModal';
import { TestResultsModal } from '../../components/admin/TestResultsModal';

interface Test {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  total_marks: number;
  is_active: boolean;
  created_at: string;
}

export const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [viewingResults, setViewingResults] = useState<Test | null>(null);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTests(data);
    }
    setLoading(false);
  };

  const handleToggleActive = async (test: Test) => {
    const { error } = await supabase
      .from('tests')
      .update({ is_active: !test.is_active })
      .eq('id', test.id);

    if (!error) {
      loadTests();
    }
  };

  const handleDelete = async (testId: string) => {
    if (confirm('Are you sure you want to delete this test? This will also delete all attempts and results.')) {
      const { error } = await supabase
        .from('tests')
        .delete()
        .eq('id', testId);

      if (!error) {
        loadTests();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">ASKGenix Admin</h1>
              <p className="text-sm text-slate-600">JNTUH UCES</p>
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
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Test Management</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Test
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-slate-600 text-lg">No tests created yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first test
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-slate-900">{test.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          test.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {test.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {test.description && (
                      <p className="text-slate-600 mb-3">{test.description}</p>
                    )}
                    <div className="flex gap-6 text-sm text-slate-600">
                      <span>Duration: {test.duration_minutes} minutes</span>
                      <span>Total Marks: {test.total_marks}</span>
                      <span>Created: {new Date(test.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewingResults(test)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Results"
                    >
                      <BarChart3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(test)}
                      className={`p-2 rounded-lg transition-colors ${
                        test.is_active
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-slate-400 hover:bg-slate-100'
                      }`}
                      title={test.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {test.is_active ? (
                        <Power className="w-5 h-5" />
                      ) : (
                        <PowerOff className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingTest(test)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(test.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateTestModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadTests();
          }}
        />
      )}

      {editingTest && (
        <EditTestModal
          test={editingTest}
          onClose={() => setEditingTest(null)}
          onSuccess={() => {
            setEditingTest(null);
            loadTests();
          }}
        />
      )}

      {viewingResults && (
        <TestResultsModal
          test={viewingResults}
          onClose={() => setViewingResults(null)}
        />
      )}
    </div>
  );
};
