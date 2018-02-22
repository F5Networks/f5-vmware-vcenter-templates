var unirest = require('unirest');
var util = require('./utility');
var apiPath = '/rest/com/vmware/vcenter/ovf/library-item?~action='
function deployOvf( datastoreId, contentItemId, mgmtNet, intNet, extNet, haNet, resourcePool, vmname) {
    data = {
        "deployment_spec": {
            "accept_all_EULA": true,
            "default_datastore_id": datastoreId,
            "name": vmname,
            "network_mappings": [
                {
                    "key": "Internal",
                    "value": intNet
                },
                {
                    "key": "External",
                    "value": extNet
                },
                {
                    "key": "HA",
                    "value": haNet
                },
                {
                    "key": "Managment",
                    "value": mgmtNet
                }
            ],
        },
        "ovf_library_item_id": contentItemId,
        "target": {
            "resource_pool_id": resourcePool
        }
    }
  return util.p( apiPath + 'deploy', 'post', data);
}
exports.deployOvf = deployOvf