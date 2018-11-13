const getCredit = require("../clients/getCredit");

module.exports = function() {
    return getCredit().then(credit => {
        return credit[0].amount
      });
};