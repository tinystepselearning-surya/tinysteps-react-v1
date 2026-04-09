const fs = require('fs');
const glob = require('glob');

const phonicsFiles = glob.sync('src/pages/public/*Phonic*.tsx');
const readingFiles = glob.sync('src/pages/public/*Reading*.tsx');
const grammarFiles = glob.sync('src/pages/public/*Grammar*.tsx');
const writingFiles = glob.sync('src/pages/public/*Writing*.tsx');
const speakingFiles = glob.sync('src/pages/public/*Speak*.tsx');
const confidenceFiles = glob.sync('src/pages/public/*Confidence*.tsx');

function inject(files, cluster) {
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('ClusterSeoNav')) return;
    
    if (!content.includes('import ClusterSeoNav')) {
      content = content.replace(/import [^\n]+;\n/, match => match + "import ClusterSeoNav from '../../components/programs/ClusterSeoNav';\n");
    }
    
    // Find the last </div> wrapper or main wrapper before the ending component curly brace
    let lastDivMatch = content.match(/(    <\/(main|div|body)>\s*\n\s*\);\n\s*}(\n|))$/);
    if(lastDivMatch) {
       content = content.replace(/(    <\/(main|div|body)>\s*\n\s*\);\n\s*}(\n|))$/, (match, p1, p2) => {
         return `      <ClusterSeoNav cluster="${cluster}" />\n${match}`;
       });
       fs.writeFileSync(file, content);
       console.log(`Injected ${cluster} into ${file}`);
    } else {
       console.log(`Could not find ending for ${file}`);
    }
  });
}

inject(phonicsFiles, 'phonics');
inject(readingFiles, 'phonics');
inject(grammarFiles, 'grammar');
inject(writingFiles, 'grammar');
inject(speakingFiles, 'speaking');
inject(confidenceFiles, 'speaking');
