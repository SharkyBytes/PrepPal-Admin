import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { Exam } from '../../types/database';

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExams();
  }, []);

  async function fetchExams() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setExams(data);
      }
    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <Head>
        <title>Exams | PrepPal Admin</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Exams</h1>
          <p className="text-gray-600">Manage exam categories for your application</p>
        </div>
        <Link href="/exams/new">
          <Button>Add New Exam</Button>
        </Link>
      </div>

      <Card>
        {loading ? (
          <div className="text-center py-4">
            <p>Loading exams...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-600">
            <p>{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchExams}>
              Retry
            </Button>
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No exams found</p>
            <Link href="/exams/new">
              <Button>Add Your First Exam</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subjects
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{exam.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(exam.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link href={`/subjects?exam_id=${exam.id}`} className="text-primary-600 hover:underline">
                        View Subjects
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/exams/${exam.id}/edit`} className="text-primary-600 hover:text-primary-800 mr-3">
                        Edit
                      </Link>
                      <button
                        onClick={() => {
                          // Logic to delete exam would go here
                          // Could use a confirmation modal before deleting
                          alert('Delete functionality would be implemented here');
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Layout>
  );
} 