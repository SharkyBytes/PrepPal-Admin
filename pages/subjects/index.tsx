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
  const [exams, setExams] = useState<Exam[]>([]);
  const [exam, setExam] = useState<Exam | null>(null);
  const [selectedExam, setSelectedExam] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);
  
  useEffect(() => {
    if (router.isReady) {
      if (exam_id) {
        setSelectedExam(exam_id as string);
      }
      fetchData();
    }
  }, [router.isReady, exam_id, selectedExam]);

  async function fetchExams() {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        setExams(data);
      }
    } catch (error: any) {
      console.error('Error fetching exams:', error);
    }
  }

  async function fetchData() {
    try {
      setLoading(true);
      setError('');
      
      // If exam_id or selectedExam is provided, fetch the exam details
      if (selectedExam) {
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .select('*')
          .eq('id', selectedExam)
          .single();
          
        if (examError) throw examError;
        setExam(examData);
        
        // Fetch subjects for the specific exam
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*')
          .eq('exam_id', selectedExam)
          .order('name');
          
        if (subjectsError) throw subjectsError;
        setSubjects(subjectsData || []);
      } else {
        // Fetch all subjects with their exam information
        setExam(null);
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select(`
            *,
            exam:exams(name)
          `)
          .order('name');
          
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

  const handleExamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const examId = e.target.value;
    setSelectedExam(examId);
    
    // Update URL without full page reload
    const query = examId ? { exam_id: examId } : {};
    router.push({
      pathname: router.pathname,
      query
    }, undefined, { shallow: true });
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject? This will also delete all associated chapters and books. This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Check if subject has syllabus PDF
      const { data: subject } = await supabase
        .from('subjects')
        .select('syllabus_pdf_url')
        .eq('id', subjectId)
        .single();
      
      // Delete syllabus PDF if it exists
      if (subject?.syllabus_pdf_url) {
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
      
      // Delete the subject (cascade delete will handle chapters and books)
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId);
      
      if (error) throw error;
      
      // Update local state
      setSubjects(subjects.filter(subject => subject.id !== subjectId));
      setSuccess('Subject deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'An error occurred while deleting the subject');
      console.error('Error deleting subject:', error);
    } finally {
      setIsDeleting(false);
    }
  };

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
        <Link href={selectedExam ? `/subjects/new?exam_id=${selectedExam}` : '/subjects/new'}>
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

      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 text-green-800 dark:text-green-400 rounded-md">
          {success}
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Exam
            </label>
            <select
              className="w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm 
                focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-200"
              value={selectedExam}
              onChange={handleExamChange}
            >
              <option value="">All Exams</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

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
            <Link href={selectedExam ? `/subjects/new?exam_id=${selectedExam}` : '/subjects/new'}>
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
                          onClick={() => handleDeleteSubject(subject.id)}
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
                        onClick={() => handleDeleteSubject(subject.id)}
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