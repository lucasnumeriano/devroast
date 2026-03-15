import type { Extension } from '@codemirror/state'

type LanguageDefinition = {
  id: string
  label: string
  codemirror: () => Promise<Extension>
}

const LANGUAGES: LanguageDefinition[] = [
  {
    id: 'javascript',
    label: 'JavaScript',
    codemirror: () =>
      import('@codemirror/lang-javascript').then((m) => m.javascript({ jsx: true })),
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    codemirror: () =>
      import('@codemirror/lang-javascript').then((m) =>
        m.javascript({ jsx: true, typescript: true }),
      ),
  },
  {
    id: 'python',
    label: 'Python',
    codemirror: () => import('@codemirror/lang-python').then((m) => m.python()),
  },
  {
    id: 'java',
    label: 'Java',
    codemirror: () => import('@codemirror/lang-java').then((m) => m.java()),
  },
  {
    id: 'c',
    label: 'C',
    codemirror: () => import('@codemirror/lang-cpp').then((m) => m.cpp()),
  },
  {
    id: 'cpp',
    label: 'C++',
    codemirror: () => import('@codemirror/lang-cpp').then((m) => m.cpp()),
  },
  {
    id: 'cs',
    label: 'C#',
    codemirror: () => import('@replit/codemirror-lang-csharp').then((m) => m.csharp()),
  },
  {
    id: 'go',
    label: 'Go',
    codemirror: () => import('@codemirror/lang-go').then((m) => m.go()),
  },
  {
    id: 'rust',
    label: 'Rust',
    codemirror: () => import('@codemirror/lang-rust').then((m) => m.rust()),
  },
  {
    id: 'php',
    label: 'PHP',
    codemirror: () => import('@codemirror/lang-php').then((m) => m.php()),
  },
  {
    id: 'html',
    label: 'HTML',
    codemirror: () => import('@codemirror/lang-html').then((m) => m.html()),
  },
  {
    id: 'css',
    label: 'CSS',
    codemirror: () => import('@codemirror/lang-css').then((m) => m.css()),
  },
  {
    id: 'sql',
    label: 'SQL',
    codemirror: () => import('@codemirror/lang-sql').then((m) => m.sql()),
  },
  {
    id: 'json',
    label: 'JSON',
    codemirror: () => import('@codemirror/lang-json').then((m) => m.json()),
  },
  {
    id: 'markdown',
    label: 'Markdown',
    codemirror: () => import('@codemirror/lang-markdown').then((m) => m.markdown()),
  },
  {
    id: 'yaml',
    label: 'YAML',
    codemirror: () => import('@codemirror/lang-yaml').then((m) => m.yaml()),
  },
  {
    id: 'shell',
    label: 'Shell',
    codemirror: () =>
      Promise.all([
        import('@codemirror/legacy-modes/mode/shell'),
        import('@codemirror/language'),
      ]).then(([shell, { StreamLanguage }]) => StreamLanguage.define(shell.shell)),
  },
  {
    id: 'ruby',
    label: 'Ruby',
    codemirror: () =>
      Promise.all([
        import('@codemirror/legacy-modes/mode/ruby'),
        import('@codemirror/language'),
      ]).then(([ruby, { StreamLanguage }]) => StreamLanguage.define(ruby.ruby)),
  },
  {
    id: 'kotlin',
    label: 'Kotlin',
    codemirror: () =>
      Promise.all([
        import('@codemirror/legacy-modes/mode/clike'),
        import('@codemirror/language'),
      ]).then(([clike, { StreamLanguage }]) => StreamLanguage.define(clike.kotlin)),
  },
  {
    id: 'swift',
    label: 'Swift',
    codemirror: () =>
      Promise.all([
        import('@codemirror/legacy-modes/mode/swift'),
        import('@codemirror/language'),
      ]).then(([swift, { StreamLanguage }]) => StreamLanguage.define(swift.swift)),
  },
]

const LANGUAGE_MAP = new Map(LANGUAGES.map((lang) => [lang.id, lang]))

function getLanguageById(id: string): LanguageDefinition | undefined {
  return LANGUAGE_MAP.get(id)
}

export { getLanguageById, LANGUAGES, type LanguageDefinition }
