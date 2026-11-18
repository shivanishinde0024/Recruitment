const prisma = require('../../config/db');
const { parsePagination, buildMeta } = require('../../utils/pagination');

async function listNotifications(userId, query = {}) {
  const { page, limit, skip, take } = parsePagination(query, 20, 100);

  const where = {
    user_id: BigInt(userId)
  };

  if (query.unread === 'true' || query.unread === true) {
    where.is_read = false;
  }

  const [items, total] = await Promise.all([
    prisma.notifications.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: 'desc' }
    }),
    prisma.notifications.count({ where })
  ]);

  return {
    items,
    meta: buildMeta(page, limit, total)
  };
}

async function getUnreadCount(userId) {
  const count = await prisma.notifications.count({
    where: {
      user_id: BigInt(userId),
      is_read: false
    }
  });

  return { count };
}

async function markAsRead(id, userId) {
  await prisma.notifications.updateMany({
    where: {
      id: BigInt(id),
      user_id: BigInt(userId)
    },
    data: {
      is_read: true
    }
  });

  return { success: true };
}

async function markAllAsRead(userId) {
  await prisma.notifications.updateMany({
    where: {
      user_id: BigInt(userId),
      is_read: false
    },
    data: {
      is_read: true
    }
  });

  return { success: true };
}

module.exports = {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};

