const mongoose = require("mongoose");
const database = require("../database");

let messageSchema = new mongoose.Schema({
  uuid: String,
  destination: String,
  body: String,
  location: {
  	name: {
      type: String,
      default: "Default"
    },
    cost: {
      type: Number,
      default: 1
    }
  },
  status: {
    type: String,
    enum: ["PENDING" , "ERROR", "OK", "TIMEOUT"]
  }
});

module.exports = (dbKey) => database.get(dbKey).model("Message", messageSchema);
