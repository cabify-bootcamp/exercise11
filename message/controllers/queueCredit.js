require('dotenv').config();

const queueLimit = process.env.QUEUE_LIMIT|| 10
const queueRestore = process.env.QUEUE_RESTORE || 5
const uuidv4 = require('uuid/v4')
const Queue = require('bull');
const saveMessage = require('../transactions/saveMessage')
const sendMessage = require('./sendMessage')
const brake = require('../brakes')
// const creditCheckQueue = new Queue('creditCheckQueue', 'redis://127.0.0.1:6379');
// const creditCheckResponseQueue = new Queue('creditCheckResponseQueue', 'redis://127.0.0.1:6379');
const creditCheckQueue = new Queue('creditCheckQueue', 'redis://redis:6379');
const creditCheckResponseQueue = new Queue('creditCheckResponseQueue', 'redis://redis:6379');
const logger = require('../logger')
let isCreditChecking = true



function queueCreditCheck(req, res, next) {

    let uuid = uuidv4();
    let messageObj = req.body;
    messageObj.uuid = uuid;
    messageObj.status = "PENDING"

    queueManager(creditCheckQueue)
    .then( () => 
        {
            if (isCreditChecking) {
            return creditCheckQueue.add(messageObj)
            .then( () => 
                Promise.resolve(saveMessage(messageObj,
                    function (_result, error) {
                        if (error) {
                            logger.log('error', 'Error 500: an error has ocurred while saving the message')
                        } else {
                            logger.log('info', 'Message has been saved, ready to be processed')
                        }
                    })))
            .then( () => {
                if (!brake.isOpen()) {
                    logger.log('info', `Circuit closed, message send`)
                    res.status(200).send(`Message send successfully, you can check the your message status using /messages/${uuid}/status`)
                } else {
                    logger.log('info', `Circuit open, message queuing, waiting...`)
                    res.status(200).send(`Message service is having some delays, please check later using /messages/${uuid}/status`)
                }
            })
            } else {
                logger.log('info', `Service is full, queue limit reached ${queueLimit}`)
                res.status(200).send(`Service is full, try again later`)
            }
        }) 
}

function queueManager(queue) {

    return queue.count().then( (jobs) => {
        logger.log('info', `Pending jobs: ${jobs}`)
        if (jobs >= queueLimit) {
            isCreditChecking = false
        } else if (isCreditChecking == false && jobs == queueRestore) {
            isCreditChecking = true
        } else {
            isCreditChecking = true
        }
    })

}

brake.on('circuitOpen', () => {
    logger.log('warn', 'Circuit has opened')
    creditCheckQueue.pause().then(function(){
        logger.log('warn', 'Credit Check Jobs are paused')
      });
});
  
brake.on('circuitClosed', () => {
    logger.log('warn', 'Circuit has closed')
    creditCheckQueue.resumed().then(function(){
        logger.log('warn', 'Credit Check Jobs are resumed')
    });
});

creditCheckResponseQueue.process(async (job, done) => {
    sendMessage(job.data.messageParams, job.data.credit)
})

creditCheckResponseQueue.on('completed', (job, result) => {
    console.log(`Credit Check Job completed with result: ${result}`);
})



module.exports = { queueCreditCheck }
