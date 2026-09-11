import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/common/Navbar';
import { Avatar } from '../../components/common/Avatar';
import { adminService } from '../../services/adminService';
import {
  Users,
  MessageSquare,
  HardDrive,
  UserCheck,
  UserX,
  UserPlus,
  Shield,
  KeyRound,
  Trash2,
  Edit,
  Search,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const AdminPage = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  // Forms state
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
    role: 'USER',
  });
  const [editForm, setEditForm] = useState({
    displayName: '',
    role: 'USER',
  });
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        adminService.getAllStats().catch(() => null),
        adminService.getAllUsers({
          search: search || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
        }).catch(() => ({ users: [], pagination: { page: 1, limit: 10, total: 0, pages: 1 } })),
      ]);

      const resolvedUsers = usersData?.users || [];
      const resolvedStats = {
        totalUsers: statsData?.totalUsers || resolvedUsers.length,
        activeUsers:
          statsData?.activeUsers ||
          resolvedUsers.filter((u) => u.isActive !== false && u.status !== 'inactive').length,
        totalConversations: statsData?.totalConversations || 0,
        totalMessages: statsData?.totalMessages || 0,
        totalFiles: statsData?.totalFiles || 0,
        totalStorageBytes: statsData?.totalStorageBytes || 0,
      };

      setStats(resolvedStats);
      setUsers(resolvedUsers);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load admin data' });
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showNotification = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await adminService.createUser(createForm);
      showNotification('success', `User @${createForm.username} created successfully!`);
      setShowCreateModal(false);
      setCreateForm({ username: '', email: '', password: '', displayName: '', role: 'USER' });
      loadData();
    } catch (err) {
      showNotification('error', err.message || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!showEditModal) return;
    setActionLoading(true);
    try {
      await adminService.updateUser(showEditModal._id, editForm);
      showNotification('success', `User updated successfully!`);
      setShowEditModal(null);
      loadData();
    } catch (err) {
      showNotification('error', err.message || 'Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = !user.isActive;
      await adminService.setUserStatus(user._id, newStatus);
      showNotification(
        'success',
        `User @${user.username} is now ${newStatus ? 'Active' : 'Deactivated'}`
      );
      loadData();
    } catch (err) {
      showNotification('error', err.message || 'Failed to change status');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!showResetPasswordModal) return;
    setActionLoading(true);
    try {
      await adminService.resetPassword(showResetPasswordModal._id, newPassword);
      showNotification('success', `Password reset successfully for @${showResetPasswordModal.username}`);
      setShowResetPasswordModal(null);
      setNewPassword('');
    } catch (err) {
      showNotification('error', err.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!showDeleteModal) return;
    setActionLoading(true);
    try {
      await adminService.deleteUser(showDeleteModal._id);
      showNotification('success', `User @${showDeleteModal.username} deleted permanently.`);
      setShowDeleteModal(null);
      loadData();
    } catch (err) {
      showNotification('error', err.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const formatStorage = (bytes) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: 'clamp(14px, 3vw, 36px)', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {/* Header Title & Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-warning">System Administration</span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.35rem, 3vw, 1.85rem)' }}>Management & Overview</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              Monitor system activity, manage credentials, and control access permissions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={loadData}
              className="btn btn-secondary"
              title="Refresh Data"
              disabled={loading}
              style={{ padding: '8px 14px', fontSize: '0.84rem' }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Sync</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
              style={{ padding: '8px 14px', fontSize: '0.84rem' }}
            >
              <UserPlus size={16} />
              <span>Create User</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className="animate-fade-in"
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: feedback.type === 'success' ? '#6ee7b7' : '#fca5a5',
              fontSize: '0.88rem',
            }}
          >
            {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* System Stats Cards */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 'clamp(10px, 2vw, 18px)',
            marginBottom: '28px',
          }}
        >
          {/* Card 1: Total Users */}
          <div className="card" style={{ padding: 'clamp(12px, 2vw, 20px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Users
                </span>
                <h2 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 1.9rem)', marginTop: '4px' }}>{stats?.totalUsers ?? users.length}</h2>
              </div>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Users size={18} color="var(--primary-light)" />
              </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.74rem', color: 'var(--success)' }}>
              <span>● {stats?.activeUsers ?? users.filter(u => u.isActive).length} active</span>
            </div>
          </div>

          {/* Card 2: Active Conversations */}
          <div className="card" style={{ padding: 'clamp(12px, 2vw, 20px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Conversations
                </span>
                <h2 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 1.9rem)', marginTop: '4px' }}>{stats?.totalConversations ?? 0}</h2>
              </div>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MessageSquare size={18} color="var(--info)" />
              </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              <span>Channels</span>
            </div>
          </div>

          {/* Card 3: Total Messages */}
          <div className="card" style={{ padding: 'clamp(12px, 2vw, 20px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Messages
                </span>
                <h2 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 1.9rem)', marginTop: '4px' }}>{stats?.totalMessages ?? 0}</h2>
              </div>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Shield size={18} color="var(--warning)" />
              </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              <span>Encrypted</span>
            </div>
          </div>

          {/* Card 4: Storage Used */}
          <div className="card" style={{ padding: 'clamp(12px, 2vw, 20px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Storage
                </span>
                <h2 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 1.9rem)', marginTop: '4px' }}>{formatStorage(stats?.totalStorageBytes)}</h2>
              </div>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(217, 70, 239, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <HardDrive size={18} color="#d946ef" />
              </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              <span>{stats?.totalFiles ?? 0} media files</span>
            </div>
          </div>
        </section>

        {/* User Management Section */}
        <section className="card" style={{ padding: '0', overflow: 'hidden' }}>
          {/* Table Toolbar */}
          <div
            style={{
              padding: '16px clamp(12px, 2vw, 24px)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '2px' }}>User Directory</h3>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Viewing {users.length} registered accounts
              </span>
            </div>

            {/* Filter controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: 'auto', flex: '1 1 auto', justifyContent: 'flex-end' }}>
              <div style={{ position: 'relative', flex: '1 1 180px', minWidth: '150px' }}>
                <input
                  type="text"
                  className="input-field"
                  style={{
                    paddingLeft: '34px',
                    paddingTop: '7px',
                    paddingBottom: '7px',
                    fontSize: '0.82rem',
                    width: '100%',
                  }}
                  placeholder="Search user or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
              </div>

              <select
                className="input-field"
                style={{ padding: '7px 10px', fontSize: '0.82rem', width: 'auto', minWidth: '105px', flex: '1 1 105px' }}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="USER">User</option>
              </select>

              <select
                className="input-field"
                style={{ padding: '7px 10px', fontSize: '0.82rem', width: 'auto', minWidth: '110px', flex: '1 1 110px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <th style={{ padding: '14px 24px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>USER</th>
                  <th style={{ padding: '14px 24px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>ROLE</th>
                  <th style={{ padding: '14px 24px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>STATUS</th>
                  <th style={{ padding: '14px 24px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>JOINED</th>
                  <th style={{ padding: '14px 24px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Loading directory...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No users match the search criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u._id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background 0.15s',
                      }}
                      className="card-hover"
                    >
                      {/* User Info */}
                      <td style={{ padding: '14px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Avatar
                            name={u.displayName || u.username}
                            avatarUrl={u.avatar}
                            size={40}
                            isOnline={u.isOnline}
                            showStatus={true}
                          />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#fff' }}>
                              {u.displayName || u.username}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              @{u.username} • {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '14px 24px' }}>
                        {u.role === 'ADMIN' ? (
                          <span className="badge badge-warning">ADMIN</span>
                        ) : (
                          <span className="badge badge-primary">USER</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 24px' }}>
                        {u.isActive ? (
                          <span className="badge badge-success">ACTIVE</span>
                        ) : (
                          <span className="badge badge-danger">INACTIVE</span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td style={{ padding: '14px 24px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {/* Toggle status */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className="btn btn-ghost btn-icon"
                            style={{
                              width: '32px',
                              height: '32px',
                              color: u.isActive ? 'var(--warning)' : 'var(--success)',
                            }}
                            title={u.isActive ? 'Deactivate User' : 'Activate User'}
                          >
                            {u.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => {
                              setShowEditModal(u);
                              setEditForm({ displayName: u.displayName, role: u.role });
                            }}
                            className="btn btn-ghost btn-icon"
                            style={{ width: '32px', height: '32px' }}
                            title="Edit User"
                          >
                            <Edit size={15} />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setShowResetPasswordModal(u);
                              setNewPassword('');
                            }}
                            className="btn btn-ghost btn-icon"
                            style={{ width: '32px', height: '32px', color: 'var(--primary-light)' }}
                            title="Reset Password"
                          >
                            <KeyRound size={15} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setShowDeleteModal(u)}
                            className="btn btn-ghost btn-icon"
                            style={{ width: '32px', height: '32px', color: 'var(--danger)' }}
                            title="Delete User"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ────────────────── Create User Modal ────────────────── */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Provision New User</h3>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Username</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. john_doe"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Display Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. John Doe"
                  value={createForm.displayName}
                  onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="john@dchat.local"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Initial Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Min 6 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Role Assignment</label>
                <select
                  className="input-field"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                >
                  <option value="USER">USER (Regular Chat Access)</option>
                  <option value="ADMIN">ADMIN (Full Administrative Control)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── Edit User Modal ────────────────── */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
          onClick={() => setShowEditModal(null)}
        >
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Edit @{showEditModal.username}</h3>
            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Display Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Role</label>
                <select
                  className="input-field"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── Reset Password Modal ────────────────── */}
      {showResetPasswordModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
          onClick={() => setShowResetPasswordModal(null)}
        >
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Force Reset Password</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Set a new temporary password for @{showResetPasswordModal.username}.
            </p>
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">New Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowResetPasswordModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Updating...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── Delete User Confirmation ────────────────── */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
          onClick={() => setShowDeleteModal(null)}
        >
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={20} color="var(--danger)" />
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>Confirm Account Deletion</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete the account for{' '}
              <strong style={{ color: '#fff' }}>@{showDeleteModal.username}</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowDeleteModal(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteUser}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
