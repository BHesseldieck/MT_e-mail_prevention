// imports
const logger = require('./logger');
const outbound = require('./outbound');
const request = require('request');
const jssoup = require('jssoup').default;
const difflib = require('difflib');
const range = require('lodash.range');
const stringify = require('json-stable-stringify')

const relevantRegularHeaders = {received: '', 'content-type': '', 'bounces-to': '', 'date': '', 'delivered-to': '', 'message-id': '', 'return-path': '',
                      'errors-to': '', 'from': '', 'importance': '', 'list-help': '', 'list-id': '', 'list-owner': '',
                      'list-post': '', 'reply-to': '', 'received-spf': '', 'sender': '', 'subject': '', 'list-unsubscribe': '',
                      'content-type': ''};

const relevantRegularImageAttributes = { 'alt':'', 'align':'', 'border':'', 'border-style':'', 'class':'', 'contextmenu':'', 'dir':'', 'height':'',
                      'hidden':'', 'hspace':'', 'id':'', 'ismap':'', 'lang':'', 'longdesc':'', 'src':'', 'style':'', 'tabindex':'', 'title':'',
                      'usemap':'', 'vspace':'', 'valign':'', 'width':'' };

const relevantImageStyleAttributes = { 'style':'', 'color':'', 'font-family':'', 'font-size':'', 'text-align':'', 'height':'', 'width':'', 'display':'',
                      'opacity':'','max-width':'', 'max-height':'', 'margin':'', 'background-color':''};

// Functions created in order of their calling by Haraka
exports.register = () => {
  logger.loginfo("Starting Tracking Prevention Plugin");
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
  var headers = body.header.headers_decoded;
  var bodytext = body.bodytext;

  plugin.mlcomm(mailExtractor(body, headers));

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

  //outbound.send_email(from, to, contents, outnext);
  next();
};

exports.shutdown = () => {
  logger.loginfo("Shutting down Tracking Prevention Plugin.");
};


// Worker Functions
async function mlcomm (imgArr) {
  var testbody = {"mailCounter":47,"align":0,"alt":"","avgLinkSimilarity":0.5692,"border":0,"class":"","countIdenticalImg":0,"exist_custom_keys":0,"height":1,"hspace":"NA","id":"","maxLinkSimilarity":0.6738,"minLinkSimilarity":0.29442,"src":"http://www.stern.de/blob/4541962/12efb66149ef9afcdd6358728aecdf2c/newsletter-twitter-data.png","style_background.color":0,"style_color":0,"style_display":0,"style_font.family":0,"style_font.size":0,"style_height":"NA","style_margin":"","style_max.height":"NA","style_max.width":"NA","style_text.align":"","style_width":"NA","title":"","usemap":"","vspace":"NA","width":1,"content.type":"text/html; charset=UTF-8","date":"2017-01-19 13:00:40","delivered.to":"michael.mayer1001@gmail.com","errors.to":"","from":"stern Lifestyle <lifestyle@newsletter.stern.de>","list.help":"<mailto:complaint@intl.teradatadmc.com>","list.id":"<2100066605.newsletter.stern.de>","list.owner":"","list.post":"","list.unsubscribe":"<http://newsletter.stern.de/public/list_unsubscribe.jsp?action=listUnsubscribe&gid=2100066605&uid=21139491760&mid=2102001314&siglistunsub=BKPOMADBHEIEDOJF&errorPage=/public/list_unsubscribe.jsp>, <mailto:listunsubscribe-2100066605-2102001314-21139491760@newsletter.stern.de>","message.id":"<pcs6ku.iy4dy0oyw85qz9sal@newsletter.stern.de>","received":"from app05.muc.ec-messenger.com (app05.muc.domeus.com [172.16.8.35])\n\tby mta025.muc.domeus.com (READY) with ESMTP id 114E012002E04\n\tfor <michael.mayer1001@gmail.com>; Thu, 19 Jan 2017 14:00:40 +0100 (CET)","received.spf":"pass (google.com: domain of g-21139491760-21169-2102001314-1484830840067@bounce.newsletter.stern.de designates 195.140.185.136 as permitted sender) client-ip=195.140.185.136;","reply.to":"\"stern.de - Lifestyle Newsletter\" <newsletter@stern.de>","return.path":"<g-21139491760-21169-2102001314-1484830840067@bounce.newsletter.stern.de>","sender":"","subject":"Aktuelle News aus dem Lifestyle-Ressort","from_mail":"lifestyle@newsletter.stern.de","from_name":"stern Lifestyle","date_stamp":"20170119","mailID":"20170119-Aktuelle News aus dem Lifestyle-Ressort-1","imgPos":31,"imgCount":48,"relImagePosition":0.64583,"imagesToBorder":17,"linkLength":93,"numbers":0.24731,"upperLetters":0,"caseChanges":0,"numalphaChange":0.07527,"count_b":3.22581,"count_f":4.30108,"count_i":1.07527,"count_m":0,"count_w":5.37634,"count_b_meandev":0.14106,"count_f_meandev":2.23701,"count_i_meandev":-0.55742,"count_m_meandev":-0.99094,"count_w_meandev":2.04576,"relSrcLength":0.06639,"folderDepth":5,"relFolderDepth":0,"spotTrackSrc":0,"spotIDSrc":0,"spotListSrc":0,"spotUserSrc":0,"spotClickSrc":0,"spotTagSrc":0,"spotViewSrc":0,"spotOpenSrc":0,"spotAt":0,"spotQuestionmark":0,"countIDsPath":2,"countIDsFilename":0,"minFolderLength":4,"maxFolderLength":32,"matchSrcUnsubscribe":0,"matchSrcSpf":0,"matchSrcReturn":0,"imageFilenameLength":27,"relFilenameLength":0.09392,"longestNr":0,"nrStringsCount":0,"equalSignCount":0,"punctCharCount":3,"nrOfWords":3,"sharedFileformat":0.60417,"domain":"//www.stern.de/","domainLength":15,"senderDomain":"stern","matchSendernameImage":1,"imageSenderSameDomain":1,"sharedDomain":0.5625,"area":1,"stdWidthHeightRatio":0,"ratioSmallerImg":0.79167,"outsiderArea":0,"vhspace":"NA","altLength":0,"titleLength":0,"classLength":0,"idLength":0,"unsubscribeLength":274,"unsubscribeAdresses":2,"contentTypeLength":24,"areaClassarea00px":0,"areaClassarea01px":0,"areaClassarea01to10px":0,"areaClassarea100pxPlus":0,"areaClassarea10pxto100px":0,"areaClassareaMissing":1,"fileFormatjpg":0,"fileFormatnone":0,"fileFormatother":0,"fileFormatphp":0,"fileFormatpng":1};
  logger.loginfo(imgArr);
  // consider mails without images
  // if no image just forward if just one image add a dummy image because ML can just cope with 2+ images
  await request({
      url: 'http://localhost:8080/checkImages',
      method: "POST",
      json: true,
      headers: {
          "content-type": "application/json",
      },
      body: imgArr,
    },
    (err,res,body) => {
      if (err) { logger.logerror(err) };
      logger.loginfo('RESULT IS: ',body, Array.isArray(body));
    }
  );
  for (var key in testbody) {
    if (imgArr[5][key] == undefined) {
      logger.logerror('key not existing in imgArr: ',key);
    }
  }
};

// Extracting e-mail useful for classification
function extractHeaders (headers) {
  let extractedHeaders = { mailCounter: 1 };
  for (var key in headers) {
    if (key.toLowerCase() in relevantRegularHeaders) {
      extractedHeaders[key.toLowerCase()] = headers[key].length === 1 ? headers[key][0] : headers[key];
    }
  }
  return extractedHeaders;
};

function getStdImgTags (imgTags) {
  let imgTagsStd = { mailCounter: 1 };
  for (var key in relevantRegularImageAttributes) {
    if (key in imgTags) {
      imgTagsStd[key] = imgTags[key];
    }
  }
  return imgTagsStd;
};

function checkCustomKeys (imgTags, imgTagsStd, imgTagStdLength) {
  Object.keys(imgTags).length > imgTagStdLength ? imgTagsStd['exist_custom_keys'] = 1 : imgTagsStd['exist_custom_keys'] = 0;
  for (var key in imgTagsStd) {
    if (imgTagsStd[key] === null) {
      imgTagsStd[key] = "CODEERR";
    }
  }
};

function destructStyling (imgTags, imgTagsStd) {
  let styleAttrObj = {};
  imgTags.style.split('; ').forEach(styleAttr => {
    let tempArr = styleAttr.split(': ');
    if (tempArr.length === 2 && tempArr[0] in relevantImageStyleAttributes) {
      styleAttrObj['style_' + tempArr[0]] = tempArr[1];
    }
  });
  imgTagsStd = Object.assign(imgTagsStd, styleAttrObj);
  delete imgTagsStd['style'];
};

function extractImages (body) {
  let bodySoup = new jssoup(body.bodytext);
  var imgTagStdLength;

  return bodySoup.findAll('img').map(Image => {
    var imgTagsStd = getStdImgTags(Image.attrs);
    imgTagStdLength = Object.keys(imgTagsStd).length;
    if (imgTagStdLength > 0) {
      checkCustomKeys(Image.attrs, imgTagsStd, imgTagStdLength);
    }
    if ('style' in Image.attrs) {
      destructStyling(Image.attrs, imgTagsStd)
    }
    return imgTagsStd;
  });
};

function calcLinkSims (mailImagesArr) {
  let i = 0;
  let tempImgSrcs = mailImagesArr.reduce((accArr, ImageStd) => {
    if ('src' in ImageStd) {
      accArr.push(ImageStd);
    }
    return accArr;
  }, []);

  mailImagesArr.forEach(img => {
    if (tempImgSrcs.length > 1 && 'src' in img) {
      const indices = range(Math.max(0,i-4), Math.min(i+4,tempImgSrcs.length-1) + 1);
      let tmp = indices.reduce((accArr, indice) => {
        if (indice != i) {
          accArr.push(tempImgSrcs[indice]);
        }
        return accArr;
      },[]);
      const simratios = tmp.map(otherImg => {
        return new difflib.SequenceMatcher(null, img['src'], otherImg['src']).ratio();
      });
      img['avgLinkSimilarity'] = simratios.reduce((a,b) => (a+b)) / simratios.length;
      img['minLinkSimilarity'] = Math.min(...simratios);
      img['maxLinkSimilarity'] = Math.max(...simratios);
      img['countIdenticalImg'] = simratios.reduce((acc, val) => {
          if (val === 1) {
            acc++;
          }
          return acc;
      },0);
      i++;
    }
  });
};

function keyCheck (mailImgArr) {
  const reqKeyObj = {
    "mailCounter":47,
    "align":0,
    "alt":"",
    "avgLinkSimilarity":0.78452,
    "border":0,
    "class":"['colimg4']",
    "countIdenticalImg":0,
    "exist_custom_keys":0,
    "height":1,
    "hspace":"NA",
    "id":"",
    "maxLinkSimilarity":0.91892,
    "minLinkSimilarity":0.40964,
    "src":"http://newsletter.stern.de/imgproxy/img/679805017/newsletter-icon-135x135.png",
    "style_background.color":0,
    "style_color":0,
    "style_display":1,
    "style_font.family":0,
    "style_font.size":0,
    "style_height":"NA",
    "style_margin":"auto",
    "style_max.height":"NA",
    "style_max.width":"NA",
    "style_text.align":"",
    "style_width":"NA",
    "title":"",
    "usemap":"",
    "vspace":"NA",
    "width":135,
    "content.type":"text/html; charset=UTF-8",
    "date":"2017-01-19 13:00:40",
    "delivered.to":"michael.mayer1001@gmail.com",
    "errors.to":"",
    "from":"stern Lifestyle <lifestyle@newsletter.stern.de>",
    "list.help":"<mailto:complaint@intl.teradatadmc.com>",
    "list.id":"<2100066605.newsletter.stern.de>",
    "list.owner":"",
    "list.post":"",
    "list.unsubscribe":"<http://newsletter.stern.de/public/list_unsubscribe.jsp?action=listUnsubscribe&gid=2100066605&uid=21139491760&mid=2102001314&siglistunsub=BKPOMADBHEIEDOJF&errorPage=/public/list_unsubscribe.jsp>, <mailto:listunsubscribe-2100066605-2102001314-21139491760@newsletter.stern.de>",
    "message.id":"<pcs6ku.iy4dy0oyw85qz9sal@newsletter.stern.de>",
    "received":"from app05.muc.ec-messenger.com (app05.muc.domeus.com [172.16.8.35])\n\tby mta025.muc.domeus.com (READY) with ESMTP id 114E012002E04\n\tfor <michael.mayer1001@gmail.com>; Thu, 19 Jan 2017 14:00:40 +0100 (CET)",
    "received.spf":"pass (google.com: domain of g-21139491760-21169-2102001314-1484830840067@bounce.newsletter.stern.de designates 195.140.185.136 as permitted sender) client-ip=195.140.185.136;",
    "reply.to":"\"stern.de - Lifestyle Newsletter\" <newsletter@stern.de>",
    "return.path":"<g-21139491760-21169-2102001314-1484830840067@bounce.newsletter.stern.de>",
    "sender":"",
    "subject":"Aktuelle News aus dem Lifestyle-Ressort",
    "from_mail":"lifestyle@newsletter.stern.de",
    "from_name":"stern Lifestyle",
    "date_stamp":"20170119",
    "mailID":"20170119-Aktuelle News aus dem Lifestyle-Ressort-1",
    "imgPos":47,
    "imgCount":48,
    "relImagePosition":0.97917,
    "imagesToBorder":1,
    "linkLength":77,
    "numbers":0.19481,
    "upperLetters":0,
    "caseChanges":0,
    "numalphaChange":0.01299,
    "count_b":0,
    "count_f":0,
    "count_i":3.8961,
    "count_m":2.5974,
    "count_w":2.5974,
    "count_b_meandev":-3.08475,
    "count_f_meandev":-2.06407,
    "count_i_meandev":2.26341,
    "count_m_meandev":1.60646,
    "count_w_meandev":-0.73318,
    "relSrcLength":-0.99587,
    "spotTrackSrc":0,
    "spotIDSrc":0,
    "spotListSrc":0,
    "spotUserSrc":0,
    "spotClickSrc":0,
    "spotTagSrc":0,
    "spotViewSrc":0,
    "spotOpenSrc":0,
    "spotAt":0,
    "spotQuestionmark":0,
    "countIDsPath":1,
    "countIDsFilename":0,
    "minFolderLength":3,
    "maxFolderLength":9,
    "matchSrcUnsubscribe":0,
    "matchSrcSpf":0,
    "matchSrcReturn":0,
    "imageFilenameLength":27,
    "relFilenameLength":0.09392,
    "longestNr":3,
    "nrStringsCount":0,
    "equalSignCount":0,
    "punctCharCount":3,
    "nrOfWords":2,
    "sharedFileformat":0.60417,
    "domain":"//newsletter.stern.de/",
    "domainLength":22,
    "senderDomain":"stern",
    "matchSendernameImage":1,
    "imageSenderSameDomain":1,
    "sharedDomain":0.20833,
    "area":135,
    "stdWidthHeightRatio":0,
    "ratioSmallerImg":0.875,
    "outsiderArea":1,
    "vhspace":"NA",
    "altLength":0,
    "titleLength":0,
    "classLength":11,
    "idLength":0,
    "unsubscribeLength":274,
    "unsubscribeAdresses":2,
    "contentTypeLength":24,
    "areaClassarea00px":0,
    "areaClassarea01px":0,
    "areaClassarea01to10px":0,
    "areaClassarea100pxPlus":0,
    "areaClassarea10pxto100px":0,
    "areaClassareaMissing":1,
    "fileFormatjpg":0,
    "fileFormatnone":0,
    "fileFormatother":0,
    "fileFormatphp":0,
  };

  const tempMailImgArr = mailImgArr.map(img => {
    return Object.assign({}, reqKeyObj, img);
  });

  if (tempMailImgArr.length === 1) {
    tempMailImgArr.push(reqKeyObj);
  }
  return tempMailImgArr;
};

// Using Regex for Link replacement
// var imgSources = [].join('|');
// var re = new RegExp("\\"+"url1|url2", "ig");
// var res = str.replace(re, "replacement URL");

// Preparing mail data for classification from ML-algorithm
function mailExtractor (body, headers) {
  let mailImages = extractImages(body);
  calcLinkSims(mailImages);
  mailImages = keyCheck(mailImages);
  return mailImages.map(ImageAttr => Object.assign(ImageAttr, extractHeaders(headers)));
};





