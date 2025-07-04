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
let idMessageASupprimer = null;
let audioAutorise = false;
let mode = "groupe";
let utilisateurActif = null;

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
    afficherListeUtilisateurs();
    document.getElementById("MdGroupe").style.display = "block"
};

function basculerMode() {
    if (mode === "groupe") {
        mode = "prive";
        document.getElementById("MdGroupe").style.display = "block"
        document.getElementById("btnMode").style.display = "none"
    } else {
        mode = "groupe";
        utilisateurActif = null;
        document.getElementById("message").placeholder = "Votre message";
        afficherMessages();
    }
}

function envoyerMessage(reponseDe = null) {
    const pseudoInput = document.getElementById("pseudo");
    const messageInput = document.getElementById("message");
    let pseudo = localStorage.getItem("pseudo");

    if (!pseudo) {
        pseudo = pseudoInput.value.trim();
        if (!pseudo) {
            alert("Veuillez entrer votre nom");
            openDrawer();
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
        destinataire: mode === "prive" ? utilisateurActif : null
    });

    messageInput.value = '';
    messageInput.placeholder = "Votre message";
    idMessageRepondu = null;
}

function afficherMessages() {
    db.collection("messages").orderBy("date").onSnapshot(snapshot => {
        const messagesDiv = document.getElementById("messages");
        messagesDiv.innerHTML = '';

        let tous = [];
        snapshot.forEach(doc => {
            const msg = doc.data();
            msg.id = doc.id;

            if (mode === "groupe" && !msg.destinataire) {
                tous.push(msg);
            } else if (mode === "prive") {
                const moi = localStorage.getItem("pseudo");
                if (
                    (msg.pseudo === moi && msg.destinataire === utilisateurActif) ||
                    (msg.pseudo === utilisateurActif && msg.destinataire === moi)
                ) {
                    tous.push(msg);
                }
            }
        });

        const parents = tous.filter(m => !m.reponseDe);
        parents.forEach(msg => afficherMessageEtReponses(msg, tous));

        requestAnimationFrame(() => {
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });

        if (audioAutorise) jouerSon("bling.mp3");
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
        return `<button class="emoji-btn" onclick="ajouterReaction('${msg.id}', '${emoji}')">${emoji} ${count}</button>`;
    }).join(" ");

    const boutonSupprimer = estMoi ? `<button class="suppr-btn" onclick="supprimerMessage('${msg.id}')">❌</button>` : "";
    const boutonRepondre = `<button class="reply-btn" onclick="preparerReponse('${msg.id}', '${msg.pseudo}')">💬 Répondre</button>`;

    let contenu = msg.texte ? `<div class="texto">${msg.texte}</div>` : "";

    const messageHTML = `
      <div class="${classBulle}">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong>${msg.pseudo}</strong>
          ${boutonSupprimer}
        </div>
        ${contenu}
        <div class="reactions">${reactionsHTML} ${boutonRepondre}</div>
        <span style="font-size:10px; color:gray;">${temps}</span>
      </div>`;

    document.getElementById("messages").innerHTML += messageHTML;

    const reponses = tous.filter(m => m.reponseDe === msg.id);
    reponses.forEach(rep => {
        const tempsRep = tempsDepuis(rep.date.toDate());
        const texte = rep.texte || "";
        const repHTML = `
          <div class="message reponse">
            <div><strong>${rep.pseudo}<span style="font-size:10px; color:gray;"
            > a repondu </span>${msg.pseudo}</strong></div>
            <div class="texto">${texte}</div>
            <span style="font-size:10px; color:gray;">${tempsRep}</span>
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

function supprimerMessage(messageId) {
    idMessageASupprimer = messageId;
    document.getElementById("modalModif").style.display = "flex";
}

function deleteLe() {
    if (!idMessageASupprimer) return;

    db.collection("messages").doc(idMessageASupprimer).delete()
        .then(() => console.log("Message supprimé"))
        .catch(error => console.error("Erreur suppression :", error))
        .finally(() => {
            idMessageASupprimer = null;
        });
    jouerSon("bling.mp3");
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

function changeP() {
    document.getElementById("pseudo").style.display = "block";
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

function afficherListeUtilisateurs() {
    db.collection("messages").get().then(snapshot => {
        const noms = new Set();
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.pseudo) noms.add(data.pseudo);
        });

        const html = "<h4>👥 Utilisateurs :</h4><ul>" +
            Array.from(noms).sort().map(nom => `<li onclick=\"choisirUtilisateur('${nom}')\">${nom}</li>`).join("") +
            "</ul>";
        document.getElementById("utilisateur").innerHTML = html;
    });
}

function choisirUtilisateur(nom) {
    utilisateurActif = nom;
    mode = "prive";
    document.getElementById("message").placeholder = "À " + nom + "…";
    afficherMessages();
}
