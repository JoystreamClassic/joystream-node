#ifndef JOYSTREAM_NODE_TRANSACTION_HPP
#define JOYSTREAM_NODE_TRANSACTION_HPP

#include <nan.h>

namespace Coin {
    class Transaction;
}

namespace joystream {
namespace node {
namespace transaction {

    /* @brief Creates node Buffer representing a raw Coin::Transaction
     * @param {const Coin::Transaction&}
     * @return {v8::Local<v8::Object>} node Buffer
     * @throws
     */
    v8::Local<v8::Object> encode(const Coin::Transaction &);

     /* @brief Converts a raw transaction from a node buffer to Coin::Transaction
      * @param {v8::Local<v8::Value>} node Buffer
      * @return {Coin::Transaction}
      * @throws std::runtime_error if conversion fails
      */
     Coin::Transaction decode(const v8::Local<v8::Value>&);
}
}
}

#endif
