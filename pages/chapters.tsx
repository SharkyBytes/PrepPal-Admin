import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import AddExamModal from '../components/books/AddExamModal';
import AddSubjectModal from '../components/books/AddSubjectModal';
import { PlusCircleIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

// Define types for our data
interface Exam {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  exam_id: string;
  exams: {
    name: string;
  };
}

interface Chapter {
  id: string;
  name: string;
  description?: string;
  order?: number;
  subject_id: string;
  pdf_url?: string;
  subjects: {
    name: string;
    exam_id: string;
    exams: {
      name: string;
    };
  };
}

export default function ChaptersPage() {
  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  
  // New chapter form state
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapter, setNewChapter] = useState({
    name: '',
    description: '',
    order: '',
    subject_id: '',
    exam_id: '', // Added exam_id for form handling
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Edit chapter state
  const [isEditingChapter, setIsEditingChapter] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal states for adding exam and subject
  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [selectedExamForSubject, setSelectedExamForSubject] = useState<{id: string, name: string} | null>(null);
  
  // Auth check and data loading
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.href = '/login';
        return;
      }

      // Check if storage bucket exists, create it if not
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(bucket => bucket.name === 'chapters');
        
        if (!bucketExists) {
          await supabase.storage.createBucket('chapters', {
            public: true,
            fileSizeLimit: 10485760 // 10MB
          });
        }
      } catch (error) {
        console.error('Error checking/creating storage bucket:', error);
      }

      await fetchData();
    };

    checkAuth();
  }, []);

  // Fetch all required data
  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Fetch exams
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .order('name');
      
      if (examsError) throw examsError;
      
      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*, exams:exam_id(name)')
        .order('name');
      
      if (subjectsError) throw subjectsError;
      
      // Fetch chapters
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*, subjects:subject_id(name, exam_id, exams:exam_id(name))')
        .order('order');
      
      if (chaptersError) throw chaptersError;
      
      setExams(examsData || []);
      setSubjects(subjectsData || []);
      setChapters(chaptersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter subjects based on selected exam
  useEffect(() => {
    if (selectedExam) {
      const filtered = subjects.filter(subject => subject.exam_id === selectedExam);
      setFilteredSubjects(filtered);
    } else {
      setFilteredSubjects(subjects);
    }
    
    // Reset selected subject if it's not in the filtered list
    if (selectedExam && selectedSubject) {
      const subjectExists = subjects.some(
        s => s.id === selectedSubject && s.exam_id === selectedExam
      );
      
      if (!subjectExists) {
        setSelectedSubject('');
      }
    }
  }, [selectedExam, subjects, selectedSubject]);
  
  // Filter chapters based on selections
  const filteredChapters = chapters.filter(chapter => {
    if (selectedSubject) {
      return chapter.subject_id === selectedSubject;
    }
    if (selectedExam) {
      return chapter.subjects?.exam_id === selectedExam;
    }
    return true;
  });
  
  // Handle edit chapter
  const handleEditChapter = (chapter: Chapter) => {
    // Find the exam id from the chapter's subject
    const examId = chapter.subjects?.exam_id || '';
    
    setEditingChapterId(chapter.id);
    setNewChapter({
      name: chapter.name,
      description: chapter.description || '',
      order: chapter.order?.toString() || '',
      subject_id: chapter.subject_id,
      exam_id: examId,
    });
    setIsAddingChapter(true);
    setIsEditingChapter(true);
    
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Handle chapter deletion
  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Print the files in the bucket to debug
      try {
        console.log('Listing files in chapters bucket:');
        const { data: listData, error: listError } = await supabase
          .storage
          .from('chapters')
          .list();
        
        if (listError) {
          console.error('Error listing bucket contents:', listError);
        } else {
          console.log('Bucket files:', listData);
        }
      } catch (listError) {
        console.error('Error checking bucket:', listError);
      }
      
      const chapter = chapters.find(c => c.id === chapterId);
      
      // Delete PDF file if it exists
      if (chapter && chapter.pdf_url) {
        try {
          console.log(`Found PDF URL to delete: ${chapter.pdf_url}`);
          
          // Extract just the filename from the URL
          const url = new URL(chapter.pdf_url);
          console.log(`Parsed URL: ${url.toString()}`);
          console.log(`Pathname: ${url.pathname}`);
          
          // Method 1: Get the last segment of the URL path
          const pathname = url.pathname;
          const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
          console.log(`Method 1 extracted filename: ${filename}`);
          
          // Method 2: Try extracting the full path after storage/v1/object/public/
          let fullPath: string | null = null;
          const pathParts = url.pathname.split('/storage/v1/object/public/');
          if (pathParts.length > 1) {
            fullPath = pathParts[1];
            console.log(`Method 2 extracted path: ${fullPath}`);
            
            // Method 2 might include the bucket name, try to remove it
            if (fullPath && fullPath.startsWith('chapters/')) {
              fullPath = fullPath.substring('chapters/'.length);
              console.log(`Method 2 corrected path: ${fullPath}`);
            }
          }
          
          let deleteSuccess = false;
          
          // Try Method 1 first
          if (filename) {
            try {
              console.log(`Attempting to remove file using Method 1: ${filename}`);
              
              const { data, error: deleteError } = await supabase.storage
                .from('chapters')
                .remove([filename]);
                
              console.log(`Method 1 - Remove response:`, data);
              
              if (deleteError) {
                console.error('Method 1 - Error deleting PDF file:', deleteError);
              } else {
                console.log(`Method 1 - Successfully deleted PDF file: ${filename}`);
                deleteSuccess = true;
              }
            } catch (storageError) {
              console.error('Method 1 - Storage deletion error:', storageError);
            }
          }
          
          // If Method 1 fails, try Method 2
          if (!deleteSuccess && fullPath) {
            try {
              console.log(`Attempting to remove file using Method 2: ${fullPath}`);
              
              const { data, error: deleteError } = await supabase.storage
                .from('chapters')
                .remove([fullPath]);
                
              console.log(`Method 2 - Remove response:`, data);
              
              if (deleteError) {
                console.error('Method 2 - Error deleting PDF file:', deleteError);
                
                // Try SQL-style filename (just the exact filename without path)
                console.log(`Attempting direct filename query from URL: ${chapter.pdf_url}`);
                const directFilename = chapter.pdf_url.split('/').pop();
                if (directFilename) {
                  console.log(`Attempting with direct filename: ${directFilename}`);
                  
                  const { data, error: directError } = await supabase.storage
                    .from('chapters')
                    .remove([directFilename]);
                    
                  if (directError) {
                    console.error('Direct filename - Error deleting PDF file:', directError);
                  } else {
                    console.log(`Direct filename - Successfully deleted: ${directFilename}`);
                    deleteSuccess = true;
                  }
                }
              } else {
                console.log(`Method 2 - Successfully deleted PDF file: ${fullPath}`);
                deleteSuccess = true;
              }
            } catch (storageError) {
              console.error('Method 2 - Storage deletion error:', storageError);
            }
          }
          
          if (!deleteSuccess) {
            console.warn('Failed to delete PDF file with all methods');
          }
        } catch (urlError) {
          console.error('Error parsing PDF URL:', urlError, chapter.pdf_url);
        }
      } else {
        console.log('No PDF URL found for this chapter');
      }
      
      // Delete the chapter record
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId);
      
      if (error) throw error;
      
      // Update local state
      setChapters(chapters.filter(c => c.id !== chapterId));
      setSuccess('Chapter deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting chapter:', error);
      setError('Failed to delete chapter. Please try again.');
    } finally {
      setIsDeleting(false);
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

  // Update existing chapter
  const updateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploading(true);
    
    try {
      // Validate required fields
      if (!newChapter.name || !newChapter.subject_id) {
        throw new Error('Name and Subject are required');
      }
      
      // Prepare update data
      const updateData: any = {
        name: newChapter.name,
        description: newChapter.description,
        subject_id: newChapter.subject_id,
      };
      
      // Only include order if provided
      if (newChapter.order) {
        updateData.order = parseInt(newChapter.order);
      }
      
      // Update the PDF file if a new one is provided
      if (pdfFile) {
        // Get the existing chapter to check if it has a PDF
        const existingChapter = chapters.find(c => c.id === editingChapterId);
        
        // If there's an existing PDF, delete it
        if (existingChapter?.pdf_url) {
          // Extract just the filename from the URL
          const url = new URL(existingChapter.pdf_url);
          const pathname = url.pathname;
          const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
          
          console.log(`Attempting to delete previous PDF file: ${filename}`);
          
          if (filename) {
            try {
              const { error: deleteError } = await supabase.storage
                .from('chapters')
                .remove([filename]);
                
              if (deleteError) {
                console.error('Error deleting previous PDF file:', deleteError);
              } else {
                console.log(`Successfully deleted previous PDF file: ${filename} from chapters bucket`);
              }
            } catch (storageError) {
              console.error('Storage deletion error:', storageError);
            }
          }
        }
        
        // Upload the new PDF with sanitized filename
        const sanitizedName = sanitizeFilename(pdfFile.name);
        const fileName = `${Date.now()}_${sanitizedName}`;
        
        console.log(`Original filename: ${pdfFile.name}`);
        console.log(`Sanitized filename: ${sanitizedName}`);
        console.log(`Final filename for upload: ${fileName}`);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chapters')
          .upload(fileName, pdfFile);
        
        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data: urlData } = await supabase.storage
          .from('chapters')
          .getPublicUrl(fileName);
        
        updateData.pdf_url = urlData.publicUrl;
      }
      
      // Update the chapter in the database
      const { data: chapterData, error: chapterError } = await supabase
        .from('chapters')
        .update(updateData)
        .eq('id', editingChapterId)
        .select('*, subjects:subject_id(name, exam_id, exams:exam_id(name))')
        .single();
      
      if (chapterError) throw chapterError;
      
      // Update local state
      setChapters(chapters.map(c => c.id === editingChapterId ? chapterData : c));
      
      // Reset form
      setNewChapter({
        name: '',
        description: '',
        order: '',
        subject_id: '',
        exam_id: '',
      });
      setPdfFile(null);
      setIsAddingChapter(false);
      setIsEditingChapter(false);
      setEditingChapterId(null);
      
      setSuccess('Chapter updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating chapter:', error);
      setError('Failed to update chapter. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewChapter({ ...newChapter, [name]: value });
    
    // When exam changes, reset subject
    if (name === 'exam_id') {
      setNewChapter(prev => ({ ...prev, subject_id: '', [name]: value }));
    }
  };
  
  // Get filtered subjects for the form based on selected exam
  const getFormSubjects = () => {
    if (!newChapter.exam_id) return [];
    return subjects.filter(subject => subject.exam_id === newChapter.exam_id);
  };
  
  // Handle file input
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      setError('Please upload a PDF file');
      setPdfFile(null);
      e.target.value = null;
    }
  };

  // Handle new exam added
  const handleExamAdded = (exam) => {
    setExams(prev => [...prev, exam]);
    setNewChapter(prev => ({ ...prev, exam_id: exam.id }));
  };

  // Handle new subject added
  const handleSubjectAdded = (subject) => {
    setSubjects(prev => [...prev, subject]);
    setNewChapter(prev => ({ ...prev, subject_id: subject.id }));
  };

  // Open add subject modal
  const openAddSubjectModal = () => {
    const selectedExam = exams.find(e => e.id === newChapter.exam_id);
    if (selectedExam) {
      setSelectedExamForSubject({
        id: selectedExam.id,
        name: selectedExam.name
      });
      setIsAddSubjectModalOpen(true);
    } else {
      setError('Please select an exam first before adding a subject');
    }
  };
  
  // Submit new chapter
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If editing, call the update function instead
    if (isEditingChapter) {
      return updateChapter(e);
    }
    
    setError('');
    setSuccess('');
    setUploading(true);
    
    try {
      // Validate required fields
      if (!newChapter.name || !newChapter.subject_id) {
        throw new Error('Name and Subject are required');
      }
      
      // Create chapter record
      const { data: chapterData, error: chapterError } = await supabase
        .from('chapters')
        .insert({
          name: newChapter.name,
          description: newChapter.description,
          order: newChapter.order ? parseInt(newChapter.order) : null,
          subject_id: newChapter.subject_id,
        })
        .select()
        .single();
      
      if (chapterError) throw chapterError;
      
      // Upload PDF if provided
      if (pdfFile && chapterData) {
        // Sanitize the filename before uploading
        const sanitizedName = sanitizeFilename(pdfFile.name);
        const fileName = `${Date.now()}_${sanitizedName}`;
        
        console.log(`Original filename: ${pdfFile.name}`);
        console.log(`Sanitized filename: ${sanitizedName}`);
        console.log(`Final filename for upload: ${fileName}`);
        
        const { error: uploadError } = await supabase.storage
          .from('chapters')
          .upload(fileName, pdfFile);
        
        if (uploadError) throw uploadError;
        
        // Get public URL for the PDF
        const { data: urlData } = supabase.storage
          .from('chapters')
          .getPublicUrl(fileName);
          
        // Update chapter with PDF URL
        const { error: updateError } = await supabase
          .from('chapters')
          .update({ pdf_url: urlData.publicUrl })
          .eq('id', chapterData.id);
          
        if (updateError) throw updateError;
      }
      
      // Reset form and refresh data
      setSuccess('Chapter added successfully!');
      setNewChapter({ name: '', description: '', order: '', subject_id: '', exam_id: '' });
      setPdfFile(null);
      setIsAddingChapter(false);
      
      // Refresh chapters list
      await fetchData();
      
    } catch (error) {
      console.error('Error adding chapter:', error);
      setError(error.message || 'Failed to add chapter');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Layout>
      <Head>
        <title>Chapters | PrepPal Admin</title>
      </Head>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Chapters</h1>
        {!isAddingChapter && (
          <Button onClick={() => setIsAddingChapter(true)}>
            Add New Chapter
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
      
      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Exam
            </label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={selectedExam}
              onChange={(e) => {
                setSelectedExam(e.target.value);
                setSelectedSubject('');
              }}
            >
              <option value="">All Exams</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Subject
            </label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedExam}
            >
              <option value="">All Subjects</option>
              {filteredSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>
      
      {/* Add/Edit Chapter Form */}
      {isAddingChapter && (
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {isEditingChapter ? 'Edit Chapter' : 'Add New Chapter'}
            </h2>
            <button
              onClick={() => {
                setIsAddingChapter(false);
                setIsEditingChapter(false);
                setEditingChapterId(null);
                setNewChapter({
                  name: '',
                  description: '',
                  order: '',
                  subject_id: '',
                  exam_id: '',
                });
                setPdfFile(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Chapter Name"
              name="name"
              value={newChapter.name}
              onChange={handleInputChange}
              required
              placeholder="Enter chapter name"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={newChapter.description}
                onChange={handleInputChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                rows={3}
                placeholder="Enter chapter description"
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Display Order"
                name="order"
                type="number"
                value={newChapter.order}
                onChange={handleInputChange}
                placeholder="e.g. 1, 2, 3..."
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam (Required)
                </label>
                <div className="flex gap-2">
                  <select
                    name="exam_id"
                    value={newChapter.exam_id}
                    onChange={handleInputChange}
                    required
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">Select an Exam</option>
                    {exams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddExamModalOpen(true)}
                    className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md p-2 text-gray-700"
                    title="Add New Exam"
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject (Required)
                </label>
                <div className="flex gap-2">
                  <select
                    name="subject_id"
                    value={newChapter.subject_id}
                    onChange={handleInputChange}
                    required
                    disabled={!newChapter.exam_id}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="">Select a Subject</option>
                    {getFormSubjects().map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={openAddSubjectModal}
                    className={`flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md p-2 text-gray-700 ${!newChapter.exam_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Add New Subject"
                    disabled={!newChapter.exam_id}
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                  </button>
                </div>
                {!newChapter.exam_id && (
                  <p className="mt-1 text-xs text-amber-600">
                    Select an exam first
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chapter PDF (Optional)
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3"
              />
              <p className="mt-1 text-xs text-gray-500">
                Upload a PDF file for this chapter content
              </p>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button type="submit" loading={uploading}>
                {isEditingChapter ? 'Update Chapter' : 'Add Chapter'}
              </Button>
            </div>
          </form>
        </Card>
      )}
      
      {/* Chapters List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading chapters...</p>
        </div>
      ) : filteredChapters.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No chapters found. Add your first chapter!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredChapters.map((chapter) => (
            <Card key={chapter.id} className="hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{chapter.name}</h3>
                  {chapter.description && (
                    <p className="text-sm text-gray-600 mt-1">{chapter.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Subject: {chapter.subjects.name} | Exam: {chapter.subjects.exams.name}
                  </p>
                  {chapter.order && (
                    <p className="text-xs text-gray-500">Order: {chapter.order}</p>
                  )}
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-2">
                  {chapter.pdf_url && (
                    <a
                      href={chapter.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm bg-blue-50 text-blue-700 py-1 px-3 rounded-full hover:bg-blue-100"
                    >
                      View PDF
                    </a>
                  )}
                  <button
                    className="text-sm bg-gray-100 text-gray-700 py-1 px-3 rounded-full hover:bg-gray-200 flex items-center"
                    onClick={() => handleEditChapter(chapter)}
                    title="Edit chapter"
                  >
                    <PencilSquareIcon className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    className="text-sm bg-red-50 text-red-700 py-1 px-3 rounded-full hover:bg-red-100 flex items-center"
                    onClick={() => handleDeleteChapter(chapter.id)}
                    disabled={isDeleting}
                    title="Delete chapter"
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
      
      {/* Add Exam Modal */}
      <AddExamModal
        isOpen={isAddExamModalOpen}
        onClose={() => setIsAddExamModalOpen(false)}
        onExamAdded={handleExamAdded}
      />
      
      {/* Add Subject Modal */}
      {selectedExamForSubject && (
        <AddSubjectModal
          isOpen={isAddSubjectModalOpen}
          onClose={() => setIsAddSubjectModalOpen(false)}
          examId={selectedExamForSubject.id}
          examName={selectedExamForSubject.name}
          onSubjectAdded={handleSubjectAdded}
        />
      )}
    </Layout>
  );
} 