/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, February 3 2017
 */

#ifndef JOYSTREAM_NODE_PEER_PLUGIN_STATUS_HPP
#define JOYSTREAM_NODE_PEER_PLUGIN_STATUS_HPP

#include <nan.h>
#include <extension/Status.hpp>

namespace joystream {
namespace node {
namespace peer_plugin_status {

  NAN_MODULE_INIT(Init);

  /* @brief Creates javascript representation of extension::status::PeerPlugin.
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
  v8::Local<v8::Object> encode(const extension::status::PeerPlugin& a);

}
}
}

#endif // JOYSTREAM_NODE_PEER_PLUGIN_STATUS_HPP
