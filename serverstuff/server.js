const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
})

const upload = multer({ storage: storage })

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/webgl', (req, res) => {
  res.sendFile(__dirname + '/webgl.html');
})

app.use('/static', express.static(__dirname + '/'))
app.use(express.static(__dirname + '/uploads'))

app.post('/image', upload.single('image'), (req, res) => {
  io.emit('new image', req.file.originalname)
  res.sendStatus(200)
})

io.on('connection', socket => {
  console.log('a user connected');
});

http.listen(port = 3000, function(){
  console.log(`Listening on port ${port}`);
});
