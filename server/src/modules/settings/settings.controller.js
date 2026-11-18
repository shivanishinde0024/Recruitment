const settingsService = require('./settings.service');
const { ok } = require('../../utils/response');

async function getAllSettingsHandler(req, res, next) {
  try {
    const data = await settingsService.getAllSettings();
    return ok(res, data, 'System settings retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function updateSettingsHandler(req, res, next) {
  try {
    const data = await settingsService.updateSettings(req.body, req.user, req);
    return ok(res, data, 'System settings updated successfully');
  } catch (err) {
    next(err);
  }
}

async function sendTestEmailHandler(req, res, next) {
  try {
    const { to, subject, body } = req.body;
    const result = await settingsService.sendTestEmail({ to, subject, body });
    return ok(res, result, 'Test email processed successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllSettingsHandler,
  updateSettingsHandler,
  sendTestEmailHandler
};
