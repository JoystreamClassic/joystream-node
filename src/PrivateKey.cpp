#include <common/PrivateKey.hpp>
#include "buffers.hpp"
#include "PrivateKey.hpp"

namespace joystream {
namespace node {
namespace private_key {

v8::Local<v8::Object> encode(const Coin::PrivateKey &sk) {
    auto raw = sk.toRawVector();
    auto buffer = UCharVectorToNodeBuffer(raw);
    return buffer;
}

Coin::PrivateKey decode(const v8::Local<v8::Value>& value) {
    return Coin::PrivateKey::fromRaw(NodeBufferToUCharVector(value));
}

}
}
}
