#ifndef JOYSTREAM_NODE_PRIVATEKEY_HPP
#define JOYSTREAM_NODE_PRIVATEKEY_HPP

#include <nan.h>

namespace Coin {
    class PrivateKey;
}

namespace joystream {
namespace node {
namespace private_key {

     /* @brief Creates node Buffer representing a raw Coin::PrivateKey
      * @param {const Coin::PrivateKey&}
      * @return {v8::Local<v8::Object>} node Buffer
      * @throws
      */
     v8::Local<v8::Object> encode(const Coin::PrivateKey &);

      /* @brief Converts a raw pivate key from a node buffer to Coin::PrivateKey
       * @param {v8::Local<v8::Value>} node Buffer
       * @return {Coin::PrivateKey}
       * @throws std::runtime_error if conversion fails
       */
      Coin::PrivateKey decode(const v8::Local<v8::Value>&);

}
}
}

#endif
