import { FC, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from '../../lib/supabase';

// Icons
import {
  AcademicCapIcon,
  BookOpenIcon,
  DocumentTextIcon,
  HomeIcon,
  ChartPieIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

type NavItemProps = {
  href: string;
  icon: JSX.Element;
  text: string;
  isActive: boolean;
  isMobile?: boolean;
};

const NavItem: FC<NavItemProps> = ({ href, icon, text, isActive, isMobile = false }) => {
  return (
    <Link
      href={href}
      className={`flex items-center px-4 py-3 mb-2 rounded-md transition-colors ${
        isActive
          ? 'bg-primary-100 text-primary-800'
          : 'hover:bg-gray-100 text-gray-700'
      }`}
    >
      <span className="w-6 h-6 mr-3">{icon}</span>
      <span className={`${isMobile ? 'block' : 'hidden md:block'}`}>{text}</span>
    </Link>
  );
};

const Sidebar: FC = () => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    // The signOut function in supabase.ts handles the redirection
  };

  const navItems = [
    {
      href: '/',
      icon: <HomeIcon />,
      text: 'Dashboard',
    },
    {
      href: '/exams',
      icon: <AcademicCapIcon />,
      text: 'Exams',
    },
    {
      href: '/subjects',
      icon: <BookOpenIcon />,
      text: 'Subjects',
    },
    {
      href: '/chapters',
      icon: <DocumentTextIcon />,
      text: 'Chapters',
    },
    {
      href: '/books',
      icon: <ChartPieIcon />,
      text: 'Books',
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col h-screen w-64 bg-white border-r border-gray-200 p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary-600">PrepPal Admin</h1>
        </div>

        <nav className="flex-1">
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

        <button
          onClick={handleSignOut}
          className="flex items-center px-4 py-3 mt-auto mb-2 text-gray-700 hover:bg-gray-100 rounded-md"
        >
          <ArrowLeftOnRectangleIcon className="w-6 h-6 mr-3" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 m-2 text-gray-500 rounded-md hover:bg-gray-100"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            <div className="relative flex flex-col w-full max-w-xs bg-white">
              <div className="flex items-center justify-between p-4 border-b">
                <h1 className="text-xl font-bold text-primary-600">PrepPal Admin</h1>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-500 rounded-md hover:bg-gray-100"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 p-4">
                {navItems.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    text={item.text}
                    isActive={router.pathname === item.href}
                    isMobile={true}
                  />
                ))}
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-4 py-3 mt-4 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <ArrowLeftOnRectangleIcon className="w-6 h-6 mr-3" />
                  <span>Sign Out</span>
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar; 