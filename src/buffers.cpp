#include "buffers.hpp"
#include "libtorrent-node/utils.hpp"
#include <common/Utilities.hpp>

namespace joystream {
namespace node {

std::vector<unsigned char> NodeBufferToUCharVector(v8::Local<v8::Value> buffer) {
    if(!buffer->IsUint8Array()){
        throw std::runtime_error("argument is not a node buffer");
    }

    auto length = ::node::Buffer::Length(buffer);

    std::vector<unsigned char> vector(length);

    auto begin = ::node::Buffer::Data(buffer);

    std::copy(begin, begin + length, vector.data());

    return vector;
}

std::vector<unsigned char> StringToUCharVector(v8::Local<v8::Value> value) {
    std::string hex = ToNative<std::string>(value);
    return Coin::fromHex(hex);
}

v8::Local<v8::Object> UCharVectorToNodeBuffer(std::vector<unsigned char> &data) {
    auto buffer = Nan::NewBuffer(data.size()).ToLocalChecked();
    auto pbuf = ::node::Buffer::Data(buffer);
    std::copy(data.begin(), data.end(), pbuf);
    return buffer;
}

}}
