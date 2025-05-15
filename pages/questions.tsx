import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';

// Define types for our data
interface Exam {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  exam_id: string;
}

interface Chapter {
  id: string;
  name: string;
  subject_id: string;
}

interface Question {
  id?: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explaination: string;
  chapter_id?: string;
  chapters?: {
    id: string;
    name: string;
    subject_id: string;
    subjects: {
      id: string;
      name: string;
      exam_id: string;
      exams: {
        id: string;
        name: string;
      }
    }
  };
}

export default function QuestionsPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'add' | 'preview'>('add');
  
  // Shared state between tabs
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Add Questions tab state
  const [submitting, setSubmitting] = useState(false);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [filteredChapters, setFilteredChapters] = useState<Chapter[]>([]);
  
  // Preview Questions tab state
  const [previewExam, setPreviewExam] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [previewChapter, setPreviewChapter] = useState('');
  const [previewFilteredSubjects, setPreviewFilteredSubjects] = useState<Subject[]>([]);
  const [previewFilteredChapters, setPreviewFilteredChapters] = useState<Chapter[]>([]);
  const [savedQuestions, setSavedQuestions] = useState<Question[]>([]);
  const [loadingSavedQuestions, setLoadingSavedQuestions] = useState(false);

  // Default JSON example for placeholder
  const defaultJsonExample = `[
  {
    "question_text": "स्रोत के पहले पृष्ठ पर उल्लिखित जनवरी 2025 से जनवरी 2026 तक के राजस्थान समसामयिकी के वर्गीकरण में 'ग्रेड II' और 'ग्रेड III' के साथ और किन दो श्रेणियों का उल्लेख किया गया है?",
    "option_a": "AP और RP",
    "option_b": "AP और अन्य",
    "option_c": "SP और अन्य",
    "option_d": "ग्रेड I और AP",
    "correct_option": "B",
    "explaination": "यह विकल्प स्रोत के अनुसार सही है।"
  },
  {
    "question_text": "स्रोत के अनुसार 'अभी नहीं अभियान' का आयोजन किस संस्था द्वारा किया जा रहा है?",
    "option_a": "महिला अधिकारिता विभाग",
    "option_b": "जिला विधिक सेवा प्राधिकरण, जयपुर",
    "option_c": "राजस्थान राज्य विधिक सेवा प्राधिकरण (RSLSA)",
    "option_d": "बाल अधिकार संरक्षण आयोग",
    "correct_option": "C",
    "explaination": "RSLSA ने इस अभियान का आयोजन किया है।"
  }
]`;

  // Fetch data on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.href = '/login';
        return;
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
        .select('*')
        .order('name');
      
      if (subjectsError) throw subjectsError;
      
      // Fetch chapters
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .order('name');
      
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

  // Filter subjects based on selected exam - Add tab
  useEffect(() => {
    if (selectedExam) {
      const filtered = subjects.filter(subject => subject.exam_id === selectedExam);
      setFilteredSubjects(filtered);
    } else {
      setFilteredSubjects([]);
    }
    
    // Reset selected subject when exam changes
    setSelectedSubject('');
    setSelectedChapter('');
  }, [selectedExam, subjects]);

  // Filter chapters based on selected subject - Add tab
  useEffect(() => {
    if (selectedSubject) {
      const filtered = chapters.filter(chapter => chapter.subject_id === selectedSubject);
      setFilteredChapters(filtered);
    } else {
      setFilteredChapters([]);
    }
    
    // Reset selected chapter when subject changes
    setSelectedChapter('');
  }, [selectedSubject, chapters]);
  
  // Filter subjects based on selected exam - Preview tab
  useEffect(() => {
    if (previewExam) {
      const filtered = subjects.filter(subject => subject.exam_id === previewExam);
      setPreviewFilteredSubjects(filtered);
    } else {
      setPreviewFilteredSubjects([]);
    }
    
    // Reset selected subject when exam changes
    setPreviewSubject('');
    setPreviewChapter('');
  }, [previewExam, subjects]);

  // Filter chapters based on selected subject - Preview tab
  useEffect(() => {
    if (previewSubject) {
      const filtered = chapters.filter(chapter => chapter.subject_id === previewSubject);
      setPreviewFilteredChapters(filtered);
    } else {
      setPreviewFilteredChapters([]);
    }
    
    // Reset selected chapter when subject changes
    setPreviewChapter('');
  }, [previewSubject, chapters]);
  
  // Fetch saved questions when filters change in Preview tab
  useEffect(() => {
    if (activeTab === 'preview') {
      fetchSavedQuestions();
    }
  }, [activeTab, previewChapter, previewSubject, previewExam]);
  
  // Fetch saved questions based on filters
  const fetchSavedQuestions = async () => {
    setLoadingSavedQuestions(true);
    setSavedQuestions([]);
    
    try {
      let query = supabase.from('questions').select(`
        *,
        chapters:chapter_id (
          id,
          name,
          subject_id,
          subjects:subject_id (
            id,
            name,
            exam_id,
            exams:exam_id (
              id,
              name
            )
          )
        )
      `);
      
      // Apply filters
      if (previewChapter) {
        query = query.eq('chapter_id', previewChapter);
      } else if (previewSubject) {
        query = query.eq('chapters.subject_id', previewSubject);
      } else if (previewExam) {
        query = query.eq('chapters.subjects.exam_id', previewExam);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Process the data
      setSavedQuestions(data || []);
    } catch (error) {
      console.error('Error fetching saved questions:', error);
      setError('Failed to load saved questions.');
    } finally {
      setLoadingSavedQuestions(false);
    }
  };

  const handleParseJson = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // Parse JSON input
      const parsedQuestions = JSON.parse(jsonInput);
      
      // Validate input format
      if (!Array.isArray(parsedQuestions)) {
        throw new Error('Input must be a JSON array');
      }
      
      // Validate each question object has the required fields
      for (const question of parsedQuestions) {
        if (!question.question_text || 
            !question.option_a || 
            !question.option_b || 
            !question.option_c || 
            !question.option_d || 
            !question.correct_option) {
          throw new Error('All questions must have question text, options A-D, and correct option');
        }
      }
      
      // Set questions data
      setQuestions(parsedQuestions);
      setSuccess('Questions parsed successfully');
    } catch (error) {
      console.error('Error parsing JSON:', error);
      setError(error.message || 'Invalid JSON format');
    }
  };

  const handleSubmitQuestions = async () => {
    // Validate selections
    if (!selectedChapter) {
      setError('Please select a chapter before submitting questions');
      return;
    }

    if (questions.length === 0) {
      setError('Please parse questions before submitting');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Prepare questions with chapter_id
      const questionsToInsert = questions.map(q => ({
        chapter_id: selectedChapter,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option,
        explaination: q.explaination || null
      }));
      
      // Insert questions into database
      const { data, error: insertError } = await supabase
        .from('questions')
        .insert(questionsToInsert)
        .select();
      
      if (insertError) throw insertError;
      
      setSuccess(`Successfully saved ${questionsToInsert.length} questions to the database`);
      
      // Clear form
      setQuestions([]);
      setJsonInput('');
    } catch (error) {
      console.error('Error saving questions:', error);
      setError('Failed to save questions: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderAddQuestionsTab = () => {
    return (
      <>
        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Exam
              </label>
              <select
                className="w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm 
                  focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-200"
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
              >
                <option value="">Select an Exam</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Subject
              </label>
              <select
                className="w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm 
                  focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-200
                  disabled:bg-gray-100 disabled:dark:bg-gray-900"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedExam}
              >
                <option value="">Select a Subject</option>
                {filteredSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Chapter
              </label>
              <select
                className="w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm 
                  focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-200
                  disabled:bg-gray-100 disabled:dark:bg-gray-900"
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                disabled={!selectedSubject}
              >
                <option value="">Select a Chapter</option>
                {filteredChapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
        
        {/* JSON Input Form */}
        <Card className="mb-6">
          <form onSubmit={handleParseJson}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Paste JSON Questions Array
                <button 
                  type="button" 
                  onClick={() => {
                    navigator.clipboard.writeText(defaultJsonExample);
                    setSuccess('Example copied to clipboard!');
                    setTimeout(() => setSuccess(''), 2000);
                  }} 
                  className="ml-2 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                >
                  Copy Example
                </button>
              </label>
              <div className="relative">
                <textarea
                  className="w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm
                    focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-200"
                  rows={10}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste your JSON questions array here..."
                ></textarea>
                <button
                  type="button"
                  onClick={() => {
                    setJsonInput(defaultJsonExample);
                    setSuccess('Example loaded to input field!');
                    setTimeout(() => setSuccess(''), 2000);
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                >
                  Use Example
                </button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit">
                Parse Questions
              </Button>
            </div>
          </form>
        </Card>
        
        {/* Questions Table */}
        {questions.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Parsed Questions</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Question</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Option A</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Option B</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Option C</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Option D</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Correct</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Explanation</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {questions.map((question, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 dark:text-gray-100">{question.question_text}</td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 dark:text-gray-100">{question.option_a}</td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 dark:text-gray-100">{question.option_b}</td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 dark:text-gray-100">{question.option_c}</td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 dark:text-gray-100">{question.option_d}</td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 dark:text-gray-100">{question.correct_option}</td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 dark:text-gray-100">{question.explaination}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-6">
              <Button 
                onClick={handleSubmitQuestions}
                loading={submitting}
                disabled={!selectedChapter || submitting}
                className={!selectedChapter ? 'opacity-70 cursor-not-allowed' : ''}
              >
                Submit Questions to Database
              </Button>
            </div>
          </Card>
        )}
      </>
    );
  };
  
  const renderPreviewQuestionsTab = () => {
    return (
      <>
        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Exam
              </label>
              <select
                className="w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm 
                  focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-200"
                value={previewExam}
                onChange={(e) => setPreviewExam(e.target.value)}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Subject
              </label>
              <select
                className="w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm 
                  focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-200
                  disabled:bg-gray-100 disabled:dark:bg-gray-900"
                value={previewSubject}
                onChange={(e) => setPreviewSubject(e.target.value)}
                disabled={!previewExam}
              >
                <option value="">All Subjects</option>
                {previewFilteredSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Chapter
              </label>
              <select
                className="w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm 
                  focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-200
                  disabled:bg-gray-100 disabled:dark:bg-gray-900"
                value={previewChapter}
                onChange={(e) => setPreviewChapter(e.target.value)}
                disabled={!previewSubject}
              >
                <option value="">All Chapters</option>
                {previewFilteredChapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
        
        {/* Questions Table */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Saved Questions</h2>
          {loadingSavedQuestions ? (
            <div className="py-8 text-center text-gray-500">Loading questions...</div>
          ) : savedQuestions.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No questions found with the selected filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Chapter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Question</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Option A</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Option B</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Option C</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Option D</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Correct</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Explanation</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {savedQuestions.map((question) => (
                    <tr key={question.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 dark:text-gray-100">
                        {question.chapters?.name || 'Unknown Chapter'}
                      </td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 dark:text-gray-100">{question.question_text}</td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 dark:text-gray-100">{question.option_a}</td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 dark:text-gray-100">{question.option_b}</td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 dark:text-gray-100">{question.option_c}</td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 dark:text-gray-100">{question.option_d}</td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 dark:text-gray-100">{question.correct_option}</td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 dark:text-gray-100">{question.explaination}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </>
    );
  };

  return (
    <Layout>
      <Head>
        <title>Questions | PrepPal Admin</title>
      </Head>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Questions</h1>
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
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('add')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'add'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Add Questions
          </button>
          <button
            onClick={() => {
              setActiveTab('preview');
              fetchSavedQuestions();
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preview'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Preview Questions
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'add' && renderAddQuestionsTab()}
          {activeTab === 'preview' && renderPreviewQuestionsTab()}
        </>
      )}
    </Layout>
  );
} 