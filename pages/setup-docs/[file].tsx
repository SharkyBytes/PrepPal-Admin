import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// This is a simple file viewer for setup documentation
export default function SetupFileViewer() {
  const router = useRouter();
  const { file } = router.query;
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file) return;

    const fetchFile = async () => {
      try {
        setLoading(true);
        const filePath = file === 'setup' ? 'SETUP.md' : 'scripts/setup-tables.sql';
        const response = await fetch(`/${filePath}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status}`);
        }
        
        const text = await response.text();
        setContent(text);
      } catch (err) {
        console.error('Error fetching file:', err);
        setError('Failed to load the file. Please check if it exists.');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [file]);

  const getTitle = () => {
    if (file === 'setup') return 'Setup Guide';
    if (file === 'sql') return 'SQL Setup Script';
    return 'Documentation';
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <Head>
        <title>{getTitle()} | PrepPal Admin</title>
      </Head>
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">{getTitle()}</h1>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md"
          >
            Back
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          {loading ? (
            <p className="text-center py-8">Loading...</p>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-600">
              <p>{error}</p>
            </div>
          ) : (
            <div className={file === 'sql' ? 'font-mono text-sm' : ''}>
              {file === 'setup' ? (
                <div className="prose max-w-none">
                  {content.split('\n').map((line, index) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={index} className="text-2xl font-bold mt-6 mb-4">{line.substring(2)}</h1>;
                    } else if (line.startsWith('## ')) {
                      return <h2 key={index} className="text-xl font-bold mt-5 mb-3">{line.substring(3)}</h2>;
                    } else if (line.startsWith('### ')) {
                      return <h3 key={index} className="text-lg font-bold mt-4 mb-2">{line.substring(4)}</h3>;
                    } else if (line.startsWith('- ')) {
                      return <li key={index} className="ml-5 mb-1">{line.substring(2)}</li>;
                    } else if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
                      return <li key={index} className="ml-5 mb-1">{line.substring(3)}</li>;
                    } else if (line === '') {
                      return <br key={index} />;
                    } else {
                      return <p key={index} className="mb-2">{line}</p>;
                    }
                  })}
                </div>
              ) : (
                <pre className="overflow-x-auto p-4 bg-gray-50 rounded">
                  {content}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 