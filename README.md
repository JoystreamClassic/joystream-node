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

## Build for electron

Verify your electron version :
```
$ electron -v
v1.6.2
```

To use the package in electron, run rebuild script with electron runtime otpions:

```
$ conan install --build=missing -o runtime=electron
$ npm run rebuild -- --runtime=electron --runtime-version=<YOUR-ELECTRON-VERSION>
```

For example, current stable electron version `1.6.2`

After that you can just compile:
```
$ npm run compile -- --runtime=electron --runtime-version=<YOUR-ELECTRON-VERSION>
```

## Rebuild

If you built electron module and want to rebuild for node, simply:
```
$ conan install --build=missing -o runtime=node
$ npm run rebuild
```
