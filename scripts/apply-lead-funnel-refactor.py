from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected exactly one match, found {count}: {old[:120]!r}")
    file.write_text(text.replace(old, new, 1))


# Leads workspace: use the canonical lead-based analytics rather than demo-only analytics.
workspace = "src/pages/admin/LeadsInquiriesWorkspace.tsx"
replace_once(
    workspace,
    "import DemoSessionsManagement from './DemoSessionsManagement';",
    "import LeadFunnelTrendAnalysis from './LeadFunnelTrendAnalysis';\nimport { toIstDateKey } from './leadFunnelAnalytics';",
)
replace_once(
    workspace,
    "  updatedAt?: Timestamp | null;\n  createdAt?: Timestamp | null;",
    "  receivedAt?: Timestamp | null;\n  requestedAt?: Timestamp | null;\n  updatedAt?: Timestamp | null;\n  createdAt?: Timestamp | null;",
)
replace_once(
    workspace,
    "    leadType: '1:1',\n    requestReceivedDate: TODAY_DATE_INPUT,\n    preferredDateTimeText: lead.preferredTimingText || '',",
    "    leadType: '1:1',\n    requestReceivedDate: toIstDateKey(lead.receivedAt || lead.requestedAt || lead.createdAt) || TODAY_DATE_INPUT,\n    preferredDateTimeText: lead.preferredTimingText || '',",
)
replace_once(
    workspace,
    "  if (status === 'completed' || status === 'cancelled') return 'completed';",
    "  if (status === 'completed') return 'completed';\n  if (status === 'cancelled') return '';",
)
replace_once(
    workspace,
    '      <DemoSessionsManagement mode="trend_only" />',
    '      <LeadFunnelTrendAnalysis leads={activeLeads} demos={activeDemos} />',
)
replace_once(
    workspace,
    "          ? 'New website assessment received'\n          : `${newWebsiteLeads.length} new website assessments received`,",
    "          ? 'New lead received'\n          : `${newWebsiteLeads.length} new leads received`,",
)
replace_once(
    workspace,
    '                              aria-label="New website assessment"',
    '                              aria-label="New lead"',
)

# Realtime lead listener: direct WhatsApp leads and website leads are both first-class enquiries.
realtime = "src/pages/admin/leadsRealtime.ts"
replace_once(
    realtime,
    "    return `${leads.length} new website assessment requests were added.${hiddenSuffix}`;",
    "    return `${leads.length} new enquiries were added.${hiddenSuffix}`;",
)
replace_once(
    realtime,
    "              normalizeText(change.doc.data().source).toLowerCase() === 'website' &&",
    "              ['website', 'whatsapp'].includes(normalizeText(change.doc.data().source).toLowerCase()) &&",
)
replace_once(
    realtime,
    "  if (demoStatus === 'completed' || demoStatus === 'cancelled') return 'demo_completed';",
    "  if (demoStatus === 'completed') return 'demo_completed';\n  if (demoStatus === 'cancelled') return 'demo_active';",
)

# Teacher workflow: assigned teachers can cancel an attempt without marking the lead lost.
teacher_view = "src/pages/teacher/components/demo/DemoAssignmentsView.tsx"
replace_once(
    teacher_view,
    "import { db } from '../../../../lib/firebaseConfig';",
    "import TeacherCancelAssignedDemoDialog from './TeacherCancelAssignedDemoDialog';\nimport { db } from '../../../../lib/firebaseConfig';",
)
replace_once(
    teacher_view,
    "  const [completing, setCompleting] = useState(false);",
    "  const [completing, setCompleting] = useState(false);\n  const [cancelTarget, setCancelTarget] = useState<DemoSession | null>(null);",
)
replace_once(
    teacher_view,
    "                <Button size=\"sm\" variant=\"outline\" onClick={() => openUpdateDialog(demo)}>\n                  Update timing\n                </Button>\n                <Button size=\"sm\" onClick={() => openCompleteDialog(demo)}>",
    "                <Button size=\"sm\" variant=\"outline\" onClick={() => openUpdateDialog(demo)}>\n                  Update timing\n                </Button>\n                <Button size=\"sm\" variant=\"outline\" onClick={() => setCancelTarget(demo)}>\n                  Cancel demo\n                </Button>\n                <Button size=\"sm\" onClick={() => openCompleteDialog(demo)}>",
)
replace_once(
    teacher_view,
    "      <Dialog open={!!completeTarget} onOpenChange={(open) => (!open ? setCompleteTarget(null) : undefined)}>",
    "      <TeacherCancelAssignedDemoDialog\n        demo={cancelTarget}\n        open={Boolean(cancelTarget)}\n        onClose={() => setCancelTarget(null)}\n      />\n\n      <Dialog open={!!completeTarget} onOpenChange={(open) => (!open ? setCompleteTarget(null) : undefined)}>",
)

# Domain model: make canonical lifecycle timestamps and attribution explicit.
models = "src/types/models.ts"
replace_once(
    models,
    "  completedAt?: Timestamp | null;\n  createdAt?: Timestamp | null;",
    "  completedAt?: Timestamp | null;\n  completedByTeacherId?: string | null;\n  completedByTeacherName?: string | null;\n  cancelledAt?: Timestamp | null;\n  cancelledBy?: string | null;\n  cancellationReason?: string | null;\n  cancellationNote?: string | null;\n  enrolledAt?: Timestamp | null;\n  createdAt?: Timestamp | null;",
)

# Existing payout trigger: only delivered demos earn the completion ₹100 and preserve teacher attribution.
demo_functions = "functions/src/demoSessions.ts"
replace_once(
    demo_functions,
    "    const shouldCreditCompletion = beforeStatus !== 'completed' && afterStatus === 'completed';\n    const shouldCreditEnrollment = beforeConversion !== 'enrolled' && afterConversion === 'enrolled';",
    "    const completionOutcome = normalizeStatusValue(after.outcome);\n    const shouldCreditCompletion =\n      beforeStatus !== 'completed' &&\n      afterStatus === 'completed' &&\n      ['completed', 'not_interested', 'follow_up_needed'].includes(completionOutcome);\n    const shouldCreditEnrollment = beforeConversion !== 'enrolled' && afterConversion === 'enrolled';",
)
replace_once(
    demo_functions,
    "    const teacherId = pickOptionalText(after.assignedTeacherId, 120);\n    const teacherName = pickOptionalText(after.assignedTeacherName, 120) || 'Teacher';",
    "    const teacherId = pickOptionalText(after.completedByTeacherId || after.assignedTeacherId, 120);\n    const teacherName =\n      pickOptionalText(after.completedByTeacherName || after.assignedTeacherName, 120) || 'Teacher';",
)
replace_once(
    demo_functions,
    "      const enrollmentMonthKey = monthKeyFromTimestampIST(after.lastUpdatedAt || new Date());",
    "      const enrollmentMonthKey = monthKeyFromTimestampIST(after.enrolledAt || after.lastUpdatedAt || new Date());",
)

# Direct inbound WhatsApp message with no existing phone match becomes a lead immediately.
whatsapp = "functions/src/whatsapp.ts"
replace_once(
    whatsapp,
    "const UNMATCHED_INBOUND_COLLECTION = 'whatsappInboundUnmatched';\n",
    "",
)
replace_once(
    whatsapp,
    "  if (!matchedLead) {\n    await db.collection(UNMATCHED_INBOUND_COLLECTION).add({\n      phoneNormalized,\n      rawFrom,\n      messageSummary,\n      externalMessageId,\n      provider: PROVIDER,\n      status: 'unmatched',\n      receivedAt: admin.firestore.FieldValue.serverTimestamp(),\n      createdAt: admin.firestore.FieldValue.serverTimestamp(),\n      updatedAt: admin.firestore.FieldValue.serverTimestamp(),\n    });\n    return 'unmatched';\n  }",
    "  if (!matchedLead) {\n    const leadRef = db.collection(LEADS_COLLECTION).doc(`whatsapp_${phoneNormalized}`);\n    const existingLead = await leadRef.get();\n    if (!existingLead.exists) {\n      await leadRef.set({\n        parentName: null,\n        primaryPhone: rawFrom,\n        phoneNormalized,\n        childName: null,\n        childAge: null,\n        childGrade: null,\n        interestTrack: null,\n        programInterest: null,\n        source: 'whatsapp',\n        sourceDetail: 'whatsapp_inbound',\n        initialMessageSnippet: messageSummary,\n        status: 'new',\n        priority: 'normal',\n        receivedAt: admin.firestore.FieldValue.serverTimestamp(),\n        requestedAt: admin.firestore.FieldValue.serverTimestamp(),\n        createdAt: admin.firestore.FieldValue.serverTimestamp(),\n        updatedAt: admin.firestore.FieldValue.serverTimestamp(),\n        createdBy: null,\n        updatedBy: null,\n      });\n    }\n\n    const existingCommunication = await findExistingCommunicationByExternalId(\n      db,\n      leadRef.id,\n      externalMessageId,\n    );\n    if (!existingCommunication) {\n      await leadRef.collection(COMMUNICATIONS_SUBCOLLECTION).add({\n        type: 'message' as CommunicationType,\n        direction: 'inbound' as CommunicationDirection,\n        channel: 'whatsapp' as CommunicationChannel,\n        summary: messageSummary,\n        followUpNeeded: false,\n        followUpDate: null,\n        templateTag: null,\n        status: 'logged' as CommunicationStatus,\n        provider: PROVIDER,\n        externalMessageId,\n        deliveryStatus: 'sent' as DeliveryStatus,\n        templateLanguage: null,\n        templateName: null,\n        errorCode: null,\n        errorMessage: null,\n        providerPayloadSummary: {\n          messageType: trimText(message?.type) || 'unknown',\n        },\n        createdAt: admin.firestore.FieldValue.serverTimestamp(),\n        updatedAt: admin.firestore.FieldValue.serverTimestamp(),\n        createdBy: null,\n        updatedBy: null,\n      });\n    }\n    await leadRef.set({\n      lastInboundAt: admin.firestore.FieldValue.serverTimestamp(),\n      lastContactAt: admin.firestore.FieldValue.serverTimestamp(),\n      updatedAt: admin.firestore.FieldValue.serverTimestamp(),\n    }, { merge: true });\n    return 'matched';\n  }",
)

# Tests render the workspace; mock the new chart just as the old embedded demo chart was mocked.
workspace_test = "src/tests/pages/admin/leadsRealtime.spec.tsx"
replace_once(
    workspace_test,
    "vi.mock('../../../pages/admin/DemoSessionsManagement', () => ({\n  default: () => <div data-testid=\"demo-sessions-management\" />\n}));",
    "vi.mock('../../../pages/admin/LeadFunnelTrendAnalysis', () => ({\n  default: () => <div data-testid=\"lead-funnel-trend-analysis\" />\n}));",
)

print('Lead funnel branch refactor applied successfully.')
