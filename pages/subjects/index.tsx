import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { Subject, Exam } from '../../types/database';

export default function SubjectsPage() {
  const router = useRouter();
  const { exam_id } = router.query;
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (router.isReady) {
      fetchData();
    }
  }, [router.isReady, exam_id]);

  async function fetchData() {
    try {
      setLoading(true);
      setError('');
      
      // If exam_id is provided, fetch the exam details
      if (exam_id) {
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .select('*')
          .eq('id', exam_id)
          .single();
          
        if (examError) throw examError;
        setExam(examData);
        
        // Fetch subjects for the specific exam
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*')
          .eq('exam_id', exam_id)
          .order('created_at', { ascending: false });
          
        if (subjectsError) throw subjectsError;
        setSubjects(subjectsData || []);
      } else {
        // Fetch all subjects with their exam information
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select(`
            *,
            exam:exams(name)
          `)
          .order('created_at', { ascending: false });
          
        if (subjectsError) throw subjectsError;
        setSubjects(subjectsData || []);
      }
    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <Head>
        <title>{exam ? `${exam.name} Subjects` : 'All Subjects'} | PrepPal Admin</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {exam ? `${exam.name} Subjects` : 'All Subjects'}
          </h1>
          <p className="text-gray-600">
            {exam 
              ? `Manage subjects for ${exam.name}` 
              : 'Manage all subjects across exams'}
          </p>
        </div>
        <Link href={exam_id ? `/subjects/new?exam_id=${exam_id}` : '/subjects/new'}>
          <Button>Add New Subject</Button>
        </Link>
      </div>

      {exam && (
        <div className="mb-4">
          <Link href="/exams" className="text-primary-600 hover:underline flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Exams
          </Link>
        </div>
      )}

      <Card>
        {loading ? (
          <div className="text-center py-4">
            <p>Loading subjects...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-600">
            <p>{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchData}>
              Retry
            </Button>
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No subjects found</p>
            <Link href={exam_id ? `/subjects/new?exam_id=${exam_id}` : '/subjects/new'}>
              <Button>Add Your First Subject</Button>
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
                  {!exam && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exam
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Syllabus PDF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chapters
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{subject.name}</div>
                    </td>
                    {!exam && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subject.exam?.name || 'Unknown Exam'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subject.syllabus_pdf_url ? (
                        <a 
                          href={subject.syllabus_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline"
                        >
                          View Syllabus
                        </a>
                      ) : (
                        <span>No PDF</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link href={`/chapters?subject_id=${subject.id}`} className="text-primary-600 hover:underline">
                        View Chapters
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/subjects/${subject.id}/edit`} className="text-primary-600 hover:text-primary-800 mr-3">
                        Edit
                      </Link>
                      <button
                        onClick={() => {
                          // Logic to delete subject would go here
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