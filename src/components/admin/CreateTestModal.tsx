import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Plus, Trash2 } from 'lucide-react';

interface Question {
  question_text: string;
  question_type: 'mcq' | 'multiple_correct';
  options: { id: string; text: string }[];
  correct_answers: string[];
  marks: number;
}

export const CreateTestModal = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: 'mcq',
        options: [
          { id: '1', text: '' },
          { id: '2', text: '' },
          { id: '3', text: '' },
          { id: '4', text: '' },
        ],
        correct_answers: [],
        marks: 1,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, text: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex].text = text;
    setQuestions(updated);
  };

  const toggleCorrectAnswer = (questionIndex: number, optionId: string) => {
    const updated = [...questions];
    const question = updated[questionIndex];

    if (question.question_type === 'mcq') {
      question.correct_answers = [optionId];
    } else {
      if (question.correct_answers.includes(optionId)) {
        question.correct_answers = question.correct_answers.filter(id => id !== optionId);
      } else {
        question.correct_answers.push(optionId);
      }
    }

    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (questions.length === 0) {
      setError('Please add at least one question');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setError(`Question ${i + 1}: Question text is required`);
        return;
      }
      if (q.options.some(opt => !opt.text.trim())) {
        setError(`Question ${i + 1}: All options must have text`);
        return;
      }
      if (q.correct_answers.length === 0) {
        setError(`Question ${i + 1}: Please select at least one correct answer`);
        return;
      }
    }

    setLoading(true);

    try {
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

      const { data: testData, error: testError } = await supabase
        .from('tests')
        .insert([
          {
            title,
            description,
            duration_minutes: durationMinutes,
            total_marks: totalMarks,
            is_active: false,
            created_by: user?.id,
          },
        ])
        .select()
        .single();

      if (testError) throw testError;

      const questionsToInsert = questions.map((q, index) => ({
        test_id: testData.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        correct_answers: q.correct_answers,
        marks: q.marks,
        order_index: index,
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create test');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">Create New Test</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="space-y-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Test Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Aptitude Test 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the test..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Duration (minutes)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                required
                min="1"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Questions</h3>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((question, qIndex) => (
                <div key={qIndex} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium text-slate-900">Question {qIndex + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Question Text
                      </label>
                      <textarea
                        value={question.question_text}
                        onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                        required
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your question..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Question Type
                        </label>
                        <select
                          value={question.question_type}
                          onChange={(e) =>
                            updateQuestion(qIndex, 'question_type', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="mcq">Single Correct</option>
                          <option value="multiple_correct">Multiple Correct</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Marks
                        </label>
                        <input
                          type="number"
                          value={question.marks}
                          onChange={(e) => updateQuestion(qIndex, 'marks', parseInt(e.target.value))}
                          required
                          min="1"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Options (select correct answer{question.question_type === 'multiple_correct' ? 's' : ''})
                      </label>
                      <div className="space-y-2">
                        {question.options.map((option, oIndex) => (
                          <div key={option.id} className="flex items-center gap-2">
                            <input
                              type={question.question_type === 'mcq' ? 'radio' : 'checkbox'}
                              checked={question.correct_answers.includes(option.id)}
                              onChange={() => toggleCorrectAnswer(qIndex, option.id)}
                              className="w-4 h-4"
                            />
                            <input
                              type="text"
                              value={option.text}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              required
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={`Option ${oIndex + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400"
            >
              {loading ? 'Creating...' : 'Create Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
