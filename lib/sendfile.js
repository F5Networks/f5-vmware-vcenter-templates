var path = require('path');
var fs = require('fs');
function sndfile (mgmtIpAddress,bigipRootPwd,filename){
    var Client = require('ssh2').Client;
    var conn = new Client();
    return new Promise((resolve, reject) => {
        conn.on('keyboard-interactive',
        function(name, instructions, instructionsLang, prompts, finish) {
        // Pass answers to `prompts` to `finish()`. Typically `prompts.length === 1`
        // with `prompts[0] === "Password: "`
            finish([bigipRootPwd]);
        }).on('ready', function() {
            conn.sftp(
                function (err, sftp) {
                    if ( err ) {
                        console.log( "Error, problem starting SFTP: %s", err );
                        process.exit( 2 );
                    }
                    // upload file
                    var pathverifyHash = path.join(__dirname, '..', 'lib', 'verifyHash');
                    var readverifyHash = fs.createReadStream( pathverifyHash, 'utf8');
                    var writeverifyHash = sftp.createWriteStream( '/config/cloud/vmware/verifyHash' );
                    var pathwaitThenRun = path.join(__dirname, '..', 'lib', 'waitThenRun.sh' );
                    var readwaitThenRun = fs.createReadStream( pathwaitThenRun, 'utf8' );
                    var writewaitThenRun = sftp.createWriteStream( '/config/cloud/vmware/waitThenRun.sh' );
                    var pathcustomConfig = path.join(__dirname, '..', 'lib', filename );
                    var readcustomConfig = fs.createReadStream( pathcustomConfig, 'utf8' );
                    var writecustomConfig = sftp.createWriteStream( '/config/cloud/vmware/custom-config.sh' );
                    var pathinstallCloudlibs = path.join(__dirname, '..', 'lib', 'installCloudLibs.sh' );
                    var readinstallCloudlibs = fs.createReadStream( pathinstallCloudlibs, 'utf8' );
                    var writeinstallCloudlibs = sftp.createWriteStream( "/config/cloud/vmware/installCloudLibs.sh" );
                    // what to do when transfer finishes
                    writeverifyHash.on(
                        'close',
                        function () {
                    })
                    writeverifyHash.on(
                        'error',
                        function () {
                            reject(err);
                    })
                    writewaitThenRun.on(
                        'close',
                        function () {
                    })
                    writewaitThenRun.on(
                        'error',
                        function () {
                            reject(err);
                    })
                    writecustomConfig.on(
                        'close',
                        function () {
                    })
                    writecustomConfig.on(
                        'error',
                        function () {
                            reject(err);
                    })
                    writeinstallCloudlibs.on(
                        'close',
                        function () {
                            conn.end();
                            resolve(sftp);
                    })
                    writeinstallCloudlibs.on(
                        'error',
                        function () {
                            conn.end();
                            reject(err);
                    })
                    // initiate transfer of file
                    readverifyHash.pipe( writeverifyHash );
                    readinstallCloudlibs.pipe( writeinstallCloudlibs );
                    readwaitThenRun.pipe( writewaitThenRun );
                    readcustomConfig.pipe( writecustomConfig );
                });
            });
            conn.on(
                'error',
                function (err) {
                    console.log( "- connection error: %s", err );
                }
            );
            conn.connect({
            host: mgmtIpAddress,
            port: 22,
            username: 'root',
            tryKeyboard: true
            });
        })
};
function createCustomFile(filename,cmds) {
    return new Promise(function(resolve, reject) {
        var pathcustomConfig = path.join(__dirname, '..', 'lib', 'custom-config.sh' );
        fs.readFile(pathcustomConfig, 'utf8', function (err, data) {
            if (err) {
                reject(err)
            }
            var result = data.replace(/<CUSTOMCONFIG>/g,cmds);
            var pathtempcustomConfig = path.join(__dirname, '..', 'lib', filename);
            fs.writeFile(pathtempcustomConfig, result, 'utf8', function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
        })
    })
};
function deleteFile(filename) {
    return new Promise(function(resolve, reject) {
        var pathFileDelete = path.join(__dirname, '..', 'lib', filename );
        fs.unlink(pathFileDelete, function (err, data) {
            if (err) {
                reject(err)
            } else {
                resolve(data);
            }
        })
    });
};
exports.deleteFile = deleteFile;
exports.createCustomFile = createCustomFile;
exports.sndfile = sndfile;