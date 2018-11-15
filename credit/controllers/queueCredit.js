

const Queue = require('bull');

const creditCheckQueue = new Queue('creditCheckQueue', 'redis://127.0.0.1:6379');
const creditCheckResponseQueue = new Queue('creditCheckResponseQueue', 'redis://127.0.0.1:6379');
const txQueue = new Queue('txQueue', 'redis://127.0.0.1:6379');

// const creditCheckQueue = new Queue('creditCheckQueue', 'redis://redis:6379');
// const creditCheckResponseQueue = new Queue('creditCheckResponseQueue', 'redis://redis:6379');
// const txQueue = new Queue('txQueue', 'redis://redis:6379');

const updateCreditTransaction = require("../transactions/updateCredit");
const getCredit = require("./getCredit");

creditCheckQueue.process(async (job, done) => {
    Promise.resolve(getCredit().then( credit => {
        done(null, credit)}))
})

txQueue.process(async (job, done) => {

    return Promise.resolve(updateCreditTransaction(
        job.data.conditions, 
        job.data.newValue, 
        function(doc, error) {
        if (error) {
          return cb(undefined, error);
        } else if (doc == undefined) {
          let error = "Not enough credit";
          console.log(error);
          cb(undefined, error);
        } else {
          return 'ok'
        }
        }))
        .then( () => done() )
        
        
})

creditCheckQueue.on('completed', (job, result) => {

    let messageParams = job.data
    let credit = result
    message = JSON.stringify(messageParams)

    creditCheckResponseQueue.add({messageParams, credit})

})

creditCheckQueue.on('active', function (job, jobPromise) {
    console.log('New worker started for a Credit Check job');
});

creditCheckQueue.on('drained', function () {
    console.log('Credit Check Job queue is currently empty');
});

txQueue.on('completed', (job, result) => {
    console.log('TX charge Job completed')
})

txQueue.on('active', function (job, jobPromise) {
    console.log('New worker started for a TX charge job');
});

txQueue.on('drained', function () {
    console.log('TX Charge Job queue is currently empty');
});


