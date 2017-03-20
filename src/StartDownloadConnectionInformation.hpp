/**
* Copyright (C) JoyStream - All Rights Reserved
* Unauthorized copying of this file, via any medium is strictly prohibited
* Proprietary and confidential
* Written by Bedeho Mender <bedeho.mender@gmail.com>, January 19 2017
*/

#ifndef JOYSTREAM_NODE_STARTDOWNLOADINGCONNECTIONINFORMATION_HPP
#define JOYSTREAM_NODE_STARTDOWNLOADINGCONNECTIONINFORMATION_HPP

#include <protocol_session/protocol_session.hpp>
#include <libtorrent/socket.hpp>

#include <nan.h>

namespace joystream {
namespace node {
namespace StartDownloadConnectionInformation {

/**
 * Encoding o
 * {see @SellerTerms} o.sellerTerms - Terms which was the basis for the contract initation, see .
 * {Number}           o.index - Contract output index.
 * {Number}           o.value - Contract output value.
 * {see @PrivateKey}  o.buyerContractSk- Contract output buyer private key,  for encoding.
 * {see @PubKeyHash}  o.buyerFinalPkHash - Payment/Refund buyer output.
 */

v8::Local<v8::Object> encode(const protocol_session::StartDownloadConnectionInformation & information);
protocol_session::StartDownloadConnectionInformation decode(const v8::Local<v8::Value> & v);

}

namespace PeerToStartDownloadInformationMap {

//v8::Local<v8::Object> encode(const protocol_session::PeerToStartDownloadInformationMap<libtorrent::tcp::endpoint> & information);
protocol_session::PeerToStartDownloadInformationMap<libtorrent::tcp::endpoint> decode(const v8::Local<v8::Value> & v);

}

namespace PeerNotReadyToStartDownloadCause {

  /**
  // NAN_MODULE_INIT

  enum class PeerNotReadyToStartDownloadCause {
      connection_gone,
      connection_not_in_preparing_contract_state, // this can be due to peer, or an intervening action from us
      terms_expired
  };
  */
}

namespace PeersNotReadyToStartDownloadingMap {

  /**
  template <class ConnectionIdType>
  using PeersNotReadyToStartDownloadingMap = std::unordered_map<ConnectionIdType, PeerNotReadyToStartDownloadCause>;
  */

}

}
}

#endif // JOYSTREAM_NODE_STARTDOWNLOADINGCONNECTIONINFORMATION_HPP
