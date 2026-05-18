'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
        isActive
          ? 'text-[#76b900] bg-gray-800'
          : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
      }`}
    >
      {label}
    </Link>
  );
}
