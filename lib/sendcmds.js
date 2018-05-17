var fs = require('fs')
var q = require('q');
var util = require('./util')
//run the commands in shell session
function runCommands(cmds, mgmtIpAddress, bigipRootPwd, dnsAddresses) {
    return new Promise((resolve, reject) => {
        //host configuration with connection settings and commands
        var host = {
            server: {     
                host: mgmtIpAddress,
                userName: "root",
                port: 22,
                tryKeyboard: true
            },
            onCommandComplete: function( command, response, sshObj ) {
                this.emit("msg", 'Run Cmd: ' + command);
                this.emit("msg", response);
            },
            onError: function( err, type, close = false, callback ) {
                reject(err);
            },
            onEnd: function( sessionText, sshObj ) {                     
                resolve(sessionText);
            },
            commands: cmds,
            msg: {
                send: function( message ) {
                 //console.log(message);
                }
            },
            verbose: false,
            debug: false,
            idleTimeOut: 85000,
            onKeyboardInteractive: function(name, instructions, instructionsLang, prompts, finish){
                finish([bigipRootPwd] );
            },
        };
        var SSH2Shell = require ('ssh2shell'),
        //Create a new instance passing in the host object
        SSH = new SSH2Shell(host);
         
        //Start the process
        SSH.connect();
    })
}
function verifyMcp(cmds, mgmtIpAddress, bigipRootPwd, dnsAddresses) {
    return new Promise((resolve, reject) => {
        //host configuration with connection settings and commands
        var retryOptions;
        retryOptions = retryOptions || util.DEFAULT_RETRY;
        var mcp = 0;
        var count = 0   
        var func = function (){
            var host = {
                server: {     
                    host: mgmtIpAddress,
                    userName: "root",
                    port: 22,
                    tryKeyboard: true
                },
                onCommandComplete: function( command, response, sshObj ) {
                    this.emit("msg", 'Run Cmd: ' + command);
                        if (command === "ps aux | grep '/usr/bin/mcpd' | grep -v grep | wc -l" && response.match(1)){
                            mcp = 1;
                        }
                        else if (command === "ps aux | grep '/usr/bin/mcpd' | grep -v grep | wc -l" && response.match(0)){
                            mcp = 0;
                            sshObj.commands.unshift("ps aux | grep '/usr/bin/mcpd' | grep -v grep | wc -l");
                            sshObj.commands.unshift("sleep 10");
                        }
                        else {
                            this.emit("msg", response);
                        }
                },
                onError: function( err, type, close = false, callback ) {
                    count++
                    console.log('Attempt ' + count + ' failed');
                    console.log('Retrying SSH Connection.....');
                    if (count == 91) {
                        console.log('Max tries reached, verify ' + mgmtIpAddress + ' is accessable via SSH.....')
                    }
                    deffered.reject();
                },
                onEnd: function( sessionText, sshObj ) {
                    if (mcp == 1) {
                        deffered.resolve();
                        resolve('MCP ok ' + mcp);
                    } else {
                        deffered.reject();
                        console.log(mcp);
                    }
                },
                commands: cmds,
                msg: {
                    send: function( message ) {
                    // console.log(message);
                    }
                },
                verbose: false,
                debug: false,
                idleTimeOut: 10000,
                onKeyboardInteractive: function(name, instructions, instructionsLang, prompts, finish){
                    finish([bigipRootPwd] );
                },
            };

            var SSH2Shell = require ('ssh2shell'),
            //Create a new instance passing in the host object
            SSH = new SSH2Shell(host);
            
        //Start the process
            var deffered = q.defer();
            SSH.connect();
            return deffered.promise;
        };
        return util.tryUntil(this, retryOptions, func);
    })
}
exports.runCommands = runCommands;
exports.verifyMcp = verifyMcp;