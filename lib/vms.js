var unirest = require('unirest')
var util = require('./utility');
var apiPath = '/rest/vcenter/vm';
function find( filter) {
  return util.apiCall( apiPath + '?' + filter, 'get');
}
function del(vm) {
  return util.apiCall( apiPath + '/' + vm, 'delete');
}
function powerOn(vm) {
  return util.apiCall( apiPath + '/' + vm + '/power/start', 'post');
}
function powerOff(vm) {
  return util.apiCall( apiPath + '/' + vm + '/power/stop', 'post');
}
function listHardware(vm, hardware) {
  return util.apiCall( apiPath + '/' + vm + '/hardware/'+ hardware, 'get');
}
function deleteHardware(vm, hardware) {
  return util.apiCall( apiPath + '/' + vm + '/hardware/'+ hardware, 'delete');
}
function addHardware(vm, hardware, data) {
  data = data
  return util.apiCall( apiPath + '/' + vm + '/hardware/'+ hardware, 'post', data);
}
exports.find = find
exports.powerOn = powerOn;
exports.powerOff = powerOff;
exports.del = del;
exports.listHardware = listHardware;
exports.deleteHardware = deleteHardware;
exports.addHardware = addHardware;
