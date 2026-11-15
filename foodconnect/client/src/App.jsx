import {createContext,useContext,useEffect,useState,useCallback} from 'react';
import {BrowserRouter,Routes,Route,Navigate,Link,useNavigate} from 'react-router-dom';
import toast,{Toaster} from 'react-hot-toast';
import {Leaf,Bell,LayoutDashboard,PlusCircle,Utensils,Inbox,ClipboardList,Search,LogOut,HandHeart,MapPin,Clock,Trash2,EyeOff,Eye,Loader2,PackageOpen} from 'lucide-react';

const api=async(path,o={})=>{
  const t=localStorage.getItem('fc_token');
  const r=await fetch('/api'+path,{method:o.method,headers:{'Content-Type':'application/json',...(t&&{Authorization:'Bearer '+t})},body:o.body&&JSON.stringify(o.body)});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d.message||'Something went wrong');
  return d;
};
const Auth=createContext();const useAuth=()=>useContext(Auth);
const fmt=d=>d?new Date(d).toLocaleString([],{dateStyle:'medium',timeStyle:'short'}):'—';
const Spin=()=><div className="flex justify-center p-12"><Loader2 className="animate-spin text-leaf-500"/></div>;
const Empty=({icon:I=PackageOpen,title,text})=><div className="rounded-xl border border-dashed border-leaf-100 bg-leaf-50 p-10 text-center"><I className="mx-auto mb-3 text-leaf-500"/><p className="font-semibold">{title}</p><p className="text-sm text-leaf-700">{text}</p></div>;
const Field=({label,children})=><label className="block text-sm font-medium">{label}<div className="mt-1">{children}</div></label>;
const colors={pending:'bg-peach-100 text-peach-500',approved:'bg-leaf-100 text-leaf-700',ready:'bg-blue-100 text-blue-700',completed:'bg-leaf-600 text-white',rejected:'bg-red-100 text-red-700',cancelled:'bg-gray-100 text-gray-600',available:'bg-leaf-100 text-leaf-700',unavailable:'bg-gray-100 text-gray-600',claimed:'bg-blue-100 text-blue-700'};
const Badge=({s})=><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${colors[s]}`}>{s==='ready'?'ready for pickup':s}</span>;
const Logo=()=><Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-leaf-700"><Leaf className="text-peach-500"/>FoodConnect</Link>;

function Provider({children}){
  const [user,setUser]=useState(null),[ready,setReady]=useState(false);
  useEffect(()=>{localStorage.getItem('fc_token')?api('/auth/me').then(setUser).catch(()=>localStorage.removeItem('fc_token')).finally(()=>setReady(true)):setReady(true)},[]);
  const login=({token,user})=>{localStorage.setItem('fc_token',token);setUser(user)};
  const logout=()=>{localStorage.removeItem('fc_token');setUser(null)};
  return ready?<Auth.Provider value={{user,login,logout}}>{children}</Auth.Provider>:<Spin/>;
}

function Landing(){
  const [st,setSt]=useState(null),{user}=useAuth();
  useEffect(()=>{api('/stats').then(setSt).catch(()=>{})},[]);
  const steps=['Restaurants list their surplus food','NGOs discover available food','NGOs submit food requests','Restaurants approve requests','Food is collected and distributed'];
  return <div>
    <nav className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-leaf-100 bg-white/90 px-6 py-3 backdrop-blur">
      <Logo/>
      <div className="flex items-center gap-5 text-sm font-medium">
        {[['Home','#top'],['About Us','#about'],['How It Works','#how'],['Contact','#contact']].map(([n,h])=><a key={n} href={h} className="hidden hover:text-leaf-600 sm:block">{n}</a>)}
        {user?<Link className="btn" to="/dashboard">Dashboard</Link>:<><Link to="/login" className="hover:text-leaf-600">Login</Link><Link to="/register" className="btn">Register</Link></>}
      </div>
    </nav>
    <header id="top" className="bg-peach-50 px-6 py-20 text-center md:py-28">
      <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">Don't Waste Food. Share Hope.</h1>
      <p className="mx-auto mt-5 max-w-xl text-lg text-leaf-700">Connecting restaurants with NGOs to ensure surplus food reaches people who need it.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/register?role=restaurant" className="btn px-6 py-3"><Utensils size={18}/>Donate Food</Link>
        <Link to="/register?role=ngo" className="btn2 px-6 py-3"><HandHeart size={18}/>Request Food</Link>
      </div>
    </header>
    <section id="how" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="mb-8 text-2xl font-extrabold">How it works</h2>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((t,i)=><li key={t} className="rounded-xl border border-leaf-100 p-4"><span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-leaf-600 text-sm font-bold text-white">{i+1}</span><p className="text-sm font-medium">{t}</p></li>)}
      </ol>
    </section>
    <section id="about" className="bg-leaf-50 px-6 py-16"><div className="mx-auto max-w-3xl">
      <h2 className="mb-4 text-2xl font-extrabold">About FoodConnect</h2>
      <p className="leading-relaxed text-leaf-700">Every day, good food is thrown away while people nearby go hungry. FoodConnect gives restaurants a fast way to list what they can't serve, and gives NGOs a live view of what is available close to them, so meals get eaten instead of binned.</p>
    </div></section>
    <section className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="mb-8 text-2xl font-extrabold">Our impact so far</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[['Food donations','donations'],['NGOs connected','ngos'],['Restaurants connected','restaurants'],['Successful pickups','pickups']].map(([l,k])=>
          <div key={k} className="rounded-xl border border-leaf-100 p-5"><p className="text-3xl font-extrabold text-leaf-600">{st?st[k]:'…'}</p><p className="text-sm text-leaf-700">{l}</p></div>)}
      </div>
    </section>
    <footer id="contact" className="bg-leaf-900 px-6 py-10 text-sm text-leaf-100"><div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-6">
      <div><p className="font-bold text-white">FoodConnect</p><p>Connecting Food with People in Need</p></div>
      <div className="flex gap-5"><a href="#about">About</a><a href="#contact">Contact</a><a href="#top">Privacy Policy</a><a href="#top">Terms</a></div>
      <div className="flex gap-5"><a href="#top">Facebook</a><a href="#top">Instagram</a><a href="#top">X</a></div>
    </div></footer>
  </div>;
}

function AuthPage({mode}){
  const {login}=useAuth(),nav=useNavigate(),reg=mode==='register';
  const [f,setF]=useState({name:'',organizationName:'',email:'',phone:'',password:'',confirm:'',address:'',city:'',role:new URLSearchParams(location.search).get('role')||'restaurant'});
  const [busy,setBusy]=useState(false);
  const set=k=>e=>setF({...f,[k]:e.target.value});
  const submit=async e=>{
    e.preventDefault();
    if(reg&&f.password!==f.confirm)return toast.error('Passwords do not match');
    setBusy(true);
    try{login(await api('/auth/'+mode,{method:'POST',body:f}));toast.success(reg?'Account created':'Welcome back');nav('/dashboard')}
    catch(er){toast.error(er.message)}finally{setBusy(false)}
  };
  const I=(k,label,type='text')=><Field label={label}><input className="inp" type={type} required value={f[k]} onChange={set(k)}/></Field>;
  return <div className="flex min-h-screen items-center justify-center bg-peach-50 p-4">
    <form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-8 shadow-lg">
      <Logo/><h1 className="text-2xl font-extrabold">{reg?'Create your account':'Log in'}</h1>
      {reg&&<div className="grid grid-cols-2 gap-2">{['restaurant','ngo'].map(r=><button type="button" key={r} onClick={()=>setF({...f,role:r})} className={`rounded-lg border p-3 text-sm font-semibold ${f.role===r?'border-leaf-600 bg-leaf-50 text-leaf-700':'border-leaf-100'}`}>{r==='ngo'?'NGO':'Restaurant'}</button>)}</div>}
      {reg&&<div className="grid gap-4 sm:grid-cols-2">{I('name','Full name')}{I('organizationName',f.role==='ngo'?'NGO name':'Restaurant name')}</div>}
      {I('email','Email address','email')}
      {reg&&I('phone','Phone number','tel')}
      <div className={reg?'grid gap-4 sm:grid-cols-2':''}>{I('password','Password','password')}{reg&&I('confirm','Confirm password','password')}</div>
      {reg&&<div className="grid gap-4 sm:grid-cols-2">{I('address','Address')}{I('city','City')}</div>}
      <button className="btn w-full" disabled={busy}>{busy&&<Loader2 size={16} className="animate-spin"/>}{reg?'Create account':'Log in'}</button>
      <p className="text-center text-sm">{reg?<>Already registered? <Link className="font-semibold text-leaf-600" to="/login">Log in</Link></>:<>New here? <Link className="font-semibold text-leaf-600" to="/register">Create an account</Link></>}</p>
    </form></div>;
}

function Bell_(){
  const [n,setN]=useState([]),[open,setOpen]=useState(false);
  const load=useCallback(()=>api('/notifications').then(setN).catch(()=>{}),[]);
  useEffect(()=>{load();const t=setInterval(load,15000);return()=>clearInterval(t)},[load]);
  const unread=n.filter(x=>!x.isRead).length;
  return <div className="relative">
    <button onClick={()=>{setOpen(!open);if(!open&&unread)api('/notifications/read',{method:'PATCH'}).then(()=>setTimeout(load,1500))}} className="relative rounded-lg p-2 hover:bg-leaf-50" aria-label="Notifications">
      <Bell size={20}/>{unread>0&&<span className="absolute -right-0.5 -top-0.5 rounded-full bg-peach-500 px-1.5 text-xs font-bold text-white">{unread}</span>}
    </button>
    {open&&<div className="absolute right-0 z-20 mt-2 max-h-96 w-80 overflow-auto rounded-xl border border-leaf-100 bg-white p-2 shadow-xl">
      {n.length?n.map(x=><div key={x._id} className={`rounded-lg p-3 text-sm ${x.isRead?'':'bg-leaf-50'}`}><p className="font-semibold">{x.title}</p><p>{x.message}</p><p className="text-xs text-leaf-700">{fmt(x.createdAt)}</p></div>):<p className="p-4 text-sm">No notifications yet.</p>}
    </div>}
  </div>;
}

function Shell({tabs,tab,setTab,children}){
  const {user,logout}=useAuth();
  return <div className="flex min-h-screen flex-col md:flex-row">
    <aside className="flex gap-1 border-b border-leaf-100 bg-leaf-50 p-3 md:w-60 md:flex-col md:border-b-0 md:border-r">
      <div className="hidden px-2 pb-4 md:block"><Logo/></div>
      {tabs.map(([k,l,I])=><button key={k} onClick={()=>setTab(k)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${tab===k?'bg-leaf-600 text-white':'hover:bg-leaf-100'}`}><I size={18}/><span className="hidden sm:inline">{l}</span></button>)}
    </aside>
    <main className="flex-1 p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between"><div><p className="font-extrabold">{user.organizationName}</p><p className="text-sm capitalize text-leaf-700">{user.role} account</p></div>
        <div className="flex items-center gap-2"><Bell_/><button className="btn2" onClick={logout}><LogOut size={16}/>Log out</button></div></div>
      {children}
    </main></div>;
}
const Stat=({l,v})=><div className="rounded-xl border border-leaf-100 p-4"><p className="text-2xl font-extrabold text-leaf-600">{v}</p><p className="text-sm text-leaf-700">{l}</p></div>;
const useData=path=>{const [d,setD]=useState(null),load=useCallback(()=>api(path).then(setD).catch(e=>{toast.error(e.message);setD([])}),[path]);useEffect(()=>{load()},[load]);return [d,load]};
const act=async(fn,ok,reload)=>{try{await fn();toast.success(ok);reload()}catch(e){toast.error(e.message)}};

function AddFood({onDone}){
  const [f,setF]=useState({foodName:'',category:'Veg',quantity:'',unit:'plates',description:'',preparationDate:'',expiryDate:'',pickupAddress:'',pickupTime:'',instructions:''});
  const set=k=>e=>setF({...f,[k]:e.target.value});
  const submit=async e=>{e.preventDefault();try{await api('/listings',{method:'POST',body:f});toast.success('Donation published');onDone()}catch(er){toast.error(er.message)}};
  const I=(k,l,t='text',req=true)=><Field label={l}><input className="inp" type={t} required={req} value={f[k]} onChange={set(k)}/></Field>;
  return <form onSubmit={submit} className="grid max-w-3xl gap-4 sm:grid-cols-2">
    {I('foodName','Food name')}
    <Field label="Category"><select className="inp" value={f.category} onChange={set('category')}>{['Veg','Non-Veg','Bakery','Fruits','Dairy','Other'].map(c=><option key={c}>{c}</option>)}</select></Field>
    {I('quantity','Quantity','number')}
    <Field label="Unit"><select className="inp" value={f.unit} onChange={set('unit')}>{['plates','kg','packets','boxes','liters'].map(c=><option key={c}>{c}</option>)}</select></Field>
    {I('preparationDate','Prepared at','datetime-local',false)}{I('expiryDate','Expires at','datetime-local')}
    {I('pickupAddress','Pickup address')}{I('pickupTime','Available pickup time (e.g. 8–10 pm)')}
    <div className="sm:col-span-2"><Field label="Description"><textarea className="inp" rows={2} value={f.description} onChange={set('description')}/></Field></div>
    <div className="sm:col-span-2"><Field label="Special instructions"><textarea className="inp" rows={2} value={f.instructions} onChange={set('instructions')}/></Field></div>
    <button className="btn sm:col-span-2">Publish Food Donation</button></form>;
}

function Restaurant(){
  const [tab,setTab]=useState('overview'),[ls,loadL]=useData('/listings/mine'),[rs,loadR]=useData('/requests/mine');
  const tabs=[['overview','Overview',LayoutDashboard],['add','Add surplus food',PlusCircle],['listings','My listings',Utensils],['requests','NGO requests',Inbox]];
  const reload=()=>{loadL();loadR()},setStatus=(id,status,ok)=>act(()=>api(`/requests/${id}/status`,{method:'PATCH',body:{status}}),ok,reload);
  const cnt=s=>rs?.filter(r=>r.status===s).length;
  const next={pending:[['approved','Approve'],['rejected','Reject']],approved:[['ready','Mark ready']],ready:[['completed','Mark handed over']]};
  return <Shell tabs={tabs} tab={tab} setTab={setTab}>
    {(!ls||!rs)?<Spin/>:tab==='overview'?<div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5"><Stat l="Total listings" v={ls.length}/><Stat l="Available" v={ls.filter(l=>l.status==='available').length}/><Stat l="Pending requests" v={cnt('pending')}/><Stat l="Approved" v={cnt('approved')+cnt('ready')}/><Stat l="Completed" v={cnt('completed')}/></div>
      <div><h2 className="mb-3 font-bold">Request status breakdown</h2>
        {rs.length?<div className="space-y-2">{['pending','approved','ready','completed','rejected','cancelled'].map(s=><div key={s} className="flex items-center gap-3 text-sm"><span className="w-24 capitalize">{s}</span><div className="h-3 flex-1 rounded bg-leaf-50"><div className="h-3 rounded bg-leaf-500 transition-all" style={{width:`${cnt(s)/rs.length*100}%`}}/></div><span>{cnt(s)}</span></div>)}</div>
        :<Empty icon={ClipboardList} title="No requests yet" text="Publish your first donation and NGOs nearby will see it."/>}</div>
    </div>
    :tab==='add'?<AddFood onDone={()=>{reload();setTab('listings')}}/>
    :tab==='listings'?(ls.length?<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{ls.map(l=><div key={l._id} className="space-y-2 rounded-xl border border-leaf-100 p-4">
        <div className="flex justify-between"><h3 className="font-bold">{l.foodName}</h3><Badge s={l.status}/></div>
        <p className="text-sm">{l.quantity} {l.unit} · {l.category}</p><p className="text-sm text-leaf-700">Expires {fmt(l.expiryDate)}</p><p className="text-sm font-semibold text-peach-500">{l.requestCount} pending request(s)</p>
        <div className="flex gap-2"><button className="btn2" onClick={()=>act(()=>api('/listings/'+l._id,{method:'PUT',body:{...l,status:l.status==='available'?'unavailable':'available'}}),'Listing updated',reload)}>{l.status==='available'?<><EyeOff size={14}/>Mark unavailable</>:<><Eye size={14}/>Make available</>}</button>
        <button className="btn2 text-red-600" onClick={()=>confirm(`Delete "${l.foodName}"? Pending requests will be cancelled.`)&&act(()=>api('/listings/'+l._id,{method:'DELETE'}),'Listing deleted',reload)}><Trash2 size={14}/>Delete</button></div></div>)}</div>
      :<Empty icon={Utensils} title="No listings yet" text="Use “Add surplus food” to publish your first donation."/>)
    :(rs.length?<div className="overflow-x-auto rounded-xl border border-leaf-100"><table className="w-full text-left text-sm"><thead className="bg-leaf-50"><tr>{['NGO','Food','Qty','People','Pickup','Contact','Status','Actions'].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead>
      <tbody>{rs.map(r=><tr key={r._id} className="border-t border-leaf-100"><td className="p-3 font-semibold">{r.ngoId?.organizationName}</td><td className="p-3">{r.foodListingId?.foodName}</td><td className="p-3">{r.requestedQuantity}</td><td className="p-3">{r.beneficiaries}</td><td className="p-3">{fmt(r.pickupDate)}</td><td className="p-3">{r.contactPerson}<br/>{r.contactNumber}</td><td className="p-3"><Badge s={r.status}/></td>
        <td className="p-3"><div className="flex flex-wrap gap-1">{(next[r.status]||[]).map(([s,l])=><button key={s} className="btn2" onClick={()=>setStatus(r._id,s,'Request '+s)}>{l}</button>)}</div></td></tr>)}</tbody></table></div>
      :<Empty icon={Inbox} title="No NGO requests yet" text="Requests appear here as soon as an NGO asks for your food."/>)}
  </Shell>;
}

function Ngo(){
  const [tab,setTab]=useState('browse'),[rs,loadR]=useData('/requests/mine'),[q,setQ]=useState({q:'',category:'',city:''}),[modal,setModal]=useState(null);
  const qs='/listings?'+new URLSearchParams(Object.entries(q).filter(([,v])=>v)),[ls,loadL]=useData(qs);
  const tabs=[['browse','Browse food',Search],['mine','My requests',ClipboardList]];
  const cnt=s=>rs?.filter(r=>r.status===s).length;
  return <Shell tabs={tabs} tab={tab} setTab={setTab}>
    {!rs?<Spin/>:<>
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5"><Stat l="Available food" v={ls?.length??'…'}/><Stat l="Requests sent" v={rs.length}/><Stat l="Pending" v={cnt('pending')}/><Stat l="Approved" v={cnt('approved')+cnt('ready')}/><Stat l="Collected" v={cnt('completed')}/></div>
    {tab==='browse'?<>
      <div className="mb-4 grid gap-3 sm:grid-cols-3"><input className="inp" placeholder="Search by food name" value={q.q} onChange={e=>setQ({...q,q:e.target.value})}/>
        <select className="inp" value={q.category} onChange={e=>setQ({...q,category:e.target.value})}><option value="">All categories</option>{['Veg','Non-Veg','Bakery','Fruits','Dairy','Other'].map(c=><option key={c}>{c}</option>)}</select>
        <input className="inp" placeholder="Filter by city" value={q.city} onChange={e=>setQ({...q,city:e.target.value})}/></div>
      {!ls?<Spin/>:ls.length?<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{ls.map(l=><div key={l._id} className="space-y-2 rounded-xl border border-leaf-100 p-4 transition hover:shadow-md">
        <div className="flex justify-between"><h3 className="font-bold">{l.foodName}</h3><span className="rounded-full bg-peach-100 px-2 text-xs font-semibold text-peach-500">{l.category}</span></div>
        <p className="text-sm font-semibold text-leaf-700">{l.restaurantId?.organizationName}</p><p className="text-sm">{l.description}</p>
        <p className="text-sm"><b>{l.quantity} {l.unit}</b> available</p>
        <p className="flex gap-1 text-xs text-leaf-700"><Clock size={14}/>Prepared {fmt(l.preparationDate)} · Expires {fmt(l.expiryDate)}</p>
        <p className="flex gap-1 text-xs text-leaf-700"><MapPin size={14}/>{l.pickupAddress} · {l.pickupTime}</p>
        <button className="btn w-full" onClick={()=>setModal(l)}>Request Food</button></div>)}</div>
      :<Empty icon={Search} title="No food available right now" text="Try clearing filters, or check back soon. Restaurants publish new donations throughout the day."/>}
    </>:(rs.length?<div className="space-y-3">{rs.map(r=><div key={r._id} className="rounded-xl border border-leaf-100 p-4"><div className="flex flex-wrap items-center justify-between gap-2">
        <div><p className="font-bold">{r.foodListingId?.foodName} · {r.requestedQuantity} {r.foodListingId?.unit}</p><p className="text-sm text-leaf-700">{r.restaurantId?.organizationName} · pickup {fmt(r.pickupDate)}</p></div>
        <div className="flex items-center gap-2"><Badge s={r.status}/>{r.status==='pending'&&<button className="btn2" onClick={()=>confirm('Cancel this request?')&&act(()=>api(`/requests/${r._id}/status`,{method:'PATCH',body:{status:'cancelled'}}),'Request cancelled',loadR)}>Cancel</button>}</div></div>
        {['approved','ready','completed'].includes(r.status)&&<p className="mt-2 rounded-lg bg-leaf-50 p-3 text-sm">Collect from {r.foodListingId?.pickupAddress} ({r.foodListingId?.pickupTime}). Contact: {r.restaurantId?.phone} · {r.restaurantId?.email}</p>}</div>)}</div>
      :<Empty icon={ClipboardList} title="You haven't requested any food yet" text="Browse available food and send your first request."/>)}
    </>}
    {modal&&<RequestModal l={modal} onClose={()=>setModal(null)} onDone={()=>{setModal(null);loadR();loadL();setTab('mine')}}/>}
  </Shell>;
}

function RequestModal({l,onClose,onDone}){
  const [f,setF]=useState({requestedQuantity:'',beneficiaries:'',pickupDate:'',contactPerson:'',contactNumber:'',message:''}),set=k=>e=>setF({...f,[k]:e.target.value});
  const submit=async e=>{e.preventDefault();try{await api('/requests',{method:'POST',body:{...f,foodListingId:l._id}});toast.success('Request sent. Status: Pending');onDone()}catch(er){toast.error(er.message)}};
  const I=(k,label,t='text',req=true)=><Field label={label}><input className="inp" type={t} required={req} value={f[k]} onChange={set(k)} max={k==='requestedQuantity'?l.quantity:undefined}/></Field>;
  return <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
    <form onClick={e=>e.stopPropagation()} onSubmit={submit} className="w-full max-w-md space-y-3 rounded-2xl bg-white p-6">
      <h2 className="text-lg font-extrabold">Request {l.foodName}</h2>
      {I('requestedQuantity',`Quantity (max ${l.quantity} ${l.unit})`,'number')}{I('beneficiaries','Number of beneficiaries','number')}{I('pickupDate','Pickup date and time','datetime-local')}{I('contactPerson','Contact person')}{I('contactNumber','Contact number','tel')}
      <Field label="Additional message"><textarea className="inp" rows={2} value={f.message} onChange={set('message')}/></Field>
      <div className="flex gap-2"><button className="btn flex-1">Send request</button><button type="button" className="btn2" onClick={onClose}>Close</button></div></form></div>;
}

const Guard=()=>{const {user}=useAuth();return !user?<Navigate to="/login" replace/>:user.role==='restaurant'?<Restaurant/>:user.role==='ngo'?<Ngo/>:<p className="p-8">Admin panel is not included in this build.</p>};
const Guest=({mode})=>{const {user}=useAuth();return user?<Navigate to="/dashboard" replace/>:<AuthPage mode={mode}/>};

export default function App(){
  return <BrowserRouter><Provider><Toaster position="top-right"/>
    <Routes><Route path="/" element={<Landing/>}/><Route path="/login" element={<Guest mode="login"/>}/><Route path="/register" element={<Guest mode="register"/>}/><Route path="/dashboard" element={<Guard/>}/><Route path="*" element={<Navigate to="/"/>}/></Routes>
  </Provider></BrowserRouter>;
}
