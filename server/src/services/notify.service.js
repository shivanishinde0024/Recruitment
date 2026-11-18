const prisma = require('../config/db');

/**
 * Universal notification service for in-app bell notifications and email dispatches.
 */
async function notify({ userIds = [], type, title, message, refType = null, refId = null, email = null }) {
  try {
    if (!Array.isArray(userIds) || userIds.length === 0) return;

    const data = userIds.map((uid) => ({
      user_id: BigInt(uid),
      type,
      title,
      message,
      ref_type: refType,
      ref_id: refId ? BigInt(refId) : null,
      is_read: false
    }));

    await prisma.notifications.createMany({ data });

    // Email dispatch (fire-and-forget; logs failure without breaking transaction)
    if (email && email.to) {
      // In production, would invoke nodemailer transporter
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Notification Email] To: ${email.to} | Subject: ${email.subject || title}`);
      }
    }
  } catch (err) {
    console.error('Notification dispatch error:', err.message);
  }
}

module.exports = {
  notify
};
