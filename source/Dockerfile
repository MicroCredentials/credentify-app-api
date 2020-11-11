FROM lambci/lambda:build-nodejs10.x
ENV AWS_DEFAULT_REGION eu-central-1
RUN npm install -g typescript@3.5.3 claudia
RUN mkdir -p /app
WORKDIR /app
CMD [ "./bin/install.sh" ]