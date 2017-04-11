# Joystream Node

Repository containing the joystream bindings and the javascript wrapper library

## Getting Started:

Clone repo :
```
$ git clone https://github.com/JoyStream/joystream-node
```

Install dependencies and build node module:
```
npm install
```

## To build module for a different target:
```
$ npm run build -- --runtime=node --runtime_version=6.3.1 --arch=ia32 --debug
```

## Build for electron

To use the package in electron, rebuild with electron options:

```
$ npm run build -- --runtime=electron --runtime_version=1.6.2
```
