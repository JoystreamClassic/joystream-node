/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, March 2 2017
 */

#include "UnhandledCallbackException.hpp"

namespace joystream {
namespace node {
namespace detail {

UnhandledCallbackException::UnhandledCallbackException(const v8::Local<v8::Value> & exception)
    : std::runtime_error("Exception in callback not handled!")
    , exception(exception) {}

}
}
}
