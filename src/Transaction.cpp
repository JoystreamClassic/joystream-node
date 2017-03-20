#include <CoinCore/CoinNodeData.h>
#include "buffers.hpp"
#include "Transaction.hpp"

namespace joystream {
namespace node {
namespace transaction {

v8::Local<v8::Object> encode(const Coin::Transaction &tx) {
    auto data = tx.getSerialized();
    return UCharVectorToNodeBuffer(data);
}

Coin::Transaction decode(const v8::Local<v8::Value>& value) {
    return Coin::Transaction(NodeBufferToUCharVector(value));
}

}
}
}

