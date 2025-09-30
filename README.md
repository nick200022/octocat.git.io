<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Neon Exchange — Demo (BSC/ERC-20)</title>
  <meta name="description" content="Demo frontend para interactuar con tokens ERC-20 (estilo BSC). Compatible con GitHub Pages / HTTPS." />
  <!-- Ethers.js v5 CDN -->
  <script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.min.js"></script>
  <style>
    :root{--bg:#071427;--card:#0f2a3f;--accent:#00e6ff;--muted:#9fb3c8}
    *{box-sizing:border-box}
    body{margin:0;font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:linear-gradient(180deg,#041024,#071427);color:#eaf6ff}
    .wrap{max-width:1100px;margin:28px auto;padding:18px}
    header{display:flex;align-items:center;gap:12px}
    .logo{width:56px;height:56px;border-radius:10px;background:linear-gradient(135deg,var(--accent),#00b5ff);display:flex;align-items:center;justify-content:center;font-weight:800;color:#001820}
    h1{margin:0;font-size:20px}
    .grid{display:grid;grid-template-columns:1fr 380px;gap:16px;margin-top:18px}
    .card{background:var(--card);padding:14px;border-radius:12px;box-shadow:0 8px 30px rgba(2,6,23,0.6)}
    input,select,button{width:100%;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);color:inherit}
    .muted{color:var(--muted);font-size:13px}
    .row{display:flex;gap:8px}
    .small{width:120px}
    .token{display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid rgba(255,255,255,0.02)}
    footer{margin-top:12px;color:var(--muted);font-size:13px}
    @media(max-width:900px){.grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="logo">N</div>
      <div>
        <h1>Neon Exchange — Demo ERC-20 (BSC compatible)</h1>
        <div class="muted">Página demo: no use claves privadas en servidores sin seguridad. Funciona con MetaMask / wallets compatibles.</div>
      </div>
      <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
        <div id="account" class="muted">No conectado</div>
        <button id="connectBtn">Conectar Wallet</button>
      </div>
    </header>

    <div class="grid">
      <main class="card">
        <h3>Tokens y Balance</h3>
        <div class="muted">Puede añadir tokens ERC-20 (BSC) por dirección para ver saldos y enviar.</div>

        <div style="display:grid;grid-template-columns:1fr 140px;gap:8px;margin-top:12px">
          <input id="tokenAddr" placeholder="Dirección del token (ERC-20)" />
          <button id="addToken">Añadir</button>
        </div>

        <div id="tokensList" style="margin-top:12px"></div>

        <h4 style="margin-top:14px">Enviar token</h4>
        <div style="display:grid;gap:8px">
          <select id="selToken"><option value="">-- seleccionar token --</option></select>
          <input id="toAddr" placeholder="Dirección destinatario" />
          <input id="sendAmount" type="number" placeholder="Cantidad (según decimales)" />
          <div class="row"><button id="sendToken">Enviar</button><button id="approveToken">Aprobar (allow)</button></div>
        </div>

        <h4 style="margin-top:14px">Historial (local)</h4>
        <div id="history" class="muted" style="font-size:13px;max-height:220px;overflow:auto;margin-top:8px"></div>
      </main>

      <aside class="card">
        <h3>Cuenta / Usuario</h3>
        <div class="muted">Usuario local y contraseña (almacenados en localStorage con hash SHA-256 demo).</div>

        <div style="margin-top:10px">
          <label class="muted">Usuario</label>
          <input id="username" placeholder="tu.usuario" />
          <label class="muted" style="margin-top:8px">Contraseña</label>
          <input id="password" type="password" placeholder="nueva contraseña" />
          <button id="saveCreds" style="margin-top:8px">Guardar credenciales (demo)</button>
        </div>

        <hr style="margin:12px 0;border:none;border-top:1px solid rgba(255,255,255,0.03)"/>

        <h4>Recibir / Copiar dirección</h4>
        <div class="muted">Tu dirección pública (recibir tokens ERC-20)</div>
        <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
          <input id="recvAddr" readonly />
          <button id="copyAddr" class="small">Copiar</button>
        </div>

        <hr style="margin:12px 0;border:none;border-top:1px solid rgba(255,255,255,0.03)"/>
        <div class="muted">Red</div>
        <select id="chainSelect" style="margin-top:6px">
          <option value="56">BSC Mainnet (56)</option>
          <option value="97">BSC Testnet (97)</option>
          <option value="137">Polygon (137)</option>
        </select>
        <div style="margin-top:10px"><button id="switchChain">Solicitar cambio de red</button></div>

      </aside>
    </div>

    <footer>
      ⚠️ Esta es una demo frontend. Para producción: implemente backend seguro, manejo de KYC, cuotas, validaciones de nonce, y auditorías de contratos.
    </footer>
  </div>

<script>
// Neon Exchange — Demo frontend (single-file)
// - Usa ethers.js
// - Muestra tokens añadidos, permite enviar ERC-20 y aprobar allowance
// - Guarda "usuario" y hash de contraseña en localStorage (demo)

const connectBtn = document.getElementById('connectBtn');
const accountEl = document.getElementById('account');
const tokensList = document.getElementById('tokensList');
const selToken = document.getElementById('selToken');
const recvAddr = document.getElementById('recvAddr');
const historyEl = document.getElementById('history');
const chainSelect = document.getElementById('chainSelect');

let provider, signer, currentAccount, currentChainId;
let tokens = JSON.parse(localStorage.getItem('neon_tokens') || '[]');
const tokenAbi = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)'
];

// Init UI from saved tokens and creds
renderTokens(); renderHistory(); loadCreds();

async function connectWallet(){
  if(!window.ethereum) return alert('Instala MetaMask u otro wallet web3');
  provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
  try{
    const accounts = await provider.send('eth_requestAccounts',[]);
    signer = provider.getSigner();
    currentAccount = accounts[0];
    accountEl.textContent = shorten(currentAccount);
    recvAddr.value = currentAccount;
    currentChainId = (await provider.getNetwork()).chainId;
    chainSelect.value = currentChainId;
    logLocal('Wallet conectada: ' + currentAccount);
    await refreshAllBalances();
    // events
    window.ethereum.on('accountsChanged', (arr)=>{ currentAccount = arr[0]; accountEl.textContent = currentAccount ? shorten(currentAccount) : 'No conectado'; recvAddr.value = currentAccount || ''; });
    window.ethereum.on('chainChanged', ()=> location.reload());
  }catch(e){console.error(e);alert('Error conectando wallet')}
}
connectBtn.onclick = connectWallet;

// Add token
document.getElementById('addToken').onclick = async ()=>{
  const addr = document.getElementById('tokenAddr').value.trim();
  if(!ethers.utils.isAddress(addr)) return alert('Dirección inválida');
  // avoid duplicates
  if(tokens.find(t=>t.address.toLowerCase()===addr.toLowerCase())) return alert('Token ya agregado');
  // use provider or public RPC if no wallet
  const rpcProvider = provider || new ethers.providers.JsonRpcProvider(getRpcUrl());
  const c = new ethers.Contract(addr, tokenAbi, rpcProvider);
  try{
    const [symbol, decimals, name] = await Promise.all([c.symbol(), c.decimals(), c.name()]);
    tokens.unshift({address:addr,name, symbol, decimals});
    localStorage.setItem('neon_tokens', JSON.stringify(tokens));
    renderTokens();
    await refreshAllBalances();
  }catch(e){console.error(e); alert('No se pudo leer token: ' + e.message)}
}

function renderTokens(){
  tokensList.innerHTML=''; selToken.innerHTML='<option value="">-- seleccionar token --</option>';
  tokens.forEach(t=>{
    const el = document.createElement('div'); el.className='token';
    el.innerHTML = `<div><strong>${t.symbol}</strong> <div class='muted' style='font-size:12px'>${t.name}</div></div><div id='bal_${t.address}'>...</div>`;
    tokensList.appendChild(el);
    const opt = document.createElement('option'); opt.value = t.address; opt.textContent = `${t.symbol} — ${t.address.slice(0,6)}…`; selToken.appendChild(opt);
  });
}

async function refreshAllBalances(){
  const rpcProvider = provider || new ethers.providers.JsonRpcProvider(getRpcUrl());
  for(const t of tokens){
    const c = new ethers.Contract(t.address, tokenAbi, rpcProvider);
    try{
      const bal = currentAccount ? await c.balanceOf(currentAccount) : ethers.BigNumber.from('0');
      const formatted = ethers.utils.formatUnits(bal, t.decimals);
      document.getElementById('bal_'+t.address).textContent = formatted + ' ' + t.symbol;
    }catch(e){document.getElementById('bal_'+t.address).textContent='error'}
  }
}

// Send token
document.getElementById('sendToken').onclick = async ()=>{
  if(!signer) return alert('Conecta la wallet primero');
  const addr = selToken.value; if(!addr) return alert('Selecciona token');
  const to = document.getElementById('toAddr').value.trim(); if(!ethers.utils.isAddress(to)) return alert('Dirección destino inválida');
  const amount = document.getElementById('sendAmount').value; if(!amount || isNaN(amount) || Number(amount)<=0) return alert('Cantidad inválida');
  const t = tokens.find(x=>x.address===addr);
  const c = new ethers.Contract(addr, tokenAbi, signer);
  try{
    const bn = ethers.utils.parseUnits(amount, t.decimals);
    const tx = await c.transfer(to, bn);
    logLocal('Enviando ' + amount + ' ' + t.symbol + ' — tx: ' + tx.hash);
    await tx.wait();
    logLocal('TX confirmada: ' + tx.hash);
    await refreshAllBalances();
  }catch(e){console.error(e); alert('Error al enviar: ' + (e && e.message))}
}

// Approve (allowance) — demo: approve spender as entered in "toAddr"
document.getElementById('approveToken').onclick = async ()=>{
  if(!signer) return alert('Conecta la wallet primero');
  const addr = selToken.value; if(!addr) return alert('Selecciona token');
  const spender = document.getElementById('toAddr').value.trim(); if(!ethers.utils.isAddress(spender)) return alert('Dirección inválida');
  const amount = document.getElementById('sendAmount').value || '0';
  const t = tokens.find(x=>x.address===addr);
  const c = new ethers.Contract(addr, tokenAbi, signer);
  try{
    const bn = ethers.utils.parseUnits(amount, t.decimals);
    const tx = await c.approve(spender, bn);
    logLocal('Approve enviado — tx: ' + tx.hash);
    await tx.wait(); logLocal('Approve confirmada');
  }catch(e){console.error(e); alert('Error aprobando: ' + (e && e.message))}
}

// Helpers: local history log
function logLocal(msg){
  const t = new Date().toISOString();
  const arr = JSON.parse(localStorage.getItem('neon_history')||'[]');
  arr.unshift('['+t+'] ' + msg);
  if(arr.length>200) arr.splice(200);
  localStorage.setItem('neon_history', JSON.stringify(arr));
  renderHistory();
}
function renderHistory(){ const arr = JSON.parse(localStorage.getItem('neon_history')||'[]'); historyEl.innerHTML = arr.map(x=>'<div>'+x+'</div>').join(''); }

// Username/password (demo) — store username and SHA-256(password)
async function hashText(text){ const enc=new TextEncoder(); const data=enc.encode(text); const hash=await crypto.subtle.digest('SHA-256', data); return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join(''); }

document.getElementById('saveCreds').onclick = async ()=>{
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value;
  if(!u || !p) return alert('Usuario y contraseña requeridos');
  const h = await hashText(p);
  localStorage.setItem('neon_user', JSON.stringify({user:u, phash:h}));
  alert('Credenciales guardadas (demo, localStorage)');
}
function loadCreds(){ const s = localStorage.getItem('neon_user'); if(!s) return; try{ const o=JSON.parse(s); document.getElementById('username').value=o.user; }catch(e){} }

// Copy address button
document.getElementById('copyAddr').onclick = ()=>{ recvAddr.select(); document.execCommand('copy'); alert('Dirección copiada'); }

// Switch network (request)
document.getElementById('switchChain').onclick = async ()=>{
  if(!window.ethereum) return alert('No provider');
  const chainId = '0x' + parseInt(chainSelect.value).toString(16);
  try{
    await window.ethereum.request({ method:'wallet_switchEthereumChain', params:[{chainId}] });
    alert('Red cambiada');
  }catch(switchError){
    // if unknown chain, show instructions — for demo we won't add chains programmatically
    alert('No se pudo cambiar la red: ' + (switchError.message || switchError));
  }
}

function shorten(a){ return a? a.slice(0,6) + '…' + a.slice(-4) : '—'; }
function getRpcUrl(){ const cid = chainSelect.value || '97'; if(cid==='56') return 'https://bsc-dataseed.binance.org/'; if(cid==='97') return 'https://data-seed-prebsc-1-s1.binance.org:8545/'; if(cid==='137') return 'https://rpc.ankr.com/polygon'; return 'https://data-seed-prebsc-1-s1.binance.org:8545/'; }

// Refresh balances on load using public RPC
setTimeout(()=>{ if(!provider) refreshAllBalances(); }, 800);

</script>
</body>
</html>

