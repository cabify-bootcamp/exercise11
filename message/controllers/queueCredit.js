const uuidv4 = require('uuid/v4')
const Queue = require('bull');
const saveMessage = require('../transactions/saveMessage')
const sendMessage = require('./sendMessage')

const creditCheckQueue = new Queue('creditCheckQueue', 'redis://127.0.0.1:6379');
const creditCheckResponseQueue = new Queue('creditCheckResponseQueue', 'redis://127.0.0.1:6379');
// const creditCheckQueue = new Queue('creditCheckQueue', 'redis://redis:6379');
// const creditCheckResponseQueue = new Queue('creditCheckResponseQueue', 'redis://redis:6379');


function queueCreditCheck(req, res, next) {

    let uuid = uuidv4();
    let messageObj = req.body;
    messageObj.uuid = uuid;
    messageObj.status = "PENDING"

    saveMessage(
        messageObj,
        function (_result, error) {
            if (error) {
                console.log('Error 500.', error);
            } else {
                console.log('Successfully saved');
            }
        }
    )

    return creditCheckQueue.add(messageObj).then( () => res.status(200).send(`Message send successfully, you can check the your message status using /messages/${uuid}/status`))

}

creditCheckResponseQueue.process(async (job, done) => {
    sendMessage(job.data.messageParams, job.data.credit)
    done(null, 'done')
})

creditCheckResponseQueue.on('completed', (job, result) => {
    console.log(`Credit Check Job completed with result: ${result}`);
})


module.exports = { queueCreditCheck }
