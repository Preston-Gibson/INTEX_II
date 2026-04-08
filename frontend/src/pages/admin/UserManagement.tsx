import { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { authHeaders } from '../../utils/auth';

const API = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/users`;

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  roles: string[];
}

type ModalMode = 'add' | 'edit' | 'role' | 'password' | 'delete' | 'add-role' | null;

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
  'w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20';
const selectCls =
  'w-full bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cls =
    role === 'Admin'
      ? 'bg-primary/10 text-primary'
      : role === 'Donor'
      ? 'bg-secondary/10 text-secondary'
      : 'bg-surface-container-high text-on-surface-variant';
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>{role}</span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function UserManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Add user form
  const [addForm, setAddForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: '' });

  // Edit user form
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '' });

  // Role form
  const [selectedRole, setSelectedRole] = useState('');

  // Password form
  const [newPassword, setNewPassword] = useState('');

  // New role form
  const [newRoleName, setNewRoleName] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(API, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/roles`, { headers: authHeaders() }).then(r => r.json()),
    ])
      .then(([usersData, rolesData]) => {
        setUsers(usersData);
        setRoles(rolesData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const closeModal = () => {
    setModalMode(null);
    setSelectedUser(null);
    setFormError(null);
    setSaving(false);
    setAddForm({ firstName: '', lastName: '', email: '', password: '', role: '' });
    setEditForm({ firstName: '', lastName: '', email: '' });
    setSelectedRole('');
    setNewPassword('');
    setNewRoleName('');
  };

  const openEdit = (user: UserRow) => {
    setSelectedUser(user);
    setEditForm({ firstName: user.firstName, lastName: user.lastName, email: user.email });
    setModalMode('edit');
  };

  const openRole = (user: UserRow) => {
    setSelectedUser(user);
    setSelectedRole(user.roles[0] ?? '');
    setModalMode('role');
  };

  const openPassword = (user: UserRow) => {
    setSelectedUser(user);
    setModalMode('password');
  };

  const openDelete = (user: UserRow) => {
    setSelectedUser(user);
    setModalMode('delete');
  };

  // ── API actions ──────────────────────────────────────────────────────────────

  const handleAddUser = async () => {
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setFormError(err?.[0]?.description ?? err?.title ?? 'Failed to create user.');
        return;
      }
      fetchData();
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(`${API}/${selectedUser.id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setFormError(err?.[0]?.description ?? err?.title ?? 'Failed to update user.');
        return;
      }
      fetchData();
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleSetRole = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(`${API}/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setFormError(err?.title ?? 'Failed to update role.');
        return;
      }
      fetchData();
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(`${API}/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setFormError(err?.[0]?.description ?? err?.title ?? 'Failed to reset password.');
        return;
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(`${API}/${selectedUser.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setFormError(err?.title ?? 'Failed to delete user.');
        return;
      }
      fetchData();
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = async () => {
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(`${API}/roles`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoleName }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setFormError(err?.title ?? 'Failed to create role.');
        return;
      }
      fetchData();
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (name: string) => {
    if (!confirm(`Delete role "${name}"? This will not remove it from existing users immediately.`)) return;
    await fetch(`${API}/roles/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    fetchData();
  };

  // ── Filtered users ────────────────────────────────────────────────────────────

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q)
    );
  });

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-headline font-bold text-on-surface">User Management</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Hidden admin route — manage accounts and roles</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setModalMode('add-role')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
              Manage Roles
            </button>
            <button
              onClick={() => setModalMode('add')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#00696b' }}
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Add User
            </button>
          </div>
        </div>

        {/* Roles overview strip */}
        <div className="flex items-center gap-3 mb-6 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-4 py-3">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Roles</span>
          {roles.map(r => (
            <RoleBadge key={r} role={r} />
          ))}
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-3 py-2 bg-surface-container-low rounded-xl text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-on-surface-variant text-sm">Loading…</div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-on-surface-variant text-sm">No users found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Name</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Email</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Roles</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, i) => (
                  <tr
                    key={user.id}
                    className={`border-b border-outline-variant/10 ${i % 2 === 0 ? '' : 'bg-surface-container-lowest/40'} hover:bg-surface-container-low/50 transition-colors`}
                  >
                    <td className="px-4 py-3 font-medium text-on-surface">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{user.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length > 0
                          ? user.roles.map(r => <RoleBadge key={r} role={r} />)
                          : <span className="text-on-surface-variant text-xs italic">No role</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <ActionBtn icon="edit" title="Edit user" onClick={() => openEdit(user)} />
                        <ActionBtn icon="manage_accounts" title="Change role" onClick={() => openRole(user)} />
                        <ActionBtn icon="lock_reset" title="Reset password" onClick={() => openPassword(user)} />
                        <ActionBtn icon="delete" title="Delete user" onClick={() => openDelete(user)} danger />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-[11px] text-on-surface-variant mt-4 text-right">
          {filteredUsers.length} of {users.length} users
        </p>
      </main>

      {/* ── Modals ─────────────────────────────────────────────────────────────── */}

      {/* Add User */}
      {modalMode === 'add' && (
        <Modal title="Add New User" onClose={closeModal}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name">
                <input className={inputCls} value={addForm.firstName} onChange={e => setAddForm(f => ({ ...f, firstName: e.target.value }))} />
              </Field>
              <Field label="Last Name">
                <input className={inputCls} value={addForm.lastName} onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))} />
              </Field>
            </div>
            <Field label="Email">
              <input type="email" className={inputCls} value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
            </Field>
            <Field label="Password">
              <input type="password" className={inputCls} value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} />
            </Field>
            <Field label="Role">
              <select className={selectCls} value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}>
                <option value="">— Select role —</option>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </div>
          {formError && <p className="text-error text-xs mt-3">{formError}</p>}
          <ModalFooter onCancel={closeModal} onConfirm={handleAddUser} loading={saving} confirmLabel="Create User" />
        </Modal>
      )}

      {/* Edit User */}
      {modalMode === 'edit' && selectedUser && (
        <Modal title={`Edit — ${selectedUser.firstName} ${selectedUser.lastName}`} onClose={closeModal}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name">
                <input className={inputCls} value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} />
              </Field>
              <Field label="Last Name">
                <input className={inputCls} value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} />
              </Field>
            </div>
            <Field label="Email">
              <input type="email" className={inputCls} value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
            </Field>
          </div>
          {formError && <p className="text-error text-xs mt-3">{formError}</p>}
          <ModalFooter onCancel={closeModal} onConfirm={handleEditUser} loading={saving} confirmLabel="Save Changes" />
        </Modal>
      )}

      {/* Change Role */}
      {modalMode === 'role' && selectedUser && (
        <Modal title={`Change Role — ${selectedUser.firstName} ${selectedUser.lastName}`} onClose={closeModal}>
          <p className="text-sm text-on-surface-variant mb-4">
            Current role(s): {selectedUser.roles.join(', ') || 'None'}. This will replace all existing roles.
          </p>
          <Field label="Assign Role">
            <select className={selectCls} value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
              <option value="">— Select role —</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          {formError && <p className="text-error text-xs mt-3">{formError}</p>}
          <ModalFooter onCancel={closeModal} onConfirm={handleSetRole} loading={saving} confirmLabel="Update Role" />
        </Modal>
      )}

      {/* Reset Password */}
      {modalMode === 'password' && selectedUser && (
        <Modal title={`Reset Password — ${selectedUser.firstName} ${selectedUser.lastName}`} onClose={closeModal}>
          <p className="text-sm text-on-surface-variant mb-4">
            Set a new password for <strong>{selectedUser.email}</strong>. Minimum 14 characters.
          </p>
          <Field label="New Password">
            <input type="password" className={inputCls} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </Field>
          {formError && <p className="text-error text-xs mt-3">{formError}</p>}
          <ModalFooter onCancel={closeModal} onConfirm={handleResetPassword} loading={saving} confirmLabel="Reset Password" />
        </Modal>
      )}

      {/* Delete User */}
      {modalMode === 'delete' && selectedUser && (
        <Modal title="Delete User" onClose={closeModal}>
          <p className="text-sm text-on-surface mb-4">
            Are you sure you want to delete <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> ({selectedUser.email})?
            This action cannot be undone.
          </p>
          {formError && <p className="text-error text-xs mt-3">{formError}</p>}
          <ModalFooter onCancel={closeModal} onConfirm={handleDeleteUser} loading={saving} confirmLabel="Delete" danger />
        </Modal>
      )}

      {/* Manage Roles */}
      {modalMode === 'add-role' && (
        <Modal title="Manage Roles" onClose={closeModal}>
          <div className="mb-4">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Existing Roles</p>
            <div className="space-y-2">
              {roles.map(r => (
                <div key={r} className="flex items-center justify-between bg-surface-container-low rounded-xl px-3 py-2">
                  <RoleBadge role={r} />
                  <button
                    onClick={() => handleDeleteRole(r)}
                    className="text-error text-xs font-semibold hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-outline-variant/20 pt-4 mt-4">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Add New Role</p>
            <Field label="Role Name">
              <input className={inputCls} value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="e.g. Volunteer" />
            </Field>
          </div>
          {formError && <p className="text-error text-xs mt-3">{formError}</p>}
          <ModalFooter onCancel={closeModal} onConfirm={handleAddRole} loading={saving} confirmLabel="Add Role" />
        </Modal>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ActionBtn({ icon, title, onClick, danger }: { icon: string; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded-lg transition-colors ${
        danger
          ? 'text-error hover:bg-error/10'
          : 'text-on-surface-variant hover:bg-surface-container-low'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20">
          <h2 className="text-base font-headline font-bold text-on-surface">{title}</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({
  onCancel,
  onConfirm,
  loading,
  confirmLabel,
  danger,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
  confirmLabel: string;
  danger?: boolean;
}) {
  return (
    <div className="flex justify-end gap-3 mt-6">
      <button
        onClick={onCancel}
        className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 ${
          danger ? 'bg-error' : ''
        }`}
        style={!danger ? { backgroundColor: '#00696b' } : undefined}
      >
        {loading ? 'Saving…' : confirmLabel}
      </button>
    </div>
  );
}
