import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('adminProcessEnrollmentCSV structural checks', () => {
  const filePath = path.join(__dirname, '../src/adminProcessEnrollmentCSV.ts');
  let source: string;
  beforeAll(() => {
    source = fs.readFileSync(filePath, 'utf-8');
  });

  it('should export adminProcessEnrollmentCSV from module', () => {
    expect(source).toContain('export const adminProcessEnrollmentCSV');
  });

  it('should check for validateOnly handling', () => {
    expect(source).toContain('validateOnly');
  });

  it('should create a bulkUploadJobs job doc for audit', () => {
    expect(source).toContain('bulkUploadJobs');
  });
});
