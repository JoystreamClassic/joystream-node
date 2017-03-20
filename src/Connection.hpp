/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, February 2 2017
 */

#ifndef JOYSTREAM_NODE_CONNECTION_HPP
#define JOYSTREAM_NODE_CONNECTION_HPP

#include <nan.h>
#include <protocol_session/Status.hpp>
#include <libtorrent/socket_io.hpp>

namespace joystream {
namespace node {
namespace connection {

  /*
   * Many types badly need to be improved with a type safe representation
   * in the future, but statechart seems to lack this.
   */

  // Exports
  // - "InnerStateType" which maps names names of states in protocol_statemachine,
  // to ::encode of type corresponding to the state
  NAN_MODULE_INIT(Init);

 /* @brief Creates javascript representation of inner (i.e. simple)
  * states in protocol_statemachine::CBStateMachine.

  * @param i type_index object for state class
  * @return v8::Local<v8::Uint32> where value the value for state protoco_statemachine::X is the same
  * as what is found by inspecting InnerStateType.X.
  */
  v8::Local<v8::Uint32> encode(const std::type_index & i);

  /* @brief Creates javascript representation of protocol_statemachine::AnnouncedModeAndTerms.
   *
   * @param a to be encoded
   * @return v8::Local<v8::Object> encoded as

    { none : true }
    when mode has not been announced in `a`.

    { observe : true }
    when observe mode has been announced in `a`.

    {
      seller : {
        terms : {see @seller_terms::encode}
        index : @Number
      }
    }
    when sell mode has been announced in `a`.
   */
  v8::Local<v8::Object> encode(const protocol_statemachine::AnnouncedModeAndTerms & a);

  /* @brief Creates javascript representation of paymentchannel::Payor.
   *
   * @param a to be encoded
   * @return v8::Local<v8::Object> encoded as o where
   *
   * {Number} o.price - unit price in sats.
   * {Number} o.numberOfPaymentsMade - number of payment
   * {Number} o.funds - amount of funds locked up in stats.
   * {Number} o.settlementFee - tx fee in stats pr. Kb .
   * {Number} o.refundLockTime - relative lock time in seconds
   * {see outpoint::encode} o.anchor - channel anchor
   */
  v8::Local<v8::Object> encode(const paymentchannel::Payor & payor);

  /* @brief Creates javascript representation of paymentchannel::Payor.
   *
   * @param a to be encoded
   * @return v8::Local<v8::Object> encoded as o where
   *
   * -- same as encode(const paymentchannel::Payor &) above ---
   * {see signature::encode} o.lastValidPayorPaymentSignature - last valid signature
   */
  v8::Local<v8::Object> encode(const paymentchannel::Payee & payee);

  /* @brief Creates javascript representation of joystream::protocol_session::status::Connection.
   *
   * @param a to be encoded
   * @return v8::Local<v8::Object> encoded as o where
   * { see endpoint::encode } o.endpoint -
   * { see above } o.innerState - inner state of state machine on connection
   * { see above } o.payor - payor side of payment channel (only valid on buyer side)
   * { see above } o.payee - payee side of payment channel (only valid on seller side)
   */
  v8::Local<v8::Object> encode(const joystream::protocol_session::status::Connection<libtorrent::tcp::endpoint>& c);

}
}
}

#endif // JOYSTREAM_NODE_CONNECTION_HPP
