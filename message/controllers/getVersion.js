require('dotenv').config();
const service_version = process.env.SERVICE_NAME || 9007


module.exports = function(req, res) {
    
        res.send(`${service_version}`)

};