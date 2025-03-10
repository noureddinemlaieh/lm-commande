'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingOutlined, AppstoreOutlined, FileTextOutlined, ContactsOutlined, TeamOutlined, FileOutlined, SettingOutlined, SafetyOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const pathname = usePathname();

  // Fermer automatiquement le sidebar sur les pages de devis en création/édition
  useEffect(() => {
    if (pathname?.includes('/devis/') && (pathname?.includes('/edit') || pathname?.includes('/new'))) {
      setIsOpen(false);
    }
    
    // Gérer l'état des sous-menus en fonction du chemin actuel
    const newExpandedMenus: Record<string, boolean> = {};
    
    menuItems.forEach(item => {
      if (item.children) {
        // Vérifier si le chemin actuel correspond à un enfant de ce menu
        const hasActiveChild = item.children.some(child => 
          pathname === child.href || pathname?.startsWith(child.href + '/')
        );
        
        // Ouvrir le sous-menu uniquement si on est sur une page enfant
        if (hasActiveChild) {
          newExpandedMenus[item.href] = true;
        }
      }
    });
    
    // Mettre à jour l'état des sous-menus
    setExpandedMenus(newExpandedMenus);
  }, [pathname]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleSubMenu = (href: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [href]: !prev[href]
    }));
  };

  const menuItems = [
    {
      href: '/products',
      label: 'Produits',
      icon: <ShoppingOutlined />,
    },
    {
      href: '/catalog',
      label: 'Catalogue',
      icon: <AppstoreOutlined />,
    },
    {
      href: '/devis',
      label: 'Devis',
      icon: <FileOutlined />,
    },
    {
      href: '/invoices',
      label: 'Factures',
      icon: <FileTextOutlined />,
      children: [
        {
          href: '/retention-guarantees',
          label: 'Retenues de garantie',
          icon: <SafetyOutlined />,
        }
      ]
    },
    {
      href: '/clients',
      label: 'Clients',
      icon: <ContactsOutlined />,
    },
    {
      href: '/prescribers',
      label: 'Prescripteurs',
      icon: <TeamOutlined />,
    },
    {
      href: '/settings',
      label: 'Paramètres',
      icon: <SettingOutlined />,
    },
  ];

  return (
    <aside className={`relative bg-white shadow-sm transition-all duration-300 ${
      isOpen ? 'w-48' : 'w-12'
    }`}>
      <button 
        className="toggle-button absolute -right-3 top-4"
        onClick={toggleSidebar}
      >
        {isOpen ? '←' : '→'}
      </button>
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center space-x-2 p-2 rounded-lg ${
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                {isOpen && (
                  <>
                    <span className="flex-grow">{item.label}</span>
                    {item.children && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          toggleSubMenu(item.href);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {expandedMenus[item.href] ? <DownOutlined /> : <RightOutlined />}
                      </button>
                    )}
                  </>
                )}
              </Link>
              {isOpen && item.children && expandedMenus[item.href] && (
                <ul className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        className={`flex items-center space-x-2 p-2 rounded-lg ${
                          pathname === child.href
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {child.icon}
                        <span>{child.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
