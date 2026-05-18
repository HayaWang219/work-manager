import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavLink from "@/components/NavLink";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Influencer Manager",
  description: "Influencer marketing management tool for NVIDIA GeForce",
};

const NAV_LINKS = [
  { href: "/", label: "Creators" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/contacts", label: "Contacts" },
  { href: "/reports", label: "Reports" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-gray-950 text-gray-100">
        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col min-h-screen sticky top-0">
          {/* Brand */}
          <div className="px-5 py-5 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-[#76b900] text-sm leading-none">●</span>
              <span className="text-sm font-semibold text-gray-100 leading-tight">
                Influencer Manager
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 pl-4">NVIDIA GeForce</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>

          {/* Sign out */}
          <div className="px-3 py-4 border-t border-gray-800">
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="w-full text-left px-3 py-2 rounded-md text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-h-screen overflow-auto">{children}</main>
      </body>
    </html>
  );
}
