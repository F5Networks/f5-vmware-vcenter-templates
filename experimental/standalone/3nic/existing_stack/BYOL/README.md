# Deploying the BIG-IP in VMware vCenter - 3 NIC

[![Slack Status](https://f5cloudsolutions.herokuapp.com/badge.svg)](https://f5cloudsolutions.herokuapp.com)

**Contents**

 - [Introduction](#introduction) 
 - [Prerequisites](#prerequisites-and-notes)
 - [Security](#security)
 - [Deploying the Template](#deploying-the-template)
 
 
## Introduction
This solution uses a VMware Template to launch a 3 NIC deployment of a BIG-IP VE in a Private VMware vCenter. Traffic flows from the BIG-IP VE to the application servers. This is the standard "on-premise like" design where the compute instance of F5 is running with a management, front-end application traffic (virtual server), and a back-end application interface. 

The BIG-IP VE has the <a href="https://f5.com/products/big-ip/local-traffic-manager-ltm">Local Traffic Manager</a> (LTM) module enabled to provide advanced traffic management functionality. This means you can also configure the BIG-IP VE to enable F5's L4/L7 security features, access control, and intelligent traffic management.
 
The **existing stack** VMware template incorporates existing networks.


## Prerequisites and notes
The following are prerequisites and configuration notes for the F5 3 NIC VMware template:
  - You must have downloaded a supported BIG-IP VE (13.0+) and uncompressed the image (see [OVA to OVF instructions](#ova-to-ovf-instructions)).
  - vCenter 6.0 or later with content libraries enabled (see [Content Library Information](#content-library-information)).
  - A client which supports Node 4.2.6 or higher (see step 2 in the [Example Client Setup](#example-client-setup-using-ubuntu-16043)).
  - A client with genisoimage installed (see step 2 in the [Example Client Setup](#example-client-setup-using-ubuntu-16043)).
  - You must have a F5 Networks BYOL license (Bring Your Own License) available.
  - Three (3) vCenter defined networks. The subnet for the management network requires a route and access to the Internet for the initial configuration to download the BIG-IP cloud library.
  - Firewall rules with the following inbound rules:  
    - Port 22 for SSH access to the BIG-IP VE.
    - Port 443 (or other port) for accessing the BIG-IP web-based Configuration utility.  
    - A port for accessing your applications via defined BIG-IP virtual servers.  
  - A local copy of F5-vmware-vcenter-templates git repo (go to https://github.com/F5Networks/f5-vmware-vcenter-templates and clone or download the repository).



  
### Security
This  VMware template downloads helper code to configure the BIG-IP system. If you want to verify the integrity of the template, you can open the VMware template and ensure the following lines are present. See [Security Detail](#securitydetail) for the exact code in each of the following sections.
  - In the */config/verifyHash* section: **script-signature** and then a hashed signature
  - In the */config/installCloudLibs.sh* section **"tmsh load sys config merge file /config/verifyHash"**
  
  Additionally, F5 provides checksums for all of our supported VMware templates. For instructions and the checksums to compare against, see https://devcentral.f5.com/codeshare/checksums-for-f5-supported-cft-and-arm-templates-on-github-1014.
  


### Help 
While this template has been created by F5 Networks, it is in the experimental directory and therefore has not completed full testing and is subject to change.  F5 Networks does not offer technical support for templates in the experimental directory. For supported templates, see the templates in the **supported** directory.

**Community Support**  
We encourage you to use our [Slack channel](https://f5cloudsolutions.herokuapp.com) for discussion and assistance on F5 VMware templates. There are F5 employees who are members of this community who typically monitor the channel Monday-Friday 9-5 PST and will offer best-effort assistance. This slack channel community support should **not** be considered a substitute for F5 Technical Support. See the [Slack Channel Statement](https://github.com/F5Networks/f5-vmware-vcenter-templates/blob/master/slack-channel-statement.md) for guidelines on using this channel.



## Deploying the template
Use the following guidance for deploying this template.

### OVA to OVF instructions
  -	Use tar to uncompact your OVA
    - ```tar -xf <path/name_of_ova_file.ova>```
  - You should now have 5 files with format: ```<name_of_ova_file.ovf, .cert, .mf, disk1.vmdk, and disk2.vmdk> ```  

### Content library information
This section contains content library guidance.  For information on VMware content libraries and performance, see https://blogs.vmware.com/performance/2015/07/efficiently-deploy-vms-vmware-vsphere-content-library.html).  

  1. Create a local content library  
     - Click **Content Libraries**.  
     - Click **Create new content library**.
     - Give the content library a name and then click **Next**.
     - Leave the default **Local content library** and then click **Next**.
     - Select a datastore (use a fast datastore, otherwise VE creations can be really slow), and then click **Next**. 
     - Click **Finish**.
     - You should now notice a content library with the name you specified.

  2. Upload the OVF into the content library
     - Click your content library.  
     - Click **Import item**.
     - Under Local File, click **Browse** and then select the location of your OVF file.
     - Click **Open**.
     - Should see a new window pop open that looks similar to:  
     ![Import library image](images/import-library.png)  


     - Click **Browse** to locate the required **vmdk** files,
     - Highlight both files and then click **Open**.
     - Note green check marks now located next to each required file .
     - Click **Ok**.
     - Note and/or change the item name.
     - Click **Ok** to upload the BIG-IP VE image into the content library.



### Example Client setup using Ubuntu 16.04.3
The following contains an example of the client setup using Ubuntu, however it should work on any MAC/Linux system that supports the requirements below):

  1.  Download git repo:
      - ```git clone https://github.com/F5Networks/f5-vmware-vcenter-templates.git```

  2.  Node and required package install:
      - ```sudo apt install nodejs-legacy``` (this will install v 4.2.6)
      - ```sudo apt install npm``` (this will install node package manager)
      - ```sudo apt install genisoimage``` (this will install the ISO creator required by templates)
      - load node package required by templates:
          - Change directory (cd) to the git project **f5-vmware-vcenter-templates**
          - Install dependencies: ```npm install –production ```

  3.  Modify the **settings.js** for the template you wish to use (see [Example Script](#example-script))

  4.  Run standalone node script:
      - Change directory to script you wish to run, for example: **/experimental/standalone/3nic/existing_stack/BYOL/**.
      - Run the script, for example **node f5-existing-stack-byol-3nic-big-ip.js**.

#### Example script

``` javascript
// This file contains required configuration parameters used in f5 templates. Note most parameters are case sensitive.
module.exports = {
  //vCenter parameters
  host: 'https://vcenter.local', //No default! Please provide a valid host URL.
  username: 'user@vsphere.local', //username. No default! Please provide a value.
  password: 'password', // password. No default! Please provide a value.
  datacenter: 'Datacenter', // the name of the datacenter in which to provision vm
  datastore: 'Datastore', // the name of a datastore used to build vm
  contentlibName: 'Content Library', // content library which contains BIG-IP ovf to deploy
  contentlibItem: 'BIGIP-13.1.0.0.0.1868-scsi', //name of template in content library used to deploy BIG-IP
  managementNetwork: 'network_admin', // vCenter network name used for management interface ***Note: network is required to have internet access
  internalNetwork: 'Trunk Mode', // vCenter network name used for internal BIG-IP interface. Network contains internal/application traffic or route to internal application traffic.
  externalNetwork: 'Trunk Mode', // vCenter network name used for external Big-Ip interface. Network contains external traffic or route to external traffic.
  haNetwork: 'Trunk Mode', // vCenter network used for HA
  resourcePool: 'Test Pool', // Resource pool used for this vm - Resources is default
  vmName: 'bigip-demo', // a name of a VM and hostname of BIG-IP
  ssl: false, // use strict ssl or not.. false allows you to accept all certs.
              // NOTE: SSL should be set to true in a production environment.

  // BIG-IP Specific information
  vmIpAddress: '10.10.1.105', // ip address used to manage big-ip
  vmIpPrefix: '24', // mgmt subnet prefix
  vmGwAddress: '10.10.1.254', // management gw address
  extIpAddress: '10.10.84.5', // BIG-IP self IP (non-floating) used on external network
  extPrefix: '24', // external subnet prefix
  extGw: '10.10.84.254', // default gateway for tmm traffic
  extVlan: '1084', // VLAN for external subnet
  intIpAddress: '10.10.85.5', // BIG-IP self IP (non-floating) used on internal network
  intPrefix: '24', // prefix for internal subnet
  intVlan: '1085', // VLAN for internal subnet
  haIpAddress: '10.10.40.5', // BIG-IP self IP (non-floating) used on HA network
  haPrefix: '24', // prefix for HA subnet
  haVlan: '1040', // tagged VLAN for HA subnet
  vmFqdn: 'testing.local', // BIG-IP VE FQDN
  ntp: 'pool.ntp.org', // URL to use for NTP
  timezone: 'US/Pacific', // specify time zone, ie US/Pacific
  dnsAddresses: '10.10.70.15 192.168.10.1', //list of server IP addresses to use for DNS
  lickey1: 'ABCDE-FGHIJ-KLMNO-PQRST-UVWXYZA', // BIG-IP License key

}

```

### Modifying the template
If necessary, you can modify/customize the BIG-IP configuration portion of the template itself. The file is located at https://github.com/F5Networks/f5-vmware-vcenter-templates/blob/master/experimental/standalone/3nic/existing_stack/BYOL/user_data_stencil/user_data_template.
To modify the template, edit the lines between   

```
### START CUSTOM TMSH CONFIGURATION  
### END CUSTOM TMSH CONFIGURATION  
```

**Important**: Do NOT modify any of the template outside those two lines.


## Security Details <a name="securitydetail"></a>
This section has the entire code snippets for each of the lines you should ensure are present in your template file if you want to verify the integrity of the helper code in the template.

**/config/verifyHash section**

Note the hashes and script-signature may be different in your template. The important thing to check is that there is a script-signature line present in the location.<br>


```json
"/config/verifyHash": {
                "content": {
                  "Fn::Join": [
                    "\n",
                    [
                      "cli script /Common/verifyHash {",
                      "proc script::run {} {",
                      "    set file_path  [lindex $tmsh::argv 1]",
                      "    set expected_hash 73d01a6b4f27032fd31ea7eba55487430ed858feaabd949d4138094c26ce5521b4578c8fc0b20a87edc8cb0d9f28b32b803974ea52b10038f068e6a72fdb2bbd",
                      "    set computed_hash [lindex [exec /usr/bin/openssl dgst -r -sha512 $file_path] 0]",
                      "    if { $expected_hash eq $computed_hash } {",
                      "        exit 0",
                      "    }",
                      "    exit 1",
                      "}",
                      "    script-signature OGvFJVFxyBm/YlpBsOf8/AIyo5+p7luzrE11v8t7wJ1u24MBeit5pL/McqLxjydPJplymTcJ0qDEtXPZv09TTUF5hrF0g1pJ+z70omzJ6J9kOfOO8lyWP4XU/qM+ywEgAGoc8o8kGjKX01XcmB1e3rq6Mj5gE7CEkxKEcNzF3n5nDIFyBbpG6pJ8kg/7f6gtU14bJo0+ipNAiX+gBmT/10aUKKeJESU5wz+QqnEOE1WuTzdURArxditpk0+qqROZaSULD61w72hEy7kBC/miO+As7q8wjM5/H2yUHLoFLmBWP0jMWqIuzqnG+tgAFjJbZ1UJJDzWiYZK1TG1MsxfPg==",
                      "}"
                    ]
                  ]
                },
                "mode": "000755",
                "owner": "root",
                "group": "root"
              }
```
<br><br>
**/config/installCloudLibs.sh section**


```json
"/config/installCloudLibs.sh": {
                "content": {
                  "Fn::Join": [
                    "\n",
                    [
                      "#!/bin/bash",
                      "echo about to execute",
                      "checks=0",
                      "while [ $checks -lt 120 ]; do echo checking mcpd",
                      "    tmsh -a show sys mcp-state field-fmt | grep -q running",
                      "    if [ $? == 0 ]; then",
                      "        echo mcpd ready",
                      "        break",
                      "    fi",
                      "    echo mcpd not ready yet",
                      "    let checks=checks+1",
                      "    sleep 10",
                      "done",
                      "echo loading verifyHash script",
                      "tmsh load sys config merge file /config/verifyHash",
                      "if [ $? != 0 ]; then",
                      "    echo cannot validate signature of /config/verifyHash",
                      "    exit",
                      "fi",
                      "echo loaded verifyHash",
                      "echo verifying f5-cloud-libs.targ.gz",
                      "tmsh run cli script verifyHash /config/cloud/f5-cloud-libs.tar.gz",
                      "if [ $? != 0 ]; then",
                      "    echo f5-cloud-libs.tar.gz is not valid",
                      "    exit",
                      "fi",
                      "echo verified f5-cloud-libs.tar.gz",
                      "echo expanding f5-cloud-libs.tar.gz",
                      "tar xvfz /config/cloud/f5-aws-autoscale-cluster.tar.gz -C /config/cloud",
                      "tar xvfz /config/cloud/asm-policy-linux.tar.gz -C /config/cloud",
                      "tar xvfz /config/cloud/f5-cloud-libs.tar.gz -C /config/cloud/aws/node_modules",
                      "cd /config/cloud/aws/node_modules/f5-cloud-libs",
                      "echo installing dependencies",
                      "npm install --production /config/cloud/f5-cloud-libs-aws.tar.gz",
                      "touch /config/cloud/cloudLibsReady"
                    ]
                  ]
                },
                "mode": "000755",
                "owner": "root",
                "group": "root"
              }
```




## Filing Issues
If you find an issue, we would love to hear about it. 
You have a choice when it comes to filing issues:
  - Use the **Issues** link on the GitHub menu bar in this repository for items such as enhancement or feature requests and non-urgent bug fixes. Tell us as much as you can about what you found and how you found it.
  - Contact us at [solutionsfeedback@f5.com](mailto:solutionsfeedback@f5.com?subject=GitHub%20Feedback) for general feedback or enhancement requests. 
  - Use our [Slack channel](https://f5cloudsolutions.herokuapp.com) for discussion and assistance on F5 cloud templates. There are F5 employees who are members of this community who typically monitor the channel Monday-Friday 9-5 PST and will offer best-effort assistance.
  - For templates in the **supported** directory, contact F5 Technical support via your typical method for more time sensitive changes and other issues requiring immediate support.



## Copyright

Copyright 2014-2018 F5 Networks Inc.


## License


### Apache V2.0

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations
under the License.

### Contributor License Agreement

Individuals or business entities who contribute to this project must have
completed and submitted the F5 Contributor License Agreement.
