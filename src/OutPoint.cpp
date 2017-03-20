#include <common/typesafeOutPoint.hpp>
#include "OutPoint.hpp"
#include "TransactionId.hpp"
#include "libtorrent-node/utils.hpp"

namespace joystream {
namespace node {
namespace outpoint {

#define TXID_KEY "txid"
#define INDEX_KEY "index"


v8::Local<v8::Object> encode(const Coin::typesafeOutPoint &op) {
    auto txid = transaction_id::encode(op.transactionId());
    auto index = op.index();
    auto obj = Nan::New<v8::Object>();
    SET_VAL(obj, TXID_KEY, txid);
    SET_INT32(obj, INDEX_KEY, index);
    return obj;
}

Coin::typesafeOutPoint decode(const v8::Local<v8::Value>& value) {
    if(!value->IsObject()){
        throw std::runtime_error("argument not an Object");
    }
    auto obj = Nan::To<v8::Object>(value).ToLocalChecked();
    auto txidObj = GET_VAL(obj, TXID_KEY);
    auto index = GET_INT32(obj, INDEX_KEY);
    auto txid = transaction_id::decode(txidObj);
    return Coin::typesafeOutPoint(txid, index);
}

}
}
}
