var unirest = require('unirest')
var util = require('./utility');
var apiPath = '/rest/com/vmware/cis/session';
function login(username, password) {
  return new Promise(function(resolve, reject) {
    unirest.post(global.host + apiPath)
      .strictSSL(global.ssl)
      .auth(username, password, true)
      .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
      .end(function (response) {
        if (response.code >= 200 && response.code <= 299) {
          // set the session token id as a global variable to avoid having to
          // pass it around.
          global.sessionId = response.body.value;
          resolve(response.body);
        } else
          console.error(response.error);
          reject(response.code);
      });
  });
}
function logout() {
  return util.apiCall(apiPath, 'delete');
}
exports.login = login
exports.logout = logout
