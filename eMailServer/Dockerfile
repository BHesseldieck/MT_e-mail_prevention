FROM node:14-alpine
MAINTAINER Ben Hesseldieck <b.hesseldieck@gmail.com>

ENV HOME /tmp
RUN apk update && apk add --no-cache python g++ make

# Installing Haraka
# latest test on version 2.8.16, keeping npm install not version specific for bugfixes on Haraka
RUN npm install -g Haraka --unsafe
RUN haraka -i /haraka_tracking_prevention
COPY /haraka_tracking_prevention /haraka_tracking_prevention
RUN cd /haraka_tracking_prevention && npm install --unsafe

# Providing port 25
EXPOSE 25

CMD ["haraka","-c","/haraka_tracking_prevention"]