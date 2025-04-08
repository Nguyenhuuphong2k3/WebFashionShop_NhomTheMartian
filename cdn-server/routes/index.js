var express = require('express');
var router = express.Router();
let multer = require('multer')
let path = require('path')

let avatarDir = path.join(__dirname, '../avatars')
let storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => cb(null,
    (new Date(Date.now())).getTime() + "-" + file.originalname
  ),
})
let upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/image/)) {
      return cb(new Error('loi'));
    }
    //console.log("hehehe");
    cb(null, true);
  }, limits: {
    fileSize: 5 * 1024 * 1024
  }
})
router.post('/upload',upload.single('avatar'), async function (req, res, next) {
  if(!req.file){
    res.status(404).send({
      success:false,
      message:"file khong ton tai"
    })
  }else{
    let url = "http://localhost:4000/avatars/"+req.file.filename;
    res.status(200).send({
      success:true,
      url:url
    })
  }
})
router.get("/avatars/:filename",function(req,res,next){
  let filename = req.params.filename;
  let fileDir = path.join(avatarDir,filename);
  res.sendFile(fileDir);
})

module.exports = router;
