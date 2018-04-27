if (typeof window !== "undefined") throw new Error("Must be run on node");

const sharp = require('sharp');

const width = 2000;
const height = 880;
const filename = "img/birb2.png";

function crop(from, to, outFile) {
  sharp(filename)
    .resize(to, height)
    .crop(sharp.gravity.northwest)
    .toBuffer(function(err, data, info) {
      sharp(data).resize(to - from, height)
      .crop(sharp.gravity.northeast)
      .toFile(outFile, (err, info) => {
        if (err) throw err;
        console.log("Success: ", info);
      });
    })
}

function split(filename, at, outFile1, outFile2) {
  const width = 150;
  
  console.log("filename", filename)

  sharp(filename)
    .resize(width, at)
    .crop(sharp.gravity.northwest)
    .toFile(outFile1, (err, info) => {
      if (err) throw err;
      console.log("Success: ", info);
    });

  sharp(filename)
    .resize(width, height-at)
    .crop(sharp.gravity.southwest)
    .toFile(outFile2, (err, info) => {
      if (err) throw err;
      console.log("Success: ", info);
    });
}


crop(0, 700, 'img/birb2-right-outer-wing.png');
crop(700, 850, 'img/birb2-right-inner.png');
crop(850, 1000, 'img/birb2-right-body.png');
crop(1000, 1150, 'img/birb2-left-body.png');
crop(1150, 1300, 'img/birb2-left-inner.png');
crop(1300, 2000, 'img/birb2-left-outer-wing.png');

split('img/birb2-right-inner.png', 550, 'img/birb2-right-inner-wing.png', 'img/birb2-right-tail.png');
split('img/birb2-left-inner.png', 550, 'img/birb2-left-inner-wing.png', 'img/birb2-left-tail.png');