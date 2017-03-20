/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, January 24 2017
 */

#include "PluginAlertEncoder.hpp"
#include "libtorrent-node/alert.hpp"
#include "libtorrent-node/endpoint.hpp"
#include "libtorrent-node/utils.hpp"
#include "RequestResult.hpp"
#include "TorrentPluginStatus.hpp"
#include "PeerPluginStatus.hpp"
#include "Connection.hpp"
#include "BuyerTerms.hpp"
#include "SellerTerms.hpp"
#include "Transaction.hpp"
#include "PubKeyHash.hpp"
#include "PrivateKey.hpp"
#include "OutPoint.hpp"
#include "PublicKey.hpp"

#include <extension/extension.hpp>

#define SET_JOYSTREAM_PLUGIN_ALERT_TYPE(o, name) SET_VAL(o, #name, Nan::New<v8::Number>(joystream::extension::alert::name::alert_type));

namespace joystream {
namespace node {
namespace PluginAlertEncoder {

  boost::optional<v8::Local<v8::Object>> alertEncoder(const libtorrent::alert *a) {

    #define ENCODE_PLUGIN_ALERT(name) if(joystream::extension::alert::name const * p = libtorrent::alert_cast<joystream::extension::alert::name>(a)) v = encode(p);
    
    boost::optional<v8::Local<v8::Object>> v;

    ENCODE_PLUGIN_ALERT(RequestResult)
    else ENCODE_PLUGIN_ALERT(TorrentPluginStatusUpdateAlert)
    else ENCODE_PLUGIN_ALERT(PeerPluginStatusUpdateAlert)
    else ENCODE_PLUGIN_ALERT(TorrentPluginAdded)
    else ENCODE_PLUGIN_ALERT(TorrentPluginRemoved)
    else ENCODE_PLUGIN_ALERT(PeerPluginAdded)
    else ENCODE_PLUGIN_ALERT(PeerPluginRemoved)
    else ENCODE_PLUGIN_ALERT(ConnectionAddedToSession)
    else ENCODE_PLUGIN_ALERT(SessionStarted)
    else ENCODE_PLUGIN_ALERT(SessionPaused)
    else ENCODE_PLUGIN_ALERT(SessionStopped)
    else ENCODE_PLUGIN_ALERT(SessionToObserveMode)
    else ENCODE_PLUGIN_ALERT(SessionToSellMode)
    else ENCODE_PLUGIN_ALERT(SessionToBuyMode)
    else ENCODE_PLUGIN_ALERT(ValidPaymentReceived)
    else ENCODE_PLUGIN_ALERT(InvalidPaymentReceived)
    else ENCODE_PLUGIN_ALERT(BuyerTermsUpdated)
    else ENCODE_PLUGIN_ALERT(SellerTermsUpdated)
    else ENCODE_PLUGIN_ALERT(ContractConstructed)
    else ENCODE_PLUGIN_ALERT(SentPayment)
    else ENCODE_PLUGIN_ALERT(LastPaymentReceived)
    else ENCODE_PLUGIN_ALERT(InvalidPieceArrived)
    else ENCODE_PLUGIN_ALERT(ValidPieceArrived)
    else ENCODE_PLUGIN_ALERT(DownloadStarted)
    else ENCODE_PLUGIN_ALERT(UploadStarted)
    else ENCODE_PLUGIN_ALERT(SendingPieceToBuyer)
    else ENCODE_PLUGIN_ALERT(PieceRequestedByBuyer)
    else ENCODE_PLUGIN_ALERT(AnchorAnnounced)

    return v;
  }

  NAN_MODULE_INIT(InitAlertTypes) {

    // Export extended alert types
    v8::Local<v8::Object> object = Nan::New<v8::Object>();

    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, RequestResult)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, TorrentPluginStatusUpdateAlert)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, PeerPluginStatusUpdateAlert)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, TorrentPluginAdded)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, TorrentPluginRemoved)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, PeerPluginAdded)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, PeerPluginRemoved)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, ConnectionAddedToSession)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, ConnectionRemovedFromSession)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, SessionStarted)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, SessionPaused)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, SessionStopped)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, SessionToObserveMode)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, SessionToSellMode)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, SessionToBuyMode)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, ValidPaymentReceived)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, InvalidPaymentReceived)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, BuyerTermsUpdated)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, SellerTermsUpdated)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, ContractConstructed)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, SentPayment)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, LastPaymentReceived)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, InvalidPieceArrived)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, ValidPieceArrived)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, DownloadStarted)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, UploadStarted)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, SendingPieceToBuyer)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, PieceRequestedByBuyer)
    SET_JOYSTREAM_PLUGIN_ALERT_TYPE(object, AnchorAnnounced)

    SET_VAL(target, "AlertType", object);

  }

    v8::Local<v8::Object> encode(joystream::extension::alert::RequestResult const * p) {
        return joystream::node::RequestResult::NewInstance(p);
    }


  v8::Local<v8::Object> encode(joystream::extension::alert::TorrentPluginStatusUpdateAlert const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::alert const *>(p));

    auto statuses = Nan::New<v8::Array>();

    for(auto m: p->statuses) {
      statuses->Set(statuses->Length(), torrent_plugin_status::encode(m.second));
    }

    SET_VAL(v, "statuses", statuses);

    return v;
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::PeerPluginStatusUpdateAlert const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::torrent_alert const *>(p));

    auto statuses = Nan::New<v8::Array>();

    for(auto m: p->statuses) {
      statuses->Set(statuses->Length(), peer_plugin_status::encode(m.second));
    }

    SET_VAL(v, "statuses", statuses);

    return v;
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::TorrentPluginAdded const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::torrent_alert const *>(p));

    SET_VAL(v, "status", torrent_plugin_status::encode(p->status));

    return v;
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::TorrentPluginRemoved const * p) {
    return libtorrent::node::alert_types::encode(static_cast<libtorrent::torrent_alert const *>(p));
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::PeerPluginAdded const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::peer_alert const *>(p));

    SET_VAL(v, "status", peer_plugin_status::encode(p->status));

    return v;
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::PeerPluginRemoved const * p) {
    return libtorrent::node::alert_types::encode(static_cast<libtorrent::peer_alert const *>(p));
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::ConnectionAddedToSession const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::peer_alert const *>(p));

    SET_VAL(v, "status", connection::encode(p->status));

    return v;
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::ConnectionRemovedFromSession const * p) {
    return libtorrent::node::alert_types::encode(static_cast<libtorrent::peer_alert const *>(p));
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::SessionStarted const * p) {
    return libtorrent::node::alert_types::encode(static_cast<libtorrent::torrent_alert const *>(p));
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::SessionPaused const * p) {
    return libtorrent::node::alert_types::encode(static_cast<libtorrent::torrent_alert const *>(p));
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::SessionStopped const * p) {
    return libtorrent::node::alert_types::encode(static_cast<libtorrent::torrent_alert const *>(p));
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::SessionToObserveMode const * p) {
    return libtorrent::node::alert_types::encode(static_cast<libtorrent::torrent_alert const *>(p));
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::SessionToSellMode const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::torrent_alert const *>(p));

    SET_VAL(v, "terms", seller_terms::encode(p->terms));

    return v;
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::SessionToBuyMode const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::torrent_alert const *>(p));

    SET_VAL(v, "terms", buyer_terms::encode(p->terms));

    return v;
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::ValidPaymentReceived const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::peer_alert const *>(p));

    SET_NUMBER(v, "paymentIncrement", p->paymentIncrement);
    SET_NUMBER(v, "totalNumberOfPayments", p->totalNumberOfPayments);
    SET_NUMBER(v, "totalAmountPaid", p->totalAmountPaid);

    return v;
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::InvalidPaymentReceived const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::peer_alert const *>(p));

    SET_NUMBER(v, "totalNumberOfPayments", p->totalNumberOfPayments);
    SET_NUMBER(v, "totalAmountPaid", p->totalAmountPaid);
    SET_NUMBER(v, "pieceIndex", p->pieceIndex);

    return v;
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::BuyerTermsUpdated const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::torrent_alert const *>(p));

    SET_VAL(v, "terms", buyer_terms::encode(p->terms));

    return v;
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::SellerTermsUpdated const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::torrent_alert const *>(p));

    SET_VAL(v, "terms", seller_terms::encode(p->terms));

    return v;
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::ContractConstructed const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::torrent_alert const *>(p));

    SET_VAL(v, "tx", transaction::encode(p->tx));

    return v;
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::SentPayment const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::peer_alert const *>(p));

    SET_NUMBER(v, "paymentIncrement", p->paymentIncrement);
    SET_NUMBER(v, "totalNumberOfPayments", p->totalNumberOfPayments);
    SET_NUMBER(v, "totalAmountPaid", p->totalAmountPaid);
    SET_NUMBER(v, "pieceIndex", p->pieceIndex);

    return v;
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::LastPaymentReceived const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::peer_alert const *>(p));

    // do we need to encode the paymentchannel::Payee ?  p->payee

    return v;
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::InvalidPieceArrived const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::peer_alert const *>(p));

    SET_NUMBER(v, "pieceIndex", p->pieceIndex);

    return v;
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::ValidPieceArrived const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::peer_alert const *>(p));

    SET_NUMBER(v, "pieceIndex", p->pieceIndex);

    return v;
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::DownloadStarted const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::torrent_alert const *>(p));

    SET_VAL(v, "contractTx", transaction::encode(p->contractTx));
    //SET_VAL(v, "peerToStartDownloadInformationMap", encode(p->peerToStartDownloadInformationMap));

    return v;
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::UploadStarted const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::torrent_alert const *>(p));

    SET_VAL(v, "endPoint", libtorrent::node::endpoint::encode(p->endPoint));
    SET_VAL(v, "terms", buyer_terms::encode(p->terms));
    SET_VAL(v, "contractPrivateKey", private_key::encode(p->contractKeyPair.sk()));
    SET_VAL(v, "finalPkHash", pubkey_hash::encode(p->finalPkHash));

    return v;
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::SendingPieceToBuyer const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::peer_alert const *>(p));

    SET_NUMBER(v, "totalNumberOfPiecesSent", p->totalNumberOfPiecesSent);
    SET_NUMBER(v, "pieceIndex", p->pieceIndex);

    return v;
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::PieceRequestedByBuyer const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::peer_alert const *>(p));

    SET_NUMBER(v, "pieceIndex", p->pieceIndex);

    return v;
  }

  v8::Local<v8::Object> encode(joystream::extension::alert::AnchorAnnounced const * p) {
    auto v = libtorrent::node::alert_types::encode(static_cast<libtorrent::torrent_alert const *>(p));

    SET_VAL(v, "endPoint", libtorrent::node::endpoint::encode(p->_endPoint));
    SET_NUMBER(v, "value", p->_value);
    SET_VAL(v, "outpoint", outpoint::encode(p->_anchor));
    SET_VAL(v, "contractPk", public_key::encode(p->_contractPk));
    SET_VAL(v, "finalPkHash", pubkey_hash::encode(p->_finalPkHash));

    return v;
  }

}
}
}
