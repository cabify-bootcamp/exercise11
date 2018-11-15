const http = require("http");
const saveMessage = require("../clients/saveMessage");
const brake = require('../brakes')
const util = require('util')
const logger = require('../logger')

const random = n => Math.floor(Math.random() * Math.floor(n));

module.exports = function(message, credit) {
  const messageContent = message
  const postData = JSON.stringify(message);
  let current_credit = credit
  
  

    if (current_credit > 0) {
      logger.log('info', `Credit received, proceeding to send message with uuid: ${messageContent.uuid}`)    
      const postOptions = {
        // host: "exercise4_messageapp_1",
        // host: "messageapp",
        host: "localhost",
        port: 3000,
        path: "/message",
        method: "post",
        json: true,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData)
        }
      };

      const httpRequest = (postOptions) => {
        return new Promise(function(resolve, reject) {
            var req = http.request(postOptions, function(res) {
                if (res.statusCode === 200) {
                saveMessage(
                  {
                    ...messageContent,
                    status: "OK"
                  },
                  function(_result, error) {
                    if (error) {
                      logger.log('error', `Error while trying to update message with uuid: ${messageContent.uuid}`)  
                    } else {
                      logger.log('info', `Successfull message update with uuid: ${messageContent.uuid}`)  

                    }
                  }
                )
                resolve(messageContent)
                } else if (res.statusCode >= 500){
                  saveMessage(
                    {
                      ...messageContent,
                      status: "TIMEOUT"
                    },
                    function(_result, error) {
                      if (error) {
                        logger.log('error', `Error while trying to save message with timeout status and  uuid: ${messageContent.uuid}`) 
                      } else {
                        logger.log('info', `Successfully changed status to timeout, message uuid: ${messageContent.uuid}`)
                      }
                    }
                  )
                  reject(logger.log('warn', `Rejecting Message timeout by messageapp with uuid: ${messageContent.uuid}`)  
                  );
                }
            });

            req.setTimeout(random(1000));

            req.on("timeout", () => {
            logger.log('error', `Message service has timeout on message with uuid: ${messageContent.uuid}`)  
            saveMessage(
                  {
                    ...messageContent,
                    status: "TIMEOUT"
                  },
                  () => {
                    logger.log('error', `Internal server error, message uuid: ${messageContent.uuid}`) 
                  }
              );
              reject(logger.log('warn', `Rejecting, Service timeout by messageapp with uuid: ${messageContent.uuid}`))
            });

            req.write(postData);
            req.end();

        })
      };


      const slaveCircuit = brake.slaveCircuit(httpRequest);

      slaveCircuit.exec(postOptions)
        .then((result) =>{
          logger.log('info', `http request resolved for message with: ${messageContent.uuid}`)
        })
        .catch(error =>{
          logger.log('info', `http request rejected for message with: ${messageContent.uuid}`)
        });
    
      } else {
        saveMessage({
          ...messageContent,
          status: "NO CREDIT"
        },
        () => {
          logger.log('info', `Rejecting service, user has no credit to send messageapp with uuid: ${messageContent.uuid}`)
        })
      }

};
