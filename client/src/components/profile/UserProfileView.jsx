'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function UserProfileView() {
  const { user, refreshUser } = useAuth();

  // Profile Edit State
  const [name, setName] = useState(user?.name || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileError(null);

    try {
      setSavingProfile(true);
      const res = await api.put('/auth/me', { name, mobile });
      setProfileMsg(res.data?.message || 'Profile updated successfully.');
      toast.success('Profile updated successfully');
      if (refreshUser) await refreshUser();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile.';
      setProfileError(msg);
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      setPasswordMsg(res.data?.message || 'Password changed successfully.');
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password.';
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="container-fluid py-3">
      <div className="mb-4">
        <h1 className="h3 fw-bold mb-1">Account & Security Settings</h1>
        <p className="text-muted small">Manage your personal profile and access credentials</p>
      </div>

      <div className="row g-4">
        {/* Profile Details Card */}
        <div className="col-12 col-lg-6">
          <div className="rp-card p-4 h-100">
            <h2 className="h5 fw-bold mb-3 d-flex align-items-center gap-2">
              <span>👤</span> My Profile Information
            </h2>

            {profileMsg && (
              <div className="alert alert-success py-2 small" role="alert">
                {profileMsg}
              </div>
            )}

            {profileError && (
              <div className="alert alert-danger py-2 small" role="alert">
                {profileError}
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Email Address</label>
                <input
                  type="email"
                  className="form-control bg-light"
                  value={user?.email || ''}
                  disabled
                  readOnly
                />
                <div className="form-text small">Email address cannot be changed directly.</div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Role</label>
                <input
                  type="text"
                  className="form-control bg-light text-uppercase fw-semibold"
                  value={user?.role || ''}
                  disabled
                  readOnly
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={savingProfile}
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Mobile Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91-9876543210"
                  disabled={savingProfile}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingProfile}
              >
                {savingProfile ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="col-12 col-lg-6">
          <div className="rp-card p-4 h-100">
            <h2 className="h5 fw-bold mb-3 d-flex align-items-center gap-2">
              <span>🔒</span> Change Account Password
            </h2>

            {passwordMsg && (
              <div className="alert alert-success py-2 small" role="alert">
                {passwordMsg}
              </div>
            )}

            {passwordError && (
              <div className="alert alert-danger py-2 small" role="alert">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Current Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={savingPassword}
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars (upper, lower, digit)"
                  required
                  disabled={savingPassword}
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={savingPassword}
                />
              </div>

              <button
                type="submit"
                className="btn btn-outline-primary"
                disabled={savingPassword}
              >
                {savingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
