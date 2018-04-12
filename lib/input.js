function inputCreds(hide, question, error_message, credArg) {
  return new Promise((resolve, reject) => {
    if (credArg == null) {
      var readline = require('readline');
      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question(question, (input) => { 
        if (!input) {
          reject(error_message);
          rl.close();
        } else {
          resolve(input);
          rl.close();
        }
      }) 
      rl._writeToOutput = function _writeToOutput(stringToWrite) {
        if (hide)
          rl.output.write("*");
        else
          rl.output.write(stringToWrite);
      };
    } else {
      resolve(credArg);
    }
  })
}
exports.inputCreds = inputCreds;