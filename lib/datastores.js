var unirest = require('unirest')
var util = require('./utility');
var apiPath = '/rest/vcenter/datastore';
function find( filter) {
  return util.p( apiPath + '?' + filter, 'get');
}
exports.find = find;
