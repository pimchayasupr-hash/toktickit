const fs = require('fs');
const { execSync } = require('child_process');

const rawCred = execSync('printf "protocol=https\\nhost=github.com\\n\\n" | git credential-osxkeychain get', { encoding: 'utf8' });
const match = rawCred.match(/^password=(.*)$/m);
if (!match) {
  console.error('No token found');
  process.exit(1);
}
const token = match[1].trim();

const md = fs.readFileSync('docs/lab-04/github-issues.md', 'utf8');

const sections = md.split(/\n### Issue \d+: /).slice(1);
const issues = [];

for (const sec of sections) {
  const titleMatch = sec.match(/- \*\*Title\*\*: `([^`]+)`/);
  const labelsMatch = sec.match(/- \*\*Labels\*\*: `([^`]+)`/);
  const branchMatch = sec.match(/- \*\*Target Branch\*\*: `([^`]+)`/);
  const statusMatch = sec.match(/- \*\*Kanban Status\*\*: \*\*([^\*]+)\*\*/);
  const bodyMatch = sec.match(/- \*\*Body\*\*:\s*```markdown([\s\S]*?)```/);

  if (titleMatch && bodyMatch) {
    const title = titleMatch[1].trim();
    const labels = labelsMatch ? labelsMatch[1].split(',').map(s => s.trim()) : [];
    const branch = branchMatch ? branchMatch[1].trim() : '';
    const status = statusMatch ? statusMatch[1].trim() : 'To Do';
    const body = bodyMatch[1].trim() + `\n\n---\n**Target Branch**: \`${branch}\`\n**Sprint 4 Status**: **${status}**`;
    issues.push({ title, labels, body, status });
  }
}

console.log(`Parsed ${issues.length} issues. Creating on GitHub...`);

const created = [];

for (const issue of issues) {
  const payload = JSON.stringify({
    title: issue.title,
    body: issue.body,
    labels: issue.labels
  });

  const curlCmd = `curl -s -X POST -H "Authorization: Bearer ${token}" -H "Accept: application/vnd.github+json" -H "Content-Type: application/json" -d @- "https://api.github.com/repos/pimchayasupr-hash/toktickit/issues"`;
  
  const res = execSync(curlCmd, { input: payload, encoding: 'utf8' });
  const data = JSON.parse(res);
  if (data.html_url) {
    console.log(`Created Issue #${data.number}: ${data.title} -> ${data.html_url}`);
    created.push({ number: data.number, title: data.title, url: data.html_url, status: issue.status });
  } else {
    console.error(`Failed to create ${issue.title}:`, data.message || data);
  }
}

fs.writeFileSync('docs/lab-04/created-issues.json', JSON.stringify(created, null, 2));
console.log(`\nSuccessfully created ${created.length} issues on GitHub!`);
