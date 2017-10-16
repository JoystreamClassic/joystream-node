# Joystream Node

Repository containing the joystream bindings and the javascript wrapper library

## Getting Started:

Clone repo :
```
$ git clone https://github.com/JoyStream/joystream-node
```

Install dependencies and build node module:
```
$ npm install
```

## To build module for a specific runtime use node-gyp

building for electron for example:

```
$ node-gyp rebuild --target=1.6.2 --arch=x64 --dist-url=https://atom.io/download/electron
```

## Docker

You will need to generate a ssh key and to add it to your github in order to be able to pull the dependencies libraries with conan.
Docker will look for a `id_rsa` file to copy in the container.

Build :
```
docker build -t joystream-node .
```

Run container :
```
docker run -d --name joystream-node joystream-node
```

Notes: You might need a server with 4GB ram so it can build.
