require('dotenv').config();

const queueLimit = process.env.QUEUE_LIMIT|| 10
const queueRestore = process.env.QUEUE_RESTORE || 5
const uuidv4 = require('uuid/v4')
const Queue = require('bull');
const saveMessage = require('../transactions/saveMessage')
const sendMessage = require('./sendMessage')
const brake = require('../brakes')
const creditCheckQueue = new Queue('creditCheckQueue', 'redis://127.0.0.1:6379');
const creditCheckResponseQueue = new Queue('creditCheckResponseQueue', 'redis://127.0.0.1:6379');
let isCreditChecking = true
// const creditCheckQueue = new Queue('creditCheckQueue', 'redis://redis:6379');
// const creditCheckResponseQueue = new Queue('creditCheckResponseQueue', 'redis://redis:6379');




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
                            console.log('Error 500.', error);
                        } else {
                            console.log('Successfully saved');
                        }
                    })))
            .then( () => {
                if (!brake.isOpen()) {
                    res.status(200).send(`Message send successfully, you can check the your message status using /messages/${uuid}/status`)
                } else {
                    res.status(200).send(`Message service is having some delays, please check later using /messages/${uuid}/status`)
                }
            })
            } else {
                console.log(isCreditChecking)
                res.status(200).send(`Service is full, try again later`)
            }
        }) 
}

function queueManager(queue) {
    return queue.count().then( (jobs) => {
        console.log(jobs)
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
    console.log('----------Circuit Opened--------------');
    creditCheckQueue.pause().then(function(){
        console.log('Credit Check Jobs are paused')
      });
});
  
brake.on('circuitClosed', () => {
    console.log('----------Circuit Closed--------------');
    creditCheckQueue.resumed().then(function(){
        console.log('Credit Check Jobs are resumed')
    });
});

creditCheckResponseQueue.process(async (job, done) => {
    sendMessage(job.data.messageParams, job.data.credit)
})

creditCheckResponseQueue.on('completed', (job, result) => {
    console.log(`Credit Check Job completed with result: ${result}`);
})



module.exports = { queueCreditCheck }
