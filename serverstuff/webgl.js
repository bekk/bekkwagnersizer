const socket = io();

socket.on('new image', (fileName)  => {
  loadImage(fileName)
})

const loadImage = (fileName) => {
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const width = image.width / 5;
    const height = image.height / 5;
    canvas.width  = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    context.drawImage(image, 0, 0, width, height);
  }

  image.src = `/${fileName}`;
}
