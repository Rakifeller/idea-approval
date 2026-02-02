'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
  onLogout: () => void
}

export default function DashboardLayout({ children, onLogout }: DashboardLayoutProps) {
  const pathname = usePathname()

  const tabs = [
    { name: 'Influencers', href: '/dashboard/influencers', icon: '👤' },
    { name: 'Ideas', href: '/dashboard/ideas', icon: '💡' },
    { name: 'Content', href: '/dashboard/content', icon: '🎨' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-purple-600">AI Influencer Dashboard</h1>
              </div>
              
              {/* Tabs */}
              <div className="hidden sm:flex sm:space-x-8">
                {tabs.map((tab) => {
                  const isActive = pathname === tab.href
                  return (
                    <Link
                      key={tab.name}
                      href={tab.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-purple-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.name}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Logout Button */}
            <div className="flex items-center">
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}