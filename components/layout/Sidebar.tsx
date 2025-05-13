import { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from '../../lib/supabase';
import { useTheme } from '../../lib/themeContext';

// Icons
import {
  AcademicCapIcon,
  BookOpenIcon,
  DocumentTextIcon,
  HomeIcon,
  BookmarkIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

type NavItemProps = {
  href: string;
  icon: JSX.Element;
  text: string;
  isActive: boolean;
  onClick?: () => void;
};

const NavItem: FC<NavItemProps> = ({ href, icon, text, isActive, onClick }) => {
  return (
    <Link
      href={href}
      className={`flex items-center px-4 py-3 mb-2 rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 font-medium'
          : 'hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/60'
      }`}
      onClick={onClick}
    >
      <span className="w-6 h-6 mr-3">{icon}</span>
      <span>{text}</span>
    </Link>
  );
};

const Sidebar: FC = () => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.getElementById('mobile-sidebar');
      if (sidebar && !sidebar.contains(event.target) && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    await signOut();
    // The signOut function in supabase.ts handles the redirection
  };

  const navItems = [
    {
      href: '/',
      icon: <HomeIcon className="stroke-2" />,
      text: 'Dashboard',
    },
    {
      href: '/exams',
      icon: <AcademicCapIcon className="stroke-2" />,
      text: 'Exams',
    },
    {
      href: '/subjects',
      icon: <BookOpenIcon className="stroke-2" />,
      text: 'Subjects',
    },
    {
      href: '/chapters',
      icon: <DocumentTextIcon className="stroke-2" />,
      text: 'Chapters',
    },
    {
      href: '/books',
      icon: <BookmarkIcon className="stroke-2" />,
      text: 'Books',
    },
  ];

  // Get current page title
  const getCurrentPageTitle = () => {
    // First try exact match
    const exactMatch = navItems.find(item => item.href === router.pathname);
    if (exactMatch) return exactMatch.text;
    
    // Then try prefix match for nested routes (like /exams/new)
    const pathParts = router.pathname.split('/');
    if (pathParts.length > 1) {
      const baseRoute = '/' + pathParts[1]; // e.g., '/exams' from '/exams/new'
      const prefixMatch = navItems.find(item => item.href === baseRoute);
      if (prefixMatch) return prefixMatch.text;
    }
    
    // Default fallback
    return 'Dashboard';
  };

  // Handle add button click based on current path
  const handleAddClick = () => {
    // Each page has its own add functionality
    // Triggering the buttons in the respective pages
    const addButtonElement = document.querySelector('[data-add-button="true"]') as HTMLButtonElement;
    if (addButtonElement) {
      addButtonElement.click();
    }
  };

  // Determine if we should show Add button (not for dashboard)
  const shouldShowAddButton = router.pathname !== '/';

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200 shadow-sm">
        <div className="mb-8">
          <div className="flex items-center space-x-2 py-2">
            <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-primary-600 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
              P
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 text-transparent bg-clip-text">PrepPal Admin</h1>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              text={item.text}
              isActive={router.pathname === item.href}
            />
          ))}
        </nav>

        <div className="pt-4 mt-auto border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={toggleTheme}
            className="flex items-center w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 rounded-xl transition-all duration-200"
          >
            {isDarkMode ? (
              <>
                <SunIcon className="w-6 h-6 mr-3 stroke-2" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <MoonIcon className="w-6 h-6 mr-3 stroke-2" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 rounded-xl transition-all duration-200"
          >
            <ArrowLeftOnRectangleIcon className="w-6 h-6 mr-3 stroke-2" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Header and Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6 stroke-2" />
              ) : (
                <Bars3Icon className="w-6 h-6 stroke-2" />
              )}
            </button>
            
            <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-primary-600 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
              P
            </div>
            <h2 className="text-base font-bold text-gray-800 dark:text-white">{getCurrentPageTitle()}</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            {shouldShowAddButton && (
              <button
                onClick={handleAddClick}
                className="p-2 text-white bg-primary-600 rounded-full hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700"
                aria-label="Add new item"
              >
                <PlusIcon className="w-5 h-5 stroke-2" />
              </button>
            )}
            
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isDarkMode ? (
                <SunIcon className="w-6 h-6 stroke-2" />
              ) : (
                <MoonIcon className="w-6 h-6 stroke-2" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-0 z-20 md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)}></div>
        
        <div
          id="mobile-sidebar"
          className={`absolute top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 mt-12">
            <nav className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  text={item.text}
                  isActive={router.pathname === item.href}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
              
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 rounded-xl transition-all duration-200"
                >
                  <ArrowLeftOnRectangleIcon className="w-6 h-6 mr-3 stroke-2" />
                  <span>Sign Out</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>
      
      {/* Mobile Content Padding */}
      <div className="md:hidden h-16"></div>
    </>
  );
};

export default Sidebar; 