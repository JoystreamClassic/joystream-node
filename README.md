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

To use the package in electron, first configure for electron:

```
$ conan install --build=missing -o runtime=electron -o runtime_version=1.4.11
```

or if you have electron installed globally and want to build for that version:

```
$ electron -v
v1.6.2
```

```
$ electron configure
```

then run the rebuild script:

```
$ npm run rebuild
```

## Rebuild

When you want to build for a new runtime or runtime version you always need to reconfigure. For example to build for node after having build for electron:
```
$ conan install --build=missing -o runtime=node -o runtime_version=6.3.1
```

or

```
$ node configure
```

then rebuild:

```
$ npm run rebuild
```
