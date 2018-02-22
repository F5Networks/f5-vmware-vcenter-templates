 // Version v1.0.0
 // This file contains required configuration parameters used in f5 templates. Note most parameters are case sensitive.
module.exports = {
  //vCenter parameters
  host: 'https://<vCenter_url>', //No default! Please provide a valid host URL.
  username: '<vcenter username>', //username. No default! Please provide a value.
  password: '<vcenter password>', // password. No default! Please provide a value.
  datacenter: '<datacenter name>', // the name of the datacenter in which to provision vm
  datastore: '<datastore name', // the name of a datastore used to build vm
  contentlibName: '<content library name>', // content library which contains big-ip ovf to deploy
  contentlibItem: '<content library template name >', //name of template in content library used to deploy BIG-IP
  managementNetwork: '<name of management network>', // vCenter network name used for management interface ***Note: network is required to have internet access
  internalNetwork: '<name of internal network>', // vCenter network name used for internal BIG-IP interface. Network contains internal/application traffic or route to internal application traffic.
  externalNetwork: '<name of external network>', // vCenter network name used for external BIG-IP interface. Network contains external traffic or route to external traffic.
  haNetwork: '<name of ha network>', // vCenter network used for HA
  resourcePool: '<name of resource pool>', // Resource pool used for this vm - "Resources" is default
  vmName: '<name to use for new VE>', // a name of a VM and hostname of BIG-IP
  ssl: false, // use strict ssl or not.. false allows you to accept all certs.
              // NOTE: SSL should be set to true in a production environment.

  // BIG-IP Specific information
  vmIpAddress: '<ip-address>', // IP address used to manage BIG-IP
  vmIpPrefix: '<prefix>', // mgmt subnet prefix
  vmGwAddress: '<gw address>', // management gw address
  extIpAddress: '<external self ip address>', // BIG-IP self IP (non-floating) used on external network
  extPrefix: '<prefix>', // external subnet prefix
  extGw: '<gw address>', // default gateway for tmm traffic
  extVlan: '<vlan>', // tagged VLAN for external subnet
  intIpAddress: '<internal self ip address>', // BIG-IP self IP (non-floating) used on internal network
  intPrefix: '<prefix>', // prefix for internal subnet
  intVlan: '<vlan>', // tagged VLAN for internal subnet
  haIpAddress: '<ha self ip address>', // BIG-IP self IP (non-floating) used on ha network
  haPrefix: '<prefix>', // prefix for HA subnet
  haVlan: '<vlan>', // tagged VLAN for HA subnet
  vmFqdn: '<fqdn.local>', // BIG-IP VE FQDN
  ntp: '<ntp server url>', // URL to use for NTP
  timezone: '<UTC>', // specify time zone, ie US/Pacific
  dnsAddresses: '<DNS list>', //list of server IP addresses to use for DNS
  lickey1: '<lic key>', // BIG-IP License key
}
