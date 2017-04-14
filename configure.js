var spawn = require('child_process').spawn
var exec = require('child_process').exec


var args = ['install', '.', '--build=missing']

var runtime, runtime_version

if(process.versions.electron) {
    args.push("-oruntime=electron")
    args.push("-oruntime_version=" + process.versions.electron)
} else {
    args.push("-oruntime=node")
    args.push("-oruntime_version=" + process.versions.node)
}

if(process.platform == 'win32' && process.versions.electron) {
	var params = args.join(' ')
	console.log('Run the following command to configure build for electron:')
	console.log('conan ' + params)
	process.exit()

	// this works but a problem when conan or git prompt for a password!
	// exec('conan ' + params, function(error, stdout, stderr){
	// 	console.log(stdout)

	// 	if(error) {
	// 		console.log(error)
	// 		return process.exit(error.signal)
	// 	}

	// 	process.exit()
	// })
} else {

	var child = spawn('conan', args, {stdio: 'inherit', detached:false})

	child.on('close', process.exit)
}