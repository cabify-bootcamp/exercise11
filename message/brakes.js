const Brakes = require('brakes')
const http = require('http');

const breakerOpts = {
    timeout: 1000,
    waitThreshold: 1,
    threshold: 0.10,
    circuitDuration: 50000
  };
const brake = new Brakes(breakerOpts);

const globalStats = Brakes.getGlobalStats();

/*
Create SSE Hysterix compliant Server
*/

http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/event-stream;charset=UTF-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  globalStats.getHystrixStream().pipe(res);
}).listen(8081, () => {
  console.log('---------------------');
  console.log('Hysterix Server now live at localhost:8081/hystrix.stream');
  console.log('---------------------');
});

/*
Create SSE Hysterix compliant Server
*/
http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/event-stream;charset=UTF-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  globalStats.getHystrixStream().pipe(res);
}).listen(8082, () => {
  console.log('---------------------');
  console.log('Hysterix Server now live at localhost:8082/hystrix.stream');
  console.log('---------------------');
});




module.exports = brake