import Link from 'next/link'
import { Button } from '@/components/ui/button'

function RoastErrorView() {
  return (
    <main className="flex flex-col items-center justify-center gap-6 px-20 py-20">
      <p className="font-mono text-sm text-zinc-500">
        {'// something went wrong while roasting your code'}
      </p>
      <Link href="/">
        <Button variant="primary" size="md">
          $ try_again
        </Button>
      </Link>
    </main>
  )
}

export { RoastErrorView }
