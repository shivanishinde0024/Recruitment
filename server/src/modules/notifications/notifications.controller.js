const notificationsService = require('./notifications.service');
const { ok } = require('../../utils/response');

exports.list = async (req, res) => {
  const result = await notificationsService.listNotifications(req.user.id, req.query);
  return ok(res, result.items, 'Notifications loaded', result.meta);
};

exports.getUnreadCount = async (req, res) => {
  const result = await notificationsService.getUnreadCount(req.user.id);
  return ok(res, result, 'Unread count fetched');
};

exports.markRead = async (req, res) => {
  const result = await notificationsService.markAsRead(req.params.id, req.user.id);
  return ok(res, result, 'Marked as read');
};

exports.markAllRead = async (req, res) => {
  const result = await notificationsService.markAllAsRead(req.user.id);
  return ok(res, result, 'All marked as read');
};

