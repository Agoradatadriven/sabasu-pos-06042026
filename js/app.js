/* ============================================================
   SABASU NOODLE BAR — POS  |  app.js
   Data layer = localStorage ("database")
   ============================================================ */
const DB = {
  MENU:'sabasu_menu_v1',
  ORDERS:'sabasu_orders_v1',
  COUNTER:'sabasu_counter_v1',
  CASHIER:'sabasu_cashier_v1',
  get(k,f){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):f; }catch(e){ return f; } },
  set(k,v){ localStorage.setItem(k,JSON.stringify(v)); }
};

const CAT_EMOJI = {'Ramen & Noodles':'🍜','Sides':'🍟','Coffee':'☕','Beverages':'🥤'};
const CAT_GRAD = {
  'Ramen & Noodles':'linear-gradient(145deg,#e23b32,#7a1c16)',
  'Sides':'linear-gradient(145deg,#e8b04b,#9c6e1e)',
  'Coffee':'linear-gradient(145deg,#8a5a32,#4a2f19)',
  'Beverages':'linear-gradient(145deg,#3fae6f,#1f5e3b)'
};

const DEFAULT_MENU = [
  {id:'m1', name:'Shoyu Tonkotsu Ramen', price:130, cat:'Ramen & Noodles', note:''},
  {id:'m2', name:'Zaru Soba Cold Noodles', price:160, cat:'Ramen & Noodles', note:''},
  {id:'m3', name:'Jin Ramyeon', price:150, cat:'Ramen & Noodles', note:''},
  {id:'m4', name:'Shin Ramyeon', price:150, cat:'Ramen & Noodles', note:''},
  {id:'m5', name:'Buldak Carbonara', price:150, cat:'Ramen & Noodles', note:''},
  {id:'s1', name:'French Fries', price:70, cat:'Sides', note:''},
  {id:'s2', name:'Beef Nachos', price:135, cat:'Sides', note:''},
  {id:'c1', name:'Cafe Americano', price:70, cat:'Coffee', note:'130ml'},
  {id:'c2', name:'Cafe Latte', price:90, cat:'Coffee', note:'130ml'},
  {id:'c3', name:'Iced Honey Chia Refresher', price:75, cat:'Coffee', note:''},
  {id:'b1', name:'Coca-Cola', price:55, cat:'Beverages', note:''},
  {id:'b2', name:'Canada Dry', price:60, cat:'Beverages', note:''},
  {id:'b3', name:'Dr. Pepper', price:60, cat:'Beverages', note:''},
  {id:'b4', name:'Bottled Water', price:25, cat:'Beverages', note:''},
  {id:'b5', name:'C2 Solo', price:25, cat:'Beverages', note:''},
  {id:'b6', name:'Sparkling Water Maison Perrier', price:80, cat:'Beverages', note:''},
  {id:'b7', name:'Iced Dark Cafe', price:70, cat:'Beverages', note:''},
  {id:'b8', name:'Bundaberg', price:135, cat:'Beverages', note:''},
  {id:'b9', name:'Starbucks Double Shot', price:120, cat:'Beverages', note:''}
];

let menu = DB.get(DB.MENU, null);
if(!menu){ menu = DEFAULT_MENU.map(x=>({...x})); DB.set(DB.MENU, menu); }

let cart = [];
let activeCat = 'All';
let orderType = 'Dine In';
let payMethod = 'Cash';
let editingId = null;
let pendingImg = null;
const peso = n => '₱'+Number(n).toLocaleString('en-PH',{minimumFractionDigits:0,maximumFractionDigits:2});

/* ---------- Cashier name (editable + persistent) ---------- */
function getCashier(){
  const c = DB.get(DB.CASHIER, '');
  return (c && c.trim()) ? c.trim() : 'Cashier';
}
function initCashier(){
  const inp = document.getElementById('cashierName');
  inp.value = DB.get(DB.CASHIER, '') || '';
  inp.addEventListener('input', e=>{ DB.set(DB.CASHIER, e.target.value); });
}

/* ---------- Navigation ---------- */
document.querySelectorAll('.topnav button').forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll('.topnav button').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    document.getElementById('view-'+b.dataset.view).classList.add('active');
    if(b.dataset.view==='hist') renderHistory();
    if(b.dataset.view==='mgr') renderManager();
  };
});

/* ---------- Clock ---------- */
function tick(){
  const d=new Date();
  document.getElementById('clock').innerHTML =
    d.toLocaleDateString('en-PH',{weekday:'short',month:'short',day:'numeric'})+'<br>'+
    d.toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
}
setInterval(tick,1000); tick();

/* ---------- Order number ---------- */
function currentOrderNo(){ return DB.get(DB.COUNTER,0)+1; }
function fmtNo(n){ return '#'+String(n).padStart(3,'0'); }

/* ---------- Render menu grid ---------- */
function renderCats(){
  const cats=['All',...Object.keys(CAT_EMOJI)];
  document.getElementById('cats').innerHTML = cats.map(c=>
    `<button class="cat ${c===activeCat?'active':''}" onclick="setCat('${c.replace(/'/g,"\\'")}')">${c==='All'?'⭐ All':CAT_EMOJI[c]+' '+c}</button>`
  ).join('');
}
function setCat(c){ activeCat=c; renderCats(); renderMenu(); }
function renderMenu(){
  const items = menu.filter(m=>activeCat==='All'||m.cat===activeCat);
  document.getElementById('menuGrid').innerHTML = items.map(m=>{
    const thumb = m.img ? `<img src="${m.img}" alt="">` : `<span>${CAT_EMOJI[m.cat]||'🍽'}</span>`;
    const bg = m.img ? '' : `style="background:${CAT_GRAD[m.cat]||'#333'}"`;
    return `<button class="card" onclick="addToCart('${m.id}')">
      <div class="thumb" ${bg}>${thumb}<span class="plus">＋</span></div>
      <div class="body">
        <div class="nm">${m.name}</div>
        ${m.note?`<div class="note">${m.note}</div>`:''}
        <div class="pr">${peso(m.price)}</div>
      </div>
    </button>`;
  }).join('') || `<div class="empty"><div class="big">🍜</div>No items in this category</div>`;
}

/* ---------- Cart ---------- */
function addToCart(id){
  const m = menu.find(x=>x.id===id); if(!m) return;
  const line = cart.find(l=>l.id===id);
  if(line) line.qty++;
  else cart.push({id:m.id,name:m.name,price:m.price,qty:1,note:m.note});
  renderCart(); flash();
}
function changeQty(id,d){
  const line=cart.find(l=>l.id===id); if(!line) return;
  line.qty+=d; if(line.qty<=0) cart=cart.filter(l=>l.id!==id);
  renderCart();
}
function clearCart(){ if(!cart.length) return; cart=[]; document.getElementById('discType').value='none'; onDiscChange(); renderCart(); }
function setType(t){
  orderType=t;
  document.getElementById('btnDine').classList.toggle('active',t==='Dine In');
  document.getElementById('btnTake').classList.toggle('active',t==='Take Out');
}
function calc(){
  const subtotal = cart.reduce((s,l)=>s+l.price*l.qty,0);
  const dt=document.getElementById('discType').value;
  const dv=parseFloat(document.getElementById('discVal').value)||0;
  let discount=0, label='';
  if(dt==='senior'){ discount=subtotal*0.20; label='Senior Citizen 20%'; }
  else if(dt==='pwd'){ discount=subtotal*0.20; label='PWD 20%'; }
  else if(dt==='pct'){ discount=subtotal*(dv/100); label='Discount '+dv+'%'; }
  else if(dt==='amt'){ discount=dv; label='Discount'; }
  discount=Math.min(discount,subtotal);
  return {subtotal, discount, label, total:subtotal-discount};
}
function onDiscChange(){
  const dt=document.getElementById('discType').value;
  const inp=document.getElementById('discVal');
  inp.style.display=(dt==='pct'||dt==='amt')?'block':'none';
  if(dt!=='pct'&&dt!=='amt') inp.value='';
  inp.placeholder = dt==='pct'?'%':'₱';
  renderTotals();
}
function renderCart(){
  const box=document.getElementById('cartItems');
  if(!cart.length){
    box.innerHTML=`<div class="empty"><div class="big">🥢</div><div>No items yet.<br>Tap a dish to start.</div></div>`;
  }else{
    box.innerHTML=cart.map(l=>`
      <div class="line">
        <div class="info"><div class="ln">${l.name}</div><div class="lp">${peso(l.price)} each</div></div>
        <div class="qty">
          <button onclick="changeQty('${l.id}',-1)">−</button>
          <span>${l.qty}</span>
          <button onclick="changeQty('${l.id}',1)">＋</button>
        </div>
        <div class="sub">${peso(l.price*l.qty)}</div>
      </div>`).join('');
  }
  document.getElementById('ordNo').textContent=fmtNo(currentOrderNo());
  renderTotals();
}
function renderTotals(){
  const {subtotal,discount,label,total}=calc();
  let html=`<div class="t"><span>Subtotal (${cart.reduce((s,l)=>s+l.qty,0)} items)</span><span>${peso(subtotal)}</span></div>`;
  if(discount>0) html+=`<div class="t disc"><span>${label}</span><span>−${peso(discount)}</span></div>`;
  html+=`<div class="grand"><span class="lbl">TOTAL</span><span class="amt">${peso(total)}</span></div>`;
  document.getElementById('totals').innerHTML=html;
  const btn=document.getElementById('payBtn');
  btn.disabled=!cart.length;
  btn.textContent='Charge '+peso(total);
  const mb=document.getElementById('mobBadge');
  if(mb){ mb.textContent=cart.reduce((s,l)=>s+l.qty,0)+' · '+peso(total);
    document.getElementById('mobCartBtn').style.display=cart.length?'flex':'none'; }
}
function flash(){
  const mb=document.getElementById('mobCartBtn');
  if(window.innerWidth<=920 && mb){ mb.style.display='flex'; }
}
function openCart(){ document.getElementById('cart').classList.add('open'); }
function closeCart(){ document.getElementById('cart').classList.remove('open'); }

/* ---------- Payment ---------- */
// Variable to store the currently selected payment method
function setPayMethod(method) {
    // 1. Global state tracking (Ensures your receipt records the correct method)
    if (typeof currentPayMethod !== 'undefined') {
        currentPayMethod = method;
    }

    // 2. Highlight the active button layout
    document.querySelectorAll('.pay-methods button').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.pay-methods button[data-m="${method}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // 3. Grab UI elements
    const qrContainer = document.getElementById('qrContainer');
    const qrImage = document.getElementById('qrImage');
    const qrLabel = document.getElementById('qrLabel');
    const cashFld = document.getElementById('cashFld');
    const quickCash = document.getElementById('quickCash');

    // Dictionary to clean up UI display labels neatly
    const paymentNames = {
        'Gcash': 'GCash',
        'Maya': 'Maya',
        'qrph': 'QRph',
        'visa': 'Visa'
    };

    // 4. Interface control switch
    if (paymentNames[method]) {
        // Digital Payment: Show QR block, hide cash tools
        if (qrContainer) qrContainer.style.display = 'block';
        if (cashFld) cashFld.style.display = 'none';
        if (quickCash) quickCash.style.display = 'none';

        // Update display text values and source path dynamically
        if (qrLabel) qrLabel.innerText = `Scan to Pay via ${paymentNames[method]}`;
        if (qrImage) qrImage.src = `qr-${method.toLowerCase()}.png`;

    } else {
        // Cash Payment: Hide QR code view and restore standard numerical keyboard inputs
        if (qrContainer) qrContainer.style.display = 'none';
        if (cashFld) cashFld.style.display = 'block';
        if (quickCash) quickCash.style.display = 'flex';
        
        // Optional Quality-of-Life: Clear old cash inputs when changing methods
        const cashInput = document.getElementById('cashInput');
        if (cashInput && method === 'Cash') cashInput.focus();
    }

    // 5. Run calculations / safety checks
    if (typeof renderPay === 'function') {
        renderPay();
    }
}
function setPayMethod(m){
  payMethod=m;
  document.querySelectorAll('#payMethods button').forEach(b=>b.classList.toggle('active',b.dataset.m===m));
  document.getElementById('cashFld').style.display = m==='Cash'?'block':'none';
  document.getElementById('quickCash').style.display = m==='Cash'?'flex':'none';
  renderPay();
}
function openPay(){
  if(!cart.length) return;
  payMethod='Cash'; setPayMethod('Cash');
  document.getElementById('cashInput').value='';
  document.getElementById('payCashier').value = DB.get(DB.CASHIER,'') || '';
  const {total}=calc();
  const opts=[total, Math.ceil(total/50)*50, Math.ceil(total/100)*100, Math.ceil(total/500)*500, 1000];
  const uniq=[...new Set(opts.filter(v=>v>=total))].slice(0,5);
  document.getElementById('quickCash').innerHTML = uniq.map(v=>`<button onclick="setCash(${v})">${peso(v)}</button>`).join('');
  renderPay();
  document.getElementById('payOverlay').classList.add('show');
}
function setCash(v){ document.getElementById('cashInput').value=v; renderPay(); }
function syncCashier(val){
  DB.set(DB.CASHIER, val);
  document.getElementById('cashierName').value = val;
}
function renderPay(){
  const {subtotal,discount,label,total}=calc();
  const cash=parseFloat(document.getElementById('cashInput').value)||0;
  let html=`<div class="r"><span>Subtotal</span><span>${peso(subtotal)}</span></div>`;
  if(discount>0) html+=`<div class="r" style="color:#3fae6f"><span>${label}</span><span>−${peso(discount)}</span></div>`;
  html+=`<div class="r total"><span>Amount Due</span><span>${peso(total)}</span></div>`;
  if(payMethod==='Cash'){
    const change=cash-total;
    html+=`<div class="r"><span>Cash</span><span>${peso(cash)}</span></div>`;
    html+=`<div class="r change"><span>Change</span><span>${cash>=total?peso(change):'—'}</span></div>`;
  }else{
    html+=`<div class="r"><span>Method</span><span>${payMethod}</span></div>`;
  }
  document.getElementById('paySummary').innerHTML=html;
  const cp=document.getElementById('confirmPay');
  cp.disabled = payMethod==='Cash' && cash<total;
  cp.style.opacity = cp.disabled?'.45':'1';
}
function confirmPayment(){
  const {subtotal,discount,label,total}=calc();
  const cash=parseFloat(document.getElementById('cashInput').value)||0;
  if(payMethod==='Cash' && cash<total){ toast('Insufficient cash'); return; }
  const no=currentOrderNo();
  const order={
    no, ts:Date.now(),
    items:cart.map(l=>({name:l.name,price:l.price,qty:l.qty,note:l.note})),
    subtotal, discount, discLabel:label, total,
    type:orderType, method:payMethod,
    cashier: getCashier(),
    cash: payMethod==='Cash'?cash:total,
    change: payMethod==='Cash'?cash-total:0
  };
  const orders=DB.get(DB.ORDERS,[]); orders.unshift(order); DB.set(DB.ORDERS,orders);
  DB.set(DB.COUNTER,no);
  closeOverlay('payOverlay');
  showReceipt(order,true);
  cart=[]; document.getElementById('discType').value='none'; onDiscChange(); renderCart();
  closeCart();
}

/* ---------- Receipt (shows cashier name) ---------- */
function showReceipt(o, isNew){
  const dt=new Date(o.ts);
  const itemsHtml=o.items.map(i=>`
    <div class="rc-it">
      <div class="l1"><span>${i.qty} × ${i.name}</span><span>${peso(i.price*i.qty)}</span></div>
      <div class="l2">@ ${peso(i.price)}${i.note?' · '+i.note:''}</div>
    </div>`).join('');
  let tot=`<div class="r"><span>Subtotal</span><span>${peso(o.subtotal)}</span></div>`;
  if(o.discount>0) tot+=`<div class="r disc"><span>${o.discLabel}</span><span>−${peso(o.discount)}</span></div>`;
  tot+=`<div class="r grand"><span>TOTAL</span><span>${peso(o.total)}</span></div>`;
  if(o.method==='Cash'){
    tot+=`<div class="r"><span>Cash</span><span>${peso(o.cash)}</span></div>`;
    tot+=`<div class="r"><span>Change</span><span>${peso(o.change)}</span></div>`;
  }else{
    tot+=`<div class="r"><span>Paid via</span><span>${o.method}</span></div>`;
  }
  document.getElementById('receipt').innerHTML=`
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
        <div class="ty">ありがとう · Arigatō!</div>
        This serves as your official order receipt.<br>
        SABASU Noodle Bar · See you again soon 🍜
      </div>
    </div>
    <div class="rc-actions">
      <button class="rc-print" onclick="window.print()">🖨 Print</button>
      <button class="rc-new" onclick="closeOverlay('rcOverlay')">${isNew?'New Order':'Close'}</button>
    </div>`;
  document.getElementById('rcOverlay').classList.add('show');
}

/* ---------- History / Sales ---------- */
function renderHistory(){
  const orders=DB.get(DB.ORDERS,[]);
  const today=new Date().toDateString();
  const todays=orders.filter(o=>new Date(o.ts).toDateString()===today);
  const todaySales=todays.reduce((s,o)=>s+o.total,0);
  const allSales=orders.reduce((s,o)=>s+o.total,0);
  document.getElementById('stats').innerHTML=`
    <div class="stat"><div class="k">Today's Orders</div><div class="v">${todays.length}</div></div>
    <div class="stat"><div class="k">Today's Sales</div><div class="v">${peso(todaySales)}</div></div>
    <div class="stat"><div class="k">Total Orders</div><div class="v">${orders.length}</div></div>
    <div class="stat"><div class="k">Total Sales</div><div class="v">${peso(allSales)}</div></div>`;
  const list=document.getElementById('histList');
  if(!orders.length){ list.innerHTML=`<div class="empty"><div class="big">📊</div>No sales yet. Completed orders will appear here.</div>`; return; }
  list.innerHTML=orders.map(o=>{
    const dt=new Date(o.ts);
    const n=o.items.reduce((s,i)=>s+i.qty,0);
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
function reprint(no){ const o=DB.get(DB.ORDERS,[]).find(x=>x.no===no); if(o) showReceipt(o,false); }
function clearHistory(){
  if(!confirm('Delete ALL sales records? This cannot be undone.')) return;
  DB.set(DB.ORDERS,[]); DB.set(DB.COUNTER,0); renderHistory(); renderCart(); toast('Sales cleared');
}
function exportCSV(){
  const orders=DB.get(DB.ORDERS,[]);
  if(!orders.length){ toast('No sales to export'); return; }
  let rows=[['Order','Date','Time','Cashier','Type','Method','Items','Subtotal','Discount','Total','Cash','Change']];
  orders.slice().reverse().forEach(o=>{
    const dt=new Date(o.ts);
    rows.push([fmtNo(o.no),dt.toLocaleDateString('en-PH'),dt.toLocaleTimeString('en-PH'),o.cashier||'',o.type,o.method,
      o.items.map(i=>i.qty+'x '+i.name).join('; '),o.subtotal,o.discount,o.total,o.cash,o.change]);
  });
  const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='sabasu_sales_'+new Date().toISOString().slice(0,10)+'.csv';
  a.click(); toast('CSV exported');
}

/* ---------- Menu Manager ---------- */
function renderManager(){
  document.getElementById('mgrGrid').innerHTML=menu.map(m=>{
    const thumb=m.img?`<img src="${m.img}">`:`<span>${CAT_EMOJI[m.cat]||'🍽'}</span>`;
    const bg=m.img?'':`style="background:${CAT_GRAD[m.cat]}"`;
    return `<div class="mcard">
      <div class="mthumb" ${bg}>${thumb}</div>
      <div class="mi"><div class="mn">${m.name}</div><div class="mc">${m.cat}${m.note?' · '+m.note:''}</div><div class="mp">${peso(m.price)}</div></div>
      <button class="medit" onclick="openItemEdit('${m.id}')">✎</button>
    </div>`;
  }).join('');
}
function openItemEdit(id){
  editingId=id; pendingImg=null;
  const m = id?menu.find(x=>x.id===id):null;
  document.getElementById('itemTitle').textContent=m?'Edit Item':'Add Item';
  document.getElementById('fName').value=m?m.name:'';
  document.getElementById('fPrice').value=m?m.price:'';
  document.getElementById('fCat').value=m?m.cat:'Ramen & Noodles';
  document.getElementById('fNote').value=m?m.note||'':'';
  pendingImg = m?m.img||null:null;
  updatePrev(m?m.cat:'Ramen & Noodles');
  document.getElementById('fDelete').style.display=m?'block':'none';
  document.getElementById('fImg').value='';
  document.getElementById('itemOverlay').classList.add('show');
}
function updatePrev(cat){
  const p=document.getElementById('fPrev');
  if(pendingImg){ p.innerHTML=`<img src="${pendingImg}">`; document.getElementById('fRemove').style.display='block'; }
  else { p.innerHTML=CAT_EMOJI[cat]||'🍽'; p.style.background=CAT_GRAD[cat]||'#333'; document.getElementById('fRemove').style.display='none'; }
}
function onImgPick(e){
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=ev=>{
    const img=new Image();
    img.onload=()=>{
      const max=600, sc=Math.min(1,max/Math.max(img.width,img.height));
      const c=document.createElement('canvas');
      c.width=img.width*sc; c.height=img.height*sc;
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      pendingImg=c.toDataURL('image/jpeg',0.82);
      updatePrev(document.getElementById('fCat').value);
    };
    img.src=ev.target.result;
  };
  r.readAsDataURL(f);
}
function removeImg(){ pendingImg=null; updatePrev(document.getElementById('fCat').value); }
function saveItem(){
  const name=document.getElementById('fName').value.trim();
  const price=parseFloat(document.getElementById('fPrice').value);
  const cat=document.getElementById('fCat').value;
  const note=document.getElementById('fNote').value.trim();
  if(!name){ toast('Enter an item name'); return; }
  if(isNaN(price)||price<0){ toast('Enter a valid price'); return; }
  if(editingId){
    const m=menu.find(x=>x.id===editingId);
    Object.assign(m,{name,price,cat,note,img:pendingImg||null});
  }else{
    menu.push({id:'x'+Date.now(),name,price,cat,note,img:pendingImg||null});
  }
  DB.set(DB.MENU,menu);
  closeOverlay('itemOverlay'); renderManager(); renderMenu(); toast('Item saved ✓');
}
function deleteItem(){
  if(!editingId) return;
  if(!confirm('Delete this item?')) return;
  menu=menu.filter(x=>x.id!==editingId); DB.set(DB.MENU,menu);
  cart=cart.filter(l=>l.id!==editingId);
  closeOverlay('itemOverlay'); renderManager(); renderMenu(); renderCart(); toast('Item deleted');
}
function resetMenu(){
  if(!confirm('Reset menu to the original SABASU list? Custom items & photos will be removed.')) return;
  menu=DEFAULT_MENU.map(x=>({...x})); DB.set(DB.MENU,menu); renderManager(); renderMenu(); toast('Menu reset');
}

/* ---------- Misc ---------- */
function closeOverlay(id){ document.getElementById(id).classList.remove('show'); }
let toastT;
function toast(msg){
  const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2200);
}
document.querySelectorAll('.overlay').forEach(o=>o.addEventListener('click',e=>{ if(e.target===o) o.classList.remove('show'); }));
document.getElementById('fCat').addEventListener('change',e=>{ if(!pendingImg) updatePrev(e.target.value); });

/* ---------- Init ---------- */
initCashier();
renderCats(); renderMenu(); renderCart(); onDiscChange();

//force to redeploy
