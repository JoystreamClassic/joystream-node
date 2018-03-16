#ifndef JOYSTREAM_NODE_NETWORK_HPP
#define JOYSTREAM_NODE_NETWORK_HPP

#include <nan.h>
#include <common/Network.hpp>

namespace joystream {
namespace node {
namespace network {

  v8::Local<v8::Value> encode(const Coin::Network & network);
  Coin::Network decode(const v8::Local<v8::Value> & o);

}
}
}

#endif // JOYSTREAM_NODE_BUYER_TERMS_HPP
