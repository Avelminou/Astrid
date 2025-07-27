const apf = localStorage.getItem("pseudo")
const pdp = document.getElementById("afficheAvatar")
pdp.style.backgroundImage = `url('https://avelminou.github.io/ikwely.mg/${apf}.jpg')`;
pdp.style.backgroundSize = "cover"
