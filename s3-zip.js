var s3Files = require('s3-files')
var archiver = require('archiver')

var s3Zip = {}
module.exports = s3Zip

s3Zip.archive = function (opts, folder, filesS3, errorCallback) {
  var self = this

  var keyStream = s3Files
    .connect({
      region: opts.region,
      bucket: opts.bucket
    })
    .createKeyStream(folder, filesS3)

  var fileStream = s3Files.createFileStream(keyStream)
  var archive = self.archiveStream(fileStream, filesS3, errorCallback)
  return archive
}

s3Zip.archiveStream = function (stream, filesS3, errorCallback) {
  var archive = archiver('zip')
  archive.on('error', function (err) {
    console.log('archive error', err)
    throw err
  })

  stream
   .on('data', function (file) {
     if (file.path[file.path.length - 1] === '/') {
       console.log('don\'t append to zip', file.path)
       return
     }
     var fname
     const randomNum = Math.random();
     fname = `${randomNum}_${file.path}`

     console.log('append to zip', fname)
     if (file.data.length === 0) {
       archive.append('', { name: fname })
     } else {
       archive.append(file.data, { name: fname })
     }
   })
   .on('end', function () {
     console.log('end -> finalize')
     archive.finalize()
   })
   .on('error', function (err) {
     errorCallback(err.message)
   })

  return archive
}
