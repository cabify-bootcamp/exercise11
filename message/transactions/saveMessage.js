const database = require("../database");
const Message = require("../models/message");
const { cleanClone } = require("../utils");
const logger = require('../logger')

function saveMessageReplica(replica, retries) {
  if (retries > 0) {
    replica.markModified("body");
    return replica
      .save()
      .then(doc => {
        logger.log('info', `Message replicated succesfully with uuid: ${doc.uuid}`)
        return doc;
      })
      .catch(err => {
        logger.log('error', `Error while trying to save replica with uuid: ${doc.uuid}, retrying...`)
        return saveMessageReplica(replica, retries - 1);
      });
  }
}

function saveMessageTransaction(newValue) {
  const MessagePrimary = Message();
  const MessageReplica = Message("replica");
  const uuid = newValue.uuid

  let message = new MessagePrimary(newValue);

  return MessagePrimary.findOneAndUpdate(
    {"uuid": uuid}, newValue, {new: true})
    .then(doc => {
      if ( doc == null ) {
      return message.save()
        .then(doc => {
          logger.log('info', `Message saved successfully with uuid: ${doc.uuid}`)
          return cleanClone(doc);
        })
        .then(clone => {
          let replica = new MessageReplica(clone);
          saveMessageReplica(replica, 3);
          return clone;
        })
        .catch(err => {
          logger.log('error', `Error while saving messages with uuid: : ${doc.uuid}`)
          throw err;
        });
      } else {
        MessageReplica.findOneAndUpdate({"uuid": uuid}, newValue, {new: true})
        .then(doc => logger.log('info', `Message replica updated with uuid: ${doc.uuid}`))
      }
    })
}

module.exports = function(messageParams, cb) {
  saveMessageTransaction(messageParams, cb)
    .then(() => cb())
    .catch(err => {
      logger.log('error', 'Error while trying to save message transaction')
      cb(undefined, err);
    });
};
