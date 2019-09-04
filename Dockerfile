FROM arm32v7/node
ENV NODE_VERSION 11.15.0
WORKDIR ./

# install dependencies
RUN apt-get update;\
    apt-get install qemu qemu-user-static binfmt-support -y;\
    apt-get install nano -y;\
    apt-get install i2c-tools -y;

# TODO: install mongodb-org-tools
##mongodb tools
#RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 9DA31620334BD75D9DCB49F368818C72E52529D4
#RUN echo "deb http://repo.mongodb.org/apt/debian stretch/mongodb-org/3.0 main" | tee /etc/apt/sources.list.d/mongodb-org-3.0.list
#
#RUN apt-get update
#RUN apt-get install mongodb-org-tools

# nodejs packages
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm install --only=production

# copy app
COPY  src/ ./

# add logs folder
RUN mkdir -p /logs/

# wait for mongoDB launch
ADD wait /wait
RUN chmod +x /wait

EXPOSE 3000

STOPSIGNAL SIGTERM

#temporaray fix with sleep
CMD wait && npm run start
