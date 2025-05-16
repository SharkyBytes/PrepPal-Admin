import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Prompt {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function PromptsPage() {
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [isAddingPrompt, setIsAddingPrompt] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch prompts on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.href = '/login';
        return;
      }
      await fetchPrompts();
    };

    checkAuth();
  }, []);

  // Fetch user's prompts
  const fetchPrompts = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setPrompts(data || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      setError('Failed to load prompts. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setTitle('');
    setContent('');
    setCurrentPrompt(null);
    setIsAddingPrompt(false);
    setIsEditingPrompt(false);
  };

  // Handle form submission (add/edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    // Validate form
    if (!title.trim() || !content.trim()) {
      setError('Title and Content are required');
      setSubmitting(false);
      return;
    }

    try {
      // Get current user's session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session found');
      }
      
      const userId = session.user.id;
      console.log("Creating/updating prompt as user:", userId);

      // If editing, update existing prompt; otherwise create new prompt
      if (isEditingPrompt && currentPrompt) {
        const { error } = await supabase
          .from('prompts')
          .update({ title, content })
          .eq('id', currentPrompt.id);
        
        if (error) throw error;
        
        setSuccess('Prompt updated successfully');
        
        // Update local state
        setPrompts(prompts.map(p => 
          p.id === currentPrompt.id 
            ? { ...p, title, content, updated_at: new Date().toISOString() } 
            : p
        ));
      } else {
        // Create new prompt with explicit user_id
        const { data, error } = await supabase
          .from('prompts')
          .insert([{ 
            title, 
            content, 
            user_id: userId 
          }])
          .select();
        
        if (error) {
          console.error("Insert error details:", error);
          throw error;
        }
        
        setSuccess('Prompt created successfully');
        
        // Add to local state
        if (data && data.length > 0) {
          setPrompts([data[0], ...prompts]);
        }
      }
      
      // Reset form after submission
      resetForm();
    } catch (error) {
      console.error('Error saving prompt:', error);
      setError('Failed to save prompt. Please try again: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit prompt
  const handleEditPrompt = (prompt: Prompt) => {
    setCurrentPrompt(prompt);
    setTitle(prompt.title);
    setContent(prompt.content);
    setIsEditingPrompt(true);
    setIsAddingPrompt(true);
  };

  // Handle delete prompt
  const handleDeletePrompt = async (promptId: string) => {
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', promptId);
      
      if (error) throw error;
      
      // Update local state
      setPrompts(prompts.filter(p => p.id !== promptId));
      setSuccess('Prompt deleted successfully');
      
      // Reset form if the deleted prompt was being edited
      if (currentPrompt && currentPrompt.id === promptId) {
        resetForm();
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
      setError('Failed to delete prompt. Please try again.');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <Head>
        <title>Prompts | PrepPal Admin</title>
      </Head>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Prompts</h1>
        {!isAddingPrompt && (
          <Button 
            onClick={() => setIsAddingPrompt(true)} 
            data-add-button="true"
            className="hidden md:inline-flex"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Add New Prompt
          </Button>
        )}
      </div>
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-md">
          {success}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      {/* Add/Edit Prompt Form */}
      {isAddingPrompt && (
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {isEditingPrompt ? 'Edit Prompt' : 'Add New Prompt'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Enter prompt title"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content
              </label>
              <textarea
                name="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm 
                  focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-200"
                rows={8}
                placeholder="Enter prompt content"
                required
              ></textarea>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button type="submit" loading={submitting}>
                {isEditingPrompt ? 'Update Prompt' : 'Add Prompt'}
              </Button>
            </div>
          </form>
        </Card>
      )}
      
      {/* Prompts List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading prompts...</p>
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No prompts found. Create your first prompt!</p>
          {!isAddingPrompt && (
            <Button 
              onClick={() => setIsAddingPrompt(true)} 
              className="mt-4"
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              Add New Prompt
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {prompts.map((prompt) => (
            <Card key={prompt.id} className="hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{prompt.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-wrap">{prompt.content}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Created: {formatDate(prompt.created_at)}
                    {prompt.updated_at !== prompt.created_at && 
                      ` • Updated: ${formatDate(prompt.updated_at)}`}
                  </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-start space-x-2">
                  <button
                    className="text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 py-1 px-3 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center"
                    onClick={() => handleEditPrompt(prompt)}
                    title="Edit prompt"
                  >
                    <PencilSquareIcon className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    className="text-sm bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 py-1 px-3 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center"
                    onClick={() => handleDeletePrompt(prompt.id)}
                    title="Delete prompt"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
} 