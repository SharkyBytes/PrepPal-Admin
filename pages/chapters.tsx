import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import AddExamModal from '../components/books/AddExamModal';
import AddSubjectModal from '../components/books/AddSubjectModal';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

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
        const fileName = `${Date.now()}_${pdfFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('chapters') // Updated bucket name
          .upload(fileName, pdfFile);
        
        if (uploadError) throw uploadError;
        
        // Get public URL for the PDF
        const { data: urlData } = supabase.storage
          .from('chapters') // Updated bucket name
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
        <Button onClick={() => setIsAddingChapter(!isAddingChapter)}>
          {isAddingChapter ? 'Cancel' : 'Add New Chapter'}
        </Button>
      </div>
      
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
      
      {/* Add Chapter Form */}
      {isAddingChapter && (
        <Card className="mb-6">
          <h2 className="text-xl font-bold mb-4">Add New Chapter</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-md text-sm">
              {success}
            </div>
          )}
          
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
                Add Chapter
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
                    className="text-sm bg-gray-100 text-gray-700 py-1 px-3 rounded-full hover:bg-gray-200"
                    onClick={() => {
                      // Handle edit in a future implementation
                      alert('Edit functionality will be added here');
                    }}
                  >
                    Edit
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