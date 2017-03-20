/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, January 24 2017
 */

#ifndef JOYSTREAM_NODE_REQUESTRESULT_HPP
#define JOYSTREAM_NODE_REQUESTRESULT_HPP

#include <nan.h>

#include <extension/extension.hpp> // extension::alert::LoadedCallback

namespace joystream {
namespace node {

class RequestResult : public Nan::ObjectWrap {

public:

  static NAN_MODULE_INIT(Init);

  static v8::Local<v8::Object> NewInstance(const extension::alert::RequestResult * alert);

private:

  // Alert fields
  extension::alert::LoadedCallback _loadedCallback;
  int _type;
  char const * _what;
  std::string _message;
  int _category;

  static Nan::Persistent<v8::Function> constructor;

  // We do not export this constructor
  static NAN_METHOD(New);

  static NAN_METHOD(Run);

  static NAN_GETTER(Type);
  static NAN_GETTER(What);
  static NAN_GETTER(Message);
  static NAN_GETTER(Category);
};

}
}

#endif // JOYSTREAM_NODE_REQUESTRESULT_HPP
