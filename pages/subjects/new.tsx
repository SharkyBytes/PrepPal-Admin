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
      
      const { data, error } = await supabase
        .from('subjects')
        .insert([{ 
          name, 
          exam_id: selectedExamId 
        }])
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
        <h1 className="text-2xl font-bold text-gray-800">Add New Subject</h1>
        <p className="text-gray-600">Create a new subject for an exam</p>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam</label>
            {fetchingExams ? (
              <p className="text-sm text-gray-500">Loading exams...</p>
            ) : (
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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