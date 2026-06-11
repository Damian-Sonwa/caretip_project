import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  Edit,
  Download,
  UserPlus,
  X,
} from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AdminMobileSidebar } from './AdminMobileSidebar';
import { DashboardHeader } from './DashboardHeader';
import { Footer } from './Footer';
import AnimatedShaderBackground from './ui/animated-shader-background';
import { useMobileMenuState } from '../hooks/useMobileMenuState';

interface User {
  id: string;
  name: string;
  email: string;
  accountType: string;
  status: 'active' | 'suspended' | 'inactive';
  joinDate: string;
  lastActive: string;
}

interface EditUserModalProps {
  user: User | null;
  onClose: () => void;
  onSave: (user: User) => void;
}

function EditUserModal({ user, onClose, onSave }: EditUserModalProps) {
  const [formData, setFormData] = useState(user || {
    id: '',
    name: '',
    email: '',
    accountType: 'Starter',
    status: 'active' as const,
    joinDate: '',
    lastActive: '',
  });

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card border border-border rounded-xl p-6 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Edit User</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Name
            </label>
            <input
              id="edit-user-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Account type
            </label>
            <select
              value={formData.accountType}
              onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
              className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="Starter">Starter</option>
              <option value="Pro">Pro</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Employee">Employee</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as User['status'] })}
              className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function AdminUsersPage() {
  const { mobileMenuOpen, openMobileMenu, closeMobileMenu } = useMobileMenuState();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleSaveUser = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          status: u.status === 'active' ? 'suspended' : 'active' as User['status']
        };
      }
      return u;
    }));
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedShaderBackground />
      
      <div className="relative z-10">
        <AdminSidebar />
        <AdminMobileSidebar isOpen={mobileMenuOpen} onClose={closeMobileMenu} />

        <div className="lg:pl-64">
          <DashboardHeader onMenuClick={openMobileMenu} />

          <main className="px-4 lg:px-8 py-8 pb-20">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                User Management
              </h1>
              <p className="text-muted-foreground">
                Manage user accounts, roles, and access
              </p>
            </div>

            {/* Actions Bar */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-card border border-border rounded-xl p-4 mb-6"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                {/* Filter */}
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>

                  <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                  </button>

                  <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add User</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Users Table */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-foreground">User</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-foreground">Account type</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-foreground">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-foreground">Joined</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-foreground">Last Active</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                          No users yet. User data will appear here when connected to your backend.
                        </td>
                      </tr>
                    ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-medium text-accent">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            user.accountType === 'Enterprise' ? 'bg-purple-100 text-purple-700' :
                            user.accountType === 'Pro' ? 'bg-blue-100 text-blue-700' :
                            user.accountType === 'Employee' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {user.accountType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                            user.status === 'active' ? 'bg-green-100 text-green-700' :
                            user.status === 'suspended' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              user.status === 'active' ? 'bg-green-500' :
                              user.status === 'suspended' ? 'bg-red-500' :
                              'bg-gray-500'
                            }`} />
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{user.joinDate}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{user.lastActive}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingUser(user)}
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                              title="Edit user"
                            >
                              <Edit className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user.id)}
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                              title={user.status === 'active' ? 'Suspend user' : 'Activate user'}
                            >
                              {user.status === 'active' ? (
                                <UserX className="w-4 h-4 text-red-500" />
                              ) : (
                                <UserCheck className="w-4 h-4 text-green-500" />
                              )}
                            </button>
                            <button
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                              title="More actions"
                            >
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredUsers.length} of {users.length} users
                </p>
                <div className="flex gap-2">
                  <button className="px-3 py-1 border border-border rounded-lg hover:bg-muted transition-colors text-sm">
                    Previous
                  </button>
                  <button className="px-3 py-1 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-sm">
                    1
                  </button>
                  <button className="px-3 py-1 border border-border rounded-lg hover:bg-muted transition-colors text-sm">
                    2
                  </button>
                  <button className="px-3 py-1 border border-border rounded-lg hover:bg-muted transition-colors text-sm">
                    Next
                  </button>
                </div>
              </div>
            </motion.div>
          </main>

          <Footer />
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}
