// Extensionless imports resolve .ts before .tsx in the app toolchain.
// Keep the legacy .tsx implementation intact for rollback while the canonical
// curriculum-backed editor is validated on this branch.
export { default } from './StudentTopicProgressEditorCanonical';
