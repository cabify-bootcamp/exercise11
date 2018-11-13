
const getMessageStatus = require("../clients/getMessageStatus");

module.exports = function(req, res) {
  const uuid = req.params.messageId
  getMessageStatus(uuid).then(messages => {
    let status = messages[0].status
    res.json(`Current message status: ${status}`);
  });
};