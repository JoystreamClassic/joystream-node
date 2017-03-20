/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, January 24 2017
 */

#ifndef JOYSTREAM_NODE_PLUGIN_ALERT_ENCODER_HPP
#define JOYSTREAM_NODE_PLUGIN_ALERT_ENCODER_HPP

#include <nan.h>

#include "libtorrent-node/common.hpp"

namespace joystream {
  struct alert;
namespace extension {
namespace alert {
  struct RequestResult;
  struct TorrentPluginStatusUpdateAlert;
  struct PeerPluginStatusUpdateAlert;
  struct TorrentPluginAdded;
  struct TorrentPluginRemoved;
  struct PeerPluginAdded;
  struct PeerPluginRemoved;
  struct ConnectionAddedToSession;
  struct ConnectionRemovedFromSession;
  struct SessionStarted;
  struct SessionPaused;
  struct SessionStopped;
  struct SessionToObserveMode;
  struct SessionToSellMode;
  struct SessionToBuyMode;
  struct ValidPaymentReceived;
  struct InvalidPaymentReceived;
  struct BuyerTermsUpdated;
  struct SellerTermsUpdated;
  struct ContractConstructed;
  struct SentPayment;
  struct LastPaymentReceived;
  struct InvalidPieceArrived;
  struct ValidPieceArrived;
  struct DownloadStarted;
  struct UploadStarted;
  struct SendingPieceToBuyer;
  struct PieceRequestedByBuyer;
  struct AnchorAnnounced;
}
}
namespace node {
namespace PluginAlertEncoder {

  NAN_MODULE_INIT(InitAlertTypes);

  boost::optional<v8::Local<v8::Object>> alertEncoder(const libtorrent::alert *a);

  v8::Local<v8::Object> encode(extension::alert::RequestResult const * p);
  v8::Local<v8::Object> encode(extension::alert::TorrentPluginStatusUpdateAlert const * p);
  v8::Local<v8::Object> encode(extension::alert::PeerPluginStatusUpdateAlert const * p);
  v8::Local<v8::Object> encode(extension::alert::TorrentPluginAdded const * p);
  v8::Local<v8::Object> encode(extension::alert::TorrentPluginRemoved const * p);
  v8::Local<v8::Object> encode(extension::alert::PeerPluginAdded const * p);
  v8::Local<v8::Object> encode(extension::alert::PeerPluginRemoved const * p);
  v8::Local<v8::Object> encode(extension::alert::ConnectionAddedToSession const * p);
  v8::Local<v8::Object> encode(extension::alert::ConnectionRemovedFromSession const * p);
  v8::Local<v8::Object> encode(extension::alert::SessionStarted const * p);
  v8::Local<v8::Object> encode(extension::alert::SessionPaused const * p);
  v8::Local<v8::Object> encode(extension::alert::SessionStopped const * p);
  v8::Local<v8::Object> encode(extension::alert::SessionToObserveMode const * p);
  v8::Local<v8::Object> encode(extension::alert::SessionToSellMode const * p);
  v8::Local<v8::Object> encode(extension::alert::SessionToBuyMode const * p);
  v8::Local<v8::Object> encode(extension::alert::ValidPaymentReceived const * p);
  v8::Local<v8::Object> encode(extension::alert::InvalidPaymentReceived const * p);
  v8::Local<v8::Object> encode(extension::alert::BuyerTermsUpdated const * p);
  v8::Local<v8::Object> encode(extension::alert::SellerTermsUpdated const * p);
  v8::Local<v8::Object> encode(extension::alert::ContractConstructed const * p);
  v8::Local<v8::Object> encode(extension::alert::SentPayment const * p);
  v8::Local<v8::Object> encode(extension::alert::LastPaymentReceived const * p);
  v8::Local<v8::Object> encode(extension::alert::InvalidPieceArrived const * p);
  v8::Local<v8::Object> encode(extension::alert::ValidPieceArrived const * p);
  v8::Local<v8::Object> encode(extension::alert::DownloadStarted const * p);
  v8::Local<v8::Object> encode(extension::alert::UploadStarted const * p);
  v8::Local<v8::Object> encode(extension::alert::SendingPieceToBuyer const * p);
  v8::Local<v8::Object> encode(extension::alert::PieceRequestedByBuyer const * p);
  v8::Local<v8::Object> encode(extension::alert::AnchorAnnounced const * p);

}
}
}

#endif // JOYSTREAM_NODE_PLUGIN_ALERT_ENCODER_HPP
