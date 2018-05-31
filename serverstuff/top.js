const LIMIT = 50;

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

function fetchImages(container, renderer, { images }) {
  if (images.length < 1) {
    return;
  }
  let markup = renderer(images.pop());
  document.querySelector(container).prepend(markup);

  fetchImages(container, renderer, { images });
}

let renderGalleryImage = renderImage.bind(null, deleteImage, 'Slett', '');

let fetchGallery = fetchImages.bind(null, '#gallery', renderGalleryImage);

fetch(`/images?limit=${LIMIT}`)
  .then(res => res.json())
  .then(fetchGallery);

let socket = io('/');
socket.on('new image', function(data) {
  document.querySelector('#gallery').prepend(renderGalleryImage(data));
  if (document.querySelectorAll('#gallery .gallery-image').length > LIMIT) {
    document.querySelector('#gallery').lastChild.remove();
  }
});
