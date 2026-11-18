const trashService = require('./trash.service');
const { ok } = require('../../utils/response');

async function listTrashItemsHandler(req, res, next) {
  try {
    const result = await trashService.listTrashItems(req.query);
    return ok(res, result.data, 'Trash items retrieved successfully', 200, result.meta);
  } catch (err) {
    next(err);
  }
}

async function restoreItemHandler(req, res, next) {
  try {
    const { module, id } = req.params;
    const result = await trashService.restoreItem({
      module,
      id,
      currentUser: req.user,
      req
    });
    return ok(res, result, 'Item restored successfully from trash');
  } catch (err) {
    next(err);
  }
}

async function permanentlyDeleteItemHandler(req, res, next) {
  try {
    const { module, id } = req.params;
    const result = await trashService.permanentlyDeleteItem({
      module,
      id,
      currentUser: req.user,
      req
    });
    return ok(res, result, 'Item permanently deleted');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTrashItemsHandler,
  restoreItemHandler,
  permanentlyDeleteItemHandler
};
