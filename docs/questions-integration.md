# Questions Feature Integration Guide

This document outlines how to integrate the Questions feature in the PrepPal application.

## Database Schema

The questions feature uses the following schema in Supabase:

```sql
CREATE TABLE public.questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL,
    explaination TEXT,
    order_priority INTEGER
);
```

## Security Rules

The questions table has Row Level Security (RLS) enabled with policies that:
1. Allow admin users to perform all CRUD operations
2. Allow authenticated users to read questions
3. Prevent public access

## Fetching Questions in Flutter App

You can fetch questions for a specific chapter using the following code in your Flutter app:

```dart
import 'package:supabase_flutter/supabase_flutter.dart';

class Question {
  final String id;
  final String questionText;
  final String optionA;
  final String optionB;
  final String optionC;
  final String optionD;
  final String correctOption;
  final String? explanation;

  Question({
    required this.id,
    required this.questionText,
    required this.optionA,
    required this.optionB,
    required this.optionC,
    required this.optionD,
    required this.correctOption,
    this.explanation,
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    return Question(
      id: json['id'],
      questionText: json['question_text'],
      optionA: json['option_a'],
      optionB: json['option_b'],
      optionC: json['option_c'],
      optionD: json['option_d'],
      correctOption: json['correct_option'],
      explanation: json['explaination'],
    );
  }
}

class QuestionService {
  final SupabaseClient _supabase = Supabase.instance.client;

  Future<List<Question>> getQuestionsByChapter(String chapterId) async {
    try {
      // Option 1: Using the custom function
      final response = await _supabase
          .rpc('get_questions_by_chapter', params: {'chapter_uuid': chapterId})
          .execute();

      // Option 2: Direct query
      // final response = await _supabase
      //     .from('questions')
      //     .select()
      //     .eq('chapter_id', chapterId)
      //     .order('order_priority', ascending: true)
      //     .order('created_at', ascending: true)
      //     .execute();

      if (response.error != null) {
        throw response.error!;
      }

      final data = response.data as List;
      return data.map((json) => Question.fromJson(json)).toList();
    } catch (e) {
      print('Error fetching questions: $e');
      throw e;
    }
  }
}
```

## Sample Question List UI

Here's a sample implementation of a question list screen:

```dart
import 'package:flutter/material.dart';

class QuestionListScreen extends StatefulWidget {
  final String chapterId;
  final String chapterName;

  const QuestionListScreen({
    Key? key,
    required this.chapterId,
    required this.chapterName,
  }) : super(key: key);

  @override
  _QuestionListScreenState createState() => _QuestionListScreenState();
}

class _QuestionListScreenState extends State<QuestionListScreen> {
  final QuestionService _questionService = QuestionService();
  List<Question>? _questions;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadQuestions();
  }

  Future<void> _loadQuestions() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });
      
      final questions = await _questionService.getQuestionsByChapter(widget.chapterId);
      
      setState(() {
        _questions = questions;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load questions: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Questions: ${widget.chapterName}'),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_error!, style: TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadQuestions,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_questions == null || _questions!.isEmpty) {
      return const Center(
        child: Text('No questions available for this chapter.'),
      );
    }

    return ListView.builder(
      itemCount: _questions!.length,
      itemBuilder: (context, index) {
        final question = _questions![index];
        return QuestionCard(
          question: question,
          index: index,
        );
      },
    );
  }
}

class QuestionCard extends StatelessWidget {
  final Question question;
  final int index;

  const QuestionCard({
    Key? key,
    required this.question,
    required this.index,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Question ${index + 1}',
              style: Theme.of(context).textTheme.subtitle2,
            ),
            const SizedBox(height: 8),
            Text(
              question.questionText,
              style: Theme.of(context).textTheme.subtitle1!.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            _buildOption('A', question.optionA, question.correctOption == 'A'),
            _buildOption('B', question.optionB, question.correctOption == 'B'),
            _buildOption('C', question.optionC, question.correctOption == 'C'),
            _buildOption('D', question.optionD, question.correctOption == 'D'),
            if (question.explanation != null && question.explanation!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Explanation:',
                      style: Theme.of(context).textTheme.subtitle2!.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(question.explanation!),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildOption(String option, String text, bool isCorrect) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isCorrect ? Colors.green.shade100 : Colors.grey.shade200,
              border: Border.all(
                color: isCorrect ? Colors.green : Colors.grey,
              ),
            ),
            child: Center(
              child: Text(
                option,
                style: TextStyle(
                  color: isCorrect ? Colors.green : Colors.grey,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}
```

## Implementation Notes

1. **Database Structure**:
   - Questions are linked to chapters via `chapter_id`
   - Each question has multiple-choice options (A through D)
   - The `correct_option` field stores the letter of the correct answer
   - The `explaination` field provides explanation for the correct answer

2. **Flutter Implementation**:
   - Use the Supabase Flutter SDK to fetch questions
   - Questions can be retrieved by chapter using the provided SQL function
   - Implement caching if needed for better performance
   - Consider adding local storage for offline access to questions

3. **UI/UX Considerations**:
   - Group questions by chapter
   - Provide a way to show/hide explanations
   - Implement a quiz mode where users can attempt questions and see results

## Security Considerations

- Row Level Security ensures that only authenticated users can read questions
- Admin users have full CRUD access to manage questions
- The client app should handle data securely and not expose admin features to regular users

## Performance Optimization

1. For large sets of questions, implement pagination:
```dart
// Fetch questions with pagination
Future<List<Question>> getQuestionsByChapterPaginated(
  String chapterId, 
  {int page = 0, int pageSize = 20}
) async {
  final from = page * pageSize;
  final to = from + pageSize - 1;
  
  final response = await _supabase
    .from('questions')
    .select()
    .eq('chapter_id', chapterId)
    .order('order_priority', ascending: true)
    .order('created_at', ascending: true)
    .range(from, to)
    .execute();
  
  // Process response...
}
```

2. Consider caching responses for frequently accessed chapters:
```dart
// Implementation with caching
Map<String, List<Question>> _cache = {};

Future<List<Question>> getQuestionsByChapterCached(String chapterId) async {
  if (_cache.containsKey(chapterId)) {
    return _cache[chapterId]!;
  }
  
  final questions = await getQuestionsByChapter(chapterId);
  _cache[chapterId] = questions;
  return questions;
}
``` 