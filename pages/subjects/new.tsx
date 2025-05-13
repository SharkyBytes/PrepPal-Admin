import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { Exam } from '../../types/database';

export default function NewSubject() {
  const router = useRouter();
  const { exam_id } = router.query;
  
  const [name, setName] = useState('');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingExams, setFetchingExams] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (router.isReady && exam_id) {
      setSelectedExamId(exam_id as string);
    }
  }, [router.isReady, exam_id]);

  async function fetchExams() {
    try {
      setFetchingExams(true);
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
    } finally {
      setFetchingExams(false);
    }
  }

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else if (file) {
      setError('Please upload a PDF file');
      setPdfFile(null);
      e.target.value = '';
    }
  };

  // Sanitize filename by replacing spaces and special characters with underscores
  const sanitizeFilename = (filename: string): string => {
    // First, get file extension
    const lastDot = filename.lastIndexOf('.');
    const extension = lastDot !== -1 ? filename.slice(lastDot) : '';
    const nameWithoutExt = lastDot !== -1 ? filename.slice(0, lastDot) : filename;
    
    // Replace spaces and special chars with underscore
    const sanitized = nameWithoutExt
      .replace(/[^a-zA-Z0-9]/g, '_') // Replace non-alphanumeric with underscore
      .replace(/_+/g, '_'); // Replace multiple underscores with a single one
    
    return sanitized + extension;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Subject name is required');
      return;
    }
    
    if (!selectedExamId) {
      setError('Please select an exam');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Prepare subject data
      const subjectData: any = { 
        name, 
        exam_id: selectedExamId 
      };
      
      // If PDF file is provided, check for bucket and upload
      if (pdfFile) {
        // Check if syllabus bucket exists
        try {
          const { data: buckets } = await supabase.storage.listBuckets();
          const bucketExists = buckets?.some(bucket => bucket.name === 'syllabus');
          
          if (!bucketExists) {
            // Create the bucket if it doesn't exist
            await supabase.storage.createBucket('syllabus', {
              public: true
            });
          }
        } catch (bucketError) {
          console.error('Error checking/creating storage bucket:', bucketError);
        }
        
        // Upload the PDF with sanitized filename
        const sanitizedName = sanitizeFilename(pdfFile.name);
        const fileName = `${Date.now()}_${sanitizedName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('syllabus')
          .upload(fileName, pdfFile);
        
        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('syllabus')
          .getPublicUrl(fileName);
        
        subjectData.syllabus_pdf_url = urlData.publicUrl;
      }
      
      // Insert the subject
      const { data, error } = await supabase
        .from('subjects')
        .insert([subjectData])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      router.push(selectedExamId ? `/subjects?exam_id=${selectedExamId}` : '/subjects');
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the subject');
      console.error('Error creating subject:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Add New Subject | PrepPal Admin</title>
      </Head>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Add New Subject</h1>
        <p className="text-gray-600 dark:text-gray-300">Create a new subject for an exam</p>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exam</label>
            {fetchingExams ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading exams...</p>
            ) : (
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md 
                  focus:outline-none focus:ring-2 focus:ring-primary-500 
                  dark:bg-gray-800 dark:text-gray-200
                  disabled:bg-gray-100 disabled:text-gray-500 
                  dark:disabled:bg-gray-900 dark:disabled:text-gray-600"
                value={selectedExamId || ''}
                onChange={(e) => setSelectedExamId(e.target.value)}
                disabled={exam_id !== undefined}
                required
              >
                <option value="">Select an exam</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <Input
            label="Subject Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Physics, Chemistry, Mathematics"
            required
          />
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Syllabus PDF (Optional)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 dark:bg-gray-800 dark:text-gray-200"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Upload a PDF version of the syllabus if available
            </p>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Subject
            </Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
} 