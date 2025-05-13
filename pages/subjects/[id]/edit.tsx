import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';
import { Subject, Exam } from '../../../types/database';

export default function EditSubject() {
  const router = useRouter();
  const { id } = router.query;
  
  const [name, setName] = useState('');
  const [examId, setExamId] = useState('');
  const [examName, setExamName] = useState('');
  const [syllabusPdfUrl, setSyllabusPdfUrl] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    if (router.isReady && id) {
      fetchSubject(id as string);
    }
  }, [router.isReady, id]);
  
  async function fetchSubject(subjectId: string) {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('subjects')
        .select('*, exam:exams(name)')
        .eq('id', subjectId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setName(data.name);
        setExamId(data.exam_id);
        setExamName(data.exam.name);
        setSyllabusPdfUrl(data.syllabus_pdf_url || '');
      } else {
        setError('Subject not found');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching the subject');
      console.error('Error fetching subject:', err);
    } finally {
      setLoading(false);
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
    
    try {
      setUpdating(true);
      setError('');
      setSuccess('');
      
      // Prepare update data
      const updateData: any = {
        name
      };
      
      // Update the PDF file if a new one is provided
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
        
        // If there's an existing PDF, delete it
        if (syllabusPdfUrl) {
          try {
            // Extract just the filename from the URL
            const url = new URL(syllabusPdfUrl);
            const pathname = url.pathname;
            const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
            
            if (filename) {
              const { error: deleteError } = await supabase.storage
                .from('syllabus')
                .remove([filename]);
              
              if (deleteError) {
                console.error('Error deleting previous PDF file:', deleteError);
              }
            }
          } catch (storageError) {
            console.error('Storage deletion error:', storageError);
          }
        }
        
        // Upload the new PDF with sanitized filename
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
        
        updateData.syllabus_pdf_url = urlData.publicUrl;
      }
      
      // Update the subject in the database
      const { data, error } = await supabase
        .from('subjects')
        .update(updateData)
        .eq('id', id)
        .select('*, exam:exams(name)')
        .single();
      
      if (error) throw error;
      
      setSuccess('Subject updated successfully');
      setTimeout(() => {
        router.push(examId ? `/subjects?exam_id=${examId}` : '/subjects');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating the subject');
      console.error('Error updating subject:', err);
    } finally {
      setUpdating(false);
    }
  };
  
  return (
    <Layout>
      <Head>
        <title>Edit Subject | PrepPal Admin</title>
      </Head>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Subject</h1>
        <p className="text-gray-600 dark:text-gray-300">Update subject information</p>
      </div>
      
      <Card>
        {loading ? (
          <div className="text-center py-4">
            <p className="dark:text-gray-200">Loading subject details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-400 rounded-md">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 text-green-800 dark:text-green-400 rounded-md">
                {success}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exam</label>
              <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {examName}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                You cannot change the exam for a subject
              </p>
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
                Syllabus PDF
              </label>
              {syllabusPdfUrl && (
                <div className="mb-3">
                  <a 
                    href={syllabusPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 hover:underline flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Current Syllabus
                  </a>
                </div>
              )}
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 dark:bg-gray-800 dark:text-gray-200"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Upload a new PDF to replace the current one, or leave empty to keep the current file
              </p>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" loading={updating}>
                Update Subject
              </Button>
            </div>
          </form>
        )}
      </Card>
    </Layout>
  );
} 