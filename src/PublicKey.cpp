#include <common/PublicKey.hpp>
#include "buffers.hpp"
#include "PublicKey.hpp"

namespace joystream {
namespace node {
namespace public_key {

v8::Local<v8::Object> encode(const Coin::PublicKey &pk) {
    auto raw = pk.toCompressedRawVector();
    auto buffer = UCharVectorToNodeBuffer(raw);
    return buffer;
}

Coin::PublicKey decode(const v8::Local<v8::Value>& value) {
    return Coin::PublicKey::fromCompressedRaw(NodeBufferToUCharVector(value));
}

}
}
}

