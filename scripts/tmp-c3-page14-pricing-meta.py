from pathlib import Path

page_path = Path('src/pages/PricingPage.tsx')
registry_path = Path('src/lib/routeSeoRegistry.js')

page = page_path.read_text()
registry = registry_path.read_text()

page = page.replace(
    "  FREE_DEMO_FULL_DESCRIPTION,\n  STANDARD_PRICING_SUMMARY,\n",
    "  FREE_DEMO_FULL_DESCRIPTION,\n",
    1,
)

old = """  '/pricing': {
    title: 'Premium 1:1 Online English Class Pricing | Tiny Steps Learning',
    description:
      'Standard 1:1 classes cost ₹400 per class and small groups cost ₹180–₹300 per child per class. Book one free 35-minute 1:1 demo assessment class.',
    canonicalPath: '/pricing',
    ogType: 'website',
  },"""
new = """  '/pricing': {
    title: 'Online English Classes for Kids Fees & Pricing | Tiny Steps',
    description:
      'See Tiny Steps online English class fees: standard live 1:1 ₹400/class, 12 classes ₹4,800, small groups ₹180–₹300 per child/class, plus native-teacher options.',
    canonicalPath: '/pricing',
    ogType: 'website',
    keywords:
      'online English classes for kids fees,online English classes fees,English classes for kids price,online English classes pricing,online English classes cost India,English classes fees India,1 to 1 English class fees,1 to 1 English classes price,online English tutor fees for kids,small group English class fees,live online English class price,online English course fees for kids',
  },"""

if old not in registry:
    raise SystemExit('Expected pricing registry block not found')
registry = registry.replace(old, new, 1)

page_path.write_text(page)
registry_path.write_text(registry)
