FROM ubuntu:16.04

MAINTAINER Lola Rigaut-Luczak <rllola80@gmail.com>

WORKDIR /usr/src/app

RUN apt-get update

RUN apt-get -y install g++ cmake git python-pip python-dev curl

RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -

RUN apt-get -y install nodejs build-essential

# Make ssh dir
RUN mkdir /root/.ssh/
# Copy over private key, and set permissions
ADD id_rsa /root/.ssh/id_rsa
# Create known_hosts
RUN touch /root/.ssh/known_hosts
# Add bitbuckets key
RUN ssh-keyscan github.com >> /root/.ssh/known_hosts

RUN pip install --upgrade pip
RUN pip install conan
RUN conan remote add joystream https://conan.joystream.co:9300 True
RUN conan user travis -p trav444 -r=joystream

COPY . .

RUN npm install -g node-gyp

RUN npm install
RUN npm run transpile
RUN node-gyp rebuild

EXPOSE 6881

CMD [ "npm", "run", "purchase" ]
