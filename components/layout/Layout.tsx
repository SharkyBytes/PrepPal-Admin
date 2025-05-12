import { FC, ReactNode } from 'react';
import Sidebar from './Sidebar';

type LayoutProps = {
  children: ReactNode;
};

const Layout: FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {children}
      </main>
    </div>
  );
};

export default Layout; 