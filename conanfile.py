from conans import ConanFile

class JoyStreamNodeNPMConan(ConanFile):
    settings = "os", "compiler", "build_type", "arch"
    requires = "LibtorrentNode/1.1.1@joystream/stable", "Extension/0.1@joystream/stable"
    generators = "cmake"
    
    options = {
      "runtime": ["node", "electron"],
    }

    default_options = "runtime=node"

    def configure(self):
      self.options["LibtorrentNode"].runtime = self.options.runtime
