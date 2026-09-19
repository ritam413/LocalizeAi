import * as p from '@clack/prompts';
import pc from 'picocolors';
import { SKILLS, SkillInfo } from './skills-data.js';
import { WORKFLOWS, WorkflowPipeline } from './workflows-data.js';

function formatWorkflowDetails(wf: WorkflowPipeline): string {
  const lines: string[] = [];
  lines.push(`${pc.bold(pc.yellow(`[MODE ${wf.id}] ${wf.name}`))}`);
  lines.push(`${pc.dim(wf.tag)}`);
  lines.push('');
  lines.push(`${pc.white(wf.description)}`);
  lines.push('');
  lines.push(`${pc.bold(pc.cyan('Recommended Step-by-Step Skill Pipeline:'))}`);
  lines.push('');

  wf.steps.forEach((s) => {
    const badge = pc.bgBlue(pc.bold(pc.white(` /${s.skill} `)));
    lines.push(`  ${pc.bold(pc.green(`Step ${s.step}:`))} ${badge} ${pc.bold(pc.white(s.role))}`);
    lines.push(`         ${pc.dim('↳')} ${pc.white(s.directive)}`);
    lines.push('');
  });

  return lines.join('\n');
}

function formatSkillDetails(skill: SkillInfo): string {
  const normName = skill.name.toLowerCase();
  const relatedWfs = WORKFLOWS.filter((wf) => wf.steps.some((s) => s.skill === normName));

  const lines: string[] = [];
  lines.push(`${pc.bold(pc.cyan('• Category:       '))} ${pc.bold(pc.green(skill.category))}`);
  lines.push(`${pc.bold(pc.cyan('• Slash Command:  '))} ${pc.bold(pc.yellow(`/${skill.name}`))}`);
  lines.push(`${pc.bold(pc.cyan('• Summary:        '))} ${pc.white(skill.summary)}`);
  lines.push('');
  lines.push(`${pc.bold(pc.cyan('📋 WHAT IT DOES:'))}`);
  lines.push(`  ${pc.white(skill.whatItDoes)}`);
  lines.push('');
  lines.push(`${pc.bold(pc.green('🎯 WHEN TO USE IT:'))}`);
  lines.push(`  ${pc.white(skill.whenToUse)}`);
  lines.push('');
  lines.push(`${pc.bold(pc.yellow('⚡ HOW TO USE IT:'))}`);
  lines.push(`  ${pc.white(skill.howToUse)}`);
  lines.push('');
  lines.push(`${pc.bold(pc.red('🚫 WHEN TO AVOID (ANTI-PATTERNS):'))}`);
  lines.push(`  ${pc.white(skill.whenToAvoid)}`);

  if (relatedWfs.length > 0) {
    lines.push('');
    lines.push(`${pc.bold(pc.magenta('🔗 ASSOCIATED WORKFLOW PIPELINES:'))}`);
    relatedWfs.forEach((wf) => {
      const stepObj = wf.steps.find((s) => s.skill === normName);
      const stepNum = stepObj ? stepObj.step : '?';
      lines.push(`  • ${pc.cyan(wf.name)} ${pc.dim(`(Runs at Step ${stepNum} of ${wf.steps.length})`)}`);
    });
  }

  return lines.join('\n');
}

async function handleWorkflowExplorer() {
  while (true) {
    const choices = WORKFLOWS.map((wf) => ({
      value: String(wf.id),
      label: `Mode ${wf.id}: ${wf.name}`,
      hint: wf.tag,
    }));
    choices.push({ value: 'back', label: '⬅️  Back to Main Menu', hint: 'Return to start' });

    const selected = await p.select({
      message: 'Select a Workflow Pipeline to view its execution sequence:',
      options: choices,
    });

    if (p.isCancel(selected) || selected === 'back') break;

    const wf = WORKFLOWS.find((w) => String(w.id) === selected);
    if (wf) {
      p.note(formatWorkflowDetails(wf), `Mode ${wf.id}: ${wf.name}`);
    }
  }
}

async function handleSkillInspector() {
  while (true) {
    const input = await p.text({
      message: 'Enter skill name to inspect (or press Enter to browse by category):',
      placeholder: 'e.g. serena, repomix, codegraph, tdd, firecrawl, animate',
    });

    if (p.isCancel(input)) break;

    const query = input.trim().toLowerCase().replace(/^\//, '');

    if (query === '') {
      // Browse categories
      const categories = Array.from(new Set(Object.values(SKILLS).map((s) => s.category)));
      const catChoices = categories.map((c) => ({ value: c, label: c }));
      catChoices.push({ value: 'back', label: '⬅️  Back' });

      const selCat = await p.select({
        message: 'Select a Category to browse skills:',
        options: catChoices,
      });

      if (p.isCancel(selCat) || selCat === 'back') continue;

      const skillsInCat = Object.values(SKILLS).filter((s) => s.category === selCat);
      const skillChoices = skillsInCat.map((s) => ({
        value: s.name,
        label: `/${s.name}`,
        hint: s.summary.slice(0, 50) + '...',
      }));
      skillChoices.push({ value: 'back', label: '⬅️  Back', hint: '' });

      const selSkill = await p.select({
        message: `Skills in ${selCat}:`,
        options: skillChoices,
      });

      if (p.isCancel(selSkill) || selSkill === 'back') continue;

      const skillObj = SKILLS[selSkill as string];
      if (skillObj) {
        p.note(formatSkillDetails(skillObj), `Skill Inspector: /${skillObj.name}`);
      }
      continue;
    }

    // Direct search or fuzzy search
    const skillObj = SKILLS[query];
    if (skillObj) {
      p.note(formatSkillDetails(skillObj), `Skill Inspector: /${skillObj.name}`);
    } else {
      const candidates = Object.keys(SKILLS).filter((k) => k.includes(query));
      if (candidates.length > 0) {
        const choiceOptions = candidates.map((cand) => ({
          value: cand,
          label: `/${cand}`,
          hint: SKILLS[cand].summary.slice(0, 50) + '...',
        }));
        choiceOptions.push({ value: 'back', label: '⬅️  Cancel', hint: '' });

        const picked = await p.select({
          message: `Skill '/${query}' not found. Did you mean one of these?`,
          options: choiceOptions,
        });

        if (!p.isCancel(picked) && picked !== 'back') {
          const matchedSkill = SKILLS[picked as string];
          if (matchedSkill) {
            p.note(formatSkillDetails(matchedSkill), `Skill Inspector: /${matchedSkill.name}`);
          }
        }
      } else {
        p.log.error(`Skill '/${query}' was not found in the 77+ skill ecosystem.`);
      }
    }
  }
}

async function handleIntentRecommender() {
  while (true) {
    const objective = await p.select({
      message: 'What is your current engineering objective?',
      options: [
        { value: '3', label: '🔬 Research an external API, RFC, or understand existing codebase logic', hint: 'Mode 3: Research Flow' },
        { value: '2', label: '⚡ Build a new feature or backend business logic using Test-Driven Development', hint: 'Mode 2: Builder Flow' },
        { value: '4', label: '🎨 Design & polish frontend UI, component styling, animations & web vitals', hint: 'Mode 4: Design Flow' },
        { value: '5', label: '🐞 Diagnose a hard bug, regression, race condition, or test failure', hint: 'Mode 5: Debug Flow' },
        { value: '1', label: '🏛️ Plan a large multi-module architecture, epic roadmap, or system design', hint: 'Mode 1: Epic Flow' },
        { value: '6', label: '🛡️ Audit security, find logic flaws, and red-team stress test code', hint: 'Mode 6: Defender Flow' },
        { value: '7', label: '💾 Compact active session and prepare structured handoff record', hint: 'Mode 7: Memory Flow' },
        { value: 'back', label: '⬅️  Back to Main Menu', hint: 'Return to start' },
      ],
    });

    if (p.isCancel(objective) || objective === 'back') break;

    const wf = WORKFLOWS.find((w) => String(w.id) === objective);
    if (wf) {
      p.note(formatWorkflowDetails(wf), `Recommended Skill Pipeline for Your Objective`);
    }
  }
}

async function handleCatalogView() {
  const groups: Record<string, string[]> = {};
  Object.values(SKILLS).forEach((sk) => {
    if (!groups[sk.category]) groups[sk.category] = [];
    groups[sk.category].push(sk.name);
  });

  const lines: string[] = [];
  Object.keys(groups).forEach((cat) => {
    lines.push(`${pc.bold(pc.yellow(`📁 ${cat.toUpperCase()} (${groups[cat].length} skills):`))}`);
    const list = groups[cat].map((s) => pc.cyan(`/${s}`)).join(', ');
    lines.push(`  ${list}`);
    lines.push('');
  });

  p.note(lines.join('\n'), `Complete 77+ Multi-Agent Skill Catalog`);
}

async function runInteractiveMenu() {
  p.intro(pc.bgCyan(pc.black(' ⚡ 413 MULTI-AGENT SKILLS & WORKFLOW COMPASS ')));

  while (true) {
    const action = await p.select({
      message: 'What would you like to explore?',
      options: [
        { value: 'workflows', label: '🚀 Workflow Sequences (Order of skills for Research, Builder, QA, UI)', hint: '7 Step-by-Step Pipelines' },
        { value: 'inspect', label: '🔍 Skill Inspector (Search any skill for When/How/Avoid guide)', hint: '77+ Deep Encyclopedia Cards' },
        { value: 'recommender', label: '🧪 Workflow Recommender (Match your goal to the exact skill sequence)', hint: 'Interactive Intent Matcher' },
        { value: 'catalog', label: '📋 Ecosystem Catalog (All 77+ active skills grouped by category)', hint: 'Full Overview' },
        { value: 'exit', label: '🚪 Exit', hint: 'Quit guide' },
      ],
    });

    if (p.isCancel(action) || action === 'exit') {
      p.outro(pc.bold(pc.green('🚀 Happy coding! Use /skill-name anytime in your agent sessions.')));
      process.exit(0);
    }

    if (action === 'workflows') await handleWorkflowExplorer();
    else if (action === 'inspect') await handleSkillInspector();
    else if (action === 'recommender') await handleIntentRecommender();
    else if (action === 'catalog') await handleCatalogView();
  }
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const helpTriggers = new Set([
    '', '--help', '-help', '-h', '--h', 'help', '/help', '?', '-?', '/?', 'gui', 'menu'
  ]);

  const cleanArgs = rawArgs.map(a => a.toLowerCase().trim());
  const isHelpOrInteractive = rawArgs.length === 0 || cleanArgs.some(a => helpTriggers.has(a));

  // If no args or help / gui trigger, launch interactive Clack UI
  if (isHelpOrInteractive) {
    await runInteractiveMenu();
    return;
  }

  const firstArg = cleanArgs[0].replace(/^[-/]+/, '');

  if (firstArg === 'workflows' || firstArg === '-w') {
    p.intro(pc.bgCyan(pc.black(' 🚀 STANDARDIZED WORKFLOW PIPELINES ')));
    WORKFLOWS.forEach((wf) => {
      console.log(formatWorkflowDetails(wf));
      console.log(pc.dim('─'.repeat(80)));
    });
    p.outro(pc.green('Finished displaying workflows.'));
    return;
  }

  if (firstArg === 'list' || firstArg === '-l' || firstArg === 'catalog') {
    p.intro(pc.bgCyan(pc.black(' 📋 77+ SKILLS CATALOG ')));
    await handleCatalogView();
    p.outro(pc.green('Finished displaying catalog.'));
    return;
  }

  // Direct skill search
  const skill = SKILLS[firstArg];
  if (skill) {
    p.intro(pc.bgCyan(pc.black(` 🔍 SKILL CARD: /${skill.name.toUpperCase()} `)));
    console.log(formatSkillDetails(skill));
    p.outro(pc.green(`Use /${skill.name} in chat to activate.`));
  } else {
    // Try candidate matching
    const candidates = Object.keys(SKILLS).filter((k) => k.includes(firstArg));
    if (candidates.length > 0) {
      p.log.warn(`Skill '/${firstArg}' not found. Did you mean:`);
      candidates.forEach((cand) => console.log(`  • ${pc.cyan(`/${cand}`)}`));
    } else {
      p.log.error(`Skill '/${firstArg}' was not found in the 77+ skill ecosystem.`);
    }
  }
}

main().catch((err) => {
  p.log.error(`Execution error: ${err.message}`);
  process.exit(1);
});
