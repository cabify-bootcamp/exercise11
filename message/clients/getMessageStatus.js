const Message = require("../models/message");

module.exports = function (uuid) {
  return Message().find({ "uuid": uuid });
};