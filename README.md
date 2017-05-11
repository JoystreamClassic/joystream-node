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
