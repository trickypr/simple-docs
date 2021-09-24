const acc = document.querySelectorAll('.sidebar.button')

for (let i = 0; i < acc.length; i++) {
  acc[i].addEventListener('click', function () {
    /* Toggle between adding and removing the "active" class,
    to highlight the button that controls the panel */
    this.classList.toggle('active')

    /* Toggle between hiding and showing the active panel */
    const panel = this.nextElementSibling

    if (!panel.classList.contains('panel')) return

    if (panel.style.display === 'block') {
      panel.style.display = 'none'
    } else {
      panel.style.display = 'block'
    }
  })
}
