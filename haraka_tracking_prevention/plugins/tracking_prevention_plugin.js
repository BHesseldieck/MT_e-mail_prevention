// imports
const logger = require('./logger');
const outbound = require('./outbound');
const request = require('request-promise');
const jssoup = require('jssoup').default;
const difflib = require('difflib');
const range = require('lodash.range');

const trackingDetector = require('./trackingDetector');

function escapeRegExp(string) {
  return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
};

// Functions created in order of their calling by Haraka
exports.register = () => {
  logger.loginfo("Starting Tracking Prevention Plugin");
};

exports.hook_data = (next, connection) => {
  connection.transaction.parse_body = true;
  next();
};

exports.hook_queue = async (next, connection) => {
  var plugin = this;
  var transaction = connection.transaction;
  var emailTo = transaction.rcpt_to;
  var body = transaction.body; //transaction.message_stream.pipe(writeStream);
  var headers = body.header.headers_decoded;
  var bodytext = body.bodytext;

  const trackedImages = await trackingDetector(body,headers);
  logger.loginfo('TRACKED IMAGES: ', trackedImages);

  // Using Regex for Link replacement
  const escapedTrackedImgSources = trackedImages.map(trackedImage => escapeRegExp(trackedImage.src)).join('|');
  bodytext = bodytext.replace(new RegExp(escapedTrackedImgSources, "ig"), "HERE WAS A TRACKING IMAGE");

  var to = emailTo;
  var from = headers.from[0];

  var contents = [
      "From: " + from,
      "To: " + to,
      `MIME-Version: ${headers['mime-version'][0]}`,
      `Content-type: ${ body.ct }; charset=${ body.body_encoding }`,
      `Subject: ${ headers.subject[0] }`,
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
  //next();
};

exports.shutdown = () => {
  logger.loginfo("Shutting down Tracking Prevention Plugin.");
};





