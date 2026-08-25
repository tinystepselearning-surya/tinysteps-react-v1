import fs from 'node:fs';

const path = 'src/pages/parent/ParentDashboard.tsx';
let text = fs.readFileSync(path, 'utf8');

const marker = 'const [curriculumTopicModalOpen, setCurriculumTopicModalOpen]';
if (!text.includes(marker)) {
  const anchor = '  const [selectedKidId, setSelectedKidId] = useState<string>("");\n';
  if (!text.includes(anchor)) throw new Error('selectedKidId state anchor not found');
  text = text.replace(
    anchor,
    `${anchor}  const [curriculumTopicModalOpen, setCurriculumTopicModalOpen] = useState(false);\n  const [selectedCurriculumTopic, setSelectedCurriculumTopic] = useState<any>(null);\n`,
  );
}

fs.writeFileSync(path, text);
console.log('P5 ParentDashboard compatibility state repaired.');
