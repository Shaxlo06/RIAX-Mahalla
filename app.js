const menuButton = document.querySelector('.mobile-menu');
const sidebar = document.querySelector('.sidebar');
const links = document.querySelectorAll('.nav-link');

menuButton.addEventListener('click', () => {
  const open = sidebar.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

links.forEach((link) => link.addEventListener('click', () => {
  links.forEach((item) => item.classList.remove('active'));
  link.classList.add('active');
  sidebar.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

document.addEventListener('click', (event) => {
  if (window.innerWidth <= 820 && sidebar.classList.contains('open') && !sidebar.contains(event.target) && !menuButton.contains(event.target)) {
    sidebar.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }
});

document.querySelector('.notification').addEventListener('click', () => {
  const dot = document.querySelector('.notification i');
  dot.hidden = !dot.hidden;
});
