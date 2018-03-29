/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, January 25 2017
 */

#include <libtorrent-node/init.hpp>
#include "Init.hpp"

#include <iostream>
#include <fstream>

void redirectStdCLog();

NAN_MODULE_INIT(InitJoyStreamAddon) {
    redirectStdCLog();

    v8::Local<v8::Object> libtorrent = Nan::New<v8::Object>();
    libtorrent::node::Init(libtorrent);
    target->Set(Nan::New("libtorrent").ToLocalChecked(), libtorrent);

    v8::Local<v8::Object> joystream = Nan::New<v8::Object>();
    joystream::node::Init(joystream);
    target->Set(Nan::New("joystream").ToLocalChecked(), joystream);
}

NODE_MODULE(JoyStreamAddon, InitJoyStreamAddon)

void redirectStdCLog () {
  char* redirectToFile = NULL;

  // get env variable
  char* joystreamLog = getenv("JOYSTREAM_NODE_LOGS");

  if (joystreamLog) {
    redirectToFile = "joystream.log";
  }

  if (redirectToFile) {

    // redirects std::clog to file in local working directory
    auto logfile = new std::ofstream(redirectToFile);
    std::clog.rdbuf(logfile->rdbuf());

  } else {
    // putting the stream in fail state will make it silently discard any output
    std::clog.setstate(std::ios_base::failbit);
  }
}
