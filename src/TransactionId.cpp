#include <common/TransactionId.hpp>
#include "buffers.hpp"
#include "TransactionId.hpp"

namespace joystream {
namespace node {
namespace transaction_id {


v8::Local<v8::Object> encode(const Coin::TransactionId &id) {
    auto raw = id.toRPCByteOrderVector();
    auto buffer = UCharVectorToNodeBuffer(raw);
    return buffer;
}

Coin::TransactionId decode(const v8::Local<v8::Value>& value) {
    auto data = NodeBufferToUCharVector(value);
    return Coin::TransactionId::fromRPCByteOrder(data);
}

}
}
}

