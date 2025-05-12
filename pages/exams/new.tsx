import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

export default function NewExam() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Exam name is required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const { data, error } = await supabase
        .from('exams')
        .insert([{ name }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      router.push('/exams');
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the exam');
      console.error('Error creating exam:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Add New Exam | PrepPal Admin</title>
      </Head>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Add New Exam</h1>
        <p className="text-gray-600">Create a new exam category</p>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md">
              {error}
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
            <Button type="submit" loading={loading}>
              Create Exam
            </Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
} 