const Message = require("../models/message");
const saveMessageTransaction = require("../transactions/saveMessage");
const { queueTx } = require("../controllers/queueTx");


module.exports = function(messageParams, cb) {
  const MessageModel = Message();
  let message = new MessageModel(messageParams);


  if (message.status == "OK") {

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
