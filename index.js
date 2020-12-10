const express = require('express')
const app = express()
var cors = require('cors')
var port = process.env.PORT || 8000
const Multer = require('multer')
const newMerge = require('pdf-merger-js')
const fs = require('fs')
const fsExtra = require('fs-extra')

app.use(cors())

var tempDest = './tmp/'
var outDest = './out/outee.pdf'

const storage = Multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDest);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

var upload = Multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024
    }
})

app.listen(port, () => {
    console.log('App listening to port ' + port)
})

const makeNoBreak = (files) => {
    var extensionAr = []
    for (var i = 0; i < files.length; i++) {
        var extendAr = splitAtLastIndex(files[i].originalname, '.')
        extensionAr.push(extendAr[1])
    }
    return assertAllPDF(extensionAr)
}

const splitAtLastIndex = (string, char) => {
    var returnAr = []
    var i = string.lastIndexOf(char)
    returnAr.push(string.substring(0, i))
    returnAr.push(string.substring(i+1))
    return returnAr
}

const assertAllPDF = (arrayOfExtensions) => {
    var ret = true;
    for (var i = 0; i < arrayOfExtensions.length; i++) {
        if (arrayOfExtensions[i] !== 'pdf') {
            ret = false;
            break;
        }
    }
    return ret;
}

const createArrayOfPaths = (files) => {
    var ret = []
    files.forEach((item) => {
        ret.push(tempDest + item.originalname)
    })
    return ret
}

const mergeWrap = async (ar) => {
    var merger = new newMerge();
    for (let i = 0; i < ar.length; i++) {
        merger.add(ar[i])
    }
    await merger.save(outDest)
}

app.post('/upload', upload.array('files', 20), (req, res) => {
    const files = req.files;
    if (!makeNoBreak(files)) {
        res.send('nerp')
        return
    }
    paths = createArrayOfPaths(files)
    mergeWrap(paths).then(() => {
        fsExtra.emptyDir(tempDest).then(res.send("ok"))
    })
})

app.get('/retrieve', (req, res) => {
    const upload = fs.createReadStream(outDest);
    upload.pipe(res)
})

