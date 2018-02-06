#ifndef JOYSTREAM_NODE_PAYMENT_CHANNEL_HPP
#define JOYSTREAM_NODE_PAYMENT_CHANNEL_HPP

#include <nan.h>

namespace joystream {
namespace paymentchannel {
  class Commitment;
}

namespace node {
namespace payment_channel {

    NAN_MODULE_INIT(Init);

namespace commitment {
    /* @brief Converts a commitment to a raw paymentchannel
     * contract transaction output.
     * @return node Buffer
     * @thows TypeError if conversion fails
     */
    NAN_METHOD(CommitmentToOutput);

    /* @brief Converts a JavaScript Object
     * to a native paymentchannel::Commitment
     * @param {v8::Local<v8::Value>}
     * @return {paymentchannel::Commitment}
     * @throws std::runtime_error if conversion fails
     */
    paymentchannel::Commitment decode(const v8::Local<v8::Value>&);
}

}}}
#endif
