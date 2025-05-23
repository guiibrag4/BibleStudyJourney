const menuBtn = document.querySelector('.menu');
const menuLateral = document.getElementById('menuLateral');
const menuOverlay = document.getElementById('menuOverlay');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const teologiaItem = document.querySelector('.item-teologia');
const inicioItem = document.querySelector('.item-inicio');

function abrirMenu() {
  menuLateral.classList.add('aberta');
  menuOverlay.classList.add('ativa');
}

function fecharMenu() {
  menuLateral.classList.remove('aberta');
  menuOverlay.classList.remove('ativa');
}

menuBtn.addEventListener('click', abrirMenu);
closeMenuBtn.addEventListener('click', fecharMenu);
menuOverlay.addEventListener('click', fecharMenu);

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