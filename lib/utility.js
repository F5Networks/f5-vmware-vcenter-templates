var unirest = require('unirest');
function apiCall(path, method, data) {
  var Request;
  switch (method.toLowerCase()) {
    case 'get':
        Request = unirest.get(global.host + path);
        break;
    case 'post':
        Request = unirest.post(global.host + path);
        if (undefined !== data && null !== data) {
          Request.send(JSON.stringify(data));
        }
        break;
    case 'put':
        Request = unirest.post(global.host + path);
        if (undefined !== data && null !== data) {
          Request.send(JSON.stringify(data));
        }
    case 'patch':
        Request = unirest.patch(global.host + path);
        if (undefined !== data && null !== data) {
          Request.send(data);
        }
        break;
    case 'delete':
        Request = unirest.delete(global.host + path);
        break;
  }
  var mediaTypes = {'Cookie': 'vmware-api-session-id=' + global.sessionId, 'Accept': 'application/json', 'Content-Type': 'application/json'};
  return new Promise(function(resolve, reject) {
    Request.headers(mediaTypes).strictSSL(global.ssl).end(resp => {
      if (resp.code >= 200 && resp.code <= 299) {
        resolve(resp);
      } else {
        reject(resp);
      }
    });
  })
}
exports.apiCall = apiCall
