'use client'

import { useState } from 'react'
import { Users, Search, Shield, ShieldAlert, ShieldOff, AlertTriangle } from 'lucide-react'
import { mockUsers } from '@/lib/mock-data'
import { timeAgo } from '@/lib/utils'
import { User, UserRole } from '@/types'

type RoleTab = 'all' | 'buyer' | 'seller' | 'admin'

const roleTabs: { key: RoleTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'buyer', label: 'Buyers' },
  { key: 'seller', label: 'Sellers' },
  { key: 'admin', label: 'Admins' },
]

const roleConfig: Record<UserRole, { label: string; color: string }> = {
  buyer: { label: 'Buyer', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  seller: { label: 'Seller', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  admin: { label: 'Admin', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
}

const allUsers: User[] = [
  ...mockUsers,
  {
    id: '5',
    name: 'Admin User',
    email: 'admin@example.com',
    avatar: '/avatars/5.jpg',
    role: 'admin',
    memberSince: '2023-06-01',
  },
  {
    id: '6',
    name: 'Lisa Park',
    email: 'lisa@example.com',
    avatar: '/avatars/6.jpg',
    role: 'buyer',
    memberSince: '2025-01-12',
  },
  {
    id: '7',
    name: 'David Chen',
    email: 'david@example.com',
    avatar: '/avatars/7.jpg',
    role: 'seller',
    memberSince: '2024-09-20',
    rating: 4.3,
    totalSales: 145,
    badges: ['Verified'],
  },
]

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<RoleTab>('all')
  const [search, setSearch] = useState('')

  const filtered = allUsers.filter((user) => {
    const matchesTab = activeTab === 'all' || user.role === activeTab
    const matchesSearch =
      search === '' ||
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
        <p className="text-surface-400">Manage platform users, roles, and access.</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field w-full pl-10"
        />
      </div>

      {/* Role Filter Tabs */}
      <div className="flex gap-1 mb-6 p-1 glass rounded-lg w-fit">
        {roleTabs.map((tab) => {
          const count =
            tab.key === 'all'
              ? allUsers.length
              : allUsers.filter((u) => u.role === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-brand-600 text-white'
                  : 'text-surface-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      {/* User Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  User
                </th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Member Since
                </th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((user) => {
                const role = roleConfig[user.role]
                return (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-surface-300">{user.email}</td>
                    <td className="p-4">
                      <span className={`badge border text-xs ${role.color}`}>{role.label}</span>
                    </td>
                    <td className="p-4 text-sm text-surface-400">
                      {timeAgo(user.memberSince)}
                    </td>
                    <td className="p-4">
                      <span className="badge border text-xs text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                        Active
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button className="text-xs px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1">
                          <ShieldOff className="w-3 h-3" /> Ban
                        </button>
                        <button className="text-xs px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Suspend
                        </button>
                        <button className="text-xs px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Warn
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="glass rounded-xl p-12 text-center mt-4">
          <Users className="w-12 h-12 text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No users found</h3>
          <p className="text-surface-400">Try adjusting your search or filter.</p>
        </div>
      )}
    </div>
  )
}
