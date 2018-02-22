/*
    Version v1.0.0
    Deploys single BIG-IP with 4 configured network interfaces.
    Required values located in lib/settings.js
*/
var async = require("async");
var auth = require('../../../../../lib/authentication');
var content_library = require('../../../../../lib/content_library');
var datastore = require('../../../../../lib/datastores');
var net = require('../../../../../lib/networks');
var ovf = require('../../../../../lib/ovf');
var pool = require('../../../../../lib/resource_pools');
var settings = require('./settings');
var vm = require('../../../../../lib/vms');
var fs = require('fs');
global.host = settings.host;
global.ssl = settings.ssl;
async.series([
  function createUserData(callback) {
  console.log('Create user_data for Big-IP VE:' + settings.vmName);
    fs.readFile('./user_data_stencil/user_data_template', 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        var result = data.replace(/<VMNAME>/g, settings.vmName);
        var result = result.replace(/<VMIPADDRESS>/g, settings.vmIpAddress);
        var result = result.replace(/<VMIPPREFIX>/g, settings.vmIpPrefix);
        var result = result.replace(/<VMGWADDRESS>/g, settings.vmGwAddress);
        var result = result.replace(/<EXTIPADDRESS>/g, settings.extIpAddress);
        var result = result.replace(/<EXTPREFIX>/g, settings.extPrefix);
        var result = result.replace(/<EXTGW>/g, settings.extGw);
        var result = result.replace(/<EXTVLAN>/g, settings.extVlan);
        var result = result.replace(/<INTIPADDRESS>/g, settings.intIpAddress);
        var result = result.replace(/<INTPREFIX>/g, settings.intPrefix);
        var result = result.replace(/<INTVLAN>/g, settings.intVlan);
        var result = result.replace(/<HAIPADDRESS>/g, settings.haIpAddress);
        var result = result.replace(/<HAPREFIX>/g, settings.haPrefix);
        var result = result.replace(/<HAVLAN>/g, settings.haVlan);
        var result = result.replace(/<VMFQDN>/g, settings.vmFqdn);
        var result = result.replace(/<NTP>/g, settings.ntp);
        var result = result.replace(/<TIMEZONE>/g, settings.timezone);
        var result = result.replace(/<DNSADDRESSES>/g, settings.dnsAddresses);
        var result = result.replace(/<LICKEY1>/g, settings.lickey1);
        fs.writeFile('./build_iso/openstack/latest/user_data', result, 'utf8', function (err) {
            if (err) return console.log(err);
            callback();
        });
    });
  },
  function createMetaData(callback) {
    console.log('Create Metadata for Big-IP VE:' + settings.vmName);
    var uuid = require('node-uuid');
    var genuuid = uuid.v4();
    fs.readFile('./user_data_stencil/meta_data_template.json', 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        var result_uuid = data.replace(/<UUID>/g, genuuid);
        fs.writeFile('./build_iso/openstack/latest/meta_data.json', result_uuid, 'utf8', function (err) {
            if (err) return console.log(err);
            callback();
        });
    });
  },
  function createIso(callback) {
  console.log('exec out and create ISO used during first boot for Big-IP VE:' + settings.vmName);
    var sys = require('util')
    var exec = require('child_process').exec;
    var args = 'genisoimage -input-charset "utf-8" -V "config-2" -o ./iso/' + settings.vmName + '.iso -r build_iso'
    exec(args, function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      callback();
      if (error !== null) {
        console.log('exec error: ' + error);
      }
    });
  },
  function login(callback) {
    console.log('logging into vcenter:' + settings.host);
    auth.login(settings.username, settings.password).then(resp => {
      console.log('Session obtained:' + global.sessionId)
      callback();
    }).catch(error => {
      console.log(JSON.stringify(error, null, 2));
    });
  },
  function findDatastorebyName(callback) {
    console.log('Looking for DataStore ID with name ' + settings.datastore);
    datastore.find('filter.names.1=' + settings.datastore).then(resp => {
       if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
         datastoreId = resp.body.value[0].datastore;
         console.log('found id for ' + settings.datastore + ':' + datastoreId);
       }
       callback();
   }).catch(error => {
     console.log(JSON.stringify(error, null, 2));
   });
  },
  function findLibarayName(callback) {
    console.log('Looking for Content Library ID with name ' + settings.contentlibName);
    content_library.find(settings.contentlibName).then(resp => {
       if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
         libraryId = resp.body.value[0];
         console.log('found id for ' + settings.contentlibName + ':' + libraryId);
       }
      callback();
    }).catch(error => {
      console.log(JSON.stringify(error, null, 2));
   });
  },
  function findNetworkbyName(callback) {
    console.log('Looking for Management Network with name ' + settings.managementNetwork);
    net.find('filter.names.1=' + settings.managementNetwork).then(resp => {
       if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
         mgmtNet = resp.body.value[0].network;
         console.log('found id for ' + settings.managementNetwork + ':' + mgmtNet);
       }
       callback();
   }).catch(error => {
     console.log(JSON.stringify(error, null, 2));
   });
  },
  function findNetworkbyName(callback) {
    console.log('Looking for internal Network with name ' + settings.internalNetwork);
    net.find('filter.names.1=' + settings.internalNetwork).then(resp => {
       if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
         intNet = resp.body.value[0].network;
         console.log('found id for ' + settings.internalNetwork + ':' + intNet);
       }
       callback();
   }).catch(error => {
     console.log(JSON.stringify(error, null, 2));
   });
  },
  function findNetworkbyName(callback) {
    console.log('Looking for external Network with name ' + settings.externalNetwork);
     net.find('filter.names.1=' + settings.externalNetwork).then(resp => {
       if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
         extNet = resp.body.value[0].network;
         console.log('found id for ' + settings.externalNetwork + ':' + extNet);
       }
       callback();
   }).catch(error => {
     console.log(JSON.stringify(error, null, 2));
     callback();
   });
  },
  function findNetworkbyName(callback) {
    console.log('Looking for HA Network with name ' + settings.haNetwork);
    net.find('filter.names.1=' + settings.haNetwork).then(resp => {
       if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
         haNet = resp.body.value[0].network;
         console.log('found id for ' + settings.haNetwork + ':' + haNet);
       }
       callback();
   }).catch(error => {
     console.log(JSON.stringify(error, null, 2));
   });
  },
  function listResourcePool(callback) {
    console.log('Looking for Resource Pool with name ' + settings.resourcePool);
    pool.find('filter.names.1=' + settings.resourcePool).then(resp => {
       if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
         resourcePool = resp.body.value[0].resource_pool;
         console.log('found id for resource pool ' + settings.resourcePool + ':' + resourcePool);
       }
      callback();
    }).catch(error => {
      console.log(JSON.stringify(error, null, 2));
    });
  },
  function findLibarayItem(callback) {
    console.log('Looking for Library item ID with name ' + settings.contentlibItem + ' in Content Library (' + settings.contentlibName + '):' + libraryId);
     content_library.findItem(settings.contentlibItem, libraryId).then(resp => {
       if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
         contentItemId = resp.body.value[0];
         console.log('found id for ' + settings.contentlibItem + ':' + contentItemId);
       }
      callback();
    }).catch(error => {
      console.log(JSON.stringify(error, null, 2));
   });
  },
  function deployOvf(callback) {
    console.log('Creating VM ' + settings.vmName);
    ovf.deployOvf(datastoreId,contentItemId,mgmtNet,intNet,extNet,haNet,resourcePool, settings.vmName).then(resp => {
       if (null !== resp && null !== resp.body.value && null == resp.body.value.error.errors[0]) {
         deployVm = resp.body.value.resource_id;
         console.log('Successfully deployed VM ' + JSON.stringify(deployVm, null, 2));
         callback();
       }
       if (null !== resp && null !== resp.body.value.error.errors[0]) {
         deployVmError = resp.body.value.error.errors[0];
         console.log('Error:' + JSON.stringify(deployVmError, null, 2));
         }

    }).catch(error => {
      console.log(JSON.stringify(error, null, 2));
      console.log('Error:' + error);
    });
  },
  function findVMByName(callback) {
    console.log('Looking for VM ID with name ' + settings.vmName);
     vm.find('filter.names.1=' + settings.vmName).then(resp => {
       if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
         vmName = resp.body.value[0].vm;
         console.log('VM ID:' + vmName);
       }
       callback();
   }).catch(error => {
     console.log(JSON.stringify(error, null, 2));
   });
  },
  function createLibItem(callback) {
  console.log('Creating Content Library Item ' + settings.vmName);
   content_library.createLibItem(settings.vmName + ".iso", libraryId).then(resp => {
     if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
       item = resp.body.value;
         console.log('created Library item.. ' + settings.vmName + '.iso - ID:' + item);
     }
     callback();
   }).catch(error => {
     console.log(JSON.stringify(error, null, 2));
     callback();
   });
  },
  function createSession(callback) {
  console.log('Creating Session for file upload to library item ' + settings.vmName + '.iso :' + item);
   content_library.createSession(item).then(resp => {
     if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
       session = resp.body.value;
         console.log('session created..id: ' + session);
     }
     callback();
   }).catch(error => {
     console.log(JSON.stringify(error, null, 2));
     callback();
   });
  },
  function updateEndpoint(callback) {
  console.log('Grab upload session id for config drive, session:' + session);
   content_library.updateEndpoint(settings.vmName + ".iso", session).then(resp => {
     if (null !== resp && null !== resp.body.value.upload_endpoint.uri && resp.body.value.upload_endpoint.uri.length > 0) {
       endpointid = resp.body.value.upload_endpoint.uri;
         console.log('Endpoint id.. ' + endpointid);
     }
     callback();
   }).catch(error => {
     console.log(JSON.stringify(error, null, 2));
     callback();
   });
  },
  function fileupload(callback) {
  console.log('exec out and upload file');
    var sys = require('util')
    var exec = require('child_process').exec;
    var args = "-v -k -X PUT -T iso/" + settings.vmName + ".iso -H 'Accept:application/json' -H 'vmware-api-session-id:" + global.sessionId + "' " + endpointid
    exec('curl ' + args, function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      callback();
      if (error !== null) {
        console.log('exec error: ' + error);
      }
    });
  },
  function validate(callback) {
  console.log('Validate file: ' + settings.vmName + '.iso');
   content_library.validateupload(session).then(resp => {
     if (null !== resp) {
       validateupload = resp.body.value.has_errors;
         console.log('validate response ' + validateupload);
     }
     callback();
   }).catch(error => {
     console.log(JSON.stringify(error, null, 2));
     callback();
   });
  },
  function complete(callback) {
  console.log('Complete file: ' + settings.vmName + '.iso');
   content_library.complete(session).then(resp => {
     if (null !== resp) {
       completeupload = resp.body.value;
         console.log('complete response ' + completeupload);
     }
     callback();
   }).catch(error => {
     console.log(JSON.stringify(error, null, 2));
     callback();
   });
  },
  function deletesession(callback) {
  console.log('Delete Session for file upload');
   content_library.deletesession(session).then(resp => {
     if (null !== resp) {
       deleteupload = resp.body.value;
         console.log('delete response ' + deleteupload);
     }
     callback();
   }).catch(error => {
     console.log(JSON.stringify(error, null, 2));
     callback();
   });
  },
  function findLibarayItem(callback) {
    console.log('Looking for Library item ID with name ' + settings.vmName + '.iso in Content Library:' + libraryId);
     content_library.findItem(settings.vmName + '.iso',libraryId).then(resp => {
       if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
         libraryItemId = resp.body.value[0];
         console.log('found it.. ' + libraryItemId);
       }
      callback();
    }).catch(error => {
      console.log(JSON.stringify(error, null, 2));
      callback();
   });
  },
  function findLibarayItemFile(callback) {
    console.log('Looking for Library file ID with name ' + settings.vmName + '.iso in Content Library item :' + libraryItemId);
     content_library.mountfile(vmName, libraryItemId).then(resp => {
       if (null !== resp) {
         contentItemId2 = JSON.stringify(resp.body.value[0]);
         console.log('found it.. ' + contentItemId2);
         console.log(contentItemId2 + 'mounted to VE');
       }
      callback();
    }).catch(error => {
      console.log(JSON.stringify(error, null, 2));
      callback();
   });
  },
  function powerOn(callback) {
   console.log('Powering on ' + vmName);
   vm.powerOn(vmName).then(resp => {
     console.log(resp.body.value);
     callback();
   }).catch(error => {
     console.log(JSON.stringify(error, null, 2));
     callback();
   });
  },
  function logout(callback) {
    auth.logout().then(resp => {
      console.log('logged out of vCenter:' + settings.host);
      callback();
    }).catch(error => {
      console.log(JSON.stringify(error, null, 2));
      callback();
    });
    console.log('Creation of ' + settings.vmName + ' complete!');
  },
]);
