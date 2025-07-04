// ✅ Initialisation Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC0TH2KYCJ9fqvHGU7Y0facZZHS11qbDCc",
    authDomain: "astrid-2642.firebaseapp.com",
    projectId: "astrid-2642",
    storageBucket: "astrid-2642.appspot.com",
    messagingSenderId: "797746414978",
    appId: "1:797746414978:web:586b25dae714fa0f467b9b"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let idMessageRepondu = null;
const notificationSound = document.getElementById("notificationSound");
let audioAutorise = false;

function activerSon() {
    notificationSound.play().then(() => {
        audioAutorise = true;
        alert("🔔 Son activé !");
    }).catch((e) => {
        alert("⚠️ Impossible d’activer le son : " + e.message);
    });
}

function jouerSon(fichier) {
    new Audio(fichier).play();
}


window.onload = () => {
    const pseudoInput = document.getElementById("pseudo");
    const savedPseudo = localStorage.getItem("pseudo");

    if (savedPseudo) {
        pseudoInput.style.display = "none";
        document.getElementById("changerNom").style.display = "block";
        document.getElementById("monNom").textContent = savedPseudo;
    } else {
        document.getElementById("changerNom").style.display = "none";
        pseudoInput.style.display = "block";
    }

    afficherMessages();
};

function envoyerMessage(reponseDe = null) {
    const pseudoInput = document.getElementById("pseudo");
    const messageInput = document.getElementById("message");
    let pseudo = localStorage.getItem("pseudo");

    if (!pseudo) {
        pseudo = pseudoInput.value.trim();
        if (!pseudo) {
            alert("Veuillez entrer votre nom");
            openDrawer()
            return;
        }
        localStorage.setItem("pseudo", pseudo);
        pseudoInput.style.display = "none";
        document.getElementById("changerNom").style.display = "block";
        document.getElementById("monNom").textContent = pseudo;
    }

    const message = messageInput.value.trim();
    if (!message) return;

    db.collection("messages").add({
        pseudo: pseudo,
        texte: message,
        date: firebase.firestore.FieldValue.serverTimestamp(),
        reactions: {},
        reponseDe: reponseDe || null,
        imageUrl: null
    });

    messageInput.value = '';
    messageInput.placeholder = "Votre message";
    idMessageRepondu = null;
}

function envoyerImage(file) {
    const pseudo = localStorage.getItem("pseudo") || "Anonyme";
    if (!file || !pseudo) return;

    const storageRef = firebase.storage().ref();
    const imageRef = storageRef.child('images/' + Date.now() + '_' + file.name);

    imageRef.put(file).then(snapshot => {
        return snapshot.ref.getDownloadURL();
    }).then(url => {
        db.collection("messages").add({
            pseudo: pseudo,
            texte: "",
            date: firebase.firestore.FieldValue.serverTimestamp(),
            reactions: {},
            reponseDe: idMessageRepondu || null,
            imageUrl: url
        });
    }).catch(err => {
        alert("Erreur d'envoi d'image: " + err.message);
    });
}

function changeP() {
    document.getElementById("pseudo").style.display = "block";
}

function changerPseudo() {
    const pseudoInput = document.getElementById("pseudo");
    const pseudo = pseudoInput.value.trim();
    if (!pseudo) {
        alert("Entrez un pseudo");
        return;
    }
    localStorage.setItem("pseudo", pseudo);
    pseudoInput.style.display = "none";
    document.getElementById("monNom").textContent = pseudo;
}

function tempsDepuis(date) {
    const secondes = Math.floor((Date.now() - date.getTime()) / 1000);
    if (secondes < 60) return `il y a ${secondes} sec`;
    const minutes = Math.floor(secondes / 60);
    if (minutes < 60) return `il y a ${minutes} min`;
    const heures = Math.floor(minutes / 60);
    if (heures < 24) return `il y a ${heures} h`;
    const jours = Math.floor(heures / 24);
    return `il y a ${jours} j`;
}

function afficherMessages() {
    db.collection("messages").orderBy("date")
        .onSnapshot(snapshot => {
            const messagesDiv = document.getElementById("messages");
            messagesDiv.innerHTML = '';

            let tousLesMessages = [];
            snapshot.forEach(doc => {
                const msg = doc.data();
                tousLesMessages.push({ id: doc.id, ...msg });
            });

            const messagesParents = tousLesMessages.filter(m => !m.reponseDe);
            messagesParents.forEach(msg => {
                afficherMessageEtReponses(msg, tousLesMessages);
            });

            // ✅ Scroll vers le bas après affichage
            requestAnimationFrame(() => {
                const messagesDiv = document.getElementById("messages");
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            });


            jouerSon("Blip.mp3");
        });
}


function afficherMessageEtReponses(msg, tous) {
    const moi = localStorage.getItem("pseudo") || "";
    const estMoi = msg.pseudo === moi;
    const classBulle = estMoi ? "message moi" : "message autre";
    const temps = tempsDepuis(msg.date.toDate());

    const reactions = msg.reactions || {};
    const emojis = ["❤️", "😂", "👍", "😮", "😢"];
    const reactionsHTML = emojis.map(emoji => {
        const count = reactions[emoji]?.length || 0;
        return `<button class=\"emoji-btn\" onclick=\"ajouterReaction('${msg.id}', '${emoji}')\">${emoji} ${count}</button>`;
    }).join(" ");

    const boutonSupprimer = estMoi ? `<button class=\"suppr-btn\" onclick=\"supprimerMessage('${msg.id}')\">❌</button>` : "";
    const boutonRepondre = `<button class=\"reply-btn\" onclick=\"preparerReponse('${msg.id}', '${msg.pseudo}')\">💬 Répondre</button>`;

    let contenu = msg.texte ? `<div class=\"texto\">${msg.texte}</div>` : "";
    if (msg.imageUrl) {
        contenu += `<div><img src=\"${msg.imageUrl}\" style=\"max-width: 100%; border-radius: 10px;\"></div>`;
    }

    const messageHTML = `
      <div class=\"${classBulle}\">
        <div style=\"display: flex; justify-content: space-between; align-items: center;\">
          <strong>${msg.pseudo}</strong>
          ${boutonSupprimer}
        </div>
        ${contenu}
        <div class=\"reactions\">${reactionsHTML} ${boutonRepondre}</div>
        <span style=\"font-size:10px; color:gray;\">${temps}</span>
      </div>`;

    document.getElementById("messages").innerHTML += messageHTML;

    const reponses = tous.filter(m => m.reponseDe === msg.id);
    reponses.forEach(rep => {
        const tempsRep = tempsDepuis(rep.date.toDate());
        const image = rep.imageUrl ? `<img src=\"${rep.imageUrl}\" style=\"max-width: 100%;\">` : "";
        const texte = rep.texte ? rep.texte : "";
        const repHTML = `
          <div class=\"message reponse\">
            <div><strong>${rep.pseudo}<span style=\"font-size:10px; color:gray;\"> à repomdu </span>${msg.pseudo}</strong></div>
            <div class=\"texto\">${texte}${image}</div>
            <span style=\"font-size:10px; color:gray;\">${tempsRep}</span>
          </div>`;
        document.getElementById("messages").innerHTML += repHTML;
    });
}

function ajouterReaction(messageId, emoji) {
    const pseudo = localStorage.getItem("pseudo");
    if (!pseudo) return alert("Entrez votre nom d'abord");

    const msgRef = db.collection("messages").doc(messageId);
    msgRef.get().then(doc => {
        if (!doc.exists) return;
        const data = doc.data();
        const reactions = data.reactions || {};
        const dejaReagi = reactions[emoji]?.includes(pseudo);

        if (dejaReagi) {
            reactions[emoji] = reactions[emoji].filter(p => p !== pseudo);
        } else {
            reactions[emoji] = reactions[emoji] || [];
            reactions[emoji].push(pseudo);
        }

        msgRef.update({ reactions });
    });
}

// 🔴 CONFIRMATION PERSONNALISÉE
function supprimerMessage(messageId) {
    idMessageASupprimer = messageId;
    document.getElementById("modalModif").style.display = "flex";
}

function deleteLe() {
    if (!idMessageASupprimer) return;

    db.collection("messages").doc(idMessageASupprimer).delete()
        .then(() => {
            console.log("Message supprimé");
        })
        .catch(error => {
            console.error("Erreur suppression :", error);
        })
        .finally(() => {

            idMessageASupprimer = null;
        });
    jouerSon("Blip.mp3")
    document.getElementById("modalModif").style.display = "none";
}
function quitter() {
    document.getElementById("modalModif").style.display = "none";
}

function preparerReponse(id, pseudo) {

    idMessageRepondu = id;
    const input = document.getElementById("message");
    input.placeholder = "Réponse à " + pseudo + "…";
    input.focus();
}

// Gestion du bouton image
const inputImage = document.createElement('input');
inputImage.type = 'file';
inputImage.accept = 'image/*';
inputImage.style.display = 'none';
document.body.appendChild(inputImage);

inputImage.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) envoyerImage(file);
});

function ouvrirSelecteurImage() {
    inputImage.click();
}
