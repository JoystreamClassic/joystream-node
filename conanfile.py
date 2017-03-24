from conans import ConanFile

class JoyStreamNodeNPMConan(ConanFile):
    settings = "os", "compiler", "build_type", "arch"
    requires = "Libtorrent/1.1.1@joystream/stable", "Extension/0.1@joystream/stable"
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
