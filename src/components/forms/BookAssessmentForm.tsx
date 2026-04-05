import PublicAssessmentForm from './PublicAssessmentForm';

type BookAssessmentFormProps = {
  defaultInterest?: 'Phonics' | 'Reading' | 'Grammar' | 'Speaking';
  source?: string;
  autoFocusFirstField?: boolean;
  onSuccess?: () => void;
};

export default function BookAssessmentForm(props: BookAssessmentFormProps) {
  return <PublicAssessmentForm {...props} />;
}
