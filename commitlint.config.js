/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ['@commitlint/config-conventional'],

  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w+)(?:\(([^)]+)\))?(!)?:\s(.+)$/,
      headerCorrespondence: ['type', 'scope', 'breaking', 'subject'],
    },
  },

  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'test',
        'build',
        'ci',
        'docs',
        'chore',
        'style',
        'security',
        'deps',
        'release',
        'wip',
      ],
    ],

    'scope-enum': [
      2,
      'always',
      [
        'api-gateway',
        'auth-service',
        'product-service',
        'order-payment-service',
        'appointment-service',
        'content-service',
        'customer-service',
        'notification-service',
        'analytics-service',
        'shared-utils',
        'shared-types',
        'shared-db',
        'shared-errors',
        'shared-logger',
        'infra',
        'k8s',
        'terraform',
        'docker',
        'ci',
        'scripts',
        'security',
        'deps',
        'monorepo',
        'release',
      ],
    ],

    'scope-case': [2, 'always', 'kebab-case'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-empty': [1, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-min-length': [2, 'always', 10],
    'subject-max-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 120],
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 120],
    'footer-leading-blank': [2, 'always'],
    'footer-max-line-length': [2, 'always', 120],
  },

  ignores: [
    (commit) => commit.startsWith('Merge '),
    (commit) => commit.startsWith('Revert '),
    (commit) => commit.startsWith('Initial commit'),
    (commit) => /^v\d+\.\d+\.\d+/.test(commit),
  ],

  defaultIgnores: true,

  helpUrl: 'https://www.conventionalcommits.org',

  prompt: {
    settings: {},
    messages: {
      skip: ':skip',
      max: 'upper %d chars',
      min: '%d chars at least',
      emptyWarning: 'can not be empty',
      upperLimitWarning: 'over limit',
      lowerLimitWarning: 'below limit',
    },
    questions: {
      type: {
        description: "Select the type of change you're committing",
        enum: {
          feat:     { description: 'A new feature',                                  title: 'Features',          emoji: '✨' },
          fix:      { description: 'A bug fix',                                      title: 'Bug Fixes',         emoji: '🐛' },
          perf:     { description: 'A code change that improves performance',        title: 'Performance',       emoji: '⚡' },
          refactor: { description: 'A code change that neither fixes nor adds feat', title: 'Refactoring',       emoji: '♻️'  },
          security: { description: 'A security fix or hardening change',             title: 'Security',          emoji: '🔒' },
          deps:     { description: 'Dependency updates or removals',                 title: 'Dependencies',      emoji: '📦' },
          test:     { description: 'Adding or updating tests',                       title: 'Tests',             emoji: '✅' },
          docs:     { description: 'Documentation only changes',                     title: 'Documentation',     emoji: '📝' },
          build:    { description: 'Changes to build system or external dependencies',title: 'Build System',     emoji: '🏗️'  },
          ci:       { description: 'Changes to CI/CD configuration',                 title: 'CI/CD',             emoji: '🚀' },
          chore:    { description: 'Other changes that do not modify src or tests',  title: 'Chores',            emoji: '🔧' },
          revert:   { description: 'Reverts a previous commit',                      title: 'Reverts',           emoji: '⏪' },
          style:    { description: 'Code style changes (formatting, whitespace)',    title: 'Code Style',        emoji: '💄' },
          wip:      { description: 'Work in progress — do not merge',               title: 'WIP',               emoji: '🚧' },
          release:  { description: 'Release commit',                                 title: 'Release',           emoji: '🎉' },
        },
      },
      scope: {
        description: 'What is the scope of this change (e.g. service or package name)',
      },
      subject: {
        description: 'Write a short, imperative, lowercase description of the change',
      },
      body: {
        description: 'Provide a longer description of the change (optional)',
      },
      isBreaking: {
        description: 'Are there any breaking changes?',
      },
      breakingBody: {
        description: 'A BREAKING CHANGE commit requires a body. Describe the breaking change',
      },
      breaking: {
        description: 'Describe the breaking changes',
      },
      isIssueAffected: {
        description: 'Does this change affect any open issues?',
      },
      issuesBody: {
        description: 'Add issue references (e.g. "fix #123", "re #456")',
      },
      issues: {
        description: 'Add issue references',
      },
    },
  },
};

module.exports = config;