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
      // Very naive import injection
      content = content.replace(/import [^\n]+;\n/, match => match + "import ClusterSeoNav from '../../components/programs/ClusterSeoNav';\n");
    }
    
    // Finding where to put it at the bottom. Before the last </section> or </div> before </div> );
    // Better: insert right before the main trailing layout.
    // the layout usually ends with `    </div>\n  );\n}` or `    </main>\n  );\n}`
    content = content.replace(/(    <\/(main|div)>\s*\n\s*\);\n\s*}(\n|))$/, (match, p1, p2) => {
      return `      <ClusterSeoNav cluster="${cluster}" />\n${match}`;
    });
    
    fs.writeFileSync(file, content);
    console.log(`Injected ${cluster} into ${file}`);
  });
}

inject(phonicsFiles, 'phonics');
inject(readingFiles, 'phonics');
inject(grammarFiles, 'grammar');
inject(writingFiles, 'grammar');
inject(speakingFiles, 'speaking');
inject(confidenceFiles, 'speaking');

