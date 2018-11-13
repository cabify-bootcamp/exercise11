const http = require("http");
const saveMessage = require("../clients/saveMessage");

const random = n => Math.floor(Math.random() * Math.floor(n));

module.exports = function(message, credit) {
  const messageContent = message
  const messageJSON = JSON.stringify(message);
  
  let current_credit = credit

    if (current_credit > 0) {
      
      const postOptions = {
        // host: "exercise4_messageapp_1",
        // host: "localhost",
        host: "messageapp",
        port: 3000,
        path: "/message",
        method: "post",
        json: true,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(messageJSON)
        }
      };

      let postReq = http.request(postOptions);

      postReq.on("response", postRes => {
        if (postRes.statusCode === 200) {
          // updateMessage
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
          );
        } else {
          console.error("Error while sending message");
          // updateMessage
          saveMessage(
            {
              ...messageContent,
              status: "ERROR"
            },
            () => {
              console.log("Internal server error: SERVICE ERROR")
            }
          );
        }
      });

      postReq.setTimeout(random(6000));

      postReq.on("timeout", () => {
        console.error("Timeout Exceeded!");
        postReq.abort();
        saveMessage(
          {
            ...messageContent,
            status: "TIMEOUT"
          },
          () => {
            console.log("Internal server error: TIMEOUT")
          }
        );
      });

      postReq.on("error", () => {
        console.error("Error while sending message");
        saveMessage(
          {
            ...messageContent,
            status: "ERROR"
          },
          () => {
            console.log("Internal server error: SERVICE ERROR")
          }
        );
      });

      postReq.write(messageJSON);
      postReq.end();
      
    } else {
      console.log("No credit error")
    }
};
