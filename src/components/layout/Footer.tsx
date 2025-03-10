import React from 'react'

interface FooterProps {
  className?: string;
}

export const Footer = ({ className = '' }: FooterProps) => {
  return (
    <footer className={`footer ${className}`}>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600">© 2024 Mon Application. Tous droits réservés.</p>
          <div className="mt-4 md:mt-0">
            <nav className="flex space-x-4">
              <a href="/mentions-legales" className="text-gray-600 hover:text-gray-900">
                Mentions légales
              </a>
              <a href="/confidentialite" className="text-gray-600 hover:text-gray-900">
                Confidentialité
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
