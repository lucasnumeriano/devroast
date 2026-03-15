import type { BundledLanguage } from 'shiki'
import { codeToHtml } from 'shiki'
import { twMerge } from 'tailwind-merge'

type CodeBlockProps = {
  code: string
  lang: BundledLanguage
  showLineNumbers?: boolean
  className?: string
}

async function CodeBlock({ code, lang, showLineNumbers = true, className }: CodeBlockProps) {
  const html = await codeToHtml(code, {
    lang,
    theme: 'vesper',
  })

  return (
    <div
      className={twMerge(
        'overflow-hidden bg-zinc-950',
        showLineNumbers
          ? [
              '[&_.line]:before:mr-6 [&_.line]:before:inline-block',
              '[&_.line]:before:w-4 [&_.line]:before:text-right [&_.line]:before:text-zinc-600',
              '[&_.line]:before:content-[counter(line)] [&_.line]:before:[counter-increment:line]',
              '[&_pre]:[counter-reset:line]',
            ]
          : '',
        '[&_pre]:overflow-x-auto [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[13px]',
        '[&_pre]:leading-relaxed [&_code]:font-mono',
        className,
      )}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki output is trusted server-side HTML
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export { CodeBlock, type CodeBlockProps }
