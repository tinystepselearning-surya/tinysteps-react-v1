from pathlib import Path

path = Path('src/pages/admin/LeadsInquiriesWorkspaceV2.tsx')
source = path.read_text()


def replace_once(old: str, new: str, label: str) -> None:
    global source
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected exactly 1 match, found {count}')
    source = source.replace(old, new, 1)


replace_once(
    "import { db } from '../../lib/firebaseConfig';\nimport { normalizeDemoStatus } from '../../lib/statuses';",
    "import { db } from '../../lib/firebaseConfig';\nimport { buildLeadAttributionDisplay } from '../../lib/leadAttributionDisplay';\nimport { normalizeDemoStatus } from '../../lib/statuses';",
    'attribution display import',
)

replace_once(
    """  source?: string | null;\n  preferredTimingText?: string | null;\n""",
    """  source?: string | null;\n  sourceDetail?: string | null;\n  acquisitionChannel?: string | null;\n  acquisitionSource?: string | null;\n  landingPage?: string | null;\n  conversionPage?: string | null;\n  attribution?: {\n    utm_source?: string | null;\n    utm_medium?: string | null;\n    utm_campaign?: string | null;\n    referrerDomain?: string | null;\n  } | null;\n  preferredTimingText?: string | null;\n""",
    'lead attribution fields',
)

replace_once(
    """  course: string;\n  source: string;\n  teacherName: string;\n""",
    """  course: string;\n  source: string;\n  acquisitionLabel: string;\n  contentInfluenceLabel: string | null;\n  attributionDetail: string | null;\n  teacherName: string;\n""",
    'row attribution fields',
)

replace_once(
    """      const workflow = { leadStatus: lead?.status, demoStatus, conversionStatus: demo?.conversionStatus, hasDemo: Boolean(demo), hasFollowUp: followUpAtMs > 0 };\n      return {\n""",
    """      const workflow = { leadStatus: lead?.status, demoStatus, conversionStatus: demo?.conversionStatus, hasDemo: Boolean(demo), hasFollowUp: followUpAtMs > 0 };\n      const attributionDisplay = buildLeadAttributionDisplay(lead || { source: demo?.source });\n      return {\n""",
    'build attribution summary',
)

replace_once(
    """        course: normalizeText(demo?.courseInterested || lead?.programInterest) || formatTrack(lead?.interestTrack) || '—',\n        source: normalizeText(demo?.source || lead?.source) || '—',\n        teacherName: normalizeText(demo?.assignedTeacherName) || (demo?.assignedTeacherId ? 'Assigned teacher' : '—'),\n""",
    """        course: normalizeText(demo?.courseInterested || lead?.programInterest) || formatTrack(lead?.interestTrack) || '—',\n        source: normalizeText(demo?.source || lead?.source) || '—',\n        acquisitionLabel: attributionDisplay.acquisitionLabel,\n        contentInfluenceLabel: attributionDisplay.contentInfluenceLabel,\n        attributionDetail: attributionDisplay.detailLabel,\n        teacherName: normalizeText(demo?.assignedTeacherName) || (demo?.assignedTeacherId ? 'Assigned teacher' : '—'),\n""",
    'row attribution values',
)

replace_once(
    """      [row.parentName, row.childName, row.parentPhone, row.course, row.source, row.teacherName, row.statusLabel]\n""",
    """      [\n        row.parentName,\n        row.childName,\n        row.parentPhone,\n        row.course,\n        row.source,\n        row.acquisitionLabel,\n        row.contentInfluenceLabel,\n        row.attributionDetail,\n        row.teacherName,\n        row.statusLabel,\n      ]\n""",
    'attribution search fields',
)

replace_once(
    'placeholder="Search parent, child, phone, course or teacher"',
    'placeholder="Search parent, child, phone, course, teacher or attribution"',
    'search placeholder',
)

replace_once(
    """          <div><div className=\"text-sm font-medium text-slate-800\">{row.course}</div><div className=\"text-xs text-slate-500\">{row.source}</div></div>\n""",
    """          <div>\n            <div className=\"text-sm font-medium text-slate-800\">{row.course}</div>\n            <div className=\"text-xs text-slate-500\">{row.source}</div>\n            <div className=\"mt-1 text-xs font-semibold text-slate-700\">{row.acquisitionLabel}</div>\n            {row.contentInfluenceLabel && (\n              <div\n                className=\"mt-0.5 max-w-[260px] truncate text-xs text-slate-500\"\n                title={row.attributionDetail || row.contentInfluenceLabel}\n              >\n                {row.contentInfluenceLabel}\n              </div>\n            )}\n          </div>\n""",
    'attribution display in row',
)

path.write_text(source)
