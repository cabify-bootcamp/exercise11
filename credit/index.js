require('dotenv').config();

const service_port = process.env.SERVICE_PORT || 9007

const http = require("http");
const express = require("express");
const bodyParser = require("body-parser");
const { Validator, ValidationError } = require("express-json-validator-middleware");
const updateCredit = require("./controllers/updateCredit");
const getCredit = require("./controllers/getCredit");
const app = express();

require("./controllers/queueCredit");

const validator = new Validator({ allErrors: true });
const { validate } = validator;

const creditSchema = {
  type: "object",
  required: ["amount"],
  properties: {
    location: {
      type: "string"
    },
    amount: {
      type: "number"
    }
  }
};

app.post(
  "/credit",
  bodyParser.json(),
  validate({ body: creditSchema }),
  updateCredit
);

app.get(
  "/credit",
  getCredit
);

app.use(function(err, req, res, next) {
  console.log(res.body);
  if (err instanceof ValidationError) {
    res.sendStatus(400);
  } else {
    res.sendStatus(500);
  }
});


app.listen(service_port, function() {
  console.log(`App started on PORT ${service_port}`);
});
