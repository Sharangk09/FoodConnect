require('dotenv').config();
const express=require('express'),mongoose=require('mongoose'),bcrypt=require('bcrypt'),jwt=require('jsonwebtoken'),helmet=require('helmet'),cors=require('cors'),rate=require('express-rate-limit');
const {User,Listing,Request,Notif}=require('./models');
if(!process.env.JWT_SECRET||!process.env.MONGO_URI){console.error('Set MONGO_URI and JWT_SECRET in .env');process.exit(1)}
const app=express();app.use(helmet(),cors({origin:process.env.CLIENT_ORIGIN}),express.json({limit:'100kb'}),rate({windowMs:15*60e3,limit:600}));
const authLimit=rate({windowMs:15*60e3,limit:30});
const bad=(s,m,c=400)=>s.status(c).json({message:m}),wrap=f=>(q,s)=>f(q,s).catch(e=>{console.error(e);bad(s,'Server error',500)});
const auth=(q,s,n)=>{try{q.user=jwt.verify((q.headers.authorization||'').slice(7),process.env.JWT_SECRET);n()}catch{bad(s,'Please log in again',401)}};
const only=role=>(q,s,n)=>q.user.role===role?n():bad(s,'Not allowed for your account type',403);
const notify=(recipientId,title,message,type)=>Notif.create({recipientId,title,message,type});
const sign=u=>jwt.sign({id:u.id,role:u.role},process.env.JWT_SECRET,{expiresIn:'7d'});
const pub=u=>{const o=u.toObject();delete o.password;return o};
const A=express.Router();
A.post('/auth/register',authLimit,wrap(async(q,s)=>{
 const b=q.body,need=['name','organizationName','email','phone','password','address','city'];
 for(const k of need)if(!String(b[k]||'').trim())return bad(s,`${k} is required`);
 if(!/^\S+@\S+\.\S+$/.test(b.email))return bad(s,'Enter a valid email');
 if(b.password.length<8)return bad(s,'Password must be at least 8 characters');
 if(!['restaurant','ngo'].includes(b.role))return bad(s,'Choose Restaurant or NGO');
 if(await User.findOne({email:b.email.toLowerCase()}))return bad(s,'An account with this email already exists',409);
 const u=await User.create({...Object.fromEntries(need.filter(k=>k!=='password').map(k=>[k,b[k].trim()])),role:b.role,password:await bcrypt.hash(b.password,12)});
 s.status(201).json({token:sign(u),user:pub(u)})}));
A.post('/auth/login',authLimit,wrap(async(q,s)=>{
 const u=await User.findOne({email:String(q.body.email||'').toLowerCase()});
 if(!u||!(await bcrypt.compare(String(q.body.password||''),u.password)))return bad(s,'Incorrect email or password',401);
 s.json({token:sign(u),user:pub(u)})}));
A.get('/auth/me',auth,wrap(async(q,s)=>{const u=await User.findById(q.user.id);u?s.json(pub(u)):bad(s,'Account not found',401)}));
A.get('/stats',wrap(async(q,s)=>s.json({donations:await Listing.countDocuments(),ngos:await User.countDocuments({role:'ngo'}),restaurants:await User.countDocuments({role:'restaurant'}),pickups:await Request.countDocuments({status:'completed'})})));
const val=b=>{const e=[];if(!b.foodName?.trim())e.push('Food name is required');if(!(+b.quantity>0))e.push('Quantity must be greater than 0');
 if(!b.expiryDate||new Date(b.expiryDate)<=new Date())e.push('Expiry must be in the future');
 if(b.preparationDate&&new Date(b.preparationDate)>new Date(b.expiryDate))e.push('Preparation time must be before expiry');return e[0]};
const F=['foodName','category','quantity','unit','description','preparationDate','expiryDate','pickupAddress','pickupTime','instructions','image'];
const pick=b=>Object.fromEntries(F.filter(k=>b[k]!==undefined).map(k=>[k,b[k]]));
A.get('/listings',auth,only('ngo'),wrap(async(q,s)=>{
 const f={status:'available',quantity:{$gt:0},expiryDate:{$gt:new Date()}},{q:t,category,city}=q.query;
 if(t)f.foodName=new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');if(category)f.category=category;
 let l=await Listing.find(f).sort('-createdAt').populate('restaurantId','organizationName city');
 if(city)l=l.filter(x=>x.restaurantId?.city?.toLowerCase().includes(city.toLowerCase()));s.json(l)}));
A.get('/listings/mine',auth,only('restaurant'),wrap(async(q,s)=>{
 const l=await Listing.find({restaurantId:q.user.id}).sort('-createdAt').lean();
 for(const x of l)x.requestCount=await Request.countDocuments({foodListingId:x._id,status:'pending'});s.json(l)}));
A.post('/listings',auth,only('restaurant'),wrap(async(q,s)=>{const e=val(q.body);if(e)return bad(s,e);s.status(201).json(await Listing.create({...pick(q.body),restaurantId:q.user.id}))}));
A.put('/listings/:id',auth,only('restaurant'),wrap(async(q,s)=>{
 const l=await Listing.findOne({_id:q.params.id,restaurantId:q.user.id});if(!l)return bad(s,'Listing not found',404);
 Object.assign(l,pick(q.body));if(['available','unavailable'].includes(q.body.status))l.status=q.body.status;
 const e=val(l);if(e)return bad(s,e);s.json(await l.save())}));
A.delete('/listings/:id',auth,only('restaurant'),wrap(async(q,s)=>{
 const l=await Listing.findOneAndDelete({_id:q.params.id,restaurantId:q.user.id});if(!l)return bad(s,'Listing not found',404);
 await Request.updateMany({foodListingId:l._id,status:'pending'},{status:'cancelled'});s.json({ok:true})}));
A.post('/requests',auth,only('ngo'),wrap(async(q,s)=>{
 const b=q.body,l=await Listing.findById(b.foodListingId);
 if(!l||l.status!=='available'||l.expiryDate<=new Date()||l.quantity<=0)return bad(s,'This food is no longer available');
 if(!(+b.requestedQuantity>0)||+b.requestedQuantity>l.quantity)return bad(s,`Quantity must be between 1 and ${l.quantity}`);
 if(!(+b.beneficiaries>=1))return bad(s,'Enter the number of beneficiaries');
 if(!b.pickupDate||new Date(b.pickupDate)<=new Date()||new Date(b.pickupDate)>l.expiryDate)return bad(s,'Pickup must be in the future and before the food expires');
 if(!b.contactPerson?.trim()||!b.contactNumber?.trim())return bad(s,'Contact person and number are required');
 const r=await Request.create({...Object.fromEntries(['requestedQuantity','beneficiaries','pickupDate','contactPerson','contactNumber','message'].map(k=>[k,b[k]])),ngoId:q.user.id,restaurantId:l.restaurantId,foodListingId:l._id});
 const n=await User.findById(q.user.id);await notify(l.restaurantId,'New food request',`${n.organizationName} requested ${b.requestedQuantity} ${l.unit||''} of ${l.foodName}`,'request');s.status(201).json(r)}));
A.get('/requests/mine',auth,wrap(async(q,s)=>{
 const ngo=q.user.role==='ngo',r=await Request.find(ngo?{ngoId:q.user.id}:{restaurantId:q.user.id}).sort('-createdAt')
  .populate('foodListingId','foodName unit pickupAddress pickupTime').populate('ngoId','organizationName phone email').populate('restaurantId','organizationName phone email address').lean();
 r.forEach(x=>{if(ngo&&!['approved','ready','completed'].includes(x.status))x.restaurantId={organizationName:x.restaurantId.organizationName}});s.json(r)}));
A.patch('/requests/:id/status',auth,wrap(async(q,s)=>{
 const rq=await Request.findById(q.params.id).populate('foodListingId');if(!rq)return bad(s,'Request not found',404);
 const next=q.body.status,flow={pending:['approved','rejected'],approved:['ready'],ready:['completed']},{id,role}=q.user;
 const ok=role==='ngo'?String(rq.ngoId)===id&&rq.status==='pending'&&next==='cancelled':role==='restaurant'?String(rq.restaurantId)===id&&(flow[rq.status]||[]).includes(next):false;
 if(!ok)return bad(s,'That status change is not allowed',403);
 if(next==='approved'){const l=rq.foodListingId;if(!l||l.status!=='available'||l.expiryDate<=new Date()||l.quantity<rq.requestedQuantity)return bad(s,'Listing no longer has enough available food');
  l.quantity-=rq.requestedQuantity;if(l.quantity<=0)l.status='claimed';await l.save()}
 rq.status=next;await rq.save();
 const food=rq.foodListingId?.foodName||'food',msg={approved:`Your request for ${food} was approved`,rejected:`Your request for ${food} was rejected`,ready:`${food} is ready for pickup`,completed:`Donation of ${food} marked as completed`};
 if(role==='restaurant')await notify(rq.ngoId,'Request '+next,msg[next],next);else await notify(rq.restaurantId,'Request cancelled',`An NGO cancelled its request for ${food}`,'cancelled');
 s.json(rq)}));
A.get('/notifications',auth,wrap(async(q,s)=>s.json(await Notif.find({recipientId:q.user.id}).sort('-createdAt').limit(30))));
A.patch('/notifications/read',auth,wrap(async(q,s)=>{await Notif.updateMany({recipientId:q.user.id,isRead:false},{isRead:true});s.json({ok:true})}));
app.use('/api',A);
mongoose.connect(process.env.MONGO_URI).then(()=>app.listen(process.env.PORT||5000,()=>console.log('API running'))).catch(e=>{console.error(e.message);process.exit(1)});
