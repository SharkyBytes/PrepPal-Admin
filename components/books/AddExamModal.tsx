import { FC, useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface AddExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExamAdded: (exam: { id: string; name: string }) => void;
}

const AddExamModal: FC<AddExamModalProps> = ({ isOpen, onClose, onExamAdded }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Exam name is required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const { data, error } = await supabase
        .from('exams')
        .insert([{ name }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      onExamAdded(data);
      setName('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the exam');
      console.error('Error creating exam:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Exam"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md">
            {error}
          </div>
        )}
        
        <Input
          label="Exam Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., JEE, NEET, UPSC"
          required
        />
        
        <div className="flex gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Exam
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddExamModal; 