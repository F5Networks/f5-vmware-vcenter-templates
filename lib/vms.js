var unirest = require('unirest')
var util = require('./utility');
var apiPath = '/rest/vcenter/vm';
function find( filter) {
  return util.p( apiPath + '?' + filter, 'get');
}
function del( vm) {
  return util.p( apiPath + '/' + vm, 'delete');
}
function powerOn( vm) {
  return util.p( apiPath + '/' + vm + '/power/start', 'post');
}
function powerOff( vm) {
  return util.p( apiPath + '/' + vm + '/power/stop', 'post');
}
exports.find = find
exports.powerOn = powerOn;
exports.powerOff = powerOff;
exports.del = del;