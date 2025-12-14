'use client';

import Button from '@/app/components/button';
import { showErrorToast, showSuccessToast } from '@/app/components/toast';
import { useState } from 'react';

interface Question {
  id: number;
  question: string;
  correctLat: number;
  correctLng: number;
  difficulty: string;
  category: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    correctLat: '',
    correctLng: '',
    difficulty: 'medium',
    category: 'geography',
  });
  const [bulkText, setBulkText] = useState('');

  // ChatGPT template for question generation
  const chatGPTTemplate = `Please generate geography questions in this exact JSON format:

[
  {
    "question": "Where is [landmark/location]?",
    "correctLat": [latitude as decimal number],
    "correctLng": [longitude as decimal number], 
    "difficulty": "easy" | "medium" | "hard",
    "category": "geography" | "landmarks" | "cities" | "countries"
  }
]

Requirements:
- Use exact coordinate values (not approximate)
- Include mix of difficulties 
- Provide precise latitude/longitude decimals
- Categories: geography, landmarks, cities, countries
- Questions should be: "Where is [location name]?"

Example:
[
  {
    "question": "Where is the Eiffel Tower?",
    "correctLat": 48.8584,
    "correctLng": 2.2945,
    "difficulty": "easy",
    "category": "landmarks"
  }
]`;

  // Copy template to clipboard
  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(chatGPTTemplate);
      showSuccessToast(
        'Template copied to clipboard! Now ask ChatGPT to generate questions using this format.'
      );
    } catch (error) {
      showErrorToast('Error copying to clipboard: ' + error);
    }
  };

  // Fetch all questions
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/bulk-questions');
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      showErrorToast('Error fetching questions: ' + error);
    } finally {
      setLoading(false);
    }
  };

  // Add single question
  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newQuestion.question,
          correctLat: parseFloat(newQuestion.correctLat),
          correctLng: parseFloat(newQuestion.correctLng),
          difficulty: newQuestion.difficulty,
          category: newQuestion.category,
        }),
      });

      if (response.ok) {
        showSuccessToast('Question added successfully!');
        setNewQuestion({
          question: '',
          correctLat: '',
          correctLng: '',
          difficulty: 'medium',
          category: 'geography',
        });
        fetchQuestions();
      } else {
        const error = await response.json();
        showErrorToast('Error: ' + error.error);
      }
    } catch (error) {
      showErrorToast('Error adding question: ' + error);
    } finally {
      setLoading(false);
    }
  };

  // Bulk import questions from CSV/JSON
  const bulkImport = async () => {
    if (!bulkText.trim()) {
      showErrorToast('Please enter questions data');
      return;
    }

    setLoading(true);
    try {
      let questionsData;
      try {
        questionsData = JSON.parse(bulkText);
      } catch {
        const lines = bulkText.trim().split('\n');
        const headers = lines[0].split(',').map((h) => h.trim());

        questionsData = lines.slice(1).map((line) => {
          const values = line.split(',').map((v) => v.trim());
          const obj: any = {};
          headers.forEach((header, index) => {
            if (header === 'correctLat' || header === 'correctLng') {
              obj[header] = parseFloat(values[index]);
            } else {
              obj[header] = values[index];
            }
          });
          return obj;
        });
      }

      const response = await fetch('/api/admin/bulk-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionsData }),
      });

      if (response.ok) {
        const result = await response.json();
        showSuccessToast(result.message);
        setBulkText('');
        fetchQuestions();
      } else {
        const error = await response.json();
        showErrorToast('Error: ' + error.error);
      }
    } catch (error) {
      showErrorToast('Error importing questions: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>

        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Add Single Question
          </h2>
          <form
            onSubmit={addQuestion}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Question
              </label>
              <input
                type="text"
                value={newQuestion.question}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, question: e.target.value })
                }
                className="w-full rounded-md border-2 border-gray-400 px-3 py-2 text-gray-900 transition-colors hover:border-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g., Where is the Eiffel Tower?"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={newQuestion.correctLat}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, correctLat: e.target.value })
                }
                className="w-full rounded-md border-2 border-gray-400 px-3 py-2 text-gray-900 transition-colors hover:border-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="48.8584"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={newQuestion.correctLng}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, correctLng: e.target.value })
                }
                className="w-full rounded-md border-2 border-gray-400 px-3 py-2 text-gray-900 transition-colors hover:border-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="2.2945"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Difficulty
              </label>
              <select
                value={newQuestion.difficulty}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, difficulty: e.target.value })
                }
                className="w-full rounded-md border-2 border-gray-400 px-3 py-2 text-gray-900 transition-colors hover:border-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Category
              </label>
              <input
                type="text"
                value={newQuestion.category}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, category: e.target.value })
                }
                className="w-full rounded-md border-2 border-gray-400 px-3 py-2 text-gray-900 transition-colors hover:border-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="geography"
                required
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Adding...' : 'Add Question'}
              </Button>
            </div>
          </form>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Bulk Import Questions
            </h2>
            <Button
              onClick={copyTemplate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              📋 Copy ChatGPT Template
            </Button>
          </div>
          <p className="mb-4 text-sm text-gray-800">
            Use the copy button above to get a template for ChatGPT, then paste
            the JSON response here. Also supports CSV format:
            question,correctLat,correctLng,difficulty,category
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="h-40 w-full rounded-md border-2 border-gray-400 px-3 py-2 font-mono text-sm text-gray-900 transition-colors hover:border-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Paste JSON questions here or use the template button above..."
          />
          <Button onClick={bulkImport} disabled={loading} className="mt-4">
            {loading ? 'Importing...' : 'Import Questions'}
          </Button>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Existing Questions ({questions.length})
            </h2>
            <Button onClick={fetchQuestions} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>

          {questions.length === 0 ? (
            <p className="py-8 text-center text-gray-600">
              No questions found. Add some questions above!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Question
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Lat
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Lng
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Difficulty
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr
                      key={q.id}
                      className="border-t border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-gray-900">{q.question}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {q.correctLat}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {q.correctLng}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium ${
                            q.difficulty === 'easy'
                              ? 'bg-green-100 text-green-800'
                              : q.difficulty === 'hard'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{q.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
