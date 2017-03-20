/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, February 3 2017
 */

 #ifndef JOYSTREAM_NODE_SESSION_HPP
 #define JOYSTREAM_NODE_SESSION_HPP

 #include <nan.h>

 #include <libtorrent/socket_io.hpp>

namespace joystream {
namespace protocol_session {
namespace status {
  struct Selling;
  template <class ConnectionIdType> struct Buying;
  template <class ConnectionIdType> struct Session;
}
  enum class SessionMode;
  enum class SessionState;
  enum class BuyingState;
}
namespace extension {
namespace status {
 class Session;
}
}
namespace node {
namespace session {

  // Exports objects
  // - `SessionMode` object, which maps protocol_session::SessionMode enum values,
  // as strings, to integers corresponding to encode function below.
  //
  // - `SessionState` object, which maps protocol_session::SessionState enum values,
  // as strings, to integers corresponding to encode function below.
  //
  // - `BuyingState` object, which maps protocol_session::BuyingState enum values,
  // as strings, to integers corresponding to encode function below.
  NAN_MODULE_INIT(Init);

  v8::Local<v8::Uint32> encode(const protocol_session::SessionMode mode);

  v8::Local<v8::Uint32> encode(const protocol_session::SessionState state);

  v8::Local<v8::Object> encode(const protocol_session::status::Selling & s);

  v8::Local<v8::Uint32> encode(const protocol_session::BuyingState & state);

  v8::Local<v8::Object> encode(const protocol_session::status::Buying<libtorrent::tcp::endpoint> & b);

  v8::Local<v8::Object> encode(const protocol_session::status::Session<libtorrent::tcp::endpoint> & s);

}
}
}

 #endif // JOYSTREAM_NODE_SESSION_HPP
