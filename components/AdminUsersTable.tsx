'use client';

import { useState, useMemo } from 'react';
import type { Profile, UserRole, SubscriptionStatus } from '@/types';
import PromoteUserButton from '@/components/PromoteUserButton';

interface Props {
  users: Profile[];
}

export default function AdminUsersTable({ users }: Props) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [planFilter, setPlanFilter] = useState<SubscriptionStatus | 'all'>('all');

  //Using supabase fetches to filter users
  // useMemo remembers the filtered list until there is a change in the input values
  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (planFilter !== 'all' && u.subscription_status !== planFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const name = (u.display_name ?? '').toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    });
  }, [users, roleFilter, planFilter, search]);

  return (
    <div>
      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)} //Update as the user puts text into the input
          className="rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
          className="rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value as SubscriptionStatus | 'all')}
          className="rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
        </select>
        {(search || roleFilter !== 'all' || planFilter !== 'all') && (
          <button
            onClick={() => {
              setSearch('');
              setRoleFilter('all');
              setPlanFilter('all');
            }}
            className="rounded border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No users match the current filters.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="whitespace-nowrap pb-3 pr-4 font-medium text-muted-foreground">
                  Name
                </th>
                <th className="whitespace-nowrap pb-3 pr-4 font-medium text-muted-foreground">
                  Email
                </th>
                <th className="whitespace-nowrap pb-3 pr-4 font-medium text-muted-foreground">
                  Role
                </th>
                <th className="whitespace-nowrap pb-3 pr-4 font-medium text-muted-foreground">
                  Plan
                </th>
                <th className="whitespace-nowrap pb-3 pr-4 font-medium text-muted-foreground">
                  Joined
                </th>
                <th className="whitespace-nowrap pb-3 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap py-3 pr-4 text-foreground">
                    {user.display_name || '—'}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-4 text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-3 pr-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        user.subscription_status === 'premium'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {user.subscription_status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-3 pr-4 text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap py-3">
                    <PromoteUserButton
                      userId={user.id}
                      email={user.email}
                      isAdmin={user.role === 'admin'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
