import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const cfg=window.RIFA_CONFIG;
const $=id=>document.getElementById(id);
if(!cfg?.supabaseUrl||!cfg?.supabaseKey){$('setup').classList.remove('hidden');throw Error('Missing config');}
const db=createClient(cfg.supabaseUrl,cfg.supabaseKey);
const admin=location.pathname.replace(/\/$/,'')==='/admin';
$('public').classList.toggle('hidden',admin);$('admin').classList.toggle('hidden',!admin);
let numbers=[],sales=[],selected=null,authorized=false;
function money(n){return '$'+n.toLocaleString('es-CO')}
function msg(text){$('status').textContent=text}
async function refresh(){
 const {data,error}=await db.from('raffle_numbers').select('number,occupied').order('number');
 if(error){msg('No se pudieron cargar los números. Intenta actualizar la página.');return;}
 numbers=data||[];const used=numbers.filter(n=>n.occupied).length;
 $('free').textContent=100-used;$('used').textContent=used;
 const grid=$('publicGrid');grid.replaceChildren();
 for(const n of numbers){const e=document.createElement('button');e.className='num'+(n.occupied?' used':'');e.textContent=String(n.number).padStart(2,'0');e.title=n.occupied?'Ocupado':'Disponible';e.disabled=true;grid.append(e)}
 msg('Última actualización: '+new Date().toLocaleTimeString('es-CO'));
 if(admin&&authorized)await refreshAdmin();
}
async function refreshAdmin(){
 const {data,error}=await db.from('raffle_sales').select('number,buyer_name,buyer_phone,paid').order('number');
 if(error){$('loginMsg').textContent='No tienes permiso de administración. Contacta al propietario.';return;}
 sales=data||[];const saleMap=new Map(sales.map(s=>[s.number,s]));
 const paid=sales.filter(s=>s.paid).length,pending=sales.length-paid;
 $('admFree').textContent=100-sales.length;$('admPending').textContent=pending;$('admPaid').textContent=paid;
 $('collected').textContent=money(paid*20000);$('pending').textContent=money(pending*20000);
 $('adminGrid').replaceChildren();
 for(let i=0;i<100;i++){const e=document.createElement('button');e.className='num adminnum'+(saleMap.has(i)?' used':'')+(selected===i?' selected':'');e.textContent=String(i).padStart(2,'0');e.onclick=()=>edit(i);$('adminGrid').append(e)}
 $('buyers').replaceChildren();
 for(const sale of sales){let row=document.createElement('tr');for(const v of [String(sale.number).padStart(2,'0'),sale.buyer_name,sale.buyer_phone||'—',sale.paid?'Pagado':'Pendiente']){const cell=document.createElement('td');cell.textContent=v;row.append(cell)}$('buyers').append(row)}
}
function edit(n){selected=n;const s=sales.find(x=>x.number===n);$('editPanel').classList.remove('hidden');$('ticketTitle').textContent='Boleta '+String(n).padStart(2,'0');$('buyer').value=s?.buyer_name||'';$('phone').value=s?.buyer_phone||'';$('paid').checked=!!s?.paid;$('release').classList.toggle('hidden',!s);$('saveMsg').textContent='';refreshAdmin();$('editPanel').scrollIntoView({behavior:'smooth',block:'nearest'})}
$('cancel').onclick=()=>{$('editPanel').classList.add('hidden');selected=null;refreshAdmin()};
$('ticketForm').onsubmit=async e=>{e.preventDefault();if(selected===null)return;$('saveMsg').textContent='Guardando…';const payload={number:selected,buyer_name:$('buyer').value.trim(),buyer_phone:$('phone').value.trim()||null,paid:$('paid').checked};const {error}=await db.from('raffle_sales').upsert(payload,{onConflict:'number'});if(error){$('saveMsg').textContent='Error al guardar: '+error.message;return;}$('editPanel').classList.add('hidden');selected=null;await refresh();};
$('release').onclick=async()=>{if(selected===null||!confirm('¿Liberar este número?'))return;const {error}=await db.from('raffle_sales').delete().eq('number',selected);if(error){$('saveMsg').textContent=error.message;return;}$('editPanel').classList.add('hidden');selected=null;await refresh()};
async function checkLogin(){const {data}=await db.auth.getUser();if(!data?.user){authorized=false;$('loginPanel').classList.remove('hidden');$('dashboard').classList.add('hidden');return;}
 const {data:allow,error}=await db.from('raffle_admins').select('user_id').eq('user_id',data.user.id).maybeSingle();
 authorized=!error&&!!allow;$('loginPanel').classList.toggle('hidden',authorized);$('dashboard').classList.toggle('hidden',!authorized);if(!authorized){$('loginMsg').textContent='Esta cuenta todavía no ha sido autorizada para administrar la rifa.';return}await refresh()}
$('login').onclick=async()=>{const email=$('email').value.trim(),password=$('pass').value;$('loginMsg').textContent='Ingresando…';const {error}=await db.auth.signInWithPassword({email,password});$('pass').value='';if(error){$('loginMsg').textContent='No se pudo iniciar sesión. Revisa tus credenciales.';return}await checkLogin()};
$('logout').onclick=async()=>{await db.auth.signOut();authorized=false;await checkLogin()};
if(admin){const label=document.createElement('label');label.htmlFor='email';label.textContent='Correo de administración';const inp=document.createElement('input');inp.id='email';inp.type='email';inp.autocomplete='username';inp.required=true;$('pass').before(label,inp);checkLogin()}
refresh();setInterval(refresh,20000);
