from conans import ConanFile

class JoyStreamNode(ConanFile):
    settings = "os", "compiler", "build_type", "arch"
    requires = ("Libtorrent/1.1.1@joystream/stable",
                "LibtorrentNode/0.0.8@joystream/stable",
                "CoinCore/0.2.0@joystream/stable",
                "Common/0.2.0@joystream/stable",
                "PaymentChannel/0.2.0@joystream/stable",
                "ProtocolWire/0.1.3@joystream/stable",
                "ProtocolStateMachine/0.3.1@joystream/stable",
                "ProtocolSession/0.3.2@joystream/stable",
                "Extension/0.3.2@joystream/stable",
                "Boost/1.60.0@joystream/stable",
                "OpenSSL/1.0.2j@lasote/stable")

    generators = "cmake"

    options = {
      "runtime": ["node", "electron"],
      "runtime_version": "ANY"
    }

    def configure(self):
      if self.options.runtime_version == "":
        raise ValueError('Invalid runtime_version value')

      self.options["LibtorrentNode"].runtime = self.options.runtime
      self.options["LibtorrentNode"].runtime_version = self.options.runtime_version
