
const Queue = require('bull');
const logger = require('../logger')

// const txQueue = new Queue('txQueue', 'redis://127.0.0.1:6379');
const txQueue = new Queue('txQueue', 'redis://redis:6379');

const queueTx = (conditions, newValue, cb) => {
    logger.log('info', 'Charging for message')
    return txQueue.add({conditions, newValue, cb})
}


module.exports = { queueTx }
