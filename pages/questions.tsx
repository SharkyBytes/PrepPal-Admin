import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { TrashIcon, CheckIcon } from '@heroicons/react/24/outline';

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
  id: string;
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
  
  // Multiple selection state
  const [targetSelections, setTargetSelections] = useState<{
    exam_id: string;
    subject_id: string;
    chapter_id: string;
    filteredSubjects: Subject[];
    filteredChapters: Chapter[];
  }[]>([]);
  
  // Preview Questions tab state with new selections
  const [previewExam, setPreviewExam] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [previewChapter, setPreviewChapter] = useState('');
  const [previewFilteredSubjects, setPreviewFilteredSubjects] = useState<Subject[]>([]);
  const [previewFilteredChapters, setPreviewFilteredChapters] = useState<Chapter[]>([]);
  const [savedQuestions, setSavedQuestions] = useState<Question[]>([]);
  const [loadingSavedQuestions, setLoadingSavedQuestions] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [copyingToClipboard, setCopyingToClipboard] = useState(false);

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
    setSelectedQuestionIds([]);
    setSelectAll(false);
    
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

  // Add current selection to target selections
  const handleAddSelection = () => {
    // Validate that all are selected
    if (!selectedExam || !selectedSubject || !selectedChapter) {
      setError('Please select an exam, subject, and chapter before adding');
      return;
    }

    // Check for duplicates
    const isDuplicate = targetSelections.some(
      selection => selection.chapter_id === selectedChapter
    );

    if (isDuplicate) {
      setError('This chapter selection is already added');
      return;
    }

    // Add new selection
    setTargetSelections([
      ...targetSelections,
      {
        exam_id: selectedExam,
        subject_id: selectedSubject,
        chapter_id: selectedChapter,
        filteredSubjects,
        filteredChapters
      }
    ]);

    // Clear success/error messages
    setSuccess('Target added successfully');
    setTimeout(() => setSuccess(''), 2000);
    setError('');
    
    // Optionally clear selections to make it easier to add another set
    // Comment out the next three lines if you prefer keeping the selections
    setSelectedExam('');
    setSelectedSubject('');
    setSelectedChapter('');
  };

  // Remove a selection
  const handleRemoveSelection = (index: number) => {
    const newSelections = [...targetSelections];
    newSelections.splice(index, 1);
    setTargetSelections(newSelections);
  };

  // Get selection label for display
  const getSelectionLabel = (selection: any) => {
    const exam = exams.find(e => e.id === selection.exam_id);
    const subject = subjects.find(s => s.id === selection.subject_id);
    const chapter = chapters.find(c => c.id === selection.chapter_id);
    
    return `${exam?.name || 'Unknown'} → ${subject?.name || 'Unknown'} → ${chapter?.name || 'Unknown'}`;
  };

  const handleSubmitQuestions = async () => {
    // Check if we have any selections
    if (targetSelections.length === 0 && !selectedChapter) {
      setError('Please select at least one chapter destination for the questions');
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
      // Gather all chapter destinations (including the main one if present)
      const allDestinations = [
        ...targetSelections.map(selection => selection.chapter_id),
        // Include the main selection if it's valid and not already in targets
        ...(selectedChapter && !targetSelections.some(s => s.chapter_id === selectedChapter) 
          ? [selectedChapter] 
          : [])
      ];
      
      if (allDestinations.length === 0) {
        throw new Error('No valid chapter destinations selected');
      }
      
      // Prepare questions for all destinations
      const questionsToInsert = allDestinations.flatMap(chapterId => 
        questions.map(q => ({
          chapter_id: chapterId,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option,
          explaination: q.explaination || null
        }))
      );
      
      // Insert questions into database
      const { data, error: insertError } = await supabase
        .from('questions')
        .insert(questionsToInsert)
        .select();
      
      if (insertError) throw insertError;
      
      setSuccess(`Successfully saved ${questions.length} questions to ${allDestinations.length} chapter destinations`);
      
      // Clear form
      setQuestions([]);
      setJsonInput('');
      setTargetSelections([]);
    } catch (error) {
      console.error('Error saving questions:', error);
      setError('Failed to save questions: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Function to delete a question
  const handleDeleteQuestion = async (questionId: string) => {
    try {
      setLoadingSavedQuestions(true);
      
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);
      
      if (error) throw error;
      
      // Update the UI by removing the deleted question
      setSavedQuestions(prevQuestions => 
        prevQuestions.filter(question => question.id !== questionId)
      );
      
      setSuccess('Question deleted successfully');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      console.error('Error deleting question:', error);
      setError('Failed to delete question');
    } finally {
      setLoadingSavedQuestions(false);
    }
  };

  // Function to handle single question selection
  const handleQuestionSelection = (questionId: string) => {
    setSelectedQuestionIds(prev => {
      // If already selected, remove it
      if (prev.includes(questionId)) {
        const newSelection = prev.filter(id => id !== questionId);
        
        // Update selectAll state if needed
        if (newSelection.length === 0) {
          setSelectAll(false);
        }
        
        return newSelection;
      } 
      // Otherwise add it
      else {
        const newSelection = [...prev, questionId];
        
        // Check if all are selected
        if (newSelection.length === savedQuestions.length) {
          setSelectAll(true);
        }
        
        return newSelection;
      }
    });
  };

  // Function to handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all
      setSelectedQuestionIds([]);
      setSelectAll(false);
    } else {
      // Select all
      const allQuestionIds = savedQuestions.map(q => q.id);
      setSelectedQuestionIds(allQuestionIds);
      setSelectAll(true);
    }
  };

  // Function to copy selected questions as JSON
  const handleCopySelectedQuestionsAsJson = () => {
    if (selectedQuestionIds.length === 0) {
      setError('Please select at least one question to copy');
      return;
    }

    setCopyingToClipboard(true);
    
    try {
      // Get the selected questions
      const selectedQuestions = savedQuestions.filter(q => 
        selectedQuestionIds.includes(q.id)
      );
      
      // Format them for the clipboard
      const formattedQuestions = selectedQuestions.map(q => ({
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option,
        explaination: q.explaination || ""
      }));
      
      // Convert to pretty JSON
      const jsonString = JSON.stringify(formattedQuestions, null, 2);
      
      // Copy to clipboard
      navigator.clipboard.writeText(jsonString).then(() => {
        setSuccess(`Copied ${selectedQuestions.length} questions to clipboard as JSON`);
        setTimeout(() => setSuccess(''), 2000);
      }).catch(err => {
        console.error('Failed to copy to clipboard:', err);
        setError('Failed to copy to clipboard');
      });
    } catch (error) {
      console.error('Error formatting questions for clipboard:', error);
      setError('Failed to format questions for clipboard');
    } finally {
      setCopyingToClipboard(false);
    }
  };

  // Function to handle bulk deletion of selected questions
  const handleDeleteSelectedQuestions = async () => {
    if (selectedQuestionIds.length === 0) {
      setError('Please select at least one question to delete');
      return;
    }

    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete ${selectedQuestionIds.length} selected questions? This action cannot be undone.`)) {
      return;
    }

    setLoadingSavedQuestions(true);
    setError('');
    setSuccess('');
    
    try {
      // Delete all selected questions
      const { error } = await supabase
        .from('questions')
        .delete()
        .in('id', selectedQuestionIds);
      
      if (error) throw error;
      
      // Update the UI by removing the deleted questions
      setSavedQuestions(prevQuestions => 
        prevQuestions.filter(question => !selectedQuestionIds.includes(question.id))
      );
      
      // Reset selection
      setSelectedQuestionIds([]);
      setSelectAll(false);
      
      setSuccess(`Successfully deleted ${selectedQuestionIds.length} questions`);
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      console.error('Error deleting questions:', error);
      setError('Failed to delete selected questions');
    } finally {
      setLoadingSavedQuestions(false);
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
          
          {/* Add selection button */}
          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={handleAddSelection}
              className="flex items-center justify-center px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/60 transition-colors border border-primary-200 dark:border-primary-800 shadow-sm"
              title="Add another exam-subject-chapter selection"
              disabled={!selectedChapter}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add This Selection
            </button>
          </div>
          
          {/* Selected targets display */}
          {targetSelections.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Questions will be added to these destinations:
              </h3>
              <div className="space-y-2">
                {targetSelections.map((selection, index) => (
                  <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm border border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {getSelectionLabel(selection)}
                    </span>
                    <button
                      onClick={() => handleRemoveSelection(index)}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Remove this selection"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 italic">
                The same set of questions will be added to all destinations above. You can select one or multiple destinations.
              </p>
            </div>
          )}
          
          {/* Hint when no additional targets are selected */}
          {targetSelections.length === 0 && selectedChapter && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 inline-block mr-1">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
                Need to add these questions to multiple chapters? Click the "Add This Selection" button above.
              </p>
            </div>
          )}
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
                disabled={(targetSelections.length === 0 && !selectedChapter) || submitting}
                className={(targetSelections.length === 0 && !selectedChapter) ? 'opacity-70 cursor-not-allowed' : ''}
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Saved Questions</h2>
            
            {/* Actions for selected questions */}
            {savedQuestions.length > 0 && (
              <div className="flex space-x-3">
                <div className="flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Select All
                    </span>
                  </label>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={handleCopySelectedQuestionsAsJson}
                    loading={copyingToClipboard}
                    disabled={selectedQuestionIds.length === 0 || copyingToClipboard || loadingSavedQuestions}
                  >
                    Copy Selected as JSON ({selectedQuestionIds.length})
                  </Button>
                  
                  <Button
                    onClick={handleDeleteSelectedQuestions}
                    loading={loadingSavedQuestions}
                    disabled={selectedQuestionIds.length === 0 || loadingSavedQuestions || copyingToClipboard}
                    className="flex items-center bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete Selected ({selectedQuestionIds.length})
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {loadingSavedQuestions ? (
            <div className="py-8 text-center text-gray-500">Loading questions...</div>
          ) : savedQuestions.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No questions found with the selected filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Chapter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Question</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Option A</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Option B</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Option C</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Option D</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Correct</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Explanation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {savedQuestions.map((question) => (
                    <tr key={question.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleQuestionSelection(question.id)}
                            className={`w-6 h-6 flex items-center justify-center rounded-full border 
                              ${selectedQuestionIds.includes(question.id) 
                                ? 'bg-primary-500 text-white border-primary-500' 
                                : 'border-gray-300 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'}`
                            }
                            title={selectedQuestionIds.includes(question.id) ? "Deselect question" : "Select question"}
                          >
                            {selectedQuestionIds.includes(question.id) && (
                              <CheckIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete question"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
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