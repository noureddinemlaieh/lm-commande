import Link from 'next/link';

<nav className="flex gap-4">
  <Link href="/devis" className="text-sm font-medium transition-colors hover:text-primary">
    Devis
  </Link>
  <Link href="/devis/new" className="text-sm font-medium transition-colors hover:text-primary">
    Créer un devis
  </Link>
</nav> 