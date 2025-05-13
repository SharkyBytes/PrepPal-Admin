import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { Exam } from '../../types/database';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function ExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam? This will also delete all associated subjects and chapters. This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Get associated subjects to this exam
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id, syllabus_pdf_url')
        .eq('exam_id', examId);
        
      // Delete syllabus PDFs from storage if they exist
      if (subjects && subjects.length > 0) {
        for (const subject of subjects) {
          if (subject.syllabus_pdf_url) {
            try {
              // Extract filename from URL
              const url = new URL(subject.syllabus_pdf_url);
              const pathname = url.pathname;
              const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
              
              if (filename) {
                const { error: deleteFileError } = await supabase.storage
                  .from('syllabus')
                  .remove([filename]);
                  
                if (deleteFileError) {
                  console.error('Error deleting syllabus file:', deleteFileError);
                }
              }
            } catch (err) {
              console.error('Error parsing syllabus URL:', err);
            }
          }
        }
      }
      
      // Delete the exam (cascade delete will handle subjects and chapters)
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);
      
      if (error) throw error;
      
      // Update local state
      setExams(exams.filter(exam => exam.id !== examId));
      setSuccess('Exam deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'An error occurred while deleting the exam');
      console.error('Error deleting exam:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Exams | PrepPal Admin</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Exams</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage exam categories for your application</p>
        </div>
        <Link href="/exams/new">
          <Button data-add-button="true">Add New Exam</Button>
        </Link>
      </div>
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 text-green-800 dark:text-green-400 rounded-md">
          {success}
        </div>
      )}

      <Card>
        {loading ? (
          <div className="text-center py-4">
            <p className="dark:text-gray-200">Loading exams...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-600 dark:text-red-400">
            <p>{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchExams}>
              Retry
            </Button>
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No exams found</p>
            <Link href="/exams/new">
              <Button>Add Your First Exam</Button>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Subjects
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 dark:text-white">{exam.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(exam.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <Link href={`/subjects?exam_id=${exam.id}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                          View Subjects
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/exams/${exam.id}/edit`} className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 mr-3">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          disabled={isDeleting}
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
              {exams.map((exam) => (
                <Card key={exam.id} className="hover:shadow-md transition-shadow">
                  <div className="flex flex-col h-full">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{exam.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Created: {new Date(exam.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex mt-auto pt-4 gap-2">
                      <Link 
                        href={`/subjects?exam_id=${exam.id}`}
                        className="text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 py-1 px-3 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        View Subjects
                      </Link>
                      
                      <Link 
                        href={`/exams/${exam.id}/edit`}
                        className="text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 py-1 px-3 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center"
                      >
                        <PencilSquareIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                      
                      <button
                        className="text-sm bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 py-1 px-3 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center"
                        onClick={() => handleDeleteExam(exam.id)}
                        disabled={isDeleting}
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