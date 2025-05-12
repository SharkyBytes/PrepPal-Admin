import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { Exam, Subject, Chapter, Book } from '../types/database';

export default function Dashboard() {
  const router = useRouter();
  const [counts, setCounts] = useState({
    exams: 0,
    subjects: 0,
    chapters: 0,
    books: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Check authentication
  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.href = '/login';
      } else {
        setLoadingAuth(false);
      }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    async function fetchCounts() {
      if (loadingAuth) return; // Don't fetch data until auth check completes
      
      try {
        const [examCount, subjectCount, chapterCount, bookCount] = await Promise.all([
          supabase.from('exams').select('id', { count: 'exact', head: true }),
          supabase.from('subjects').select('id', { count: 'exact', head: true }),
          supabase.from('chapters').select('id', { count: 'exact', head: true }),
          supabase.from('books').select('id', { count: 'exact', head: true }),
        ]);

        setCounts({
          exams: examCount.count || 0,
          subjects: subjectCount.count || 0,
          chapters: chapterCount.count || 0,
          books: bookCount.count || 0,
        });
      } catch (error) {
        console.error('Error fetching counts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCounts();
  }, [loadingAuth]);

  // Show loading indicator while checking auth
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const stats = [
    { name: 'Exams', count: counts.exams, href: '/exams', color: 'bg-blue-500' },
    { name: 'Subjects', count: counts.subjects, href: '/subjects', color: 'bg-green-500' },
    { name: 'Chapters', count: counts.chapters, href: '/chapters', color: 'bg-purple-500' },
    { name: 'Books', count: counts.books, href: '/books', color: 'bg-red-500' },
  ];

  return (
    <Layout>
      <Head>
        <title>Dashboard | PrepPal Admin</title>
      </Head>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Overview of your educational content</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <a 
            key={stat.name}
            href={stat.href} 
            className="block transition-transform hover:scale-105 hover:shadow-lg"
          >
            <Card className="h-full">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-full p-3 mr-4`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {loading ? '...' : stat.count}
                  </p>
                </div>
              </div>
            </Card>
          </a>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Exams">
          <p className="text-gray-500">Loading recent exams...</p>
        </Card>
        
        <Card title="Recent Subjects">
          <p className="text-gray-500">Loading recent subjects...</p>
        </Card>
      </div>
    </Layout>
  );
} 