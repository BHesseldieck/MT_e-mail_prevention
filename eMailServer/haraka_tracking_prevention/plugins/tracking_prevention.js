// imports
const logger = require('./logger');
const outbound = require('./outbound');

const mailExtractor = require('./mailExtractor')
const { sendToDetectionEngine } = require('./detectionEngineCommunication');

const MODE = 'mta'; // set as 'mta' or 'proxy' or 'rebound'
const PROXY_MAIL_ADDRESS = ''; // insert the proxy target address here and uncomment line 72

function escapeRegExp(string) {
  return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
};

function escapedTrackedImgSources(trackedImages) {
  return trackedImages.map(trackedImage => escapeRegExp(trackedImage.src)).join('|');
};

// Functions created in order of their calling by Haraka
exports.register = () => {
  logger.loginfo("Starting Tracking Prevention Plugin");
};

exports.hook_data = (next, connection) => {
  connection.transaction.parse_body = true;
  next();
};

exports.hook_data_post = async (next, connection) => {
  var to = MODE === 'proxy' ? PROXY_MAIL_ADDRESS : connection.transaction.rcpt_to;
  var body = connection.transaction.body; //transaction.message_stream.pipe(writeStream);
  var headers = connection.transaction.header.headers_decoded;

  const trackedImages = await sendToDetectionEngine(mailExtractor(body, headers));
  if (trackedImages.length) {
    // Adding untracked tag to subject
    headers.subject[0] = `[untracked] ${ headers.subject[0] }`;

    // Using Regex for Link replacement
    body.bodytext = body.bodytext.replace(new RegExp(escapedTrackedImgSources(trackedImages), "ig"), "https://cdn.pixabay.com/photo/2016/07/07/08/14/stop-1502032_960_720.png");
  }
  //logger.loginfo('TRACKED IMAGES: ', trackedImages); // logging tracked images to terminal

  // Forwarding untracked E-Mail
  var from = headers.from[0];
  var contents = [
      "From: " + from,
      "To: " + to,
      `MIME-Version: ${headers['mime-version'][0]}`,
      `Content-type: ${ body.ct }; charset=${ body.body_encoding }`,
      `Subject: ${ headers.subject[0] }`,
      "",
      body.bodytext,
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

  // Checking for forwarding-mode
  if (MODE === 'mta') {
    outbound.send_email(from, to, contents, outnext);
  } else if (MODE === 'proxy') {
    //outbound.send_email(from, PROXY_MAIL_ADDRESS, contents, outnext);
  } else if (MODE === 'rebound') {
    outbound.send_email(to, from, contents, outnext);
  } else {
    next();
  }
};

exports.shutdown = () => {
  logger.loginfo("Shutting down Tracking Prevention Plugin.");
};
