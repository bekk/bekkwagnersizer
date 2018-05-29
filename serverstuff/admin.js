function renderImage(onClick, onClickLabel, location, imgSrc) {
  let container = document.createElement('div');
  container.setAttribute('class', 'gallery-image');
  container.setAttribute('id', `img-${imgSrc.replace('.', '-')}`);

  let image = new Image(200, 200);
  image.src = `${location}/${imgSrc}`;

  let button = document.createElement('button');
  button.textContent = onClickLabel;
  button.addEventListener('click', onClick.bind(null, imgSrc));

  container.appendChild(image);
  container.appendChild(button);
  return container;
}

function deleteImage(imgSrc) {
  fetch(`image/${imgSrc}`, {
    method: 'DELETE'
  }).then(function(res) {
    if (res.ok) {
      document
        .querySelector(`#gallery #img-${imgSrc.replace('.', '-')}`)
        .remove();
    } else {
      console.error('Sletting feilet');
    }
  });
}

function undeleteImage(imgSrc) {
  fetch(`trash/${imgSrc}`, {
    method: 'DELETE'
  }).then(function(res) {
    if (res.ok) {
      document
        .querySelector(`#trash #img-${imgSrc.replace('.', '-')}`)
        .remove();
    } else {
      console.error('Reversering av sletting feilet');
    }
  });
}

function fetchImages(container, renderer, { images }) {
  if (images.length < 1) {
    return;
  }
  let markup = renderer(images.pop());
  document.querySelector(container).appendChild(markup);

  setTimeout(fetchImages.bind(null, container, renderer, { images }), 500);
}

let renderGalleryImage = renderImage.bind(null, deleteImage, 'Slett', '');
let renderTrashImage = renderImage.bind(
  null,
  undeleteImage,
  'Reverser slett',
  'trash'
);

let fetchGallery = fetchImages.bind(null, '#gallery', renderGalleryImage);
let fetchTrash = fetchImages.bind(null, '#trash', renderTrashImage);

fetch('/images')
  .then(res => res.json())
  .then(fetchGallery);

fetch('/trashbin')
  .then(res => res.json())
  .then(fetchTrash);

let socket = io('/');
socket.on('new image', function(data) {
  document.querySelector('#gallery').appendChild(renderGalleryImage(data));
});

socket.on('remove image', function(data) {
  document.querySelector('#trash').appendChild(renderTrashImage(data));
});
