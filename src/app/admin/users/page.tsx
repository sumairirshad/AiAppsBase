'use client'

import { useEffect, useState } from 'react'
import { Users, Search, ShieldOff, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

type RoleTab = 'all' | 'buyer' | 'seller' | 'admin'

const roleTabs: { key: RoleTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'buyer', label: 'Buyers' },
  { key: 'seller', label: 'Sellers' },
  { key: 'admin', label: 'Admins' },
]

const roleConfig: Record<string, { label: string; color: string }> = {
  buyer: { label: 'Buyer', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  seller: { label: 'Seller', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  admin: { label: 'Admin', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
}

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  isVerified: boolean
  isBanned: boolean
  isSuspended: boolean
  memberSince: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<RoleTab>('all')
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter((u) => {
    const matchesTab = activeTab === 'all' || u.role === activeTab
    const matchesSearch =
      search === '' ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  const updateUser = async (id: string, action: string) => {
    setUpdating(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id !== id) return u
            return {
              ...u,
              isBanned: action === 'ban' ? true : action === 'unban' ? false : u.isBanned,
              isSuspended: action === 'suspend' ? true : action === 'unsuspend' ? false : u.isSuspended,
            }
          })
        )
      }
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
        <p className="text-surface-400">Manage platform users, roles, and access.</p>
      </div>

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

      <div className="flex gap-1 mb-6 p-1 glass rounded-lg w-fit">
        {roleTabs.map((tab) => {
          const count = tab.key === 'all' ? users.length : users.filter((u) => u.role === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-brand-600 text-white' : 'text-surface-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['User', 'Email', 'Role', 'Member Since', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((user) => {
                const role = roleConfig[user.role] ?? { label: user.role, color: 'text-surface-400' }
                const isUpdating = updating === user.id
                const statusLabel = user.isBanned ? 'Banned' : user.isSuspended ? 'Suspended' : 'Active'
                const statusColor = user.isBanned
                  ? 'text-red-400 bg-red-500/10 border-red-500/20'
                  : user.isSuspended
                  ? 'text-orange-400 bg-orange-500/10 border-orange-500/20'
                  : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'

                return (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-surface-300">{user.email}</td>
                    <td className="p-4">
                      <span className={`badge border text-xs ${role.color}`}>{role.label}</span>
                    </td>
                    <td className="p-4 text-sm text-surface-400">{timeAgo(user.memberSince)}</td>
                    <td className="p-4">
                      <span className={`badge border text-xs ${statusColor}`}>{statusLabel}</span>
                    </td>
                    <td className="p-4">
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin text-surface-400" />
                      ) : (
                        <div className="flex items-center gap-2">
                          {!user.isBanned ? (
                            <button
                              onClick={() => updateUser(user.id, 'ban')}
                              className="text-xs px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1"
                            >
                              <ShieldOff className="w-3 h-3" /> Ban
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUser(user.id, 'unban')}
                              className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" /> Unban
                            </button>
                          )}
                          {!user.isSuspended ? (
                            <button
                              onClick={() => updateUser(user.id, 'suspend')}
                              className="text-xs px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors flex items-center gap-1"
                            >
                              <ShieldAlert className="w-3 h-3" /> Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUser(user.id, 'unsuspend')}
                              className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" /> Unsuspend
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="glass rounded-xl p-12 text-center mt-4">
            <Users className="w-12 h-12 text-surface-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No users found</h3>
            <p className="text-surface-400">Try adjusting your search or filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}
