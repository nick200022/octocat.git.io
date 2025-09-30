// Configuración de Firebase (debes poner tus credenciales)
// const firebaseConfig = { ... };
// firebase.initializeApp(firebaseConfig);

// Conexión con MetaMask y ethers.js
let currentAccount = null;
const tokenAddress = "DIRECCION_DEL_CONTRATO"; // Cambia por la dirección real
const tokenABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint)",
  "function decimals() view returns (uint8)"
];

async function connectWallet() {
  if (window.ethereum) {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    currentAccount = accounts[0];
    document.getElementById('walletAddress').innerText = 'Wallet: ' + currentAccount;
  } else {
    alert('MetaMask no detectado');
  }
}

async function getBalance() {
  if (!currentAccount) return alert('Conecta tu wallet primero');
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const contract = new ethers.Contract(tokenAddress, tokenABI, provider);
  const bal = await contract.balanceOf(currentAccount);
  const decimals = await contract.decimals();
  document.getElementById('tokenBalance').innerText = 'Saldo: ' + ethers.utils.formatUnits(bal, decimals) + ' NEON';
}

// Registro de usuario (estructura para Firebase)
function registerUser() {
  const email = document.getElementById('email').value;
  // Aquí iría la lógica para guardar el correo en Firebase
  document.getElementById('registerMsg').innerText = 'Registrado (simulado) con: ' + email;
}

// Mensajería entre usuarios (estructura para Firebase)
function sendMessage() {
  const to = document.getElementById('msgTo').value;
  const text = document.getElementById('msgText').value;
  // Aquí iría la lógica para guardar el mensaje en Firebase
  document.getElementById('msgStatus').innerText = 'Mensaje enviado (simulado) a: ' + to;
}

// Para mostrar mensajes recibidos, deberías consultar la base de datos y mostrarlos en #inbox
