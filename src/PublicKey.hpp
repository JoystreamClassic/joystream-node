#ifndef JOYSTREAM_NODE_PUBLICKEY_HPP
#define JOYSTREAM_NODE_PUBLICKEY_HPP

#include <nan.h>

namespace Coin {
    class PublicKey;
}

namespace joystream {
namespace node {
namespace public_key {

    /* @brief Creates node Buffer representing a raw Coin::PublicKey
     * @param {const Coin::PublicKey&}
     * @return {v8::Local<v8::Object>} node Buffer
     * @throws
     */
    v8::Local<v8::Object> encode(const Coin::PublicKey &);

     /* @brief Converts a raw public key from a node buffer to Coin::PublicKey
      * @param {v8::Local<v8::Value>} node Buffer
      * @return {Coin::PublicKey}
      * @throws std::runtime_error if conversion fails
      */
     Coin::PublicKey decode(const v8::Local<v8::Value>&);
}
}
}

#endif
