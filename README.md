# JoyStream Node

[![npm package](https://nodei.co/npm/joystream-node.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/joystream-node/)

`joystream-node` is the core javascript library for the JoyStreamClassic payment protocol over BitTorrent.

```
conan remote add joystreamclassic https://api.bintray.com/conan/joystreamclassic/main True

npm install joystream-node
```

## Dependencies
The module is a nodejs native c++ addon and needs to be compiled from source. The build tools required are:

- [git](https://git-scm.com/)
- [node-js](https://nodejs.org)
- [node-gyp](https://github.com/nodejs/node-gyp)
- CMake (minimum version 3.1 for support of CMAKE_CXX_STANDARD variable)
- python2 + pip
- [Conan](https://www.conan.io/downloads) C/C++ package manager

Follow [instruction in node-gyp readme](https://github.com/nodejs/node-gyp) for setting up a compiler toolchain for your platform.

The module depends on multiple c++ packages which will be fetched and built using conan.

After installing conan add the JoyStreamClassic conan repository:
```
conan remote add joystreamclassic https://api.bintray.com/conan/joystreamclassic/main True
```

If building on windows install npm v4.6.1 (build fails with newer versions of npm)
```
npm install -g npm@4.6.1
```


Installing joystream-node:
```
npm install joystream-node
```

## License

JoyStream node library is released under the terms of the MIT license.
See [LICENSE](LICENCE) for more information.
