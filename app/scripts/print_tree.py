import os, sys, fnmatch

ROOT = "."
MAX_DEPTH = 5
IGNORE = [
  "node_modules", ".git", "dist", "build", ".next", ".cache", ".firebase",
  "coverage", ".DS_Store", "*.log", "*.map", "service-account.json", ".env*"
]

def ignored(name):
  return any(fnmatch.fnmatch(name, pat) for pat in IGNORE)

def walk(path, depth=0, prefix=""):
  if depth > MAX_DEPTH: return
  try:
    entries = sorted(os.listdir(path))
  except Exception:
    return
  for i, name in enumerate(entries):
    if ignored(name): 
      continue
    full = os.path.join(path, name)
    connector = "└── " if i == len(entries)-1 else "├── "
    print(prefix + connector + name)
    if os.path.isdir(full):
      new_prefix = prefix + ("    " if i == len(entries)-1 else "│   ")
      walk(full, depth+1, new_prefix)

print(".")
walk(ROOT, 0, "")
