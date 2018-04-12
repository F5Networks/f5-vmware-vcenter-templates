var unirest = require('unirest')
var util = require('./utility');
var apiPath = '/rest/vcenter/datastore';
function find( filter) {
  return util.apiCall( apiPath + '?' + filter, 'get');
}
exports.find = find;
