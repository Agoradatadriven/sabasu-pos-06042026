/* ============================================================
   SABASU NOODLE BAR — POS  |  app.js
   Data layer = localStorage ("database") + Live Supabase Cloud
   ============================================================ */

// 1. Initialize your Supabase Cloud Client Connection Bridge via the global window container
const SUPABASE_URL = 'https://vddvsbveybvnqrfydfjr.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZHZzYnZleWJ2bnFyZnlkZmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NzI1NjAsImV4cCI6MjA5NjE0ODU2MH0.TX13Ptf-Zh_RKoAb0hyczqyvhAiQkYCnhh40Ir8P9i8';

// Fixed initialization placement at the top for proper script loading
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

/* ---------- Authentication State Engine ---------- */
async function initAuth() {
  if (!supabaseClient) return;

  // Check for an existing active user session
  const { data: { session } } = await supabaseClient.auth.getSession();
  toggleAuthUI(session);

  // Permanently listen to auth state updates (Logins / Logouts)
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    toggleAuthUI(session);
  });
}

function toggleAuthUI(session) {
  const appElement = document.getElementById('app');
  const loginElement = document.getElementById('loginView');
  
  if (session) {
    if (appElement) appElement.style.display = 'flex';
    if (loginElement) loginElement.style.display = 'none';
    
    // Automatically inherit cashier identity from staff login metadata email prefix
    const cashierInput = document.getElementById('cashierName');
    if (cashierInput && !cashierInput.value) {
      const emailPrefix = session.user.email.split('@')[0];
      cashierInput.value = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      DB.set(DB.CASHIER, cashierInput.value);
    }
  } else {
    if (appElement) appElement.style.display = 'none';
    if (loginElement) loginElement.style.display = 'flex';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const loginBtn = document.getElementById('loginBtn');

  if (!supabaseClient) return;
  
  loginBtn.disabled = true;
  loginBtn.textContent = 'Authenticating...';

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  
  if (error) {
    alert('Authentication Failed: ' + error.message);
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
}

async function handleSignOut() {
  if (!supabaseClient) return;
  const confirmLeave = confirm('Are you sure you want to sign out of this terminal session?');
  if (confirmLeave) {
    await supabaseClient.auth.signOut();
  }
}

const DB = {
  MENU: 'sabasu_menu_v1',
  ORDERS: 'sabasu_orders_v1',
  COUNTER: 'sabasu_counter_v1',
  CASHIER: 'sabasu_cashier_v1',
  get(k, f) { 
    try { 
      const v = localStorage.getItem(k); 
      return v ? JSON.parse(v) : f; 
    } catch(e) { 
      return f; 
    } 
  },
  set(k, v) { 
    localStorage.setItem(k, JSON.stringify(v)); 
  }
};

const CAT_EMOJI = {
  'Ramen & Noodles': '',
  'Pasta': '',
  'Sides': '',
  'Coffee': '',
  'Beverages': ''
};

const CAT_GRAD = {
  'Ramen & Noodles': 'linear-gradient(145deg,#e23b32,#7a1c16)',
  'Pasta': 'linear-gradient(145deg,#d35400,#8e2a00)',
  'Sides': 'linear-gradient(145deg,#e8b04b,#9c6e1e)',
  'Coffee': 'linear-gradient(145deg,#8a5a32,#4a2f19)',
  'Beverages': 'linear-gradient(145deg,#3fae6f,#1f5e3b)'
};

const DEFAULT_MENU = [
  {id: 'm1', name: 'Shoyu Tonkotsu Ramen', price: 130, cat: 'Ramen & Noodles', note: '', addons: [], sort_order: 1},
  {id: 'm2', name: 'Zaru Soba Cold Noodles', price: 160, cat: 'Ramen & Noodles', note: '', addons: [], sort_order: 2},
  {id: 'm3', name: 'Jin Ramyeon', price: 150, cat: 'Ramen & Noodles', note: '', addons: [], sort_order: 3},
  {id: 'm4', name: 'Shin Ramyeon', price: 150, cat: 'Ramen & Noodles', note: '', addons: [], sort_order: 4},
  {id: 'm5', name: 'Buldak Carbonara', price: 150, cat: 'Pasta', note: '', addons: [], sort_order: 5},
  {id: 's1', name: 'French Fries', price: 70, cat: 'Sides', note: '', addons: [], sort_order: 6},
  {id: 's2', name: 'Beef Nachos', price: 135, cat: 'Sides', note: '', addons: [], sort_order: 7},
  {id: 'c1', name: 'Cafe Americano', price: 70, cat: 'Coffee', note: '130ml', addons: [], sort_order: 8},
  {id: 'c2', name: 'Cafe Latte', price: 90, cat: 'Coffee', note: '130ml', addons: [], sort_order: 9},
  {id: 'c3', name: 'Iced Honey Chia Refresher', price: 75, cat: 'Coffee', note: '', addons: [], sort_order: 10},
  {id: 'b1', name: 'Coca-Cola', price: 55, cat: 'Beverages', note: '', addons: [], sort_order: 11},
  {id: 'b2', name: 'Canada Dry', price: 60, cat: 'Beverages', note: '', addons: [], sort_order: 12},
  {id: 'b3', name: 'Dr. Pepper', price: 60, cat: 'Beverages', note: '', addons: [], sort_order: 13},
  {id: 'b4', name: 'Bottled Water', price: 25, cat: 'Beverages', note: '', addons: [], sort_order: 14},
  {id: 'b5', name: 'C2 Solo', price: 25, cat: 'Beverages', note: '', addons: [], sort_order: 15},
  {id: 'b6', name: 'Sparkling Water Maison Perrier', price: 80, cat: 'Beverages', note: '', addons: [], sort_order: 16},
  {id: 'b7', name: 'Iced Dark Cafe', price: 70, cat: 'Beverages', note: '', addons: [], sort_order: 17},
  {id: 'b8', name: 'Bundaberg', price: 135, cat: 'Beverages', note: '', addons: [], sort_order: 18},
  {id: 'b9', name: 'Starbucks Double Shot', price: 120, cat: 'Beverages', note: '', addons: [], sort_order: 19}
];

let menu = [];
let cart = [];
let activeCat = 'Ramen & Noodles';
let orderType = 'Dine In';
let payMethod = 'Cash';
let editingId = null;
let pendingImg = null;  
let pendingImageFile = null;

// Kiosk intermediate item configuration caches
let currentAddonsList = []; 
let activeKioskItem = null;  

const peso = n => '₱' + Number(n).toLocaleString('en-PH', {minimumFractionDigits: 0, maximumFractionDigits: 2});

/* ---------- Cloud Synchronization Master Fetch Loader ---------- */
async function loadMasterMenuCatalog() {
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('menu')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      menu = data;
      console.log("Master catalog pulled successfully from Supabase.");
    } else {
      console.warn("Supabase table empty or offline. Falling back to local cache.");
      menu = DB.get(DB.MENU, null);
      if (!menu) {
        menu = DEFAULT_MENU.map(x => ({...x}));
        DB.set(DB.MENU, menu);
      }
    }
  } else {
    menu = DB.get(DB.MENU, null);
    if (!menu) {
      menu = DEFAULT_MENU.map(x => ({...x}));
      DB.set(DB.MENU, menu);
    }
  }
  renderMenu();
  renderManager();
}

/* ---------- Cashier Name (Editable + Persistent) ---------- */
function getCashier() {
  const c = DB.get(DB.CASHIER, '');
  return (c && c.trim()) ? c.trim() : 'Cashier';
}

function initCashier() {
  const inp = document.getElementById('cashierName');
  if (inp) {
    inp.value = DB.get(DB.CASHIER, '') || '';
    inp.addEventListener('input', e => { DB.set(DB.CASHIER, e.target.value); });
  }
}

/* ---------- Navigation Menu Handling ---------- */
document.querySelectorAll('.topnav button').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('.topnav button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + b.dataset.view).classList.add('active');
    if (b.dataset.view === 'hist') renderHistory();
    if (b.dataset.view === 'mgr') renderManager();
  };
});

/* ---------- Aesthetic Digital Clock System ---------- */
function tick() {
  const d = new Date();
  const dateStr = d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const clockEl = document.getElementById('clock');
  if (clockEl) {
    clockEl.innerHTML = `
      <div class="clock-time">${timeStr}</div>
      <div class="clock-date">${dateStr}</div>
    `;
  }
}
setInterval(tick, 1000); 
tick();

/* ---------- Order Tracking Numbers ---------- */
function currentOrderNo() { return DB.get(DB.COUNTER, 0) + 1; }
function fmtNo(n) { return '#' + String(n).padStart(3, '0'); }

/* ---------- Left Sidebar Categories Panel ---------- */
function renderCats() {
  const cats = Object.keys(CAT_EMOJI);
  const catsBox = document.getElementById('cats');
  if (!catsBox) return;

  catsBox.innerHTML = cats.map(c =>
    `<button class="cat ${c === activeCat ? 'active' : ''}" onclick="setCat('${c.replace(/'/g, "\\'")}')">${c}</button>`
  ).join('');
}

function setCat(c) { 
  activeCat = c; 
  renderCats(); 
  renderMenu(); 
}

function renderMenu() {
  const gridEl = document.getElementById('menuGrid');
  if (!gridEl) return;
  const items = menu.filter(m => m.cat === activeCat);
  
  gridEl.innerHTML = items.map(m => {
    const thumb = m.img ? `<img src="${m.img}" alt="">` : `<span></span>`;
    const bg = m.img ? '' : `style="background:${CAT_GRAD[m.cat] || '#333'}"`;
    return `<button class="card" onclick="addToCart('${m.id}')">
      <div class="thumb" ${bg}>${thumb}<span class="plus">＋</span></div>
      <div class="body">
        <div class="nm">${m.name}</div>
        ${m.note ? `<div class="note">${m.note}</div>` : ''}
        <div class="pr">${peso(m.price)}</div>
      </div>
    </button>`;
  }).join('') || `<div class="empty">No items in this category</div>`;
}

/* ---------- Cart & Kiosk Modifier Framework Actions ---------- */
function addToCart(id) {
  const m = menu.find(x => x.id === id); 
  if (!m) return;
  
  if ((m.addons && m.addons.length > 0) || m.cat === 'Ramen & Noodles') {
    launchKioskCustomizer(m);
    return;
  }
  
  executeCartInsertion(m, [], '');
}

function launchKioskCustomizer(item) {
  activeKioskItem = item;
  document.getElementById('kioskItemTitle').textContent = `Customize ${item.name}`;
  
  const notesInput = document.getElementById('kioskItemNotesInput');
  if (notesInput) notesInput.value = '';

  const imgFrame = document.getElementById('kioskItemImageFrame');
  if (imgFrame) {
    if (item.img) {
      imgFrame.style.background = 'none';
      imgFrame.innerHTML = `<img src="${item.img}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
    } else {
      imgFrame.innerHTML = '';
      imgFrame.style.background = CAT_GRAD[item.cat] || '#333';
    }
  }

  const grid = document.getElementById('kioskAddonsGrid');
  if (grid) {
    if (item.addons && item.addons.length > 0) {
      grid.innerHTML = item.addons.map((add, idx) => `
        <div class="kiosk-addon-row" onclick="const chk = document.getElementById('kchk_${idx}'); chk.checked = !chk.checked; updateKioskTotalPrice(); event.stopPropagation();">
          <div class="kiosk-addon-info">
            <span class="kiosk-addon-name">${add.name}</span>
            <span class="kiosk-addon-price">+ ${peso(add.price)}</span>
          </div>
          <input type="checkbox" id="kchk_${idx}" value="${idx}" onclick="event.stopPropagation();" onchange="updateKioskTotalPrice();">
        </div>
      `).join('');
    } else {
      grid.innerHTML = `<div style="color:var(--ink-muted); font-size:13px; text-align:center; padding:15px; width:100%;">No modifications mapped to this line dish item.</div>`;
    }
  }
  
  updateKioskTotalPrice();
  
  const submitBtn = document.getElementById('kioskSubmitBtn');
  if (submitBtn) {
    submitBtn.onclick = () => {
      const selected = [];
      if (item.addons) {
        item.addons.forEach((add, idx) => {
          const chk = document.getElementById(`kchk_${idx}`);
          if (chk && chk.checked) {
            selected.push({...add});
          }
        });
      }
      
      const specialInstructionsText = notesInput ? notesInput.value.trim() : '';
      executeCartInsertion(item, selected, specialInstructionsText);
      closeOverlay('kioskOverlay');
    };
  }
  
  document.getElementById('kioskOverlay').classList.add('show');
}

function updateKioskTotalPrice() {
  if (!activeKioskItem) return;
  
  let dynamicSumTotal = activeKioskItem.price;
  if (activeKioskItem.addons) {
    activeKioskItem.addons.forEach((add, idx) => {
      const chk = document.getElementById(`kchk_${idx}`);
      if (chk && chk.checked) {
        dynamicSumTotal += add.price;
      }
    });
  }
  
  const submitBtn = document.getElementById('kioskSubmitBtn');
  if (submitBtn) {
    submitBtn.textContent = `Confirm & Add to Order — ${peso(dynamicSumTotal)}`;
  }
}

function executeCartInsertion(item, selectedAddons, specialNotes) {
  const addonsSignature = selectedAddons.map(a => a.name).sort().join('|');
  const uniqueCartLineId = item.id + (addonsSignature ? '-' + addonsSignature : '') + (specialNotes ? '-' + btoa(specialNotes).slice(0, 8) : '');
  
  const line = cart.find(l => l.cartLineId === uniqueCartLineId);
  if (line) {
    line.qty++;
  } else {
    cart.push({
      cartLineId: uniqueCartLineId,
      id: item.id,
      name: item.name,
      price: item.price,
      qty: 1,
      note: item.note,
      selectedAddons: selectedAddons,
      customerNotes: specialNotes
    });
  }
  renderCart(); 
  flash();
}

function changeQty(cartLineId, d) {
  const line = cart.find(l => l.cartLineId === cartLineId); 
  if (!line) return;
  
  line.qty += d; 
  if (line.qty <= 0) {
    cart = cart.filter(l => l.cartLineId !== cartLineId);
  }
  renderCart();
}

function clearCart() { 
  if (!cart.length) return; 
  cart = []; 
  document.getElementById('discType').value = 'none'; 
  onDiscChange(); 
  renderCart(); 
}

function setType(t) {
  orderType = t;
  document.getElementById('btnDine').classList.toggle('active', t === 'Dine In');
  document.getElementById('btnTake').classList.toggle('active', t === 'Take Out');
}

function calc() {
  const subtotal = cart.reduce((s, l) => {
    const addonsCost = l.selectedAddons ? l.selectedAddons.reduce((sum, a) => sum + a.price, 0) : 0;
    return s + (l.price + addonsCost) * l.qty;
  }, 0);
  
  const dt = document.getElementById('discType').value;
  const dv = parseFloat(document.getElementById('discVal').value) || 0;
  let discount = 0, label = '';
  
  if (dt === 'senior') { discount = subtotal * 0.20; label = 'Senior Citizen 20%'; }
  else if (dt === 'pwd') { discount = subtotal * 0.20; label = 'PWD 20%'; }
  else if (dt === 'pct') { discount = subtotal * (dv / 100); label = 'Discount ' + dv + '%'; }
  else if (dt === 'amt') { discount = dv; label = 'Discount'; }
  
  discount = Math.min(discount, subtotal);
  return { subtotal, discount, label, total: subtotal - discount };
}

function onDiscChange() {
  const dt = document.getElementById('discType').value;
  const inp = document.getElementById('discVal');
  if (inp) {
    inp.style.display = (dt === 'pct' || dt === 'amt') ? 'block' : 'none';
    if (dt !== 'pct' && dt !== 'amt') inp.value = '';
    inp.placeholder = dt === 'pct' ? '%' : '₱';
  }
  renderTotals();
}

function renderCart() {
  const box = document.getElementById('cartItems');
  if (!box) return;
  
  if (!cart.length) {
    box.innerHTML = `<div class="empty">No items yet. Tap a dish to start.</div>`;
  } else {
    box.innerHTML = cart.map(l => {
      const addonsCost = l.selectedAddons ? l.selectedAddons.reduce((sum, a) => sum + a.price, 0) : 0;
      const totalLinePrice = l.price + addonsCost;
      const addonsLabel = l.selectedAddons && l.selectedAddons.length > 0 
        ? `<span class="cart-addon-inline">Extras: ${l.selectedAddons.map(a => `+${a.name}`).join(', ')}</span>`
        : '';
        
      const notesLabel = l.customerNotes 
        ? `<span class="cart-addon-inline" style="color: var(--red); font-style: italic;">📝 Note: "${l.customerNotes}"</span>`
        : '';
        
      return `
      <div class="line">
        <div class="info">
          <div class="ln">${l.name}</div>
          <div class="lp">${peso(totalLinePrice)} each</div>
          ${addonsLabel}
          ${notesLabel}
        </div>
        <div class="qty">
          <button onclick="changeQty('${l.cartLineId}',-1)">−</button>
          <span>${l.qty}</span>
          <button onclick="changeQty('${l.cartLineId}',1)">＋</button>
        </div>
        <div class="sub">${peso(totalLinePrice*l.qty)}</div>
      </div>`;
    }).join('');
  }
  document.getElementById('ordNo').textContent = fmtNo(currentOrderNo());
  renderTotals();
}

function renderTotals() {
  const { subtotal, discount, label, total } = calc();
  let html = `<div class="t"><span>Subtotal (${cart.reduce((s,l)=>s+l.qty,0)} items)</span><span>${peso(subtotal)}</span></div>`;
  if (discount > 0) html += `<div class="t disc"><span>${label}</span><span>−${peso(discount)}</span></div>`;
  html += `<div class="grand"><span class="lbl">TOTAL</span><span class="amt">${peso(total)}</span></div>`;
  
  const totalsBox = document.getElementById('totals');
  if (totalsBox) totalsBox.innerHTML = html;
  
  const btn = document.getElementById('payBtn');
  if (btn) {
    btn.disabled = !cart.length;
    btn.textContent = 'Charge ' + peso(total);
  }
  const mb = document.getElementById('mobBadge');
  if (mb) { 
    mb.textContent = cart.reduce((s,l)=>s+l.qty,0) + ' · ' + peso(total);
    document.getElementById('mobCartBtn').style.display = cart.length ? 'flex' : 'none'; 
  }
}

function flash() {
  const mb = document.getElementById('mobCartBtn');
  if (window.innerWidth <= 920 && mb) { mb.style.display = 'flex'; }
}
function openCart() { document.getElementById('cart').classList.add('open'); }
function closeCart() { document.getElementById('cart').classList.remove('open'); }

/* ---------- Checkout Ledger & QR Drawers ---------- */
function setPayMethod(m) {
  payMethod = m;
  document.querySelectorAll('#payMethods button').forEach(b => b.classList.toggle('active', b.dataset.m === m));
  
  const qrMethods = {
    'Gcash': 'Qr/qr-gcash.png',
    'Maya': 'Qr/qr-maya.png',
    'qrph': 'Qr/qr-qrph.png',
    'visa': 'Qr/qr-visa.png'
  };
  
  const qrDisplay = document.getElementById('qrDisplay');
  if (qrMethods[m]) {
    const labels = {'Gcash':'GCash Payment','Maya':'Maya Payment','qrph':'QRph Payment','visa':'Visa Payment'};
    document.getElementById('qrLabel').textContent = labels[m];
    document.getElementById('qrImage').src = qrMethods[m];
    if (qrDisplay) qrDisplay.classList.add('show');
    document.getElementById('cashFld').style.display = 'none';
    document.getElementById('quickCash').style.display = 'none';
  } else {
    if (qrDisplay) qrDisplay.classList.remove('show');
    document.getElementById('cashFld').style.display = 'block';
    document.getElementById('quickCash').style.display = 'flex';
  }
  renderPay();
}

function openPay() {
  if (!cart.length) return;
  payMethod = 'Cash'; 
  setPayMethod('Cash');
  document.getElementById('cashInput').value = '';
  document.getElementById('payCashier').value = DB.get(DB.CASHIER, '') || '';
  const { total } = calc();
  const opts = [total, Math.ceil(total/50)*50, Math.ceil(total/100)*100, Math.ceil(total/500)*500, 1000];
  const uniq = [...new Set(opts.filter(v => v >= total))].slice(0, 5);
  document.getElementById('quickCash').innerHTML = uniq.map(v => `<button onclick="setCash(${v})">${peso(v)}</button>`).join('');
  renderPay();
  document.getElementById('payOverlay').classList.add('show');
}

function setCash(v) { 
  document.getElementById('cashInput').value = v; 
  renderPay(); 
}

function syncCashier(val) {
  DB.set(DB.CASHIER, val);
  const cn = document.getElementById('cashierName');
  if (cn) cn.value = val;
}

function renderPay() {
  const { subtotal, discount, label, total } = calc();
  const qrMethods = ['Gcash', 'Maya', 'qrph', 'visa'];
  const isQR = qrMethods.includes(payMethod);
  
  let html = `<div class="r"><span>Subtotal</span><span>${peso(subtotal)}</span></div>`;
  if (discount > 0) html += `<div class="r" style="color:#2C7A4B"><span>${label}</span><span>−${peso(discount)}</span></div>`;
  html += `<div class="r total"><span>Amount Due</span><span>${peso(total)}</span></div>`;
  
  if (!isQR && payMethod === 'Cash') {
    const cash = parseFloat(document.getElementById('cashInput').value) || 0;
    const change = cash - total;
    html += `<div class="r"><span>Cash</span><span>${peso(cash)}</span></div>`;
    html += `<div class="r change"><span>Change</span><span>${cash >= total ? peso(change) : '—'}</span></div>`;
  } else if (isQR) {
    html += `<div class="r"><span>Payment Method</span><span>${payMethod}</span></div>`;
  }
  
  document.getElementById('paySummary').innerHTML = html;
  const cp = document.getElementById('confirmPay');
  
  if (isQR) {
    cp.disabled = false;
    cp.textContent = 'Complete Sale';
  } else {
    const cash = parseFloat(document.getElementById('cashInput').value) || 0;
    cp.disabled = cash < total;
    cp.textContent = cp.disabled ? 'Insufficient Cash' : 'Complete Sale';
  }
  cp.style.opacity = cp.disabled ? '.45' : '1';
}

function confirmPayment() {
  const { subtotal, discount, label, total } = calc();
  const qrMethods = ['Gcash', 'Maya', 'qrph', 'visa'];
  const isQR = qrMethods.includes(payMethod);
  
  if (!isQR) {
    const cash = parseFloat(document.getElementById('cashInput').value) || 0;
    if (cash < total) { toast('Insufficient cash'); return; }
  }
  
  const no = currentOrderNo();
  
  const orderItemsMapped = cart.map(l => {
    const addonsCost = l.selectedAddons ? l.selectedAddons.reduce((sum, a) => sum + a.price, 0) : 0;
    const linePrice = l.price + addonsCost;
    let modifiersText = l.selectedAddons && l.selectedAddons.length > 0 
      ? ` (${l.selectedAddons.map(a => a.name).join(', ')})` 
      : '';
      
    if (l.customerNotes) {
      modifiersText += ` [Note: ${l.customerNotes}]`;
    }
      
    return {
      name: l.name + modifiersText,
      price: linePrice,
      qty: l.qty,
      note: l.note
    };
  });

  const order = {
    no, ts: Date.now(),
    items: orderItemsMapped,
    subtotal, discount, discLabel: label, total,
    type: orderType, method: payMethod,
    cashier: getCashier(),
    cash: isQR ? total : parseFloat(document.getElementById('cashInput').value) || 0,
    change: isQR ? 0 : (parseFloat(document.getElementById('cashInput').value) || 0) - total
  };

  // Safe Cloud Bridge Stream Insertion
  if (supabaseClient) {
    supabaseClient.from('orders')
      .insert([{
        order_no: order.no,
        items: order.items, 
        subtotal: order.subtotal,
        discount: order.discount,
        disc_label: order.discLabel,
        total: order.total,
        type: orderType,
        method: payMethod,
        cashier: order.cashier,
        cash_tendered: order.cash,
        change_due: order.change
      }])
      .then(({ error }) => {
        if (error) {
          console.error("Supabase Error:", error);
          toast("Cloud Save Failed");
        } else {
          toast("Cloud Synced");
        }
      });
  }

  const orders = DB.get(DB.ORDERS, []); 
  orders.unshift(order); 
  DB.set(DB.ORDERS, orders);
  DB.set(DB.COUNTER, no);
  
  closeOverlay('payOverlay');
  showReceipt(order, true);
  
  cart = []; 
  document.getElementById('discType').value = 'none'; 
  onDiscChange(); 
  renderCart();
  closeCart();
}

/* ---------- Thermal Receipts Layout ---------- */
function showReceipt(o, isNew) {
  const dt = new Date(o.ts);
  const itemsHtml = o.items.map(i => `
    <div class="rc-it">
      <div class="l1"><span>${i.qty} × ${i.name}</span><span>${peso(i.price*i.qty)}</span></div>
      <div class="l2">@ ${peso(i.price)}${i.note ? ' · ' + i.note : ''}</div>
    </div>`).join('');
    
  let tot = `<div class="r"><span>Subtotal</span><span>${peso(o.subtotal)}</span></div>`;
  if (o.discount > 0) tot += `<div class="r disc"><span>${o.discLabel}</span><span>−${peso(o.discount)}</span></div>`;
  tot += `<div class="r grand"><span>TOTAL</span><span>${peso(o.total)}</span></div>`;
  
  if (o.method === 'Cash') {
    tot += `<div class="r"><span>Cash</span><span>${peso(o.cash)}</span></div>`;
    tot += `<div class="r"><span>Change</span><span>${peso(o.change)}</span></div>`;
  } else {
    tot += `<div class="r"><span>Paid via</span><span>${o.method}</span></div>`;
  }
  
  document.getElementById('receipt').innerHTML = `
    <div class="rc-inner">
      <div class="rc-brand">
        <div class="rn">SABASU</div>
        <div class="rs">Noodle Bar</div>
        <div class="ra">Authentic Ramen &amp; Refreshments<br>Thank you for dining with us</div>
      </div>
      <div class="rc-meta">
        <div class="rm"><span>Order No.</span><span>${fmtNo(o.no)}</span></div>
        <div class="rm"><span>Date</span><span>${dt.toLocaleDateString('en-PH')}</span></div>
        <div class="rm"><span>Time</span><span>${dt.toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'})}</span></div>
        <div class="rm"><span>Cashier</span><span>${o.cashier||'Cashier'}</span></div>
      </div>
      <div class="rc-type">${o.type}</div>
      <div class="rc-items">${itemsHtml}</div>
      <div class="rc-tot">${tot}</div>
      <div class="rc-foot">
        <div class="ty">Arigato</div>
        This serves as your official order receipt.<br>
        SABASU Noodle Bar · See you again soon 
      </div>
    </div>
    <div class="rc-actions">
      <button class="rc-print" onclick="window.print()">Print</button>
      <button class="rc-new" onclick="closeOverlay('rcOverlay')">${isNew?'New Order':'Close'}</button>
    </div>`;
  document.getElementById('rcOverlay').classList.add('show');
}

/* ---------- History & Reports Workspace ---------- */
function renderHistory() {
  const orders = DB.get(DB.ORDERS, []);
  const today = new Date().toDateString();
  const todays = orders.filter(o => new Date(o.ts).toDateString() === today);
  const todaySales = todays.reduce((s, o) => s + o.total, 0);
  const allSales = orders.reduce((s, o) => s + o.total, 0);
  
  document.getElementById('stats').innerHTML = `
    <div class="stat"><div class="k">Today's Orders</div><div class="v">${todays.length}</div></div>
    <div class="stat"><div class="k">Today's Sales</div><div class="v">${peso(todaySales)}</div></div>
    <div class="stat"><div class="k">Total Orders</div><div class="v">${orders.length}</div></div>
    <div class="stat"><div class="k">Total Sales</div><div class="v">${peso(allSales)}</div></div>`;
    
  const list = document.getElementById('histList');
  if (!orders.length) { 
    list.innerHTML = `<div class="empty">No sales yet. Completed orders will appear here.</div>`; 
    return; 
  }
  
  list.innerHTML = orders.map(o => {
    const dt = new Date(o.ts);
    const n = o.items.reduce((s, i) => s + i.qty, 0);
    return `<div class="hrow">
      <div class="ono">${fmtNo(o.no)}</div>
      <div class="meta">
        <div class="tt">${n} item${n>1?'s':''} · ${o.method} · ${o.cashier||'Cashier'}</div>
        <div class="dd">${dt.toLocaleDateString('en-PH')} ${dt.toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'})}</div>
      </div>
      <span class="tag ${o.type==='Dine In'?'dine':'take'}">${o.type==='Dine In'?'Dine In':'C/O'}</span>
      <div class="amt">${peso(o.total)}</div>
      <button class="view-btn" onclick="reprint(${o.no})">Receipt</button>
    </div>`;
  }).join('');
}

function reprint(no) { 
  const o = DB.get(DB.ORDERS, []).find(x => x.no === no); 
  if (o) showReceipt(o, false); 
}

function clearHistory() {
  if (!confirm('Delete ALL sales records? This cannot be undone.')) return;
  DB.set(DB.ORDERS, []); 
  DB.set(DB.COUNTER, 0); 
  renderHistory(); 
  renderCart(); 
  toast('Sales cleared');
}

function exportCSV() {
  const orders = DB.get(DB.ORDERS, []);
  if (!orders.length) { toast('No sales to export'); return; }
  
  let rows = [['Order','Date','Time','Cashier','Type','Method','Items','Subtotal','Discount','Total','Cash','Change']];
  orders.slice().reverse().forEach(o => {
    const dt = new Date(o.ts);
    rows.push([fmtNo(o.no), dt.toLocaleDateString('en-PH'), dt.toLocaleTimeString('en-PH'), o.cashier||'', o.type, o.method,
      o.items.map(i => i.qty + 'x ' + i.name).join('; '), o.subtotal, o.discount, o.total, o.cash, o.change]);
  });
  
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type: 'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sabasu_sales_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click(); 
  toast('CSV exported');
}

/* ---------- Menu Manager Catalog Grid ---------- */
function renderManager() {
  const mgrGrid = document.getElementById('mgrGrid');
  if (!mgrGrid) return;

  mgrGrid.innerHTML = menu.map((m, index) => {
    const thumb = m.img ? `<img src="${m.img}">` : `<span></span>`;
    const bg = m.img ? '' : `style="background:${CAT_GRAD[m.cat] || '#333'}"`;
    const isFirst = index === 0;
    const isLast = index === menu.length - 1;

    return `
      <div class="mcard" data-id="${m.id}">
        <div class="mthumb" ${bg}>${thumb}</div>
        <div class="mi">
          <div class="mn">${m.name}</div>
          <div class="mc">${m.cat}${m.note ? ' · ' + m.note : ''}</div>
          <div class="mp">${peso(m.price)}</div>
        </div>
        
        <div class="mcard-actions">
          <button class="btn-sort" onclick="moveItemInMenu(${index}, -1)" ${isFirst ? 'disabled' : ''} title="Move Up">▲</button>
          <button class="btn-sort" onclick="moveItemInMenu(${index}, 1)" ${isLast ? 'disabled' : ''} title="Move Down">▼</button>
          <button class="medit" onclick="openItemEdit('${m.id}')">✏️</button>
        </div>
      </div>
    `;
  }).join('');
}

async function moveItemInMenu(currentIndex, direction) {
  const targetIndex = currentIndex + direction;
  if (targetIndex < 0 || targetIndex >= menu.length) return;
  
  // Swap mechanics in regional memory
  const tempItem = menu[currentIndex];
  menu[currentIndex] = menu[targetIndex];
  menu[targetIndex] = tempItem;
  
  // Re-assign order priority tracking sequences down the collection array
  menu.forEach((item, index) => {
    item.sort_order = index + 1;
  });

  // Bulk update positions live onto the cloud node if online
  if (supabaseClient) {
    for (let item of [menu[currentIndex], menu[targetIndex]]) {
      await supabaseClient
        .from('menu')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id);
    }
  }

  DB.set(DB.MENU, menu);
  renderMenu();
  renderManager();
  toast("Menu arrangement updated across instances");
}

function openItemEdit(id) {
  editingId = id; 
  pendingImg = null;
  const m = id ? menu.find(x => x.id === id) : null;
  
  // Initialize intermediate modular modifier list configuration arrays
  currentAddonsList = m && m.addons ? [...m.addons] : [];
  
  document.getElementById('itemTitle').textContent = m ? 'Edit Item' : 'Add Item';
  document.getElementById('fName').value = m ? m.name : '';
  document.getElementById('fPrice').value = m ? m.price : '';
  document.getElementById('fCat').value = m ? m.cat : 'Ramen & Noodles';
  document.getElementById('fNote').value = m ? m.note || '' : '';
  pendingImg = m ? m.img || null : null;
  
  // Lazily inject modifiers panel shell wrapper context into the management modal view on the fly
  let addonsSection = document.getElementById('modalAddonsSection');
  if (!addonsSection) {
    addonsSection = document.createElement('div');
    addonsSection.id = 'modalAddonsSection';
    addonsSection.className = 'addons-manager-section';
    const parentForm = document.getElementById('fName').parentElement.parentElement;
    const photoLabel = document.querySelector('.popup-body label[for="fImg"]') || document.getElementById('fImg').parentElement;
    parentForm.insertBefore(addonsSection, photoLabel);
  }
  
  renderModalAddonsManager();
  updatePrev(m ? m.cat : 'Ramen & Noodles');
  document.getElementById('fDelete').style.display = m ? 'block' : 'none';
  document.getElementById('fImg').value = '';
  document.getElementById('itemOverlay').classList.add('show');
}

function renderModalAddonsManager() {
  const container = document.getElementById('modalAddonsSection');
  if (!container) return;
  
  container.innerHTML = `
    <div class="addons-label">Configure Item Add-ons / Modifiers</div>
    <div class="addons-input-row">
      <input type="text" id="newAddonName" placeholder="e.g. Extra Egg" style="flex: 2; padding:8px; border:1px solid #e1dbd6; border-radius:6px;">
      <input type="number" id="newAddonPrice" placeholder="₱ Price" style="flex: 1; padding:8px; border:1px solid #e1dbd6; border-radius:6px;">
      <button type="button" class="btn-add-addon" onclick="addNewAddonTag()" style="background:#16121f; color:white; border:none; padding:0 12px; border-radius:6px; font-weight:700; cursor:pointer;">+ Add</button>
    </div>
    <div class="addons-list-tags" id="addonsTagsList" style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
      ${currentAddonsList.map((add, idx) => `
        <span class="addon-tag" style="display:inline-flex; align-items:center; background:#f3efeb; padding:4px 8px; border-radius:6px; font-size:12px; font-weight:500;">
          ${add.name} (+₱${add.price})
          <button type="button" class="remove-btn" onclick="removeAddonTag(${idx})" style="background:none; border:none; color:#e23b32; margin-left:6px; cursor:pointer; font-weight:900;">✕</button>
        </span>
      `).join('') || '<span style="color:#a59a90; font-size:13px;">No active add-ons assigned yet.</span>'}
    </div>
  `;
}

function addNewAddonTag() {
  const nameInp = document.getElementById('newAddonName');
  const priceInp = document.getElementById('newAddonPrice');
  const name = nameInp.value.trim();
  const price = parseFloat(priceInp.value) || 0;
  
  if (!name) { toast('Enter modifier name'); return; }
  currentAddonsList.push({ name, price });
  nameInp.value = '';
  priceInp.value = '';
  renderModalAddonsManager();
}

function removeAddonTag(idx) {
  currentAddonsList.splice(idx, 1);
  renderModalAddonsManager();
}

function updatePrev(cat) {
  const p = document.getElementById('fPrev');
  if (pendingImg) { 
    p.innerHTML = `<img src="${pendingImg}">`; 
    document.getElementById('fRemove').style.display = 'block'; 
  } else { 
    p.innerHTML = ''; 
    p.style.background = CAT_GRAD[cat] || '#333'; 
    document.getElementById('fRemove').style.display = 'none'; 
  }
}

function onImgPick(e) {
  const file = e.target.files[0]; 
  if (!file) return;

  const fileName = file.name.toLowerCase();
  const hasValidExtension = fileName.endsWith('.jpg') || 
                            fileName.endsWith('.jpeg') || 
                            fileName.endsWith('.png') || 
                            fileName.endsWith('.webp');

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type) && !hasValidExtension) {
    alert('⚠️ Invalid file type. Please select a clear JPG, PNG, or WEBP image.');
    e.target.value = ''; 
    return;
  }

  const maxSizeBytes = 10 * 1024 * 1024; 
  if (file.size > maxSizeBytes) {
    alert('⚠️ File size is too large. Please upload an image under 10MB.');
    e.target.value = ''; 
    return;
  }

  const r = new FileReader();
  r.onload = ev => {
    const img = new Image();
    img.onerror = () => {
      alert('⚠️ Failed to load image. File may be broken or corrupted.');
      e.target.value = '';
    };

    img.onload = () => {
      const max = 600;
      const sc = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = img.width * sc; 
      c.height = img.height * sc;
      
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, c.width, c.height);
      
      c.toBlob((blob) => {
        if (!blob) {
          alert('⚠️ Image compression loop processing error.');
          return;
        }
        pendingImageFile = new File([blob], file.name, { type: 'image/jpeg' });
        pendingImg = URL.createObjectURL(pendingImageFile);
        updatePrev(document.getElementById('fCat').value);
      }, 'image/jpeg', 0.82);
    };
    img.src = ev.target.result;
  };
  r.readAsDataURL(file);
}

function removeImg() {
  if (pendingImg && pendingImg.startsWith('blob:')) {
    URL.revokeObjectURL(pendingImg);
  }
  pendingImageFile = null;
  pendingImg = null; 
  updatePrev(document.getElementById('fCat').value); 
}

async function saveItem() {
  const name = document.getElementById('fName').value.trim();
  const price = parseFloat(document.getElementById('fPrice').value);
  const cat = document.getElementById('fCat').value;
  const note = document.getElementById('fNote').value.trim();
  
  if (!name) { alert('⚠️ Enter an item name'); return; }
  if (isNaN(price) || price < 0) { alert('⚠️ Enter a valid price'); return; }

  let finalImageUrl = pendingImg; 

  if (pendingImageFile && supabaseClient) {
    toast("Uploading photo to cloud...");
    const uniqueFileName = `item-${Date.now()}.jpg`;
    const { data, error } = await supabaseClient.storage
      .from('menu-images') 
      .upload(uniqueFileName, pendingImageFile);

    if (error) {
      console.error("Supabase Storage Upload Exception:", error);
      alert("🛑 Cloud Storage Error: " + error.message);
      return; 
    } else {
      const { data: publicUrlData } = supabaseClient.storage
        .from('menu-images') 
        .getPublicUrl(uniqueFileName);
      finalImageUrl = publicUrlData.publicUrl;
    }
  }

  const generatedPayload = { 
    name, 
    price, 
    cat, 
    note, 
    img: finalImageUrl, 
    addons: currentAddonsList,
    sort_order: editingId ? menu.find(x => x.id === editingId).sort_order : menu.length + 1
  };

  if (supabaseClient) {
    if (editingId) {
      // Append .select() to verify if the primary key exists and row count was impacted
      const { data, error: dbErr } = await supabaseClient
        .from('menu')
        .update(generatedPayload)
        .eq('id', editingId)
        .select();

      if (dbErr) {
        alert("🛑 Database Sync Error: " + dbErr.message);
        return;
      }

      // Safe Fallback: If 0 rows were updated, it means frontend keys don't match database keys.
      // We instantly re-route the save operation by matching the item's unique name string!
      if (!data || data.length === 0) {
        console.warn("Primary key mismatch detected. Falling back to unique name-string query matching...");
        const { error: fallbackErr } = await supabaseClient
          .from('menu')
          .update(generatedPayload)
          .eq('name', name);
          
        if (fallbackErr) {
          alert("🛑 Database Fallback Error: " + fallbackErr.message);
          return;
        }
      }
    } else {
      generatedPayload.id = 'x' + Date.now();
      const { error: dbErr } = await supabaseClient.from('menu').insert([generatedPayload]);
      if (dbErr) {
        alert("🛑 Database Sync Error: " + dbErr.message);
        return;
      }
    }
  }

  // Synchronize memory cache and repaint the interfaces
  await loadMasterMenuCatalog();
  
  pendingImageFile = null;
  pendingImg = null;
  closeOverlay('itemOverlay'); 
  toast('Product profiles saved and synced live to cloud data rows ✓');
}

async function deleteItem() {
  if (!editingId) return;
  if (!confirm('Delete this item?')) return;
  
  if (supabaseClient) {
    const { error } = await supabaseClient.from('menu').delete().eq('id', editingId);
    if (error) {
      alert("🛑 Delete Error: " + error.message);
      return;
    }
  }
  
  cart = cart.filter(l => l.id !== editingId);
  await loadMasterMenuCatalog();
  
  closeOverlay('itemOverlay'); 
  toast('Item deleted from catalog data layers');
}

function resetMenu() {
  if (!confirm('Reset menu to the original SABASU list? Custom items & photos will be removed.')) return;
  
  if (supabaseClient) {
    supabaseClient.from('menu').delete().neq('id', 'keep-all-purge').then(() => {
      const arrayToInsert = DEFAULT_MENU.map(x => ({...x}));
      supabaseClient.from('menu').insert(arrayToInsert).then(() => {
        loadMasterMenuCatalog();
      });
    });
  } else {
    menu = DEFAULT_MENU.map(x => ({...x})); 
    DB.set(DB.MENU, menu); 
    renderManager(); 
    renderMenu();
  }
  toast('Menu configuration baseline loaded');
}

/* ---------- Overlay & Alert Notification Utilities ---------- */
function closeOverlay(id) { document.getElementById(id).classList.remove('show'); }
let toastT;
function toast(msg) {
  const t = document.getElementById('toast'); 
  t.innerHTML = '🔔 ' + msg;
  t.classList.add('show');
  clearTimeout(toastT); 
  toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

document.querySelectorAll('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('show'); }));
const fCatEl = document.getElementById('fCat');
if (fCatEl) fCatEl.addEventListener('change', e => { if (!pendingImg) updatePrev(e.target.value); });

/* ---------- System Initialization ---------- */
initCashier();
renderCats(); 
renderCart(); 
onDiscChange();
initAuth(); 
loadMasterMenuCatalog(); // Triggers real-time cloud data retrieval routine on app boot