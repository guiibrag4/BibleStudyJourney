const menuBtn = document.querySelector('.menu');
const menuLateral = document.getElementById('menuLateral');
const menuOverlay = document.getElementById('menuOverlay');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const teologiaItem = document.querySelector('.item-teologia');
const inicioItem = document.querySelector('.item-inicio');

//Premium Mode
const premiumItem = document.querySelector('.item-premium');
const themeModal = document.getElementById('theme-modal');
const closeThemeModalBtn = document.getElementById('close-theme-modal');

function abrirMenu() {
  menuLateral.classList.add('aberta');
  menuOverlay.classList.add('ativa');
}

function fecharMenu() {
  menuLateral.classList.remove('aberta');
  menuOverlay.classList.remove('ativa');
}

function abrirModalTema() {
  if (menuLateral.classList.contains('aberta')) {
    fecharMenu();
  }
  setTimeout(() => { // Pequeno delay para uma transição mais suave
    if (themeModal) themeModal.classList.add('open');
    menuOverlay.classList.add('ativa');
  }, 50);
}

function fecharModalTema() {
  if (themeModal) themeModal.classList.remove('open');
  menuOverlay.classList.remove('ativa');
}

menuBtn.addEventListener('click', abrirMenu);
closeMenuBtn.addEventListener('click', fecharMenu);

// O overlay agora fecha qualquer coisa que estiver aberta
menuOverlay.addEventListener('click', () => {
  fecharMenu();
  fecharModalTema();
});

if (teologiaItem) {
  teologiaItem.addEventListener('click', () => {
    window.location.href = 'tl1-teologia.html';
  });
}

if (inicioItem) {
  inicioItem.addEventListener('click', () => {
    window.location.href = 'home.html';
  });
}

// Event listener para o item premium
if (premiumItem) {
  premiumItem.addEventListener('click', abrirModalTema);
}

if (closeThemeModalBtn) {
  closeThemeModalBtn.addEventListener('click', fecharModalTema);
}