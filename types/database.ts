export type User = {
  id: string;
  email: string;
  role: string;
};

export type Exam = {
  id: string;
  name: string;
  created_at: string;
};

export type Subject = {
  id: string;
  exam_id: string;
  name: string;
  syllabus_pdf_url?: string;
  created_at: string;
  // For joins
  exam?: {
    name: string;
  };
};

export type Chapter = {
  id: string;
  subject_id: string;
  name: string;
  description?: string;
  order?: number;
  created_at: string;
  // For joins
  subject?: {
    name: string;
  };
};

export type Book = {
  id: string;
  subject_id: string;
  title: string;
  author: string;
  link?: string;
  created_at: string;
  // For joins
  subject?: {
    name: string;
  };
}; 