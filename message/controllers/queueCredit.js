const uuidv4 = require('uuid/v4')
const Queue = require('bull');
const saveMessage = require('../transactions/saveMessage')
const sendMessage = require('./sendMessage')
const brake = require('../brakes')
const creditCheckQueue = new Queue('creditCheckQueue', 'redis://127.0.0.1:6379');
const creditCheckResponseQueue = new Queue('creditCheckResponseQueue', 'redis://127.0.0.1:6379');
// const creditCheckQueue = new Queue('creditCheckQueue', 'redis://redis:6379');
// const creditCheckResponseQueue = new Queue('creditCheckResponseQueue', 'redis://redis:6379');
const isCreditChecking = true


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

function queueCreditCheck(req, res, next) {

    let uuid = uuidv4();
    let messageObj = req.body;
    messageObj.uuid = uuid;
    messageObj.status = "PENDING"

    queueCount(creditCheckQueue)
    .then( jobs => 
        {
            if (jobs <= 10) {
            return creditCheckQueue.add(messageObj)
            .then( () => res.status(200).send(`Message send successfully, you can check the your message status using /messages/${uuid}/status`))
            .then( () => saveMessage(
                messageObj,
                function (_result, error) {
                    if (error) {
                        console.log('Error 500.', error);
                    } else {
                        console.log('Successfully saved');
                    }
            }))
            } else {
                res.status(200).send(`Service is full, try again later`)
            }
        
        }) 
}

function queueCount(queue) {
    return queue.count()
}
creditCheckResponseQueue.process(async (job, done) => {
    sendMessage(job.data.messageParams, job.data.credit)
})

creditCheckResponseQueue.on('completed', (job, result) => {
    console.log(`Credit Check Job completed with result: ${result}`);
})



module.exports = { queueCreditCheck }
