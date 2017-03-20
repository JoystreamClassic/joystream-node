#include "buffers.hpp"
#include "PubKeyHash.hpp"

namespace joystream {
namespace node {
namespace pubkey_hash {

v8::Local<v8::Object> encode(const Coin::PubKeyHash &hash) {
    auto raw = hash.getRawVector();
    auto buffer = UCharVectorToNodeBuffer(raw);
    return buffer;
}

Coin::PubKeyHash decode(const v8::Local<v8::Value>& value) {
    return Coin::PubKeyHash(NodeBufferToUCharVector(value));
}

}
}
}
