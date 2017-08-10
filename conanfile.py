from conans import ConanFile

class JoyStreamNodeNPMConan(ConanFile):
    settings = "os", "compiler", "build_type", "arch"
    requires = "LibtorrentNode/1.1.1@joystream/stable", "Extension/0.1@joystream/stable"
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

        # Disable building following boost libraries
        self.options["Boost"].without_graph=True
        self.options["Boost"].without_graph_parallel=True
        self.options["Boost"].without_signals=True
        self.options["Boost"].without_type_erasure=True
        self.options["Boost"].without_wave=True
        self.options["Boost"].without_coroutine=True
        self.options["Boost"].without_coroutine2=True
        self.options["Boost"].without_exception=True
        self.options["Boost"].without_locale=True
        # self.options["Boost"].without_atomic=True
        # self.options["Boost"].without_container=True
        # self.options["Boost"].without_mpi=True
        # self.options["Boost"].without_program_options=True
        # self.options["Boost"].without_random=True
        # self.options["Boost"].without_system=True
        # self.options["Boost"].without_regex=True
        # self.options["Boost"].without_chrono=True
        # self.options["Boost"].without_serialization=True
        # self.options["Boost"].without_test=True
        # self.options["Boost"].without_log=True
        # self.options["Boost"].without_math=True
        # self.options["Boost"].without_thread=True
        # self.options["Boost"].without_context=True # setting has no effect (problem in Boost conan recipie?)
        # self.options["Boost"].without_date_time=True
        # self.options["Boost"].without_timer=True
        # self.options["Boost"].without_filesystem=True
        # self.options["Boost"].without_iostreams=True
