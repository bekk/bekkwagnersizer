
for (let i = 1; i <= 6; i++) {
  const imageForm = document.getElementById('imageForm'+i);

  imageForm.onsubmit = (e) => {
    e.preventDefault();
    const file = e.target.file.files[0];
    const formData = new FormData();
    formData.append('image', file);

    fetch('/image', {
      method: 'POST',
      body: formData
    }).then(
      response => response
    ).then(
      success => console.log(success)
    ).catch(
      error => console.log(error)
    );
  }
}