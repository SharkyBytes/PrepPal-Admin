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

interface Book {
  id: string;
  title: string;
  author: string;
  link?: string;
  pdf_url?: string;
  subject_id: string;
  subjects: {
    name: string;
    exam_id: string;
    exams: {
      name: string;
    };
  };
}

export default function BooksPage() {
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  
  // New book form state
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    link: '',
    subject_id: '',
    exam_id: '',
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
        const bucketExists = buckets?.some(bucket => bucket.name === 'books');
        
        if (!bucketExists) {
          await supabase.storage.createBucket('books', {
            public: true,
            fileSizeLimit: 20971520 // 20MB
          });
        }
      } catch (error) {
        console.error('Error checking/creating storage bucket:', error);
        // If bucket creation fails, try to continue anyway
        // The bucket might already exist or need to be created manually
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
      
      // Fetch books
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('*, subjects:subject_id(name, exam_id, exams:exam_id(name))')
        .order('title');
      
      if (booksError) throw booksError;
      
      setExams(examsData || []);
      setSubjects(subjectsData || []);
      setBooks(booksData || []);
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
  
  // Filter books based on selections
  const filteredBooks = books.filter(book => {
    if (selectedSubject) {
      return book.subject_id === selectedSubject;
    }
    if (selectedExam) {
      return book.subjects?.exam_id === selectedExam;
    }
    return true;
  });
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBook({ ...newBook, [name]: value });
    
    // When exam changes, reset subject
    if (name === 'exam_id') {
      setNewBook(prev => ({ ...prev, subject_id: '', [name]: value }));
    }
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
  
  // Get filtered subjects for the form based on selected exam
  const getFormSubjects = () => {
    if (!newBook.exam_id) return [];
    return subjects.filter(subject => subject.exam_id === newBook.exam_id);
  };

  // Handle new exam added
  const handleExamAdded = (exam) => {
    setExams(prev => [...prev, exam]);
    setNewBook(prev => ({ ...prev, exam_id: exam.id }));
  };

  // Handle new subject added
  const handleSubjectAdded = (subject) => {
    setSubjects(prev => [...prev, subject]);
    setNewBook(prev => ({ ...prev, subject_id: subject.id }));
  };

  // Open add subject modal
  const openAddSubjectModal = () => {
    const selectedExam = exams.find(e => e.id === newBook.exam_id);
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
  
  // Submit new book
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploading(true);
    
    try {
      // Validate required fields
      if (!newBook.title || !newBook.author || !newBook.subject_id || !newBook.exam_id) {
        throw new Error('Title, Author, Exam and Subject are required');
      }
      
      // Create book record
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .insert({
          title: newBook.title,
          author: newBook.author,
          link: newBook.link || null,
          subject_id: newBook.subject_id,
        })
        .select()
        .single();
      
      if (bookError) throw bookError;
      
      // Upload PDF if provided
      if (pdfFile && bookData) {
        const fileName = `${Date.now()}_${pdfFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('books')
          .upload(fileName, pdfFile);
        
        if (uploadError) throw uploadError;
        
        // Get public URL for the PDF
        const { data: urlData } = supabase.storage
          .from('books')
          .getPublicUrl(fileName);
          
        // Update book with PDF URL
        const { error: updateError } = await supabase
          .from('books')
          .update({ pdf_url: urlData.publicUrl })
          .eq('id', bookData.id);
          
        if (updateError) throw updateError;
      }
      
      // Reset form and refresh data
      setSuccess('Book added successfully!');
      setNewBook({ title: '', author: '', link: '', subject_id: '', exam_id: '' });
      setPdfFile(null);
      setIsAddingBook(false);
      
      // Refresh books list
      await fetchData();
      
    } catch (error) {
      console.error('Error adding book:', error);
      setError(error.message || 'Failed to add book');
    } finally {
      setUploading(false);
    }
  }
  
  return (
    <Layout>
      <Head>
        <title>Books | PrepPal Admin</title>
      </Head>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Books</h1>
        <Button onClick={() => setIsAddingBook(!isAddingBook)}>
          {isAddingBook ? 'Cancel' : 'Add New Book'}
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
      
      {/* Add Book Form */}
      {isAddingBook && (
        <Card className="mb-6">
          <h2 className="text-xl font-bold mb-4">Add New Book</h2>
          
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
              label="Book Title"
              name="title"
              value={newBook.title}
              onChange={handleInputChange}
              required
              placeholder="Enter book title"
            />
            
            <Input
              label="Author"
              name="author"
              value={newBook.author}
              onChange={handleInputChange}
              required
              placeholder="Enter author name"
            />
            
            <Input
              label="External Link (Optional)"
              name="link"
              value={newBook.link}
              onChange={handleInputChange}
              placeholder="E.g., Amazon link or publisher website"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam (Required)
                </label>
                <div className="flex gap-2">
                  <select
                    name="exam_id"
                    value={newBook.exam_id}
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
                    value={newBook.subject_id}
                    onChange={handleInputChange}
                    required
                    disabled={!newBook.exam_id}
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
                    className={`flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md p-2 text-gray-700 ${!newBook.exam_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Add New Subject"
                    disabled={!newBook.exam_id}
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                  </button>
                </div>
                {!newBook.exam_id && (
                  <p className="mt-1 text-xs text-amber-600">
                    Select an exam first
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Book PDF (Optional)
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3"
              />
              <p className="mt-1 text-xs text-gray-500">
                Upload a PDF version of the book if available
              </p>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button type="submit" loading={uploading}>
                Add Book
              </Button>
            </div>
          </form>
        </Card>
      )}
      
      {/* Books List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading books...</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No books found. Add your first book!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="hover:shadow-md transition-shadow">
              <div className="flex flex-col h-full">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{book.title}</h3>
                  <p className="text-sm text-gray-600">by {book.author}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Subject: {book.subjects.name} | Exam: {book.subjects.exams.name}
                  </p>
                </div>
                
                <div className="flex mt-auto pt-4 gap-2">
                  {book.link && (
                    <a
                      href={book.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm bg-gray-100 text-gray-700 py-1 px-3 rounded-full hover:bg-gray-200"
                    >
                      Visit Link
                    </a>
                  )}
                  
                  {book.pdf_url && (
                    <a
                      href={book.pdf_url}
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