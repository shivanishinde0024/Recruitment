exports.ok = (res, data = null, message = 'Success', meta = undefined) => {
  const payload = {
    success: true,
    message,
    data
  };
  if (meta !== undefined) {
    payload.meta = meta;
  }
  return res.status(200).json(payload);
};

exports.created = (res, data = null, message = 'Created', meta = undefined) => {
  const payload = {
    success: true,
    message,
    data
  };
  if (meta !== undefined) {
    payload.meta = meta;
  }
  return res.status(201).json(payload);
};
