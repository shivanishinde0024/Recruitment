'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../../components/tables/DataTable';
import FilterBar from '../../../components/forms/FilterBar';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import StatusBadge from '../../../components/ui/StatusBadge';
import api from '../../../services/api';
import { toast } from 'react-toastify';
import { Modal, Button, Form } from 'react-bootstrap';
import { useAuth } from '../../../context/AuthContext';

export default function StaffManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'staff',
    password: ''
  });

  const loadUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: String(page),
        limit: '10',
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter })
      });

      const res = await api.get(`/users?${query.toString()}`);
      if (res.data?.success) {
        setUsers(res.data.data);
        if (res.data.meta) setPagination(res.data.meta);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      const res = await api.post('/users', formData);
      toast.success(
        res.data?.data?.temporaryPassword
          ? `User created! Temporary password: ${res.data.data.temporaryPassword}`
          : 'User created successfully'
      );
      setShowAddModal(false);
      setFormData({ name: '', email: '', mobile: '', role: 'staff', password: '' });
      loadUsers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusTarget) return;
    try {
      setModalLoading(true);
      const newStatus = statusTarget.status === 'active' ? 'inactive' : 'active';
      await api.patch(`/users/${statusTarget.id}/status`, { status: newStatus });
      toast.success(`User marked as ${newStatus}`);
      setStatusTarget(null);
      loadUsers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status change failed');
      setStatusTarget(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      setModalLoading(true);
      await api.delete(`/users/${deleteTarget.id}`);
      toast.success('User deleted successfully');
      setDeleteTarget(null);
      loadUsers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
      setDeleteTarget(null);
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="fw-semibold">{row.name}</div>
          <div className="text-muted small">{row.email}</div>
        </div>
      )
    },
    {
      header: 'Mobile',
      accessor: 'mobile',
      render: (row) => row.mobile || <span className="text-muted">—</span>
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => (
        <span className={`badge ${row.role === 'admin' ? 'bg-dark' : 'bg-primary'}`}>
          {row.role.toUpperCase()}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      width: '200px',
      render: (row) => {
        const isSelf = String(row.id) === String(currentUser?.id);

        return (
          <div className="btn-group btn-group-sm">
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={isSelf}
              onClick={() => setStatusTarget(row)}
            >
              {row.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
            <button
              type="button"
              className="btn btn-outline-danger"
              disabled={isSelf}
              onClick={() => setDeleteTarget(row)}
            >
              Delete
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Staff & Administrator Directory</h1>
          <p className="text-muted small mb-0">Manage internal recruiter team access, administrative permissions, and security roles</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          + Add New Team Member
        </button>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(val) => setSearch(val)}
        filters={[
          {
            label: 'Role',
            value: roleFilter,
            onChange: (val) => setRoleFilter(val),
            options: [
              { label: 'Administrator', value: 'admin' },
              { label: 'Recruiter Staff', value: 'staff' }
            ]
          },
          {
            label: 'Status',
            value: statusFilter,
            onChange: (val) => setStatusFilter(val),
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'Blocked', value: 'blocked' }
            ]
          }
        ]}
        onReset={() => {
          setSearch('');
          setRoleFilter('');
          setStatusFilter('');
        }}
      />

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => loadUsers(p)}
      />

      {/* Add User Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Form onSubmit={handleCreateUser}>
          <Modal.Header closeButton>
            <Modal.Title className="h5 fw-bold">Add Team Member</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Full Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoFocus
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Email Address *</Form.Label>
              <Form.Control
                type="email"
                placeholder="e.g. jdoe@portal.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Mobile Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="+91-9876543210"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Role *</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="staff">Staff (Recruiter)</option>
                <option value="admin">Administrator (Full Access)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Initial Password (Optional)</Form.Label>
              <Form.Control
                type="password"
                placeholder="Leave blank to auto-generate temporary password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowAddModal(false)} disabled={modalLoading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={modalLoading}>
              {modalLoading ? 'Creating...' : 'Create Account'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Status Toggle Modal */}
      <ConfirmModal
        show={Boolean(statusTarget)}
        onHide={() => setStatusTarget(null)}
        onConfirm={handleToggleStatus}
        title="Change Account Status"
        message={`Are you sure you want to ${statusTarget?.status === 'active' ? 'deactivate' : 'activate'} ${statusTarget?.name}'s access?`}
        confirmText="Confirm Status Change"
        confirmVariant={statusTarget?.status === 'active' ? 'warning' : 'success'}
        loading={modalLoading}
      />

      {/* Delete User Modal */}
      <ConfirmModal
        show={Boolean(deleteTarget)}
        onHide={() => setDeleteTarget(null)}
        onConfirm={handleDeleteUser}
        title="Delete User Account"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action soft-deletes the user and terminates all active sessions.`}
        confirmText="Delete User"
        confirmVariant="danger"
        loading={modalLoading}
      />
    </>
  );
}

