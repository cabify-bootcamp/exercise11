const Credit = require('../models/credit');

module.exports = function() {
    return Credit().find();
};