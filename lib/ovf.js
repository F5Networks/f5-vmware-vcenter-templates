var unirest = require('unirest');
var util = require('./utility');
var apiPath = '/rest/com/vmware/vcenter/ovf/library-item'
function deployOvf( datastoreId, contentItemId, mgmtNet, intNet, extNet, haNet, resourcePool, vmname, mgmtIpAddress, mgmtIpPrefix, mgmtGwAddress, adminPwd, rootPwd ) {
    data = {
        "deployment_spec": {
            "accept_all_EULA": true,
            "additional_parameters": [
                {
                    "@class": "com.vmware.vcenter.ovf.property_params",
                    "type": "PropertyParams",
                    "properties": [
                        {
                            "instance_id": "",
                            "class_id": "",
                            "description": "F5 BIG-IP VE's management address in the format of \"IP/prefix\"",
                            "id": "net.mgmt.addr",
                            "label": "mgmt-addr",
                            "category": "Network properties",
                            "type": "string",
                            "value": mgmtIpAddress + '/' + mgmtIpPrefix,
                            "ui_optional": false
                          },
                          {
                            "instance_id": "",
                            "class_id": "",
                            "description": "F5 BIG-IP VE's SHA-512 shadow or plain-text password for \"admin\" user",
                            "id": "user.admin.pwd",
                            "label": "admin-pwd",
                            "category": "User properties",
                            "type": "string",
                            "value": adminPwd,
                            "ui_optional": false
                          },
                          {
                            "instance_id": "",
                            "class_id": "",
                            "description": "F5 BIG-IP VE's SHA-512 shadow or plain-text password for \"root\" user",
                            "id": "user.root.pwd",
                            "label": "root-pwd",
                            "category": "User properties",
                            "type": "string",
                            "value": rootPwd,
                            "ui_optional": false
                          },
                          {
                            "instance_id": "",
                            "class_id": "",
                            "description": "F5 BIG-IP VE's management default gateway",
                            "id": "net.mgmt.gw",
                            "label": "mgmt-gw",
                            "category": "Network properties",
                            "type": "string",
                            "value": mgmtGwAddress,
                            "ui_optional": false
                          }
                    ],
                }
            ],
            "default_datastore_id": datastoreId,
            "name": vmname,
            "network_mappings": [
                {
                    "key": "Internal",
                    "value": extNet
                },
                {
                    "key": "External",
                    "value": intNet
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
        },
    }
  return util.apiCall( apiPath + '?~action=deploy', 'post', data);
}
function filterOvf (libid, resgroup) {
    data = {
        "ovf_library_item_id": libid,
            "target": {
                "resource_pool_id": resgroup
            }
    }
    return util.apiCall( apiPath + '?~action=filter', 'post', data);
}
exports.deployOvf = deployOvf
exports.filterOvf = filterOvf
