const Message = require("../models/message");
const saveMessageTransaction = require("../transactions/saveMessage");
const { queueTx } = require("../controllers/queueTx");
const logger = require("../logger")


module.exports = function(messageParams, cb) {
  const MessageModel = Message();
  let message = new MessageModel(messageParams);


  if (message.status == "OK") {

    logger.log('info', `Proceeding to charge message with uuid: ${message.uuid}`)
    queueTx(
      {
        amount: { $gte: 1 },
        location: message.location.name
      },
      {
        $inc: { amount: -message.location.cost }
      }
    )
    saveMessageTransaction(messageParams, cb);
    
  } else {
    saveMessageTransaction(messageParams, cb);
  }
};
