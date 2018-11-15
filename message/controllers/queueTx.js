
const Queue = require('bull');

const txQueue = new Queue('txQueue', 'redis://127.0.0.1:6379');
// const txQueue = new Queue('txQueue', 'redis://redis:6379');

const queueTx = (conditions, newValue, cb) => {
    return txQueue.add({conditions, newValue, cb})
}


module.exports = { queueTx }
