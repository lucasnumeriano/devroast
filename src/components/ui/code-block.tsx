import type { BundledLanguage } from 'shiki'
import { codeToHtml } from 'shiki'
import { twMerge } from 'tailwind-merge'

type CodeBlockProps = {
  code: string
  lang: BundledLanguage
  filename?: string
  className?: string
}

async function CodeBlock({ code, lang, filename, className }: CodeBlockProps) {
  const html = await codeToHtml(code, {
    lang,
    theme: 'vesper',
  })

  return (
    <div className={twMerge('overflow-hidden border border-zinc-800 bg-zinc-950', className)}>
      <div className={twMerge('flex h-10 items-center gap-3 border-b border-zinc-800 px-4')}>
        <span className="size-2.5 rounded-full bg-red-500" />
        <span className="size-2.5 rounded-full bg-amber-500" />
        <span className="size-2.5 rounded-full bg-emerald-500" />
        <span className="flex-1" />
        {filename && <span className="font-mono text-xs text-zinc-600">{filename}</span>}
      </div>

      <div
        className={twMerge(
          '[&_pre]:overflow-x-auto [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-relaxed',
          '[&_code]:font-mono [&_.line]:before:mr-6 [&_.line]:before:inline-block',
          '[&_.line]:before:w-4 [&_.line]:before:text-right [&_.line]:before:text-zinc-600',
          '[&_.line]:before:content-[counter(line)] [&_.line]:before:[counter-increment:line]',
          '[&_pre]:[counter-reset:line]',
        )}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki output is trusted server-side HTML
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

export { CodeBlock, type CodeBlockProps }
