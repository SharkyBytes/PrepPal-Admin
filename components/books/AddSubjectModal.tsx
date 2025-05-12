import { FC, useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  examName: string;
  onSubjectAdded: (subject: { id: string; name: string; exam_id: string }) => void;
}

const AddSubjectModal: FC<AddSubjectModalProps> = ({ 
  isOpen, 
  onClose, 
  examId,
  examName,
  onSubjectAdded 
}) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Subject name is required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const { data, error } = await supabase
        .from('subjects')
        .insert([{ 
          name, 
          exam_id: examId 
        }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      onSubjectAdded(data);
      setName('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the subject');
      console.error('Error creating subject:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Subject"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-1">Exam</div>
          <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
            {examName}
          </div>
        </div>
        
        <Input
          label="Subject Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Physics, Chemistry, Mathematics"
          required
        />
        
        <div className="flex gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Subject
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddSubjectModal; 