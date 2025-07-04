
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


