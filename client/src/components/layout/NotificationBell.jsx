'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isPollingRef = useRef(true);

  const fetchNotifications = async () => {
    if (!isPollingRef.current) return;

    // Check if authentication credentials exist before initiating request
    const hasToken =
      (typeof localStorage !== 'undefined' && (localStorage.getItem('access_token') || localStorage.getItem('refresh_token'))) ||
      (typeof document !== 'undefined' && document.cookie.includes('access_token='));
    if (!hasToken) {
      isPollingRef.current = false;
      return;
    }

    try {
      const res = await api.get('/notifications?limit=10');
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        const unread = (res.data.data || []).filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      // If 401 Unauthorized, halt further background polling intervals until re-authenticated
      if (err.response?.status === 401) {
        isPollingRef.current = false;
      }
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      isPollingRef.current = false;
      return;
    }

    isPollingRef.current = true;
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30s poll

    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary position-relative rounded-circle p-2 d-flex align-items-center justify-content-center"
        style={{ width: '36px', height: '36px' }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
        </svg>
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.65rem' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
            <span className="visually-hidden">unread notifications</span>
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="dropdown-menu dropdown-menu-end show shadow-lg p-0"
          style={{ width: '320px', maxHeight: '420px', overflowY: 'auto', zIndex: 1050 }}
        >
          <div className="d-flex align-items-center justify-content-between p-3 border-bottom bg-light">
            <span className="fw-semibold small">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-decoration-none small text-primary"
                onClick={handleMarkAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="list-group list-group-flush">
            {notifications.length === 0 ? (
              <div className="text-center text-muted py-4 small">
                No notifications yet
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`list-group-item list-group-item-action p-3 ${
                    !item.is_read ? 'bg-white' : 'bg-light text-muted'
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <span className={`small ${!item.is_read ? 'fw-bold text-dark' : 'fw-semibold'}`}>
                      {item.title}
                    </span>
                    {!item.is_read && (
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0 text-muted ms-2"
                        title="Mark read"
                        onClick={(e) => handleMarkAsRead(item.id, e)}
                      >
                        ✓
                      </button>
                    )}
                  </div>
                  <p className="small mb-1 text-secondary" style={{ fontSize: '0.8rem', lineHeight: '1.3' }}>
                    {item.message}
                  </p>
                  <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

