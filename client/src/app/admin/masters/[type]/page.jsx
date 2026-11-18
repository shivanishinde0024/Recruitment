'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import RoleLayout from '../../../../components/layout/RoleLayout';
import DataTable from '../../../../components/tables/DataTable';
import FilterBar from '../../../../components/forms/FilterBar';
import ConfirmModal from '../../../../components/modals/ConfirmModal';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { Modal, Button, Form } from 'react-bootstrap';

const MASTER_TYPES = [
  { slug: 'skills', label: 'Skills' },
  { slug: 'industries', label: 'Industries' },
  { slug: 'company-types', label: 'Company Types' },
  { slug: 'job-categories', label: 'Job Categories' },
  { slug: 'job-titles', label: 'Job Titles' },
  { slug: 'qualifications', label: 'Qualifications' },
  { slug: 'employment-types', label: 'Employment Types' },
  { slug: 'experience-levels', label: 'Experience Levels' },
  { slug: 'candidate-sources', label: 'Candidate Sources' },
  { slug: 'countries', label: 'Countries' },
  { slug: 'states', label: 'States' },
  { slug: 'cities', label: 'Cities' }
];

export default function MasterEntityPage() {
  const params = useParams();
  const router = useRouter();
  const currentType = params.type || 'skills';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [itemName, setItemName] = useState('');

  const loadData = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: String(page),
        limit: '15',
        ...(search && { search }),
        ...(statusFilter && { isActive: statusFilter })
      });

      const res = await api.get(`/masters/${currentType}?${query.toString()}`);
      if (res.data?.success) {
        setItems(res.data.data);
        if (res.data.meta) setPagination(res.data.meta);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load master records');
    } finally {
      setLoading(false);
    }
  }, [currentType, search, statusFilter]);

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  const handleToggle = async (item) => {
    try {
      await api.patch(`/masters/${currentType}/${item.id}/toggle`);
      toast.success(`${item.name} status updated`);
      loadData(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    try {
      setModalLoading(true);
      if (editItem) {
        await api.put(`/masters/${currentType}/${editItem.id}`, { name: itemName.trim() });
        toast.success('Record updated successfully');
      } else {
        await api.post(`/masters/${currentType}`, { name: itemName.trim() });
        toast.success('Record added successfully');
      }
      setShowAddModal(false);
      setEditItem(null);
      setItemName('');
      loadData(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save record');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setModalLoading(true);
      await api.delete(`/masters/${currentType}/${deleteId}`);
      toast.success('Record deleted successfully');
      setDeleteId(null);
      loadData(pagination.page);
    } catch (err) {
      // Catch deletion blocked when in use (422)
      toast.error(err.response?.data?.message || 'Delete blocked: record is currently in use');
      setDeleteId(null);
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id', width: '80px' },
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => <span className="fw-semibold">{row.name}</span>
    },
    {
      header: 'Status',
      accessor: 'is_active',
      width: '120px',
      render: (row) => (
        <span className={`badge ${row.is_active ? 'bg-success' : 'bg-secondary'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Actions',
      width: '180px',
      render: (row) => (
        <div className="btn-group btn-group-sm">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => handleToggle(row)}
            title="Toggle Status"
          >
            {row.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => {
              setEditItem(row);
              setItemName(row.name);
              setShowAddModal(true);
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={() => setDeleteId(row.id)}
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <RoleLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Master Data Management</h1>
          <p className="text-muted small mb-0">Manage taxonomies, dropdown options, and organizational master entities</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditItem(null);
            setItemName('');
            setShowAddModal(true);
          }}
        >
          + Add New
        </button>
      </div>

      {/* Type navigation tabs */}
      <div className="d-flex flex-wrap gap-2 mb-4 pb-2 border-bottom">
        {MASTER_TYPES.map((t) => (
          <Link
            key={t.slug}
            href={`/admin/masters/${t.slug}`}
            className={`btn btn-sm ${currentType === t.slug ? 'btn-primary' : 'btn-outline-secondary'}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <FilterBar
        search={search}
        onSearchChange={(val) => setSearch(val)}
        filters={[
          {
            label: 'Status',
            value: statusFilter,
            onChange: (val) => setStatusFilter(val),
            options: [
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' }
            ]
          }
        ]}
        onReset={() => {
          setSearch('');
          setStatusFilter('');
        }}
      />

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => loadData(p)}
      />

      {/* Add / Edit Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton>
            <Modal.Title className="h5 fw-bold">
              {editItem ? 'Edit Master Record' : `Add to ${currentType.replace('-', ' ')}`}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label className="small fw-semibold">Entity Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
                autoFocus
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowAddModal(false)} disabled={modalLoading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={modalLoading}>
              {modalLoading ? 'Saving...' : 'Save Record'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={Boolean(deleteId)}
        onHide={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Master Record"
        message="Are you sure you want to delete this master record? If it is currently referenced by active jobs or candidates, deletion will be blocked."
        confirmText="Delete"
        confirmVariant="danger"
        loading={modalLoading}
      />
    </RoleLayout>
  );
}

