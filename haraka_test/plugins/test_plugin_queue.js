// test_plugin_queue

const logger = require('./logger');
const outbound = require('./outbound');

exports.register = () => {
  logger.loginfo("Starting Custom Plugin");
};

exports.hook_data = (next, connection) => {
  connection.transaction.parse_body = true;
  next();
};

exports.hook_queue = (next, connection) => {
  var plugin = this;
  var transaction = connection.transaction;
  var emailTo = transaction.rcpt_to;
  var body = transaction.body; //transaction.message_stream.pipe(writeStream);
  var header = body.header.headers;
  var bodytext = body.bodytext;

  plugin.test(body);

  var to = emailTo;
  var from = header.from[0].slice(0,-2);

  var contents = [
      "From: " + from,
      "To: " + to,
      `MIME-Version: ${header['mime-version'][0].slice(-5,-1)}`,
      `Content-type: ${ body.ct }; charset=${ body.body_encoding }`,
      `Subject: ${ header.subject[0] }`,
      "",
      bodytext,
      ""].join("\n");
      
  var outnext = function (code, msg) {
      switch (code) {
          case DENY:  logger.logerror("Sending mail failed: " + msg);
                      break;
          case OK:    logger.loginfo("mail sent");
                      next();
                      break;
          default:    logger.logerror("Unrecognized return code from sending email: " + msg);
                      next();
      }
  };

  outbound.send_email(from, to, contents, outnext);
};

exports.shutdown = () => {
  logger.loginfo("Shutting down Custom Plugin.");
};
 
async function test (body) {
  //await setTimeout(()=> { logger.loginfo(body) }, 3000);
}



