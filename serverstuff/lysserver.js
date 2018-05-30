const pixel = require('node-pixel');
const five = require('johnny-five');
const express = require('express');
const app = express();

const NUMBER_OF_LEDS = 60;
const PORT = 3007;

var board = new five.Board({ repl: false });
var strip = null;

app.get('/spin', function(req, res) {
  let color = [req.query.r, req.query.g, req.query.b];
  let speed = req.query.speed || 20;
  dualSpin(color, speed);
  res.sendStatus(204);
});

app.get('/blink', function(req, res) {
  let color = [req.query.r, req.query.g, req.query.b];
  let duration = req.query.duration || 2000;
  let times = req.query.times || 2;
  blinkTimes(color, [0, 0, 0], duration, times, () =>
    fadeFrom(color, duration)
  );
  res.sendStatus(204);
});

app.get('/off', (req, res) => {
  color([0, 0, 0]);
  strip.show();
  return res.sendStatus(204);
});

app.listen(PORT, () => console.log(`Web API started on port ${PORT}`));

board.on('ready', function() {
  strip = new pixel.Strip({
    board: this,
    controller: 'FIRMATA',
    strips: [{ pin: 6, length: NUMBER_OF_LEDS }],
    gamma: 2.8
  });

  strip.on('ready', function() {
    strip.off();
  });
});

function color([r, g, b]) {
  strip.color(`rgb(${r}, ${g}, ${b})`);
}

function colorPixel(n, [r, g, b]) {
  strip.pixel(n).color(`rgb(${r * 255}, ${g * 255}, ${b * 255})`);
}

function fill(from, to, c, duration) {
  let step = duration / (to - from);
  function inner(i) {
    if (i >= to) {
      return;
    }
    colorPixel(i, c);
    strip.show();

    setTimeout(() => inner(i + 1, c), step);
  }

  inner(from);
}

function dualSpin(c, speed) {
  function inner() {
    strip.shift(1, pixel.FORWARD, true);
    strip.show();
    setTimeout(inner, speed);
  }
  Array(10)
    .fill(1)
    .forEach(function(n, i) {
      colorPixel(i, c);
      colorPixel(Math.floor(NUMBER_OF_LEDS / 2) + i, c);
    });
  strip.show();
  setTimeout(inner, speed);
}

function blinkTimes(c1, c2, duration, n, next) {
  function inner(i) {
    if (i >= n) {
      if (next) next();
      return;
    }

    blinkBetween(c1, c2, duration / n);
    setTimeout(() => inner(i + 1), duration / n);
  }

  inner(0);
}

function blinkBetween(c1, c2, duration, next) {
  color(c1);
  strip.show();
  setTimeout(() => {
    color(c2);
    strip.show();
    setTimeout(() => {
      color(c1);
      strip.show();
    }, duration / 2);
  }, duration / 2);
}

function fadeFrom([r1, g1, b1], duration = 255 * 5) {
  let step = Math.floor(duration / 255);
  function inner(i) {
    if (i >= 255) {
      return;
    }
    color([parseInt(r1, 10) - i, parseInt(g1, 10) - i, parseInt(b1, 10) - i]);
    strip.show();
    setTimeout(() => inner(i + 1), Math.max(5, step));
  }

  inner(0);
}
