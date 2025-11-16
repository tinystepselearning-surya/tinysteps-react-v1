import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('StudentBulkUploader structural tests', () => {
  it('component exists in the path', () => {
    const p = path.join(__dirname, '../../src/pages/admin/StudentManagement/StudentBulkUploader.tsx');
    const src = fs.readFileSync(p, 'utf-8');
    expect(src.length).toBeGreaterThan(10);
    expect(src).toContain('export default function StudentBulkUploader');
  });
});
