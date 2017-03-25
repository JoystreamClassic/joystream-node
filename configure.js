var spawn = require('child_process').spawn

var args = ['install', '.', '--build=missing']

var runtime, runtime_version

if(process.versions.electron) {
    args.push("-oruntime=electron")
    args.push("-oruntime_version=" + process.versions.electron)
} else {
    args.push("-oruntime=node")
    args.push("-oruntime_version=" + process.versions.node)
}

var child = spawn('conan', args, {stdio: 'inherit', detache:false})

child.on('close', process.exit)
