const Brakes = require('brakes')

const breakerOpts = {
    timeout: 1000,
    waitThreshold: 1,
    threshold: 0.10,
    circuitDuration: 50000
  };
const brake = new Brakes(breakerOpts);

module.exports = brake