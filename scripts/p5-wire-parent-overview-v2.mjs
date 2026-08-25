import fs from 'node:fs';

const path = 'src/pages/parent/ParentDashboard.tsx';
let text = fs.readFileSync(path, 'utf8');

if (text.includes('// Brick P5 canonical overview wiring')) {
  console.log('P5 overview wiring already applied.');
  process.exit(0);
}

function replaceOnce(oldValue, newValue, label) {
  const count = text.split(oldValue).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`);
  text = text.replace(oldValue, newValue);
}

replaceOnce(
  'import ParentLearningInsights from "./components/ParentLearningInsights";\nimport ParentLessonTracker from "./components/ParentLessonTracker";\n',
  'import ParentLearningInsights from "./components/ParentLearningInsights";\n',
  'remove lesson tracker import',
);
replaceOnce(
  'import ParentProgressOverview from "./components/ParentProgressOverview";\nimport ParentRecommendations from "./components/ParentRecommendations";\n',
  'import ParentProgressOverview from "./components/ParentProgressOverview";\n',
  'remove recommendations import',
);
replaceOnce(
  'import { useChildCourseProgressProjection } from "../../hooks/useChildCourseProgressProjection";\n',
  'import { useChildCourseProgressProjection } from "../../hooks/useChildCourseProgressProjection";\nimport { buildCanonicalParentOverview } from "./parentOverviewProjection";\n',
  'add P5 selector import',
);
replaceOnce(
  '  SKILL_RATING_MAX,\n  hasExplicitProgressRatings,\n',
  '  hasExplicitProgressRatings,\n',
  'remove unused star constant import',
);
replaceOnce(
  '  buildDashboardHeroMessage,\n  buildDashboardRecommendedNext,\n  formatCurrencyINR,\n  formatSkillChipLabel,\n  labelFromGameId,\n',
  '  formatCurrencyINR,\n  formatSkillChipLabel,\n',
  'remove synthetic overview helpers',
);

const stateBlock = `  const [selectedKidId, setSelectedKidId] = useState<string>("");\n  const [curriculumTopicModalOpen, setCurriculumTopicModalOpen] =\n    useState(false);\n  const [selectedCurriculumTopic, setSelectedCurriculumTopic] =\n    useState<any>(null);\n  const [curriculumFilter, setCurriculumFilter] = useState<\n    "all" | "in_progress" | "completed"\n  >("all");\n  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});\n`;
replaceOnce(stateBlock, '  const [selectedKidId, setSelectedKidId] = useState<string>("");\n', 'remove P6-only overview state');

const starGuide = /const TEACHER_STAR_GUIDE = \[[\s\S]*?\] as const;\n\nfunction starString\(level: number\): string \{[\s\S]*?\n\}\n\n/;
if (!starGuide.test(text)) throw new Error('remove star guide: pattern not found');
text = text.replace(starGuide, '');

const classesAnchor = `  }, [monthSessions, parentMonthlyBillingReadModelQuery.data, selectedKidId]);\n\n  const billingSummary = useMemo(() => {`;
replaceOnce(
  classesAnchor,
  `  }, [monthSessions, parentMonthlyBillingReadModelQuery.data, selectedKidId]);\n\n  // Brick P5 canonical overview wiring\n  // The Overview consumes only P3 course progress and P4 selected-child/month class totals.\n  // Legacy client calculations remain available to later bricks, but are not allowed to\n  // substitute values on this screen.\n  const canonicalParentOverview = buildCanonicalParentOverview({\n    courseProjection: childCourseProgressProjection.data,\n    expectedCourseId: displayCourseId,\n    classAttendanceModel: parentMonthlyBillingReadModelQuery.data?.attendance as any,\n    kidId: selectedKidId,\n    nowMs: Date.now(),\n  });\n  const overviewClassCounts = canonicalParentOverview.classCounts;\n  const overviewClassesState = parentMonthlyBillingReadModelQuery.isLoading\n    ? "loading" as const\n    : overviewClassCounts\n      ? "available" as const\n      : "unavailable" as const;\n\n  const billingSummary = useMemo(() => {`,
  'insert canonical overview selector',
);

const dashboardCurriculumPattern = /  const dashboardCurriculumData = useMemo\(\(\) => \{[\s\S]*?\n  \}, \[phonicsProgressByCourse, curriculumCompletionSummary, curriculumFilter\]\);/;
if (!dashboardCurriculumPattern.test(text)) throw new Error('canonical dashboard curriculum block not found');
text = text.replace(
  dashboardCurriculumPattern,
  `  const dashboardCurriculumData = canonicalParentOverview.course\n    ? {\n        selectedCourse: {\n          courseId: canonicalParentOverview.course.courseId,\n          courseLabel:\n            canonicalParentOverview.course.courseLabel\n            || formatCourseLabel(canonicalParentOverview.course.courseId),\n        },\n        stageSummaries: canonicalParentOverview.course.stageSummaries.map((stage) => ({\n          label: stage.label,\n          order: stage.order,\n          progressPct: stage.completionPct,\n          completedCount: stage.completedTopics,\n          totalCount: stage.totalTopics,\n        })),\n        completedStages: canonicalParentOverview.course.completedStages,\n        activeStage: canonicalParentOverview.course.activeStage\n          ? {\n              label: canonicalParentOverview.course.activeStage.label,\n              order: canonicalParentOverview.course.activeStage.order,\n              progressPct: canonicalParentOverview.course.activeStage.completionPct,\n              completedCount: canonicalParentOverview.course.activeStage.completedTopics,\n              totalCount: canonicalParentOverview.course.activeStage.totalTopics,\n            }\n          : null,\n        nextStage: canonicalParentOverview.course.nextStage\n          ? {\n              label: canonicalParentOverview.course.nextStage.label,\n              order: canonicalParentOverview.course.nextStage.order,\n              progressPct: canonicalParentOverview.course.nextStage.completionPct,\n              completedCount: canonicalParentOverview.course.nextStage.completedTopics,\n              totalCount: canonicalParentOverview.course.nextStage.totalTopics,\n            }\n          : null,\n        summaryTotalTopics: canonicalParentOverview.course.totalTopics,\n        summaryCompletedCount: canonicalParentOverview.course.completedTopics,\n        summaryInProgressCount: canonicalParentOverview.course.inProgressTopics,\n        summaryOverallPct: canonicalParentOverview.course.overallPct,\n        summaryLastUpdatedAtMs: canonicalParentOverview.course.lastUpdatedAtMs,\n      }\n    : null;`,
);

const recommendationBlock = /\n  const dashboardRecommendedNext = useMemo\(\(\) => \{[\s\S]*?\n  \}, \[canonicalRecommendedNext, kidSummaryQuery\.data\]\);\n/;
if (!recommendationBlock.test(text)) throw new Error('recommendation block not found');
text = text.replace(recommendationBlock, '\n');

const heroMessageBlock = /  const dashboardHeroMessage = useMemo\(\(\) => \{[\s\S]*?\n  \}, \[[\s\S]*?\n  \]\);\n\n  const heroJoinClass/;
if (!heroMessageBlock.test(text)) throw new Error('hero message block not found');
text = text.replace(
  heroMessageBlock,
  `  const dashboardHeroMessage =\n    "Current programme, course progress, class activity, teacher feedback, and wallet status.";\n\n  const heroJoinClass`,
);

replaceOnce(
  `    const hasCurriculumCompletionScope =\n      Number(curriculumData?.summaryTotalTopics ?? curriculumCompletionSummary?.totalTopics ?? 0) > 0;\n    const completionValue =\n      hasCurriculumCompletionScope && typeof curriculumData?.summaryOverallPct === "number"\n        ? curriculumData.summaryOverallPct\n        : hasCurriculumCompletionScope && typeof curriculumCompletionSummary?.overallPct === "number"\n          ? curriculumCompletionSummary.overallPct\n          : undefined;\n    const progressState =\n      phonicsLoading\n        ? "loading" as const\n        : typeof completionValue === "number"\n          ? "available" as const\n          : "unavailable" as const;\n    const activeStageLabel = curriculumData?.activeStage\n      ? stripStagePrefix(curriculumData.activeStage.label, curriculumData.activeStage.order ?? 0)\n      : overviewMetrics?.stageMessage || "Getting started";`,
  `    const hasCurriculumCompletionScope = Number(curriculumData?.summaryTotalTopics ?? 0) > 0;\n    const completionValue =\n      hasCurriculumCompletionScope && typeof curriculumData?.summaryOverallPct === "number"\n        ? curriculumData.summaryOverallPct\n        : undefined;\n    const progressState =\n      childCourseProgressProjection.isLoading\n        ? "loading" as const\n        : typeof completionValue === "number"\n          ? "available" as const\n          : "unavailable" as const;\n    const activeStageLabel = curriculumData?.activeStage\n      ? stripStagePrefix(curriculumData.activeStage.label, curriculumData.activeStage.order ?? 0)\n      : childCourseProgressProjection.isLoading\n        ? "Loading progress"\n        : "Progress unavailable";`,
  'replace Overview progress state',
);

replaceOnce(
  `    if (classesCounts.reschedule_requested > 0) {\n      dashboardAlerts.push(\`${'${classesCounts.reschedule_requested}'} class update needs attention\`);\n    }`,
  `    if ((overviewClassCounts?.reschedule_requested ?? 0) > 0) {\n      dashboardAlerts.push(\`${'${overviewClassCounts?.reschedule_requested}'} class update needs attention\`);\n    }`,
  'replace overview class alert',
);

replaceOnce(
  `    const lessonsSummaryText = curriculumData\n      ? \`${'${curriculumData.summaryCompletedCount}/${curriculumData.summaryTotalTopics}'} lessons\`\n      : phonicsLoading\n        ? "Loading lesson totals"\n        : "Curriculum data unavailable";`,
  `    const lessonsSummaryText = curriculumData\n      ? \`${'${curriculumData.summaryCompletedCount}'} of ${'${curriculumData.summaryTotalTopics}'} lessons completed\`\n      : childCourseProgressProjection.isLoading\n        ? "Loading canonical lesson totals"\n        : "Canonical course progress unavailable";`,
  'replace overview lesson summary label',
);

replaceOnce(
  `    const attendanceLabel = \`${'${classesCounts.completed}/${classesCounts.total}'}\`;\n    const attendanceMetaText = \`${'${classesMonthLabel}'} · ${'${classesCounts.reschedule_requested}'} rescheduled\`;`,
  `    const attendanceLabel = overviewClassCounts\n      ? \`${'${overviewClassCounts.completed}'} completed · ${'${overviewClassCounts.total}'} sessions\`\n      : "Not available";\n    const attendanceMetaText = overviewClassCounts\n      ? \`${'${classesMonthLabel}'} · selected child\`\n      : \`${'${classesMonthLabel}'} · selected-child totals unavailable\`;`,
  'replace class KPI labels',
);

replaceOnce(
  `          classesCompleted={classesCounts.completed}\n          classesUpcoming={classesCounts.upcoming}\n`,
  `          classesCompleted={overviewClassCounts?.completed ?? null}\n          classesUpcoming={overviewClassCounts?.upcoming ?? null}\n`,
  'replace hero class counts',
);

replaceOnce(
  `          attendanceLabel={attendanceLabel}\n          attendanceMetaText={attendanceMetaText}\n          attendanceLoading={kidSessionsQuery.isLoading && parentMonthlyBillingReadModelQuery.isLoading}`,
  `          attendanceState={overviewClassesState}\n          attendanceLabel={attendanceLabel}\n          attendanceMetaText={attendanceMetaText}`,
  'replace KPI attendance props',
);

replaceOnce(
  `          <ParentAttendanceSummary\n            classesCounts={classesCounts}\n            scopeLabel={\`Class activity · ${'${classesMonthLabel}'}\`}`,
  `          <ParentAttendanceSummary\n            classesState={overviewClassesState}\n            classesCounts={overviewClassCounts}\n            scopeLabel={\`Class activity · ${'${classesMonthLabel}'}\`}`,
  'replace class summary props',
);

const oldProgress = `          <ParentProgressOverview\n            childName={childName}\n            isRefetching={phonicsProgressQuery.isRefetching}\n            onRefresh={() => phonicsProgressQuery.refetch()}\n            showsFallbackBanner={curriculumCompletionSummary?.source === "fallback_client"}\n            phonicsLoading={phonicsLoading}\n            phonicsError={phonicsError}\n            phonicsErrorMessage={phonicsErrorMessage}\n            curriculumData={curriculumData}\n            completionPct={completionValue}\n            stripStagePrefix={stripStagePrefix}\n          />`;
const newProgress = `          <ParentProgressOverview\n            childName={childName}\n            loading={childCourseProgressProjection.isLoading}\n            errorMessage={\n              childCourseProgressProjection.isError\n                ? "Unable to load canonical course progress right now."\n                : null\n            }\n            course={canonicalParentOverview.course}\n            stripStagePrefix={stripStagePrefix}\n          />`;
replaceOnce(oldProgress, newProgress, 'replace progress overview props');

const recommendationsRender = /\n          <ParentRecommendations\n[\s\S]*?\n          \/>/;
if (!recommendationsRender.test(text)) throw new Error('recommendations render block not found');
text = text.replace(recommendationsRender, '');

const trackerRender = /\n        <ParentLessonTracker\n[\s\S]*?\n        \/>/;
if (!trackerRender.test(text)) throw new Error('lesson tracker render block not found');
text = text.replace(trackerRender, '');

fs.writeFileSync(path, text);
console.log('Applied Brick P5 canonical Overview wiring.');
