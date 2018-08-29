//    Version v1.4.0
//    Deploys single BIG-IP with 1-4 configured network interfaces.
//    Example Required values located in ./settings.js
//    Load script in directory were script is located using notation "node f5-existing-stack-nNic-big-ip.js filename". Were filename contains configuration parameters using the format noted in ./settings.js.

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
var bigIqUsername = process.argv[7];
var bigIqPassword = process.argv[8];
function standalone() {
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
        if (settings.bigIqAddress) {
            logger.info('\nBig-IQ Address present, collecting Big-IQ credentials....');
            return input.inputCreds(false, 'Enter Big-IQ admin username:', 'Big-IQ admin account required! Remove Big-IQ address from settings file if you wish to use registration key for licensing.', bigIqUsername).then(resp => {
                bigIqUsername = resp;
            })
        } else {
            logger.info('\nUsing registration key for licensing. Auto registration requires Big-IP has internet access to f5 registration server.....');
            if (!settings.lickey1) {
                throw ('\nLicense Key required! Verify settings file contains license key: lickey1 needs value.');
            }
        }   
    })
    .then(function() {
        if (settings.bigIqAddress) {
            return input.inputCreds(true, 'Enter Big-IQ password:', 'Big-IQ password required!', bigIqPassword).then(resp => {
                bigIqPassword = resp;
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
        logger.info('\nCollecting required resource information from vCenter...');
        logger.verbose('Logging into vcenter:' + settings.host);
        return auth.login(vcenterUsername, vcenterPwd).then(resp => {
            logger.verbose('Authentication session obtained: ' + global.sessionId);
            logger.debug(resp);
        })
    })
    .then(function() {
        if (settings.numberNics == 1){
            settings.externalNetwork = settings.managementNetwork
        }            
        if (settings.numberNics <= 2){
            settings.internalNetwork = settings.managementNetwork 
        } 
        if (settings.numberNics <= 3) {
            settings.haNetwork = settings.managementNetwork
        }
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
            logger.info('\nDone');
        })
    })
    .then(function() {
        logger.info('Begin VM creation. This can take awhile; depends on content library performance.....');
        logger.verbose('Creating VM ' + settings.vmName);
        return ovf.deployOvf(datastoreId,contentItemId,mgmtNet,intNet,extNet,haNet,resourcePool, settings.vmName, settings.mgmtIpAddress, settings.mgmtPrefix, settings.mgmtGwAddress, bigipAdminPwd512, bigipRootPwd512).then(resp => {
            if (null !== resp && null !== resp.body.value && null == resp.body.value.error.errors[0]) {
                deployVm = resp.body.value.resource_id;
                logger.info('\nDone');
                logger.verbose('Successfully deployed VM ' + JSON.stringify(deployVm.id, null, 2));
                logger.debug(resp);
            } else {
                throw (logger.error('Error on VM creation:' + JSON.stringify(resp, null, 2)));
            }
        })
    })
    .then(function() {
        logger.verbose('Looking for VM ID with name ' + settings.vmName);
        return vm.find('filter.names.1=' + settings.vmName).then(resp => {
            if (null !== resp && null !== resp.body.value && resp.body.value.length > 0) {
                vmName = resp.body.value[0].vm;
                logger.verbose('VM ID:' + vmName);
                logger.debug(resp);
            }
        })
    })
    .then(function() {
        logger.verbose('List network interfaces for ' + vmName);
        return vm.listHardware(vmName, 'ethernet').then(resp => {
            mgmtNic = resp.body.value[0].nic;
            extNic = resp.body.value[1].nic;
            intNic = resp.body.value[2].nic;
            haNic = resp.body.value[3].nic;
            logger.verbose(vmName + ' Nics. Mgmt:' + mgmtNic + ' Ext:' + extNic + ' Int:' + intNic + ' ha:' + haNic);
            logger.debug(resp);
        })
    })
    .then(function() {
        if (settings.numberNics <= 2) {
            logger.info('\nRemoving unused interfaces...');
            return vm.deleteHardware(vmName, 'ethernet/' + haNic).then(resp => {
                logger.verbose('Removed network interface:' + haNic + ' Status Code:' + resp.statusCode);
            })
            .then(function() {
                return vm.deleteHardware(vmName, 'ethernet/' + intNic).then(resp => {
                    logger.verbose('Removed network interface:' + intNic + ' Status Code:' + resp.statusCode);
                    logger.info('\nDone');
                })
            })
        } else if (settings.numberNics == 3) {
            logger.info('\nRemoving unused interfaces...');
            return vm.deleteHardware(vmName, 'ethernet/' + haNic).then(resp => {
                logger.verbose('Removed network interface:' + haNic + ' Status Code:' + resp.statusCode);
                logger.info('\nDone');
            })
        }
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
        logger.info('Checking MCP state for ' + settings.mgmtIpAddress + ':' + settings.vmName);
        return sndcmd.verifyMcp(["ps aux | grep '/usr/bin/mcpd' | grep -v grep | wc -l"],
        settings.mgmtIpAddress,bigipRootPwd,settings.dnsAddresses).then(resp => {
            logger.info(resp);
        })
    })
    .then(function() {
        logger.info('Run initial configuration commands for big-ip:' + settings.vmName);
        return sndcmd.runCommands([ "tmsh modify sys dns name-servers replace-all-with { " + settings.dnsAddresses + " }",
                                    "mkdir -p /config/cloud/vmware",
                                    "mkdir -p /var/log/cloud/vmware",
                                    "curl -s -f --retry 20 -o /config/cloud/vmware/f5-cloud-libs.tar.gz '"+ settings.cloudlibUrl + "'"],
                                    settings.mgmtIpAddress,bigipRootPwd,settings.dnsAddresses).then(resp => {
                                    logger.debug(resp);
                                    logger.info('Done');
                                    })
    })   
    .then(function() {
        logger.info('Create required files for ' + settings.vmName);
        if (settings.numberNics == 1) {
            cmds = '"tmsh modify net interface 1.1 disabled"\n"tmsh save /sys config"\n"reboot"';
        } else {
            cmds = '"tmsh save /sys config"';
        }
        return sshfile.createCustomFile(settings.vmName + '-custom-temp.sh', cmds).then(resp => {
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
        logger.debug('Cleanup temp files: ' + settings.vmName + '-custom-temp.sh');
        return sshfile.deleteFile(settings.vmName + '-custom-temp.sh').then(resp => {
            logger.verbose(resp);
        })
    })
    .then(function() {
        logger.info('Run configuration commands using cloud-libs for big-ip:' + settings.vmName);
        //Assemble Commands
        //Build network.js command
        var set1nic = "nohup /config/cloud/vmware/waitThenRun.sh f5-rest-node /config/cloud/vmware/node_modules/f5-cloud-libs/scripts/network.js --host localhost --user admin --password " + bigipAdminPwd + " <MGMTPORT> -o /var/log/cloud/vmware/1nicSetup.log --log-level debug --wait-for ONBOARD_DONE --signal NETWORK_CONFIG_1NIC_DONE <ONENIC> &>> /var/log/cloud/vmware/install.log < /dev/null &";
        networkJs = "nohup /config/cloud/vmware/waitThenRun.sh f5-rest-node /config/cloud/vmware/node_modules/f5-cloud-libs/scripts/network.js --host localhost --user admin --password " + bigipAdminPwd + " --port 443 -o /var/log/cloud/vmware/network.log --log-level debug --wait-for NETWORK_CONFIG_1NIC_DONE --signal NETWORK_CONFIG_DONE --vlan name:external,nic:1.1<EXTVLAN> --default-gw " + settings.extGw + "<INTVLAN><HAVLAN> --self-ip name:external-self,address:" + settings.extIpAddress + "/" + settings.extPrefix + ",vlan:external <INTSELF><HASELF> &>> /var/log/cloud/vmware/install.log < /dev/null &"
        if (settings.numberNics == 1) {
            var set1nic = set1nic.replace(/<ONENIC>/g, "--single-nic");
            var set1nic = set1nic.replace(/<MGMTPORT>/g, "--port 8443");
            var networkJs = "nohup /config/cloud/vmware/waitThenRun.sh f5-rest-node /config/cloud/vmware/node_modules/f5-cloud-libs/scripts/network.js --host localhost --user admin --password " + bigipAdminPwd + " --port 8443 -o /var/log/cloud/vmware/network.log --log-level debug --wait-for NETWORK_CONFIG_1NIC_DONE --signal NETWORK_CONFIG_DONE --vlan name:external,nic:1.0 --default-gw " + settings.mgmtGwAddress + " --self-ip name:external-self,address:" + settings.mgmtIpAddress + "/" + settings.mgmtPrefix + ",vlan:external &>> /var/log/cloud/vmware/install.log < /dev/null &";
        } else {
            var set1nic = set1nic.replace(/<ONENIC>/g, "");
            var set1nic = set1nic.replace(/<MGMTPORT>/g, '')
        }
        if (settings.numberNics > 1 && settings.extVlan) {
            var networkJs = networkJs.replace(/<EXTVLAN>/g, ",tag:" + settings.extVlan);
        } else {
            var networkJs = networkJs.replace(/<EXTVLAN>/g, '');
        }
        if (settings.numberNics > 2 && settings.intVlan) {
            var networkJs = networkJs.replace(/<INTVLAN>/g, " --vlan name:internal,nic:1.2,tag:" + settings.intVlan);
            var networkJs = networkJs.replace(/<INTSELF>/g, " --self-ip name:internal-self,address:" + settings.intIpAddress + "/" + settings.intPrefix + ",vlan:internal");
        } else if (settings.numberNics > 2){
            var networkJs = networkJs.replace(/<INTVLAN>/g, " --vlan name:internal,nic:1.2");
            var networkJs = networkJs.replace(/<INTSELF>/g, " --self-ip name:internal-self,address:" + settings.intIpAddress + "/" + settings.intPrefix + ",vlan:internal");
        } else {
            var networkJs = networkJs.replace(/<INTVLAN>/g, '');
            var networkJs = networkJs.replace(/<INTSELF>/g, '');
        }
        if (settings.numberNics > 3 && settings.haVlan) {
            var networkJs = networkJs.replace(/<HAVLAN>/g, " --vlan name:ha,nic:1.3,tag:" + settings.haVlan);
            var networkJs = networkJs.replace(/<HASELF>/g, " --self-ip name:ha-self,address:" + settings.haIpAddress + "/" + settings.haPrefix + ",vlan:ha");

        } else if (settings.numberNics > 3){
            var networkJs = networkJs.replace(/<HAVLAN>/g, " --vlan name:ha,nic:1.3");
            var networkJs = networkJs.replace(/<HASELF>/g, " --self-ip name:ha-self,address:" + settings.haIpAddress + "/" + settings.haPrefix + ",vlan:ha");

        } else {
            var networkJs = networkJs.replace(/<HAVLAN>/g, '');
            var networkJs = networkJs.replace(/<HASELF>/g, '');
        }
        // Build onboard.js
        onboardJs = "nohup /config/cloud/vmware/waitThenRun.sh f5-rest-node /config/cloud/vmware/node_modules/f5-cloud-libs/scripts/onboard.js -o /var/log/cloud/vmware/onboard.log --log-level debug --host localhost --user admin --password " + bigipAdminPwd + "<MGMTPORT> --hostname " + settings.vmName + "." + settings.vmFqdn + " --ntp "+ settings.ntp + " --tz " + settings.timezone + " --dns " + settings.dnsAddresses + " --module ltm:nominal <LICENSE> &>> /var/log/cloud/vmware/install.log < /dev/null &"
        if (settings.numberNics == 1){
            var onboardJs = onboardJs.replace(/<MGMTPORT>/g, " --ssl-port 8443")
        } else {
            var onboardJs = onboardJs.replace(/<MGMTPORT>/g, '')
        }
        if (settings.bigIqAddress && settings.bigIqLicenseSkuKeyword1 && settings.bigIqLicenseUnitOfMeasure){
            var onboardJs = onboardJs.replace(/<LICENSE>/g, " --license-pool --cloud vmware --big-iq-host " + settings.bigIqAddress + " --big-iq-user " + bigIqUsername + " --big-iq-password " + bigIqPassword + " --license-pool-name " + settings.bigIqLicensePoolName + " --sku-keyword-1 " + settings.bigIqLicenseSkuKeyword1 + " --unit-of-measure " + settings.bigIqLicenseUnitOfMeasure + " --big-ip-mgmt-address " + settings.mgmtIpAddress);
        } else if (settings.bigIqAddress){
            var onboardJs = onboardJs.replace(/<LICENSE>/g, " --license-pool --cloud vmware --big-iq-host " + settings.bigIqAddress + " --big-iq-user " + bigIqUsername + " --big-iq-password " + bigIqPassword + " --license-pool-name " + settings.bigIqLicensePoolName + " --big-ip-mgmt-address " + settings.mgmtIpAddress);
        } else {
            var onboardJs = onboardJs.replace(/<LICENSE>/g, " --license " + settings.lickey1);
        }
        return sndcmd.runCommands([ "chmod +x /config/cloud/vmware/installCloudLibs.sh",
                                    "chmod +x /config/cloud/vmware/waitThenRun.sh",
                                    "chmod +x /config/cloud/vmware/custom-config.sh",
                                    "nohup /config/cloud/vmware/installCloudLibs.sh &>> /var/log/cloud/vmware/install.log < /dev/null &",
                                    onboardJs,
                                    set1nic,
                                    networkJs,
                                    "nohup /config/cloud/vmware/waitThenRun.sh f5-rest-node /config/cloud/vmware/node_modules/f5-cloud-libs/scripts/runScript.js --file /config/cloud/vmware/custom-config.sh --cwd /config/cloud/vmware -o /var/log/cloud/vmware/custom-config.log --log-level debug --wait-for NETWORK_CONFIG_DONE --signal CUSTOM_CONFIG_DONE &>> /var/log/cloud/vmware/install.log < /dev/null &",
                                ],
                                settings.mgmtIpAddress,bigipRootPwd,settings.dnsAddresses).then(resp => {
                                    logger.info('Done');
                                    logger.debug(resp);
                                })
    })
    .then(function() {
        if (settings.numberNics == 1) {    
            return vm.deleteHardware(vmName, 'ethernet/' + extNic).then(resp => {
                logger.verbose('Removed network interface:' + extNic + ' Status Code:' + resp.statusCode);
                logger.info('\nDone');
            })
        }
    })
    .then(function() {
        return auth.logout().then(resp => {
            logger.info('Successfully logged out of vCenter, statuscode:' + resp.statusCode);
            if (settings.numberNics == 1) {
                logger.info('BIG-IP Successfully configured: https://' + settings.mgmtIpAddress + ':8443');                
            } else {
                logger.info('BIG-IP Successfully configured: https://' + settings.mgmtIpAddress);  
            }

            logger.debug(resp);
        })
    })
    .catch(error => {
        logger.error(error);
    })
}
standalone();