'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-4">
        <ul className="flex space-x-6">
          <li>
            <Link 
              href="/" 
              className={`${pathname === '/' ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-800`}
            >
              Accueil
            </Link>
          </li>
          <li>
            <Link 
              href="/products" 
              className={`${pathname === '/products' ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-800`}
            >
              Produits
            </Link>
          </li>
          <li>
            <Link 
              href="/catalog" 
              className={`${pathname === '/catalog' ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-800`}
            >
              Catalogue
            </Link>
          </li>
          <li>
            <Link 
              href="/contact" 
              className={`${pathname === '/contact' ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-800`}
            >
              Contact
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
