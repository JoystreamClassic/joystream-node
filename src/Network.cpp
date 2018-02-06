/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, January 9 2017
 */

#include "Network.hpp"

namespace joystream {
namespace node {
namespace network {

v8::Local<v8::Value> encode(const Coin::Network & network) {

  std::string name(Coin::nameFromNetwork(network));

  v8::Local<v8::String> networkName = Nan::New(name).ToLocalChecked();;

  return networkName;
}

Coin::Network decode(const v8::Local<v8::Value> & v) {

  if(!v->IsString())
    throw std::runtime_error("Argument must be a string.");

  v8::String::Utf8Value name(v->ToString());

  std::string networkName(*name);

  return Coin::networkFromName(networkName.c_str());
}

}
}
}
