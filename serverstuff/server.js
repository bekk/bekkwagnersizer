const express = require('express');
const path = require('path');
const fsp = require('fs').promises;
const fs = require('fs');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/webgl', (req, res) => {
  res.sendFile(__dirname + '/webgl.html');
});

app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/admin.html');
});

app.get('/top', (req, res) => {
  res.sendFile(__dirname + '/top.html');
});

app.use('/static', express.static(__dirname + '/'));
app.use(express.static(__dirname + '/uploads'));
app.use('/internal', express.static(__dirname + '/internal'));
app.use('/trash', express.static(__dirname + '/trash'));

app.post('/image', upload.single('image'), (req, res) => {
  console.log("file:", req.file);
  io.emit('new image', req.file.originalname);
  res.sendStatus(200);
});

app.delete('/image/:id', function (req, res) {
  let fileName = req.params.id;
  let oldLocation = path.join(__dirname, 'uploads', fileName);
  let newLocation = path.join(__dirname, 'trash', fileName);
  try {
    fs.renameSync(oldLocation, newLocation);
    io.emit('remove image', fileName);
    res.sendStatus(201);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.delete('/trash/:id', function (req, res) {
  let fileName = req.params.id;
  let oldLocation = path.join(__dirname, 'trash', fileName);
  let newLocation = path.join(__dirname, 'uploads', fileName);
  try {
    fs.renameSync(oldLocation, newLocation);
    io.emit('new image', fileName);
    res.sendStatus(201);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.get('/all', (req, res) => {
  fs
    .readdir(path.join(__dirname, 'uploads'), function(err, files) {
      console.log(files)
      res.status(200).json({ files });
    })
})

app.get('/images', (req, res) => {
  fsp
    .readdir(path.join(__dirname, 'uploads'))
    .then(function (images) {
      if (req.query.limit) {
        const stats = images
          .map(image => path.join(__dirname, 'uploads', image))
          .map(fsp.lstat);

        Promise.all(stats)
          .then(function (filestats) {
            const result = filestats
              .map((stat, i) => [images[i], stat])
              .sort(function(a, b) {
                return b[1].birthtimeMs - a[1].birthtimeMs;
              })
              .slice(0, req.query.limit)
              .map(pair => pair[0]);
            res.status(200).json({ images: result });
          })
          .catch(e => console.log(e.message));
      } else {
        res.status(200).json({ images });
      }
    })
    .catch(function (e) {
      res.status(500).json({ message: e.message });
    });
});

app.get('/trashbin', (req, res) => {
  let images = fs
    .readdirSync(__dirname + '/trash')
    .filter(file => file.substring(0, 1) !== '.');
  res.status(200).json({ images });
});

io.on('connection', socket => {
  console.log('a user connected');
});

http.listen((port = 3000), function () {
  console.log(`Listening on port ${port}`);
});
