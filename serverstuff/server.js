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
  res.sendStatus(200);
})

app.get('/images', (req, res) => {
  const images = fs.readdirSync('/uploads');
  res.status(200).json({ images });
})

io.on('connection', socket => {
  console.log('a user connected');
});

http.listen(port = 3000, function(){
  console.log(`Listening on port ${port}`);
});
