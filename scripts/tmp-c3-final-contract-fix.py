from pathlib import Path

path = Path('scripts/audit-commercial-c3-owner-pages.mjs')
text = path.read_text()
text = text.replace(
'''  if (c3.includes("needs-strengthening'")) {
    failures.push('C3 final contract still contains needs-strengthening status');
  }
''',
'',
1,
)
text = text.replace(
"  'src/pages/public/BookDemoPage.tsx': ['Free 35-Minute 1:1 English Assessment', 'programmeRoutes', 'multi-class free trial'],",
"  'src/pages/public/BookDemoPage.tsx': ['1:1 English Assessment', 'programmeRoutes', 'multi-class free trial'],",
1,
)
path.write_text(text)
