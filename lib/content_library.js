var unirest = require('unirest')
var util = require('./utility');
var apiPath = '/rest/com/vmware/content/library';
function mountfile(  vm, contentItemIdUsrData) {
    data = {
     "vm": vm
    }
  return util.p( '/rest/com/vmware/vcenter/iso/image/id:' + contentItemIdUsrData + '?~action=mount', 'post', data);
}
function find( filter) {
    data = {
        "spec": {
            "name": filter
        }
    }
  return util.p( apiPath + '?~action=find', 'post', data);
}
function findItem( filter, library) {
    data = {
        "spec": {
            "name": filter,
            "library_id": library
        }
    }
  return util.p( apiPath + '/item?~action=find', 'post', data);
}
function createLibItem( itemname, library) {
    data = {
        "create_spec": {
            "description": "ISO used to configure big-ip:" + itemname,
            "library_id": library,
            "name": itemname,
            "type": "iso",
        }
    }
  return util.p( apiPath + '/item', 'post', data);
}
function createSession( filter) {
    data = {
        "create_spec": {
            "library_item_id": filter,
        }
    }
  return util.p( apiPath + '/item/update-session', 'post', data);
}
function updateEndpoint( filename, sessionId) {
    data = {
        "file_spec": {
            "checksum_info": {
                "algorithm": "MD5",
                "checksum": "4d44b1bee4e2e61c862a2d94901797e1",
            },
            "name": filename,
            "source_type": "PUSH",
        }
    }
  return util.p( apiPath + '/item/updatesession/file/id:' + sessionId + '?~action=add', 'post', data);
}
function validateupload( sessionId) {
    data = {
    }
  return util.p( apiPath + '/item/updatesession/file/id:' + sessionId + '?~action=validate', 'post', data);
}
function complete( sessionId) {
  data = {}
  return util.p( apiPath + '/item/update-session/id:' + sessionId + '?~action=complete', 'post', data);
}
function deletesession( sessionId) {
  return util.p( apiPath + '/item/update-session/id:' + sessionId, 'delete');
}
function deleteItem( contentItemIsoId ) {
  return util.p( apiPath + '/item/id:' + contentItemIsoId, 'delete');
}
exports.find = find;
exports.findItem = findItem;
exports.createLibItem = createLibItem;
exports.createSession = createSession;
exports.updateEndpoint = updateEndpoint;
exports.validateupload = validateupload;
exports.complete = complete;
exports.deletesession = deletesession;
exports.mountfile = mountfile;
exports.deleteItem = deleteItem;