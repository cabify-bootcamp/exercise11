const http = require("http");
const saveMessage = require("../clients/saveMessage");
const brake = require('../brakes')
const util = require('util')

const random = n => Math.floor(Math.random() * Math.floor(n));

module.exports = function(message, credit) {
  const messageContent = message
  const postData = JSON.stringify(message);
  
  let current_credit = credit

    if (current_credit > 0) {
      
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
                      console.log(error)
                    } else {
                      console.log(messageContent)
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
                        console.log(error)
                      } else {
                        console.log(messageContent)
                      }
                    }
                  )
                  reject(new Error('statusCode=' + res.statusCode));
                }
            });

            req.setTimeout(random(1000));

            req.on("timeout", () => {
            console.error("Timeout Exceeded!");
            saveMessage(
                  {
                    ...messageContent,
                    status: "TIMEOUT"
                  },
                  () => {
                    console.log("Internal server error: TIMEOUT")
                  }
              );
              reject(new Error('Timeout'))
            });

            req.write(postData);
            req.end();

        })
      };


      const slaveCircuit = brake.slaveCircuit(httpRequest);

      slaveCircuit.exec(postOptions)
        .then((result) =>{
          console.log(`result: ${util.inspect(result)}`);
        })
        .catch(error =>{
          console.error(`error: ${util.inspect(error)}`);
        });

      brake.isOpen()
    
      } else {
        updateMessage({
          ...messageContent,
          status: "NO CREDIT"
        },
        () => {
          console.log("NO CREDIT");
        })
      }

      // brake.on('snapshot', snapshot => {
      //   console.log(`Stats received -> ${util.inspect(snapshot)}`);
      // });


};
