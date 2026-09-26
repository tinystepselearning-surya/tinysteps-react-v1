import PublicAssessmentForm from './PublicAssessmentForm';

type BookAssessmentFormProps = {
  source?: string;
  autoFocusFirstField?: boolean;
  onSuccess?: () => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  submitAriaLabel?: string;
  appearance?: 'default' | 'embedded' | 'heroCompact';
  helperText?: string;
  secondaryHelperText?: string | null;
};

export default function BookAssessmentForm(props: BookAssessmentFormProps) {
  return <PublicAssessmentForm {...props} />;
}
