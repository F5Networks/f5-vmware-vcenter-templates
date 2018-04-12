 // Version v1.1.0
 // This file contains required configuration parameters used in f5 failover templates. Note most parameters are case sensitive.

module.exports = {
  //vCenter parameters
  host: 'https://<vCenter_url>', //No default! Please provide a valid host URL.
  datacenter: '<datacenter name>', // the name of the datacenter in which to provision vm
  datastore: '<datastore name>', // the name of a datastore used to build vm
  contentlibName: '<content library name>', // content library which contains big-ip ovf to deploy
  contentlibItem: '<content library template name >', //name of template in content library used to deploy BIG-IP
  managementNetwork: '<name of management network>', // vCenter network name used for management interface ***Note: network is required to have internet access
  internalNetwork: '<name of internal network>', // vCenter network name used for internal BIG-IP interface. Network contains internal/application traffic or route to internal application traffic.
  externalNetwork: '<name of external network>', // vCenter network name used for external BIG-IP interface. Network contains external traffic or route to external traffic.
  haNetwork: '<name of ha network>', // vCenter network used for HA
  resourcePool: '<name of resource pool>', // Resource pool used for this vm - "Resources" is default
  vmName: '<name to use for new VE>', // a name of a VM and hostname of BIG-IP
  vmName2: '<name to use for new VE>', // a name of a VM and hostname of BIG-IP
  ssl: false, // use strict ssl or not.. false allows you to accept all certs.
              // NOTE: SSL should be set to true in a production environment.
  //Logging parameters
  logConsole: true, // log messages to console
  logLevel: 'info', // log message level (error, warn, info, verbose, debug, silly).

  // BIG-IP Specific information
  // Device settings
  vmFqdn: '<fqdn>', // BIG-IP VE FQDN
  ntp: '<ntp server url>', // URL to use for NTP
  timezone: '<UTC>', // specify time zone, ie US/Pacific
  dnsAddresses: '<DNS list>', // list of server IP addresses to use for DNS
  cloudlibUrl: 'https://raw.githubusercontent.com/F5Networks/f5-cloud-libs/v3.6.0/dist/f5-cloud-libs.tar.gz', // list url used to download cloud-libs node library.
                // The default is listed as public github repository, specify alternate url if public internet from big-ip management network is not available.
                // **Note cloud-lib version is specific to this template release and requires the cloud-lib release specified in default url be used (v3.6.0).
  
  // BIG-IP licensing using BIG-IQ
  bigiqAddress: '<BIG-IQ Management ip address>',   // optional - list BIG-IQ management address or FQDN to use for licensing BIG-IP's. ** Leave blank if using license keys!
  bigiqLicensePoolName: '<BIG-IQ licensing pool>', // Name of BIG-IQ license pool
  
  // BIG-IP licensing using license key
  lickey1: '',  // If not using BIG-IQ to license BIG-IP's, list first BIG-IP License key (vmName). Leave blank if using BIG-IQ!
                // **Note this option uses auto registration which requires BIG-IP management network allow access to F5 public registration server.
  lickey2: '',  // If not using BIG-IQ to license BIG-IP's, list second BIG-IP License key (vmName2). Leave blank if using BIG-IQ!
                // **Note this option uses auto registration which requires BIG-IP management network allow access to F5 public registration server.
  
  // Management network settings (1st nic)
  mgmtIpAddress: '<1st mgmt ip address>', // IP address used to manage first BIG-IP (vmName)
  mgmtAddress2: '<2nd mgmt ip address>', // IP address used to manage second BIG-IP (vmName2)
  mgmtPrefix: '<mgmt prefix>', // mgmt subnet prefix
  mgmtGwAddress: '<mgmt gw address>', // management gw address
  
  // Public or external settings (2nd nic)
  extIpAddress: '<1st ext ip address>', // First BIG-IP self IP (non-floating) used on external network (vmName)
  extIpAddress2: '<2nd ext ipaddress>', // Second BIG-IP self IP (non-floating) used on external network (vmName2)
  extIpAddressFloating: '<ext floating ip address>', // BIG-IP self IP (floating) used on external network
  extPrefix: '<ext prefix>', // external subnet prefix
  extGw: '<ext gw>', // default gateway for tmm traffic
  extVlan: '<ext vlan>', // optional - tagged VLAN for external subnet. **Leave blank if vlan is untagged.
  
  // Internal or private settings (3rd nic)
  intIpAddress: '<1st int ip address>', // First BIG-IP self IP (non-floating) used on internal network (vmName)
  intIpAddress2: '<2nd int ip address>', // Second BIG-IP self IP (non-floating) used on internal network (vmName2)
  intIpAddressFloating: '<int floating ip address>', // BIG-IP self IP (floating) used on internal network
  intPrefix: '<int prefix>', // prefix for internal subnet
  intVlan: '<int vlan>', // optional - tagged VLAN for internal subnet. **Leave blank if vlan is untagged.
  
  // HA settings (4th nic)
  haIpAddress: '<1st ha ip address>', // First BIG-IP self IP (non-floating) used on ha network (vmName)
  haIpAddress2: '<2nd ha ip address>', // Second BIG-IP self IP (non-floating) used on ha network (vmName2)
  haIpAddressFloating: '<floating ha ip address>', // BIG-IP self IP (floating) used on ha network
  haPrefix: '<ha previx>', // prefix for HA subnet
  haVlan: '<ha vlan>', // optional - tagged VLAN for ha subnet. **Leave blank if vlan is untagged.
  stateMirroring: true, // enable state mirroring - true or false
}