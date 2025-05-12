import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { Subject, Exam } from '../../types/database';
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {exam ? `${exam.name} Subjects` : 'All Subjects'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {exam 
              ? `Manage subjects for ${exam.name}` 
              : 'Manage all subjects across exams'}
          </p>
        </div>
        <Link href={exam_id ? `/subjects/new?exam_id=${exam_id}` : '/subjects/new'}>
          <Button data-add-button="true">Add New Subject</Button>
        </Link>
      </div>

      {exam && (
        <div className="mb-4">
          <Link href="/exams" className="text-primary-600 dark:text-primary-400 hover:underline hover:text-primary-700 dark:hover:text-primary-300 flex items-center">
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Exams
          </Link>
        </div>
      )}

      <Card>
        {loading ? (
          <div className="text-center py-4">
            <p className="dark:text-gray-200">Loading subjects...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-600 dark:text-red-400">
            <p>{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchData}>
              Retry
            </Button>
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No subjects found</p>
            <Link href={exam_id ? `/subjects/new?exam_id=${exam_id}` : '/subjects/new'}>
              <Button>Add Your First Subject</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Table view for desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    {!exam && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Exam
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Syllabus PDF
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Chapters
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {subjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 dark:text-white">{subject.name}</div>
                      </td>
                      {!exam && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {subject.exam?.name || 'Unknown Exam'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {subject.syllabus_pdf_url ? (
                          <a 
                            href={subject.syllabus_pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            View Syllabus
                          </a>
                        ) : (
                          <span>No PDF</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <Link href={`/chapters?subject_id=${subject.id}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                          View Chapters
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/subjects/${subject.id}/edit`} className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 mr-3">
                          Edit
                        </Link>
                        <button
                          onClick={() => {
                            // Logic to delete subject would go here
                            // Could use a confirmation modal before deleting
                            alert('Delete functionality would be implemented here');
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card view for mobile */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {subjects.map((subject) => (
                <Card key={subject.id} className="hover:shadow-md transition-shadow">
                  <div className="flex flex-col h-full">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{subject.name}</h3>
                      {!exam && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Exam: {subject.exam?.name || 'Unknown Exam'}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap mt-auto pt-4 gap-2">
                      <Link 
                        href={`/chapters?subject_id=${subject.id}`}
                        className="text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 py-1 px-3 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        View Chapters
                      </Link>
                      
                      {subject.syllabus_pdf_url && (
                        <a 
                          href={subject.syllabus_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 py-1 px-3 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"
                        >
                          View Syllabus
                        </a>
                      )}
                      
                      <Link 
                        href={`/subjects/${subject.id}/edit`}
                        className="text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 py-1 px-3 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center"
                      >
                        <PencilSquareIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                      
                      <button
                        className="text-sm bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 py-1 px-3 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center"
                        onClick={() => {
                          // Logic to delete subject would go here
                          alert('Delete functionality would be implemented here');
                        }}
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </Card>
    </Layout>
  );
} 