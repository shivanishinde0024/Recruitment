const prisma = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { recordAudit } = require('../../middleware/audit');
const nodemailer = require('nodemailer');
const env = require('../../config/env');

// Default system settings map
const DEFAULT_SETTINGS = {
  auto_approve_company: 'false',
  default_lock_minutes: '15',
  max_failed_logins: '5',
  jwt_access_expiry_minutes: '15',
  hide_candidate_contact_until_confirmed: 'true',
  smtp_host: env.SMTP_HOST || 'smtp.example.com',
  smtp_port: String(env.SMTP_PORT || 587),
  smtp_user: env.SMTP_USER || 'no-reply@portal.com',
  smtp_pass: '',
  mail_from: env.MAIL_FROM || 'Recruitment Portal <no-reply@portal.com>',
  daily_reminder_hour: '9'
};

async function getAllSettings() {
  const dbSettings = await prisma.settings.findMany();
  const settingsMap = { ...DEFAULT_SETTINGS };

  dbSettings.forEach(s => {
    settingsMap[s.key] = s.value;
  });

  return settingsMap;
}

async function updateSettings(newSettings, currentUser, req = null) {
  if (!newSettings || typeof newSettings !== 'object') {
    throw new ApiError(400, 'Settings payload must be an object of key-value pairs');
  }

  const oldSettings = await getAllSettings();
  const updatedKeys = [];

  for (const [key, value] of Object.entries(newSettings)) {
    const strValue = String(value);

    // Upsert setting
    const existing = await prisma.settings.findFirst({ where: { key } });
    if (existing) {
      await prisma.settings.update({
        where: { id: existing.id },
        data: { value: strValue }
      });
    } else {
      await prisma.settings.create({
        data: { key, value: strValue }
      });
    }
    updatedKeys.push(key);
  }

  await recordAudit({
    userId: currentUser.id,
    action: 'update_settings',
    moduleName: 'settings',
    recordId: null,
    oldValue: oldSettings,
    newValue: newSettings,
    req
  });

  return await getAllSettings();
}

async function sendTestEmail({ to, subject, body = 'This is an automated SMTP verification message from Recruitment Portal.' }) {
  if (!to || !to.includes('@')) {
    throw new ApiError(400, 'Valid recipient email address is required');
  }

  const settings = await getAllSettings();
  const host = settings.smtp_host || env.SMTP_HOST;
  const port = parseInt(settings.smtp_port, 10) || env.SMTP_PORT;
  const user = settings.smtp_user || env.SMTP_USER;
  const pass = settings.smtp_pass || env.SMTP_PASS;
  const from = settings.mail_from || env.MAIL_FROM;

  console.log(`[SMTP Test Email] From: ${from} | To: ${to} | Host: ${host}:${port}`);

  // In test environment or offline environments, return simulated success
  if (process.env.NODE_ENV === 'test' || !pass) {
    return {
      success: true,
      simulated: true,
      to,
      subject: subject || 'Test Email from Recruitment Portal',
      message: 'SMTP configuration validated (simulated dispatch in test/dev mode).'
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass } : undefined
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject: subject || 'Test Email from Recruitment Portal',
      text: body,
      html: `<p>${body}</p>`
    });

    return {
      success: true,
      messageId: info.messageId,
      to,
      message: 'Test email successfully dispatched via SMTP.'
    };
  } catch (err) {
    throw new ApiError(500, `SMTP dispatch failed: ${err.message}`);
  }
}

module.exports = {
  getAllSettings,
  updateSettings,
  sendTestEmail
};
