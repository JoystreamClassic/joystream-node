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

NAN_MODULE_INIT(InitJoyStreamAddon) {
    // redirect std::clog output to logfile
    auto logfile = new std::ofstream("joystream.log");
    std::clog.rdbuf(logfile->rdbuf());

    std::clog << "Loading JoyStream Addon" << std::endl;

    v8::Local<v8::Object> libtorrent = Nan::New<v8::Object>();
    libtorrent::node::Init(libtorrent);
    target->Set(Nan::New("libtorrent").ToLocalChecked(), libtorrent);

    v8::Local<v8::Object> joystream = Nan::New<v8::Object>();
    joystream::node::Init(joystream);
    target->Set(Nan::New("joystream").ToLocalChecked(), joystream);
}

NODE_MODULE(JoyStreamAddon, InitJoyStreamAddon)
