#ifndef JOYSTREAM_NODE_PUBKEYHASH_HPP
#define JOYSTREAM_NODE_PUBKEYHASH_HPP

#include <nan.h>
#include <common/PubKeyHash.hpp>

namespace joystream {
namespace node {
namespace pubkey_hash {

    /* @brief Creates node Buffer representing a raw Coin::PubKeyHash
     * @param {const Coin::PubKeyHash&}
     * @return {v8::Local<v8::Object>} node Buffer
     * @throws
     */
    v8::Local<v8::Object> encode(const Coin::PubKeyHash &);

     /* @brief Converts a raw pubkeyhash from a node buffer to Coin::PubKeyHash
      * @param {v8::Local<v8::Value>} node Buffer
      * @return {Coin::PubKeyHash}
      * @throws std::runtime_error if conversion fails
      */
     Coin::PubKeyHash decode(const v8::Local<v8::Value>&);

}
}
}

#endif
