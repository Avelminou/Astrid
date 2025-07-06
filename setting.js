
// Fonction pour afficher le tiroir a gauche
const drawer = document.getElementById('drawer');
function openDrawer() {
    drawer.classList.add('open');
    document.getElementById("close").style.display = "block"
}

function closeDrawer() {
    drawer.classList.remove('open');
    document.getElementById("close").style.display = "none"
}

let startY = 0;
let isPulling = false;

document.addEventListener("touchstart", (e) => {
  if (window.scrollY === 0) {
    startY = e.touches[0].clientY;
    isPulling = true;
  }
});

document.addEventListener("touchmove", (e) => {
  if (!isPulling) return;

  const currentY = e.touches[0].clientY;
  if (currentY - startY > 70) { // si on tire vers le bas de 70px
    document.getElementById("refreshMessage").style.display = "block";
    location.reload(); // recharge la page
    isPulling = false;
  }
});

document.addEventListener("touchend", () => {
  isPulling = false;
});
