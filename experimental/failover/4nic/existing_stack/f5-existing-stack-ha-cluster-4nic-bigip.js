//  Version v1.1.0
//  Deploys HA pair (Active/Standby) of BIG-IP's each with 4 configured network interfaces: Management, External, Internal, and HA
//  Example Required values located in ./settings.js
//  Load script in directory were script is located using notation "node f5-existing-stack-ha-cluster-4nic-big-ip.js filename". Were filename contains configuration parameters using the format noted in ./settings.js.

var auth = require('../../../../lib/authentication');
var content_library = require('../../../../lib/content_library');
var datastore = require('../../../../lib/datastores');
var net = require('../../../../lib/networks');
var ovf = require('../../../../lib/ovf');
var pool = require('../../../../lib/resource_pools');
var settings = require('./' + (process.argv[2]));
var vm = require('../../../../lib/vms');
var input = require('../../../../lib/input');
var sndcmd = require ('../../../../lib/sendcmds');
var sshfile = require ('../../../../lib/sendfile');
var Logger = require('../../../../lib/logger');
var loggerOptions = {};
var logger;
loggerOptions.console = settings.logConsole;
loggerOptions.logLevel = settings.logLevel;
loggerOptions.fileName = './' + settings.vmName + '.log';
loggerOptions.module = module;
logger = Logger.getLogger(loggerOptions);
global.host = settings.host;
global.ssl = settings.ssl;
var crypto = require('crypto');
var sha512crypt = require('sha512crypt-node');
var vcenterUsername = process.argv[3];
var vcenterPwd = process.argv[4];
var bigipRootPwd = process.argv[5];
var bigipAdminPwd = process.argv[6];
var bigiqUsername = process.argv[7];
var bigiqPwd = process.argv[8];
function cluster() {
    if (loggerOptions.console == false) {
        console.log('Console logs disabled, logs are written to ./' + loggerOptions.fileName);
    } else {
        console.log('Logs are written to ./' + loggerOptions.fileName);
    }
    logger.info('Collecting required credentials...');
    return input.inputCreds(false, 'Enter vCenter username:', 'vCenter username required!', vcenterUsername).then(resp => {
        vcenterUsername = resp;
    })
    .then(function() {
        return input.inputCreds(true, 'Enter vCenter password:', 'vCenter password required!', vcenterPwd).then(resp => {
            vcenterPwd = resp;
        })
    })
    .then(function() {
        return input.inputCreds(true, 'Enter Big-IP root password:', 'Big-IP root password required!', bigipRootPwd).then(resp => {
            bigipRootPwd = resp;
        })    
    })
    .then(function() {
        return input.inputCreds(true, 'Enter Big-IP admin password:', 'Big-IP admin password required!', bigipAdminPwd).then(resp => {
            bigipAdminPwd = resp;
        })    
    })
    .then(function() {
        if (settings.bigiqAddress) {
            logger.info('\nBig-IQ Address present, collecting Big-IQ credentials....');
            return input.inputCreds(false, 'Enter Big-IQ admin username:', 'Big-IQ admin account required! Remove Big-IQ address from settings file if you wish to use registration key for licensing.', bigiqUsername).then(resp => {
                bigiqUsername = resp;
            })
        } else {
            logger.info('\nUsing registration key for licensing. Auto registration requires Big-IP has internet access to f5 registration server.....');
            if (!settings.lickey1) {
                throw ('\nLicense Key required! Verify settings file contains license key: lickey1 needs value.');
            }
        }   
    })
    .then(function() {
        if (settings.bigiqAddress) {
            return input.inputCreds(true, 'Enter Big-IQ password:', 'Big-IQ password required!', bigiqPwd).then(resp => {
                bigiqPwd = resp;
            })
        } else {
        }   
    })
    .then(function() {
        var salt = crypto.randomBytes(10).toString('base64');
        bigipRootPwd512 = sha512crypt.sha512crypt(bigipRootPwd, salt);   
    })
    .then(function() {
        var salt = crypto.randomBytes(10).toString('base64');
        bigipAdminPwd512 = sha512crypt.sha512crypt(bigipAdminPwd, salt);   
    })
    .then(function() {
        logger.info('Collecting required resource information from vCenter...');
        logger.verbose('Logging into vcenter:' + settings.host);
        return auth.login(vcenterUsername, vcenterPwd).then(resp => {
            logger.debug('Authentication session obtained: ' + global.sessionId);
            logger.silly(resp);
        })
    })
    .then(function() {
        return Promise.all([
            logger.verbose('Looking for datastore id with name ' + settings.datastore),
            datastore.find('filter.names.1=' + settings.datastore).then(resp => {
                if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
                    datastoreId = resp.body.value[0].datastore;
                    logger.verbose('Found id for ' + settings.datastore + ': ' + datastoreId);
                    logger.debug(resp);
                }
            }),
            logger.verbose('Looking for content library id with name ' + settings.contentlibName),
            content_library.find(settings.contentlibName).then(resp => {
                if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
                    libraryId = resp.body.value[0];
                    logger.verbose('Found id for ' + settings.contentlibName + ': ' + libraryId);
                    logger.debug(resp);
                }
            }),
            logger.verbose('Looking for management network with name ' + settings.managementNetwork),
            net.find('filter.names.1=' + settings.managementNetwork).then(resp => {
                if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
                    mgmtNet = resp.body.value[0].network;
                    logger.verbose('Found id for ' + settings.managementNetwork + ':' + mgmtNet);
                    logger.debug(resp);
                }
            }),
            logger.verbose('Looking for internal network with name ' + settings.internalNetwork),
            net.find('filter.names.1=' + settings.internalNetwork).then(resp => {
                if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
                    intNet = resp.body.value[0].network;
                    logger.verbose('Found id for ' + settings.internalNetwork + ':' + intNet);
                    logger.debug(resp);
                }
            }),
            logger.verbose('Looking for external network with name ' + settings.externalNetwork),
            net.find('filter.names.1=' + settings.externalNetwork).then(resp => {
                if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
                    extNet = resp.body.value[0].network;
                    logger.verbose('Found id for ' + settings.externalNetwork + ':' + extNet);
                    logger.debug(resp);
                }
            }),
            logger.verbose('Looking for HA network with name ' + settings.haNetwork),
            net.find('filter.names.1=' + settings.haNetwork).then(resp => {
                if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
                    haNet = resp.body.value[0].network;
                    logger.verbose('Found id for ' + settings.haNetwork + ':' + haNet);
                    logger.debug(resp);
                }
            }),
            logger.verbose('Looking for resource pool with name ' + settings.resourcePool),
            pool.find('filter.names.1=' + settings.resourcePool).then(resp => {
                if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
                    resourcePool = resp.body.value[0].resource_pool;
                    logger.verbose('Found id for resource pool ' + settings.resourcePool + ':' + resourcePool);
                    logger.debug(resp);
                }
            }),
        ])
    })
    .then(function() {
        logger.verbose('Looking for library item ID with name ' + settings.contentlibItem + ' in content library (' + settings.contentlibName + '):' + libraryId);
        return content_library.findItem(settings.contentlibItem, libraryId).then(resp => {
            if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
                contentItemId = resp.body.value[0];
                logger.verbose('Found id for ' + settings.contentlibItem + ':' + contentItemId);
                logger.debug(resp);
            }
            logger.info('Done');
        })
    })
    .then(function() {
        logger.info('Begin VM creation. This can take awhile; depends on content library performance.....');
        logger.verbose('Creating VM1: ' + settings.vmName);
        return Promise.all([ovf.deployOvf(datastoreId,contentItemId,mgmtNet,intNet,extNet,haNet,resourcePool, settings.vmName, settings.mgmtIpAddress, settings.mgmtPrefix, settings.mgmtGwAddress, bigipAdminPwd512, bigipRootPwd512).then(resp => {
            if (null !== resp && null !== resp.body.value && null == resp.body.value.error.errors[0]) {
                deployVm1 = resp.body.value.resource_id;
                logger.info(settings.vmName + ' Done');
                logger.verbose('Successfully deployed ' + settings.vmName + JSON.stringify(deployVm1.id, null, 2));
                logger.debug(resp);
            } else {
                throw (logger.error('Error on ' + settings.vmName + ' creation:' + JSON.stringify(resp, null, 2)));
            }
        }),
        ovf.deployOvf(datastoreId,contentItemId,mgmtNet,intNet,extNet,haNet,resourcePool, settings.vmName2, settings.mgmtIpAddress2, settings.mgmtPrefix, settings.mgmtGwAddress, bigipAdminPwd512, bigipRootPwd512).then(resp => {
            if (null !== resp && null !== resp.body.value && null == resp.body.value.error.errors[0]) {
                deployVm2 = resp.body.value.resource_id;
                logger.info(settings.vmName2 + ' Done');
                logger.verbose('Successfully deployed ' + settings.vmName2 + JSON.stringify(deployVm2.id, null, 2));
                logger.debug(resp);
            } else {
                throw (logger.error('Error on ' + settings.vmName2 + ' creation:' + JSON.stringify(resp, null, 2)));
            }
        })])
    })
    .then(function() {
        logger.info('Looking for VM ID with name ' + settings.vmName);
        return vm.find('filter.names.1=' + settings.vmName).then(resp => {
            if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
                vmName = resp.body.value[0].vm;
                logger.info('VM ID:' + vmName);
            }
        })
    })
    .then(function() {
        logger.info('Powering on ' + vmName);
        return vm.powerOn(vmName).then(resp => {
            logger.info('Power on statusCode:' + resp.statusCode);
            logger.info('Creation of ' + settings.vmName + ' complete! Sending onboard configuration....');
            logger.debug(resp);
        })
    })
    .then(function() {
        logger.info('Looking for VM ID with name ' + settings.vmName2);
        return vm.find('filter.names.1=' + settings.vmName2).then(resp => {
            if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
                vmName2 = resp.body.value[0].vm;
                logger.info('VM ID: ' + vmName2);
            }
        })
    })
    .then(function() {
        logger.info('Powering on ' + vmName2);
        return vm.powerOn(vmName2).then(resp => {
            logger.info('Power on statusCode:' + JSON.stringify(resp.statusCode, null, 2));
            logger.info('Creation of ' + settings.vmName2 + ' complete! Sending onboard configuration....');
            logger.debug(resp);
        })
    })
    .then(function() {
        logger.info('Checking MCP state for ' + settings.vmName + ':' + settings.mgmtIpAddress);
        return sndcmd.verifyMcp(["ps aux | grep '/usr/bin/mcpd' | grep -v grep | wc -l"],
        settings.mgmtIpAddress,bigipRootPwd,settings.dnsAddresses).then(resp => {
            logger.info(resp);
        })
    })
    .then(function() {
        logger.info('Run initial configuration commands for ' + settings.mgmtIpAddress + ':' + settings.vmName);
        return sndcmd.runCommands([ "tmsh modify sys dns name-servers replace-all-with { " + settings.dnsAddresses + " }",
                                    "mkdir -p /config/cloud/vmware",
                                    "mkdir -p /var/log/cloud/vmware",
                                    "curl -s -f --retry 20 -o /config/cloud/vmware/f5-cloud-libs.tar.gz '"+ settings.cloudlibUrl + "'"],
                                    settings.mgmtIpAddress,bigipRootPwd,settings.dnsAddresses).then(resp => {
                                    logger.silly(resp);
                                    logger.info('Done');
                                    })
    })
    .then(function() {
        logger.info('Create required files for ' + settings.vmName);
        if (settings.stateMirroring) {
            enableMirroring = '"tmsh modify cm device ' + settings.vmName + '.' + settings.vmFqdn + ' mirror-ip ' + settings.haIpAddress + '"\n"tmsh modify cm device ' + settings.vmName + '.' + settings.vmFqdn + ' mirror-secondary-ip ' + settings.intIpAddress + '"';
        } else {
            enableMirroring  = '"echo state mirroring disabled"';
        }
        cmds = '"tmsh create net self external-self-floating address ' + settings.extIpAddressFloating + '/' + settings.extPrefix + ' traffic-group traffic-group-1 vlan external"\n"tmsh create net self internal-self-floating address ' + settings.intIpAddressFloating + '/' + settings.intPrefix + ' traffic-group traffic-group-1 vlan internal"\n"tmsh create net self ha-self-floating address ' + settings.haIpAddressFloating + '/' + settings.haPrefix + ' traffic-group traffic-group-1 vlan ha"\n"tmsh modify cm device ' + settings.vmName + '.' + settings.vmFqdn + ' unicast-address { { effective-ip ' + settings.haIpAddress + ' effective-port 1026 ip ' + settings.haIpAddress + ' } { effective-ip ' + settings.mgmtIpAddress + ' effective-port 1026 ip ' + settings.mgmtIpAddress + ' } }"\n' + enableMirroring + '\n"tmsh save /sys config"';
        return sshfile.createCustomFile(settings.vmName + '-custom-temp.sh', cmds).then(resp => {
            logger.info('Done');
            logger.verbose(resp);
        })
    })
    .then(function() {
        logger.info('Transfer required files to:' + settings.vmName);
        return sshfile.sndfile(settings.mgmtIpAddress,bigipRootPwd,settings.vmName + '-custom-temp.sh').then(resp => {
            logger.info('Done');
            logger.silly(resp);
        })
    })
    .then(function() {
        logger.verbose('Cleanup temp files: ' + settings.vmName + '-custom-temp.sh');
        return sshfile.deleteFile(settings.vmName + '-custom-temp.sh').then(resp => {
            logger.debug(resp);
        })
    })
    .then(function() {
        logger.info('Run configuration commands using cloud-libs for :' + settings.vmName);
        //Assemble Commands
        //Build network.js command
        networkJs = "nohup /config/cloud/vmware/waitThenRun.sh f5-rest-node /config/cloud/vmware/node_modules/f5-cloud-libs/scripts/network.js --host localhost --user admin --password " + bigipAdminPwd + " -o /var/log/cloud/vmware/network-config.log --log-level debug --wait-for ONBOARD_DONE --signal NETWORK_CONFIG_DONE --vlan name:external,nic:1.1<EXTVLAN> --default-gw " + settings.extGw + "<INTVLAN><HAVLAN> --self-ip name:external-self,address:" + settings.extIpAddress + "/" + settings.extPrefix + ",vlan:external <INTSELF><HASELF> &>> /var/log/cloud/vmware/cloudlibs-install.log < /dev/null &"
        if (settings.extVlan) {
            var networkJs = networkJs.replace(/<EXTVLAN>/g, ",tag:" + settings.extVlan);
        } else {
            var networkJs = networkJs.replace(/<EXTVLAN>/g, '');
        }
        if (settings.intVlan) {
            var networkJs = networkJs.replace(/<INTVLAN>/g, " --vlan name:internal,nic:1.2,tag:" + settings.intVlan);
            var networkJs = networkJs.replace(/<INTSELF>/g, " --self-ip name:internal-self,address:" + settings.intIpAddress + "/" + settings.intPrefix + ",vlan:internal");
        } else {
            var networkJs = networkJs.replace(/<INTVLAN>/g, " --vlan name:internal,nic:1.2");
            var networkJs = networkJs.replace(/<INTSELF>/g, " --self-ip name:internal-self,address:" + settings.intIpAddress + "/" + settings.intPrefix + ",vlan:internal");
        }
        if (settings.haVlan) {
            var networkJs = networkJs.replace(/<HAVLAN>/g, " --vlan name:ha,nic:1.3,tag:" + settings.haVlan);
            var networkJs = networkJs.replace(/<HASELF>/g, " --self-ip name:ha-self,address:" + settings.haIpAddress + "/" + settings.haPrefix + ",vlan:ha");

        } else {
            var networkJs = networkJs.replace(/<HAVLAN>/g, " --vlan name:ha,nic:1.3");
            var networkJs = networkJs.replace(/<HASELF>/g, " --self-ip name:ha-self,address:" + settings.haIpAddress + "/" + settings.haPrefix + ",vlan:ha");
        } 
        // Build onboard.js
        onboardJs = "nohup /config/cloud/vmware/waitThenRun.sh f5-rest-node /config/cloud/vmware/node_modules/f5-cloud-libs/scripts/onboard.js -o /var/log/cloud/vmware/onboard.log --log-level debug --host localhost --user admin --password " + bigipAdminPwd + " --hostname " + settings.vmName + "." + settings.vmFqdn + " --ntp "+ settings.ntp + " --tz " + settings.timezone + " --dns " + settings.dnsAddresses + " --module ltm:nominal <LICENSE> &>> /var/log/cloud/vmware/cloudlibs-install.log < /dev/null &"
        if (settings.bigiqAddress){
            var onboardJs = onboardJs.replace(/<LICENSE>/g, " --license-pool --big-iq-host " + settings.bigiqAddress + " --big-iq-user " + bigiqUsername + " --big-iq-password " + bigiqPwd + " --license-pool-name " + settings.bigiqLicensePoolName + " --big-ip-mgmt-address " + settings.mgmtIpAddress);
        } else {
            var onboardJs = onboardJs.replace(/<LICENSE>/g, " --license " + settings.lickey1);
        }
        //Build cluster.js
        clusterjs = "nohup /config/cloud/vmware/waitThenRun.sh f5-rest-node /config/cloud/vmware/node_modules/f5-cloud-libs/scripts/cluster.js --wait-for CUSTOM_CONFIG_DONE --signal CLUSTER_DONE -o /var/log/cloud/vmware/cluster.log --log-level debug --host localhost --user admin --password " + bigipAdminPwd + " --config-sync-ip " + settings.haIpAddress + " --create-group --device-group ha_failover_group --sync-type sync-failover --network-failover --device " + settings.vmName + "." + settings.vmFqdn + " --auto-sync &>> /var/log/cloud/vmware/cloudlibs-install.log < /dev/null &";
        return sndcmd.runCommands([ "chmod +x /config/cloud/vmware/installCloudLibs.sh",
                                    "chmod +x /config/cloud/vmware/waitThenRun.sh",
                                    "chmod +x /config/cloud/vmware/custom-config.sh",
                                    "nohup /config/cloud/vmware/installCloudLibs.sh &>> /var/log/cloud/vmware/cloudlibs-install.log < /dev/null &",
                                    networkJs,
                                    "nohup /config/cloud/vmware/waitThenRun.sh f5-rest-node /config/cloud/vmware/node_modules/f5-cloud-libs/scripts/runScript.js --file /config/cloud/vmware/custom-config.sh --cwd /config/cloud/vmware -o /var/log/cloud/vmware/custom-config.log --log-level debug --wait-for NETWORK_CONFIG_DONE --signal CUSTOM_CONFIG_DONE &>> /var/log/cloud/vmware/cloudlibs-install.log < /dev/null &",
                                    onboardJs,
                                    clusterjs
                                ],
                                settings.mgmtIpAddress,bigipRootPwd,settings.dnsAddresses).then(resp => {
                                    logger.info('Done');
                                    logger.debug(resp);
                                })
    })
    .then(function() {
        logger.info('Checking MCP state for ' + settings.vmName2 + ':' + settings.mgmtIpAddress2);
        return sndcmd.verifyMcp(["ps aux | grep '/usr/bin/mcpd' | grep -v grep | wc -l"],
        settings.mgmtIpAddress2,bigipRootPwd,settings.dnsAddresses).then(resp => {
            logger.info(resp);
        })
    })
    .then(function() {
        logger.info('Run intitial configuration commands for big-ip:' + settings.vmName2);
        return sndcmd.runCommands([ "tmsh modify sys dns name-servers replace-all-with { " + settings.dnsAddresses + " }",
                                    "mkdir -p /config/cloud/vmware",
                                    "mkdir -p /var/log/cloud/vmware",
                                    "curl -s -f --retry 20 -o /config/cloud/vmware/f5-cloud-libs.tar.gz '"+ settings.cloudlibUrl + "'"],
                                    settings.mgmtIpAddress2,bigipRootPwd,settings.dnsAddresses).then(resp => {
                                    logger.debug(resp);
                                    logger.info('Done');
                                    })
    })
    .then(function() {
        logger.info('Create required files for ' + settings.vmName2);
        if (settings.stateMirroring) {
            enableMirroring = '"tmsh modify cm device ' + settings.vmName2 + '.' + settings.vmFqdn + ' mirror-ip ' + settings.haIpAddress2 + '"\n"tmsh modify cm device ' + settings.vmName2 + '.' + settings.vmFqdn + ' mirror-secondary-ip ' + settings.intIpAddress2 + '"';
        } else {
            enableMirroring  = '"echo state mirroring disabled"';
        }
        cmds = '"tmsh create net self external-self-floating address ' + settings.extIpAddressFloating + '/' + settings.extPrefix + ' traffic-group traffic-group-1 vlan external"\n"tmsh create net self internal-self-floating address ' + settings.intIpAddressFloating + '/' + settings.intPrefix + ' traffic-group traffic-group-1 vlan internal"\n"tmsh create net self ha-self-floating address ' + settings.haIpAddressFloating + '/' + settings.haPrefix + ' traffic-group traffic-group-1 vlan ha"\n"tmsh modify cm device ' + settings.vmName + '.' + settings.vmFqdn + ' unicast-address { { effective-ip ' + settings.haIpAddress2 + ' effective-port 1026 ip ' + settings.haIpAddress2 + ' } { effective-ip ' + settings.mgmtIpAddress2 + ' effective-port 1026 ip ' + settings.mgmtIpAddress2 + ' } }"\n' + enableMirroring + '\n"tmsh save /sys config"';
        return sshfile.createCustomFile(settings.vmName2 + '-custom-temp.sh', cmds).then(resp => {
            logger.info('Done');
            logger.verbose(resp);
        })
    })
    .then(function() {
        logger.info('Transfer required files to:' + settings.vmName2);
        return sshfile.sndfile(settings.mgmtIpAddress2,bigipRootPwd,settings.vmName2 + '-custom-temp.sh').then(resp => {
            logger.info('Done');
            logger.silly(resp);
        })
    })
    .then(function() {
        logger.verbose('Cleanup temp files: ' + settings.vmName2 + '-custom-temp.sh');
        return sshfile.deleteFile(settings.vmName2 + '-custom-temp.sh').then(resp => {
            logger.debug(resp);
        })
    })
    .then(function() {
        logger.info('Run configuration commands using cloud-libs for big-ip:' + settings.vmName2);
        //Assemble Commands
        //Build network.js command
        networkJs = "nohup /config/cloud/vmware/waitThenRun.sh f5-rest-node /config/cloud/vmware/node_modules/f5-cloud-libs/scripts/network.js --host localhost --user admin --password " + bigipAdminPwd + " -o /var/log/cloud/vmware/network-config.log --log-level debug --wait-for ONBOARD_DONE --signal NETWORK_CONFIG_DONE --vlan name:external,nic:1.1<EXTVLAN> --default-gw " + settings.extGw + "<INTVLAN><HAVLAN> --self-ip name:external-self,address:" + settings.extIpAddress2 + "/" + settings.extPrefix + ",vlan:external <INTSELF><HASELF> &>> /var/log/cloud/vmware/cloudlibs-install.log < /dev/null &"
        if (settings.extVlan) {
            var networkJs = networkJs.replace(/<EXTVLAN>/g, ",tag:" + settings.extVlan);
        } else {
            var networkJs = networkJs.replace(/<EXTVLAN>/g, '');
        }
        if (settings.intVlan) {
            var networkJs = networkJs.replace(/<INTVLAN>/g, " --vlan name:internal,nic:1.2,tag:" + settings.intVlan);
            var networkJs = networkJs.replace(/<INTSELF>/g, " --self-ip name:internal-self,address:" + settings.intIpAddress2 + "/" + settings.intPrefix + ",vlan:internal");
        } else {
            var networkJs = networkJs.replace(/<INTVLAN>/g, " --vlan name:internal,nic:1.2");
            var networkJs = networkJs.replace(/<INTSELF>/g, " --self-ip name:internal-self,address:" + settings.intIpAddress2 + "/" + settings.intPrefix + ",vlan:internal");
        }
        if (settings.haVlan) {
            var networkJs = networkJs.replace(/<HAVLAN>/g, " --vlan name:ha,nic:1.3,tag:" + settings.haVlan);
            var networkJs = networkJs.replace(/<HASELF>/g, " --self-ip name:ha-self,address:" + settings.haIpAddress2 + "/" + settings.haPrefix + ",vlan:ha");

        } else {
            var networkJs = networkJs.replace(/<HAVLAN>/g, " --vlan name:ha,nic:1.3");
            var networkJs = networkJs.replace(/<HASELF>/g, " --self-ip name:ha-self,address:" + settings.haIpAddress2 + "/" + settings.haPrefix + ",vlan:ha");
        } 
        // Build onboard.js
        onboardJs = "nohup /config/cloud/vmware/waitThenRun.sh f5-rest-node /config/cloud/vmware/node_modules/f5-cloud-libs/scripts/onboard.js -o /var/log/cloud/vmware/onboard.log --log-level debug --host localhost --user admin --password " + bigipAdminPwd + " --hostname " + settings.vmName2 + "." + settings.vmFqdn + " --ntp "+ settings.ntp + " --tz " + settings.timezone + " --dns " + settings.dnsAddresses + " --module ltm:nominal <LICENSE> &>> /var/log/cloud/vmware/cloudlibs-install.log < /dev/null &"
        if (settings.bigiqAddress){
            var onboardJs = onboardJs.replace(/<LICENSE>/g, " --license-pool --big-iq-host " + settings.bigiqAddress + " --big-iq-user " + bigiqUsername + " --big-iq-password " + bigiqPwd + " --license-pool-name " + settings.bigiqLicensePoolName + " --big-ip-mgmt-address " + settings.mgmtIpAddress2);
        } else {
            var onboardJs = onboardJs.replace(/<LICENSE>/g, " --license " + settings.lickey2);
        }
        // Build cluster.js
        clusterjs = "nohup /config/cloud/vmware/waitThenRun.sh f5-rest-node /config/cloud/vmware/node_modules/f5-cloud-libs/scripts/cluster.js --wait-for CUSTOM_CONFIG_DONE --signal CLUSTER_DONE -o /var/log/cloud/vmware/cluster.log --log-level debug --host localhost --user admin --password " + bigipAdminPwd + " --config-sync-ip " + settings.haIpAddress2 + " --join-group --remote-user admin --remote-password " + bigipAdminPwd + " --device-group ha_failover_group --remote-host " + settings.mgmtIpAddress + " --sync &>> /var/log/cloud/vmware/cloudlibs-install.log < /dev/null &";
        return sndcmd.runCommands([ "chmod +x /config/cloud/vmware/installCloudLibs.sh",
                                    "chmod +x /config/cloud/vmware/waitThenRun.sh",
                                    "chmod +x /config/cloud/vmware/custom-config.sh",
                                    "nohup /config/cloud/vmware/installCloudLibs.sh &>> /var/log/cloud/vmware/cloudlibs-install.log < /dev/null &",
                                    networkJs,
                                    "nohup /config/cloud/vmware/waitThenRun.sh f5-rest-node /config/cloud/vmware/node_modules/f5-cloud-libs/scripts/runScript.js --file /config/cloud/vmware/custom-config.sh --cwd /config/cloud/vmware -o /var/log/cloud/vmware/custom-config.log --log-level debug --wait-for NETWORK_CONFIG_DONE --signal CUSTOM_CONFIG_DONE &>> /var/log/cloud/vmware/cloudlibs-install.log < /dev/null &",
                                    onboardJs,
                                    clusterjs
                                ],
                                settings.mgmtIpAddress2,bigipRootPwd,settings.dnsAddresses).then(resp => {
                                    logger.info('Done');
                                    logger.debug(resp);
                                })
    })    
    .then(function() {
        return auth.logout().then(resp => {
            logger.info('Successfully logged out of vCenter, statuscode:' + resp.statusCode);
            logger.info('BIG-IP Successfully configured: https://' + settings.mgmtIpAddress);
            logger.info('BIG-IP Successfully configured: https://' + settings.mgmtIpAddress2);  
            logger.debug(resp);
        })
    })
    .catch(error => {
        logger.error(JSON.stringify(error, null, 2));
    });
}
cluster();