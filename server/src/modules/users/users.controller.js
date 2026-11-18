const usersService = require('./users.service');
const { ok, created } = require('../../utils/response');

exports.list = async (req, res) => {
  const result = await usersService.listUsers(req.query);
  return ok(res, result.items, 'Users loaded', result.meta);
};

exports.getById = async (req, res) => {
  const user = await usersService.getUserById(req.params.id);
  return ok(res, user, 'User details loaded');
};

exports.create = async (req, res) => {
  const user = await usersService.createUser(req.body, req);
  return created(res, user, 'User created successfully');
};

exports.update = async (req, res) => {
  const user = await usersService.updateUser(req.params.id, req.body, req);
  return ok(res, user, 'User updated successfully');
};

exports.updateStatus = async (req, res) => {
  const user = await usersService.updateUserStatus(
    req.params.id,
    req.body.status,
    req.user.id,
    req
  );
  return ok(res, user, 'User status updated successfully');
};

exports.remove = async (req, res) => {
  const result = await usersService.deleteUser(req.params.id, req.user.id, req);
  return ok(res, null, result.message);
};
