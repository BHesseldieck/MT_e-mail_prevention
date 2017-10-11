const request = require('request-promise');

exports.sendToDetectionEngine = (imgArr) => {
  if (imgArr.length) {
    return request({
        url: 'http://detectionengine:8080/checkImages',
        method: "POST",
        json: true,
        headers: {
            "content-type": "application/json",
        },
        body: imgArr,
      });
  }
  return imgArr;
};
