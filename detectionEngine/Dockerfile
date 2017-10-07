FROM r-base:3.3.1
MAINTAINER Ben Hesseldieck <b.hesseldieck@gmail.com>

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    libcurl4-openssl-dev \
    libssl-dev

# jug instance configuration
ENV JUG_HOST 0.0.0.0
ENV JUG_PORT 8080

COPY /tracking_detectionEngine_20160616 /tracking_detectionEngine_20160616
WORKDIR /tracking_detectionEngine_20160616
RUN Rscript loadPackages.R

# Providing port 8080
EXPOSE 8080

CMD ["Rscript", "server_trackingDetector.R"]