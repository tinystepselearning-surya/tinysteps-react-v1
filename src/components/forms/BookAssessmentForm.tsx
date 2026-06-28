import PublicAssessmentForm from './PublicAssessmentForm';

type BookAssessmentFormProps = {
  defaultInterest?: 'Phonics' | 'Reading' | 'Grammar' | 'Speaking';
  source?: string;
  autoFocusFirstField?: boolean;
  onSuccess?: () => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  submitAriaLabel?: string;
};

export default function BookAssessmentForm(props: BookAssessmentFormProps) {
  return <PublicAssessmentForm {...props} />;
}
