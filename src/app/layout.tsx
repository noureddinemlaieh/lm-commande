"use client";

import './react-patch';
import './globals.css'
import './optimized-animations.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'
import AntdProvider from '@/components/providers/AntdProvider'
import { AppProvider } from '@/context/AppContext';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import ProgressiveLoader from '@/components/ui/ProgressiveLoader';
import { useEffect } from 'react';
import { preloadFrequentComponents } from '@/utils/lazyComponents';

// Composant de chargement pour l'application
const AppLoading = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="ant-spin ant-spin-lg ant-spin-spinning">
      <span className="ant-spin-dot ant-spin-dot-spin">
        <i className="ant-spin-dot-item"></i>
        <i className="ant-spin-dot-item"></i>
        <i className="ant-spin-dot-item"></i>
        <i className="ant-spin-dot-item"></i>
      </span>
      <div className="ant-spin-text">Chargement de l'application...</div>
    </div>
  </div>
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Précharger les composants fréquemment utilisés
  useEffect(() => {
    preloadFrequentComponents();
  }, []);

  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          <AntdProvider>
            <AppProvider>
              <ProgressiveLoader 
                fallback={<AppLoading />}
                minDisplayTime={800}
              >
                <Header />
                <div className="flex flex-1">
                  <Sidebar />
                  <main className="flex-1 p-6 overflow-hidden">
                    {children}
                  </main>
                </div>
                <Footer className="mt-auto" />
              </ProgressiveLoader>
            </AppProvider>
          </AntdProvider>
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
} 