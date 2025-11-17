'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Modules', href: '/modules', icon: '📚', badge: 'Lecture' },
  { name: 'Questions', href: '/questions', icon: '❓' },
  { name: 'Ressources', href: '/resources', icon: '📁' },
  { name: 'Import/Export', href: '/import-export', icon: '📤' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-gray-400 text-sm">MCQ Study App</p>
      </div>

      <nav className="space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-xs px-2 py-1 bg-gray-700 rounded">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
