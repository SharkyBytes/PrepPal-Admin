import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';
import { Exam } from '../../../types/database';

export default function EditExam() {
  const router = useRouter();
  const { id } = router.query;
  
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    if (router.isReady && id) {
      fetchExam(id as string);
    }
  }, [router.isReady, id]);
  
  async function fetchExam(examId: string) {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setName(data.name);
      } else {
        setError('Exam not found');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching the exam');
      console.error('Error fetching exam:', err);
    } finally {
      setLoading(false);
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Exam name is required');
      return;
    }
    
    try {
      setUpdating(true);
      setError('');
      setSuccess('');
      
      const { data, error } = await supabase
        .from('exams')
        .update({ name })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      setSuccess('Exam updated successfully');
      setTimeout(() => {
        router.push('/exams');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating the exam');
      console.error('Error updating exam:', err);
    } finally {
      setUpdating(false);
    }
  };
  
  return (
    <Layout>
      <Head>
        <title>Edit Exam | PrepPal Admin</title>
      </Head>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Exam</h1>
        <p className="text-gray-600 dark:text-gray-300">Update exam information</p>
      </div>
      
      <Card>
        {loading ? (
          <div className="text-center py-4">
            <p className="dark:text-gray-200">Loading exam details...</p>
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
            
            <Input
              label="Exam Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., JEE, NEET, UPSC"
              required
            />
            
            <div className="flex gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" loading={updating}>
                Update Exam
              </Button>
            </div>
          </form>
        )}
      </Card>
    </Layout>
  );
} 