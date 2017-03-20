/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, March 2 2017
 */

#ifndef JOYSTREAM_NODE_DETAIL_UNHANDLEDCALLBACKEXCEPTION_HPP
#define JOYSTREAM_NODE_DETAIL_UNHANDLEDCALLBACKEXCEPTION_HPP

#include <nan.h>
#include <stdexcept>

namespace joystream {
namespace node {
namespace detail {

class UnhandledCallbackException : public std::runtime_error {

public:

    UnhandledCallbackException(const v8::Local<v8::Value> & exception);

    v8::Local<v8::Value> exception;
};

}
}
}

#endif // JOYSTREAM_NODE_DETAIL_UNHANDLEDCALLBACKEXCEPTION_HPP
