import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase.js";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CATEGORIES = ["Todos","Bloques","Acero","Madera","Techos","Plomería","Cemento","Pintura","Pisos","Eléctrico","Herramientas","Ferretería","Ventanas"];
const CONDITIONS = { new:"Nuevo", used:"Usado", bulk:"Al mayor" };
const CAT_EMOJIS = {Bloques:"🧱",Acero:"🏗️",Madera:"🪵",Techos:"🏠",Plomería:"💧",Cemento:"🪨",Pintura:"🎨",Pisos:"🧊",Eléctrico:"⚡",Herramientas:"🔧",Ferretería:"🔩",Ventanas:"🪟"};

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'DM Sans',sans-serif;background:#faf7f2;color:#2a2825;overflow-x:hidden}
:root{
  --ash:#1a1917;--concrete:#2a2825;--steel:#c8b89a;--rust:#d4521a;
  --sand:#f2ead8;--pale:#faf7f2;--mid:#7a7060;--line:rgba(200,184,154,0.18);
}
input,textarea,select{font-family:'DM Sans',sans-serif}
button{cursor:pointer;font-family:'DM Sans',sans-serif}
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-thumb{background:var(--steel);border-radius:3px}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
.au{animation:fadeUp .4s ease both}
`;

// ─── SHARED UI ────────────────────────────────────────────────────────────────
const S = {
  ghostBtn:{fontFamily:"'Space Mono',monospace",fontSize:"0.65rem",letterSpacing:"0.08em",padding:"0.4rem 0.9rem",borderRadius:2,background:"transparent",color:"var(--steel)",border:"1px solid rgba(200,184,154,0.3)",cursor:"pointer"},
  primaryBtn:{fontFamily:"'Space Mono',monospace",fontSize:"0.65rem",letterSpacing:"0.08em",padding:"0.4rem 1rem",borderRadius:2,background:"var(--rust)",color:"#fff",border:"none",cursor:"pointer"},
  formLabel:{fontFamily:"'Space Mono',monospace",fontSize:"0.6rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--mid)",display:"block",marginBottom:"0.45rem"},
  formInput:{width:"100%",background:"var(--pale)",border:"1px solid rgba(42,40,37,0.18)",color:"var(--concrete)",padding:"0.6rem 0.8rem",borderRadius:2,fontSize:"0.88rem",outline:"none"},
  filterLabel:{fontFamily:"'Space Mono',monospace",fontSize:"0.6rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--steel)",display:"block",marginBottom:"0.5rem"},
  filterInput:{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(200,184,154,0.2)",color:"var(--sand)",padding:"0.5rem 0.7rem",borderRadius:2,fontSize:"0.82rem",outline:"none"},
};

const Spinner = ({size=18,light=false}) => (
  <div style={{width:size,height:size,border:`2px solid ${light?"rgba(255,255,255,0.3)":"rgba(42,40,37,0.15)"}`,borderTop:`2px solid ${light?"#fff":"var(--rust)"}`,borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0}}/>
);

const Badge = ({type}) => {
  const cfg = {new:{bg:"#d4521a",c:"#fff",l:"Nuevo"},used:{bg:"#2a2825",c:"#f2ead8",l:"Usado"},bulk:{bg:"#2c6e49",c:"#fff",l:"Al mayor"}};
  const s = cfg[type]||cfg.new;
  return <span style={{background:s.bg,color:s.c,fontFamily:"'Space Mono',monospace",fontSize:"0.58rem",letterSpacing:"0.1em",textTransform:"uppercase",padding:"0.2rem 0.55rem",borderRadius:2}}>{s.l}</span>;
};

const StarRating = ({val=5}) => (
  <span style={{color:"var(--rust)",fontSize:"0.8rem"}}>
    {"★".repeat(Math.round(val))}{"☆".repeat(5-Math.round(val))}
    <span style={{color:"var(--mid)",fontSize:"0.72rem",marginLeft:4}}>{Number(val).toFixed(1)}</span>
  </span>
);

const Toast = ({msg,type="success"}) => (
  <div style={{position:"fixed",bottom:24,right:24,zIndex:999,background:type==="error"?"#c0392b":"#2c6e49",color:"#fff",padding:"0.8rem 1.4rem",borderRadius:4,fontFamily:"'Space Mono',monospace",fontSize:"0.72rem",letterSpacing:"0.08em",boxShadow:"0 8px 24px rgba(0,0,0,0.2)",animation:"fadeIn .3s ease"}}>{msg}</div>
);

// ─── NAV ──────────────────────────────────────────────────────────────────────
function Nav({user, setPage, page, onLogout, unreadCount}) {
  return (
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:200,background:"var(--ash)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 2rem",height:58,borderBottom:"1px solid var(--line)"}}>
      <button onClick={()=>setPage("home")} style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.6rem",color:"var(--sand)",letterSpacing:"0.1em",background:"none",border:"none",cursor:"pointer"}}>
        SURPL<span style={{color:"var(--rust)"}}>E</span>NTA
      </button>
      <div style={{display:"flex",gap:"1.5rem",alignItems:"center"}}>
        {[["browse","Explorar"],...(user?[["publish","Publicar"],["messages","Chat"],["orders","Órdenes"],["dashboard","Mi cuenta"]]:[])]
          .map(([p,l])=>(
          <button key={p} onClick={()=>setPage(p)} style={{...S.ghostBtn,border:"none",color:page===p?"var(--sand)":"var(--steel)",position:"relative",padding:"0 0.25rem"}}>
            {l}
            {p==="messages"&&unreadCount>0&&<span style={{position:"absolute",top:-6,right:-10,background:"var(--rust)",color:"#fff",borderRadius:"50%",width:14,height:14,fontSize:"0.55rem",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{unreadCount}</span>}
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:"0.6rem",alignItems:"center"}}>
        {!user ? (
          <>
            <button onClick={()=>setPage("login")} style={S.ghostBtn}>Entrar</button>
            <button onClick={()=>setPage("register")} style={S.primaryBtn}>Registrarse</button>
          </>
        ) : (
          <>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:"0.65rem",color:"var(--steel)"}}>Hola, {user.name?.split(" ")[0]}</span>
            <button onClick={onLogout} style={S.ghostBtn}>Salir</button>
          </>
        )}
      </div>
    </nav>
  );
}

// ─── LISTING CARD ─────────────────────────────────────────────────────────────
function ListingCard({listing, onClick}) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={()=>onClick(listing)}
      style={{background:"#fff",border:"1px solid rgba(42,40,37,0.1)",borderRadius:2,overflow:"hidden",cursor:"pointer",transition:"transform .2s,box-shadow .2s",transform:hov?"translateY(-3px)":"none",boxShadow:hov?"0 12px 32px rgba(42,40,37,0.12)":"none"}}>
      <div style={{height:140,background:"linear-gradient(140deg,#e8e0d0,#d4c8b4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2.8rem",position:"relative"}}>
        {CAT_EMOJIS[listing.category]||"📦"}
        <div style={{position:"absolute",top:8,left:8}}><Badge type={listing.condition}/></div>
      </div>
      <div style={{padding:"0.9rem 1rem 1rem"}}>
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.58rem",letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--rust)",marginBottom:4}}>{listing.category}</div>
        <div style={{fontWeight:600,fontSize:"0.85rem",color:"var(--concrete)",marginBottom:3,lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{listing.title}</div>
        <div style={{fontSize:"0.72rem",color:"var(--mid)",marginBottom:10}}>{listing.seller_name||"Vendedor"}</div>
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between"}}>
          <div>
            <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.4rem",color:"var(--concrete)"}}>${Number(listing.price).toFixed(2)}</span>
            <span style={{fontSize:"0.65rem",color:"var(--mid)",marginLeft:4}}>/{listing.unit}</span>
          </div>
          <span style={{fontSize:"0.65rem",color:"var(--mid)"}}>📍 {listing.location}</span>
        </div>
      </div>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({listings, setPage, setSelectedListing, setFilter}) {
  const [q, setQ] = useState("");
  const search = () => { setFilter({q,category:"Todos"}); setPage("browse"); };
  return (
    <div style={{marginTop:58}}>
      {/* HERO */}
      <div style={{background:"var(--ash)",minHeight:"72vh",display:"grid",gridTemplateColumns:"1fr 1fr",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(200,184,154,0.07) 59px,rgba(200,184,154,0.07) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(200,184,154,0.07) 59px,rgba(200,184,154,0.07) 60px)",pointerEvents:"none"}}/>
        <div style={{display:"flex",flexDirection:"column",justifyContent:"center",padding:"4rem 3rem 4rem 4rem",position:"relative",zIndex:2}} className="au">
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.62rem",letterSpacing:"0.25em",textTransform:"uppercase",color:"var(--rust)",marginBottom:"1.2rem",display:"flex",alignItems:"center",gap:"0.6rem"}}>
            <span style={{width:22,height:1,background:"var(--rust)",display:"inline-block"}}/>El marketplace de la construcción
          </div>
          <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"clamp(3.5rem,6vw,6.5rem)",lineHeight:0.92,color:"var(--sand)",letterSpacing:"0.02em"}}>
            <span style={{fontSize:"0.52em",display:"block",color:"var(--steel)",letterSpacing:"0.1em"}}>Compra y vende</span>
            MATERIALES<br/>DE <span style={{color:"var(--rust)"}}>OBRA</span>
          </h1>
          <p style={{marginTop:"1.5rem",fontSize:"0.92rem",lineHeight:1.75,color:"var(--mid)",maxWidth:"38ch"}}>Cemento, varillas, madera, bloques y más — directo de vendedores en Panamá.</p>
          <div style={{marginTop:"2rem",display:"flex",maxWidth:460}}>
            <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()}
              placeholder="Busca materiales… ej: cemento, varillas…"
              style={{flex:1,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(200,184,154,0.22)",borderRight:"none",color:"var(--sand)",fontSize:"0.88rem",padding:"0.75rem 1rem",outline:"none",borderRadius:"2px 0 0 2px"}}/>
            <button onClick={search} style={{background:"var(--rust)",color:"#fff",border:"none",padding:"0 1.2rem",fontFamily:"'Space Mono',monospace",fontSize:"0.7rem",letterSpacing:"0.1em",borderRadius:"0 2px 2px 0"}}>BUSCAR</button>
          </div>
          <div style={{marginTop:"2.5rem",display:"flex",gap:"2.5rem"}}>
            {[{n:`${listings.length}+`,l:"Anuncios"},{n:"850+",l:"Vendedores"},{n:"18+",l:"Categorías"}].map(s=>(
              <div key={s.l}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2rem",color:"var(--sand)",lineHeight:1}}>{s.n}</div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.6rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--mid)",marginTop:3}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gridTemplateRows:"1fr 1fr 1fr",gap:3,zIndex:2}}>
          {["🧱","🏗️","🪵","🏠","💧"].map((e,i)=>(
            <div key={i} style={{background:"linear-gradient(160deg,rgba(50,45,38,0.9),rgba(26,25,23,0.95))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2.5rem",gridRow:i===0||i===3?"span 2":"auto"}}>
              <span style={{opacity:0.35}}>{e}</span>
            </div>
          ))}
        </div>
      </div>
      {/* TRUST */}
      <div style={{background:"var(--rust)",padding:"0.8rem 3rem",display:"flex",alignItems:"center",justifyContent:"space-around",flexWrap:"wrap",gap:"0.75rem"}}>
        {["✓  Vendedores verificados","📍  Entrega en Panamá","🔒  Pagos seguros","💬  Chat directo"].map(t=>(
          <span key={t} style={{fontFamily:"'Space Mono',monospace",fontSize:"0.62rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(255,255,255,0.9)"}}>{t}</span>
        ))}
      </div>
      {/* CATEGORIES */}
      <div style={{padding:"3.5rem 3rem"}}>
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:"2rem"}}>
          <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2.5rem",color:"var(--concrete)"}}>CATEGORÍAS <span style={{color:"var(--rust)"}}>PRINCIPALES</span></h2>
          <button onClick={()=>{setFilter({q:"",category:"Todos"});setPage("browse");}} style={{...S.ghostBtn,border:"none",color:"var(--rust)"}}>Ver todas →</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:1,background:"rgba(42,40,37,0.12)",border:"1px solid rgba(42,40,37,0.12)"}}>
          {Object.entries(CAT_EMOJIS).map(([cat,em])=>(
            <button key={cat} onClick={()=>{setFilter({q:"",category:cat});setPage("browse");}}
              style={{background:"#fff",padding:"1.5rem 1rem",border:"none",textAlign:"left",display:"flex",flexDirection:"column",gap:"0.5rem",cursor:"pointer",transition:"background .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="#faf5ed"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
              <div style={{fontSize:"1.8rem"}}>{em}</div>
              <div style={{fontWeight:600,fontSize:"0.78rem",color:"var(--concrete)"}}>{cat}</div>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.58rem",color:"var(--mid)"}}>{listings.filter(l=>l.category===cat).length} anuncios</div>
            </button>
          ))}
        </div>
      </div>
      {/* LATEST */}
      <div style={{padding:"0 3rem 3.5rem",background:"var(--sand)"}}>
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:"2rem",paddingTop:"3.5rem"}}>
          <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2.5rem",color:"var(--concrete)"}}>ANUNCIOS <span style={{color:"var(--rust)"}}>RECIENTES</span></h2>
          <button onClick={()=>setPage("browse")} style={{...S.ghostBtn,border:"none",color:"var(--rust)"}}>Ver más →</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"1.2rem"}}>
          {listings.slice(0,8).map(l=><ListingCard key={l.id} listing={l} onClick={lst=>{setSelectedListing(lst);setPage("listing");}}/>)}
        </div>
      </div>
      {/* HOW */}
      <div style={{background:"var(--concrete)",padding:"3.5rem 3rem"}}>
        <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2.5rem",color:"var(--sand)",marginBottom:"2rem"}}>CÓMO <span style={{color:"var(--rust)"}}>FUNCIONA</span></h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)"}}>
          {[["🔍","Busca","Explora miles de anuncios. Filtra por categoría, ubicación o precio."],["💬","Contacta","Chatea directo con el vendedor para negociar y coordinar."],["💳","Paga seguro","Tu dinero en escrow hasta confirmar la entrega."],["🚚","Recibe en obra","Entrega a domicilio o retiro en punto. Califica al vendedor."]].map(([ic,ti,de],i)=>(
            <div key={i} style={{padding:"2rem 1.5rem",borderRight:i<3?"1px solid var(--line)":"none",position:"relative"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"4rem",lineHeight:1,color:"rgba(200,184,154,0.1)",position:"absolute",top:"0.8rem",right:"1rem"}}>0{i+1}</div>
              <div style={{fontSize:"1.8rem",marginBottom:"1rem"}}>{ic}</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.3rem",letterSpacing:"0.05em",color:"var(--sand)",marginBottom:"0.5rem"}}>{ti}</div>
              <div style={{fontSize:"0.8rem",lineHeight:1.7,color:"var(--mid)"}}>{de}</div>
            </div>
          ))}
        </div>
      </div>
      {/* SELLER CTA */}
      <div style={{background:"var(--rust)",padding:"4rem 3rem",display:"grid",gridTemplateColumns:"1fr auto",alignItems:"center",gap:"2rem",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",fontFamily:"'Bebas Neue',sans-serif",fontSize:"14rem",color:"rgba(255,255,255,0.05)",right:"-1rem",top:"50%",transform:"translateY(-50%)",letterSpacing:"-0.02em",pointerEvents:"none",whiteSpace:"nowrap"}}>SURPLENTA</div>
        <div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.62rem",letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(255,255,255,0.7)",marginBottom:"0.8rem"}}>¿Tienes materiales para vender?</div>
          <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"clamp(2.5rem,4vw,3.5rem)",color:"#fff",lineHeight:0.95,marginBottom:"1rem"}}>PUBLICA TU<br/>INVENTARIO HOY</h2>
          <p style={{fontSize:"0.88rem",color:"rgba(255,255,255,0.8)",maxWidth:"45ch",lineHeight:1.7}}>Miles de compradores buscan materiales en Panamá cada día. Sin comisiones el primer mes.</p>
        </div>
        <button onClick={()=>setPage("register")} style={{background:"#fff",color:"var(--rust)",fontFamily:"'Bebas Neue',sans-serif",fontSize:"1rem",letterSpacing:"0.1em",padding:"1rem 2rem",border:"none",borderRadius:2,cursor:"pointer",whiteSpace:"nowrap"}}>CREAR CUENTA GRATIS</button>
      </div>
    </div>
  );
}

// ─── BROWSE PAGE ──────────────────────────────────────────────────────────────
function BrowsePage({listings, setPage, setSelectedListing, filter}) {
  const [q, setQ] = useState(filter.q||"");
  const [cat, setCat] = useState(filter.category||"Todos");
  const [cond, setCond] = useState("all");
  const [sort, setSort] = useState("newest");
  const [maxPrice, setMaxPrice] = useState("");

  const filtered = listings.filter(l=>{
    if(cat!=="Todos"&&l.category!==cat) return false;
    if(cond!=="all"&&l.condition!==cond) return false;
    if(q&&!l.title.toLowerCase().includes(q.toLowerCase())&&!l.description?.toLowerCase().includes(q.toLowerCase())) return false;
    if(maxPrice&&l.price>parseFloat(maxPrice)) return false;
    return true;
  }).sort((a,b)=>sort==="newest"?new Date(b.created_at)-new Date(a.created_at):sort==="price_asc"?a.price-b.price:b.price-a.price);

  return (
    <div style={{marginTop:58,display:"grid",gridTemplateColumns:"230px 1fr",minHeight:"calc(100vh - 58px)"}}>
      <aside style={{background:"var(--ash)",padding:"2rem 1.5rem",borderRight:"1px solid var(--line)",overflowY:"auto"}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.1rem",letterSpacing:"0.1em",color:"var(--sand)",marginBottom:"1.5rem"}}>FILTROS</div>
        <div style={{marginBottom:"1.5rem"}}>
          <label style={S.filterLabel}>Buscar</label>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Palabras clave…" style={S.filterInput}/>
        </div>
        <div style={{marginBottom:"1.5rem"}}>
          <label style={S.filterLabel}>Categoría</label>
          {CATEGORIES.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{display:"block",width:"100%",textAlign:"left",padding:"0.38rem 0.6rem",background:cat===c?"rgba(212,82,26,0.15)":"transparent",color:cat===c?"var(--rust)":"var(--mid)",border:"none",cursor:"pointer",fontSize:"0.78rem",borderRadius:2,marginBottom:1,fontWeight:cat===c?600:400}}>
              {c} <span style={{fontSize:"0.6rem",opacity:0.6}}>({c==="Todos"?listings.length:listings.filter(l=>l.category===c).length})</span>
            </button>
          ))}
        </div>
        <div style={{marginBottom:"1.5rem"}}>
          <label style={S.filterLabel}>Condición</label>
          {[["all","Todos"],["new","Nuevo"],["used","Usado"],["bulk","Al mayor"]].map(([v,l])=>(
            <button key={v} onClick={()=>setCond(v)} style={{display:"block",width:"100%",textAlign:"left",padding:"0.38rem 0.6rem",background:cond===v?"rgba(212,82,26,0.15)":"transparent",color:cond===v?"var(--rust)":"var(--mid)",border:"none",cursor:"pointer",fontSize:"0.78rem",borderRadius:2,marginBottom:1,fontWeight:cond===v?600:400}}>{l}</button>
          ))}
        </div>
        <div>
          <label style={S.filterLabel}>Precio máx ($)</label>
          <input value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} type="number" placeholder="Ej: 50" style={S.filterInput}/>
        </div>
      </aside>
      <main style={{padding:"2rem",background:"var(--pale)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem"}}>
          <div>
            <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2rem",color:"var(--concrete)"}}>{cat==="Todos"?"TODOS LOS ANUNCIOS":cat.toUpperCase()}</h2>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.6rem",color:"var(--mid)",marginTop:2}}>{filtered.length} resultado{filtered.length!==1?"s":""}</div>
          </div>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{...S.filterInput,width:"auto",background:"#fff",color:"var(--concrete)",border:"1px solid rgba(42,40,37,0.15)"}}>
            <option value="newest">Más reciente</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
          </select>
        </div>
        {filtered.length===0?(
          <div style={{textAlign:"center",padding:"4rem",color:"var(--mid)"}}>
            <div style={{fontSize:"3rem",marginBottom:"1rem"}}>🔍</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.5rem",color:"var(--concrete)"}}>SIN RESULTADOS</div>
            <div style={{fontSize:"0.85rem",marginTop:"0.5rem"}}>Intenta con otros filtros</div>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:"1.2rem"}}>
            {filtered.map(l=><ListingCard key={l.id} listing={l} onClick={lst=>{setSelectedListing(lst);setPage("listing");}}/>)}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── LISTING DETAIL ───────────────────────────────────────────────────────────
function ListingPage({listing, user, setPage, setActiveChatListing, showToast, setCheckoutData}) {
  if(!listing) return null;
  const [qty, setQty] = useState(listing.min_qty||1);
  const buyNow = () => {
    if(!user){showToast("Inicia sesión para comprar","error");setPage("login");return;}
    if(qty < (listing.min_qty||1)){showToast("Cantidad mínima: "+listing.min_qty+" "+listing.unit,"error");return;}
    setCheckoutData({listing, quantity: qty});
    setPage("checkout");
  };
  const contact = () => {
    if(!user){showToast("Inicia sesión para contactar al vendedor","error");setPage("login");return;}
    setActiveChatListing(listing);
    setPage("messages");
  };
  return (
    <div style={{marginTop:58,maxWidth:920,margin:"58px auto 0",padding:"2.5rem 2rem"}}>
      <button onClick={()=>setPage("browse")} style={{...S.ghostBtn,marginBottom:"1.5rem"}}>← Volver</button>
      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:"2rem",alignItems:"start"}}>
        <div>
          <div style={{background:"linear-gradient(140deg,#e8e0d0,#d0c4b0)",borderRadius:4,height:280,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"5rem",position:"relative",marginBottom:"1.5rem"}}>
            {CAT_EMOJIS[listing.category]||"📦"}
            <div style={{position:"absolute",top:12,left:12}}><Badge type={listing.condition}/></div>
          </div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.62rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--rust)",marginBottom:8}}>{listing.category}</div>
          <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2.2rem",letterSpacing:"0.03em",color:"var(--concrete)",lineHeight:1.1,marginBottom:"1rem"}}>{listing.title}</h1>
          <p style={{fontSize:"0.9rem",lineHeight:1.8,color:"var(--mid)",marginBottom:"1.5rem"}}>{listing.description}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem"}}>
            {[["📍 Ubicación",listing.location],["📦 Cantidad mín.",`${listing.min_qty||1} ${listing.unit}`],["🏷️ Condición",CONDITIONS[listing.condition]||listing.condition],["📅 Publicado",new Date(listing.created_at).toLocaleDateString("es-PA")]].map(([k,v])=>(
              <div key={k} style={{background:"var(--sand)",padding:"0.75rem 1rem",borderRadius:2}}>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.56rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--mid)",marginBottom:4}}>{k}</div>
                <div style={{fontWeight:600,fontSize:"0.85rem",color:"var(--concrete)"}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{background:"#fff",border:"1px solid rgba(42,40,37,0.12)",borderRadius:4,padding:"1.5rem",marginBottom:"1rem"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2.5rem",color:"var(--concrete)",lineHeight:1}}>
              ${Number(listing.price).toFixed(2)} <span style={{fontSize:"0.7rem",fontFamily:"'DM Sans',sans-serif",color:"var(--mid)",fontWeight:400}}>/{listing.unit}</span>
            </div>
            {listing.min_qty>1&&<div style={{fontSize:"0.75rem",color:"var(--mid)",marginTop:4,marginBottom:"1rem"}}>Mín. {listing.min_qty} unidades = <strong>${(listing.price*listing.min_qty).toFixed(2)}</strong></div>}
            {/* QTY */}
            <div style={{margin:"1rem 0"}}>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.6rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--mid)",marginBottom:"0.4rem"}}>Cantidad ({listing.unit})</div>
              <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                <button onClick={()=>setQty(q=>Math.max(listing.min_qty||1,q-1))} style={{...S.ghostBtn,padding:"0.3rem 0.8rem",color:"var(--concrete)",border:"1px solid rgba(42,40,37,0.2)"}}>−</button>
                <input type="number" value={qty} onChange={e=>setQty(Math.max(listing.min_qty||1,parseInt(e.target.value)||1))} style={{width:70,textAlign:"center",background:"var(--pale)",border:"1px solid rgba(42,40,37,0.18)",color:"var(--concrete)",padding:"0.4rem",borderRadius:2,fontSize:"0.88rem",outline:"none"}}/>
                <button onClick={()=>setQty(q=>q+1)} style={{...S.ghostBtn,padding:"0.3rem 0.8rem",color:"var(--concrete)",border:"1px solid rgba(42,40,37,0.2)"}}>+</button>
              </div>
            </div>
            {/* RESUMEN */}
            <div style={{background:"var(--sand)",borderRadius:2,padding:"0.75rem 1rem",marginBottom:"1rem",fontSize:"0.8rem"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:"var(--mid)"}}>Subtotal</span><span style={{fontWeight:600}}>${(listing.price*qty).toFixed(2)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:"var(--mid)"}}>Comisión (5%)</span><span style={{color:"var(--mid)"}}>${(listing.price*qty*0.05).toFixed(2)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid rgba(42,40,37,0.1)",paddingTop:6,marginTop:4}}><span style={{fontWeight:600}}>Total</span><span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.2rem"}}>${(listing.price*qty).toFixed(2)}</span></div>
            </div>
            <button onClick={buyNow} style={{...S.primaryBtn,width:"100%",padding:"0.9rem",fontSize:"0.85rem",borderRadius:2,marginBottom:"0.5rem",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",background:"#2c6e49"}}>
              💳 Comprar ahora
            </button>
            <button onClick={contact} style={{...S.ghostBtn,width:"100%",padding:"0.75rem",fontSize:"0.78rem",borderRadius:2,textAlign:"center",color:"var(--concrete)",border:"1px solid rgba(42,40,37,0.2)"}}>💬 Contactar vendedor</button>
          </div>
          <div style={{background:"#fff",border:"1px solid rgba(42,40,37,0.12)",borderRadius:4,padding:"1.2rem"}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.58rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--mid)",marginBottom:"0.75rem"}}>Vendedor</div>
            <div style={{fontWeight:600,fontSize:"0.95rem",color:"var(--concrete)",marginBottom:4}}>{listing.seller_name||"Vendedor"}</div>
            <StarRating val={listing.seller_rating||5}/>
            <div style={{marginTop:"0.75rem",fontFamily:"'Space Mono',monospace",fontSize:"0.6rem",color:"var(--mid)"}}>🔒 Pago protegido por Stripe</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PUBLISH PAGE ─────────────────────────────────────────────────────────────
function PublishPage({user, setPage, onPublish, showToast}) {
  const [form, setForm] = useState({title:"",category:"Bloques",price:"",unit:"unidad",min_qty:"1",condition:"new",location:"Panamá",description:""});
  const [saving, setSaving] = useState(false);
  const up = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async () => {
    if(!form.title||!form.price) return showToast("Completa título y precio","error");
    setSaving(true);
    const ok = await onPublish({...form,price:parseFloat(form.price),min_qty:parseInt(form.min_qty)||1,seller_name:user.name,seller_id:user.id});
    setSaving(false);
    if(ok){ showToast("¡Anuncio publicado!"); setPage("dashboard"); }
    else showToast("Error al publicar. Intenta de nuevo.","error");
  };

  return (
    <div style={{marginTop:58,maxWidth:700,margin:"58px auto 0",padding:"2.5rem 2rem"}}>
      <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2.5rem",color:"var(--concrete)",marginBottom:"0.25rem"}}>PUBLICAR <span style={{color:"var(--rust)"}}>ANUNCIO</span></h1>
      <p style={{color:"var(--mid)",marginBottom:"2rem",fontSize:"0.85rem"}}>Completa la información de tu material.</p>
      <div style={{background:"#fff",border:"1px solid rgba(42,40,37,0.1)",borderRadius:4,padding:"2rem",display:"flex",flexDirection:"column",gap:"1.25rem"}}>
        <div>
          <label style={S.formLabel}>Título *</label>
          <input value={form.title} onChange={e=>up("title",e.target.value)} placeholder="Ej: Bloques de concreto 6 pulgadas tipo A" style={S.formInput}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
          <div>
            <label style={S.formLabel}>Categoría *</label>
            <select value={form.category} onChange={e=>up("category",e.target.value)} style={S.formInput}>
              {CATEGORIES.filter(c=>c!=="Todos").map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={S.formLabel}>Condición *</label>
            <select value={form.condition} onChange={e=>up("condition",e.target.value)} style={S.formInput}>
              <option value="new">Nuevo</option>
              <option value="used">Usado</option>
              <option value="bulk">Al mayor</option>
            </select>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"1rem"}}>
          <div>
            <label style={S.formLabel}>Precio ($) *</label>
            <input value={form.price} onChange={e=>up("price",e.target.value)} type="number" step="0.01" placeholder="0.00" style={S.formInput}/>
          </div>
          <div>
            <label style={S.formLabel}>Unidad</label>
            <input value={form.unit} onChange={e=>up("unit",e.target.value)} placeholder="unidad, m², saco…" style={S.formInput}/>
          </div>
          <div>
            <label style={S.formLabel}>Cantidad mínima</label>
            <input value={form.min_qty} onChange={e=>up("min_qty",e.target.value)} type="number" min="1" style={S.formInput}/>
          </div>
        </div>
        <div>
          <label style={S.formLabel}>Ubicación</label>
          <input value={form.location} onChange={e=>up("location",e.target.value)} placeholder="Ej: Panamá, La Chorrera, Arraiján…" style={S.formInput}/>
        </div>
        <div>
          <label style={S.formLabel}>Descripción</label>
          <textarea value={form.description} onChange={e=>up("description",e.target.value)} rows={4} placeholder="Describe el material, especificaciones técnicas…" style={{...S.formInput,resize:"vertical",lineHeight:1.6}}/>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:"0.75rem",borderTop:"1px solid rgba(42,40,37,0.08)",paddingTop:"1.25rem"}}>
          <button onClick={()=>setPage("browse")} style={S.ghostBtn}>Cancelar</button>
          <button onClick={submit} disabled={saving} style={{...S.primaryBtn,display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.6rem 1.2rem",opacity:saving?0.7:1}}>
            {saving&&<Spinner light/>}{saving?"Publicando…":"Publicar anuncio"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardPage({user, listings, setPage, setSelectedListing, onDelete, showToast}) {
  const mine = listings.filter(l=>l.seller_id===user.id||l.seller_id===user.id);
  return (
    <div style={{marginTop:58,maxWidth:920,margin:"58px auto 0",padding:"2.5rem 2rem"}}>
      <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:"2rem",alignItems:"start"}}>
        <div>
          <div style={{background:"var(--ash)",borderRadius:4,padding:"1.5rem",marginBottom:"1rem",textAlign:"center"}}>
            <div style={{width:60,height:60,borderRadius:"50%",background:"var(--rust)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.6rem",margin:"0 auto 0.75rem"}}>{user.name?.[0]?.toUpperCase()||"U"}</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.1rem",letterSpacing:"0.05em",color:"var(--sand)"}}>{user.name}</div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.58rem",color:"var(--mid)",marginTop:3}}>{user.email}</div>
            <div style={{marginTop:"0.75rem"}}><StarRating val={5}/></div>
          </div>
          <div style={{background:"#fff",border:"1px solid rgba(42,40,37,0.1)",borderRadius:4,padding:"1.2rem",marginBottom:"1rem"}}>
            {[["📦 Anuncios",mine.length],["📅 Miembro desde",new Date(user.created_at||Date.now()).toLocaleDateString("es-PA")]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"0.5rem 0",borderBottom:"1px solid rgba(42,40,37,0.06)"}}>
                <span style={{fontSize:"0.78rem",color:"var(--mid)"}}>{k}</span>
                <span style={{fontWeight:600,fontSize:"0.85rem",color:"var(--concrete)"}}>{v}</span>
              </div>
            ))}
          </div>
          <button onClick={()=>setPage("publish")} style={{...S.primaryBtn,width:"100%",padding:"0.75rem",fontSize:"0.8rem",borderRadius:2}}>+ Nuevo anuncio</button>
        </div>
        <div>
          <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2rem",color:"var(--concrete)",marginBottom:"1.25rem"}}>MIS <span style={{color:"var(--rust)"}}>ANUNCIOS</span></h2>
          {mine.length===0?(
            <div style={{textAlign:"center",padding:"3rem",background:"#fff",border:"1px solid rgba(42,40,37,0.1)",borderRadius:4}}>
              <div style={{fontSize:"2.5rem",marginBottom:"0.75rem"}}>📦</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.3rem",color:"var(--concrete)"}}>NINGÚN ANUNCIO AÚN</div>
              <p style={{color:"var(--mid)",fontSize:"0.82rem",marginTop:"0.5rem"}}>Publica tu primer material.</p>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
              {mine.map(l=>(
                <div key={l.id} style={{background:"#fff",border:"1px solid rgba(42,40,37,0.1)",borderRadius:4,padding:"1rem 1.2rem",display:"flex",alignItems:"center",gap:"1rem"}}>
                  <div style={{fontSize:"1.8rem",width:44,height:44,background:"var(--sand)",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{CAT_EMOJIS[l.category]||"📦"}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:"0.85rem",color:"var(--concrete)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.title}</div>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.58rem",color:"var(--mid)",marginTop:3}}>{l.category} · ${l.price}/{l.unit} · {l.location}</div>
                  </div>
                  <Badge type={l.condition}/>
                  <div style={{display:"flex",gap:"0.5rem"}}>
                    <button onClick={()=>{setSelectedListing(l);setPage("listing");}} style={{...S.ghostBtn,fontSize:"0.62rem",padding:"0.3rem 0.7rem"}}>Ver</button>
                    <button onClick={async()=>{const ok=await onDelete(l.id);if(ok)showToast("Anuncio eliminado");else showToast("Error al eliminar","error");}} style={{...S.ghostBtn,fontSize:"0.62rem",padding:"0.3rem 0.7rem",color:"#c0392b",borderColor:"rgba(192,57,43,0.3)"}}>Borrar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MESSAGES PAGE ────────────────────────────────────────────────────────────
function MessagesPage({user, messages, setMessages, listings, activeChatListing, setActiveChatListing}) {
  const [txt, setTxt] = useState("");
  const [sending, setSending] = useState(false);

  const convos = {};
  messages.forEach(m=>{
    if(!convos[m.listing_id]) convos[m.listing_id]={id:m.listing_id,title:m.listing_title,msgs:[]};
    convos[m.listing_id].msgs.push(m);
  });

  const activeId = activeChatListing?.id;
  const activeMsgs = messages.filter(m=>m.listing_id===activeId);

  const send = async () => {
    if(!txt.trim()||!activeId) return;
    setSending(true);
    const listing = listings.find(l=>l.id===activeId);
    const msg = {listing_id:activeId,listing_title:listing?.title||"Anuncio",from_id:user.id,from_name:user.name,to_id:listing?.seller_id,text:txt.trim(),created_at:new Date().toISOString()};
    const {data,error} = await supabase.from("messages").insert([msg]).select();
    if(!error&&data) setMessages(prev=>[...prev,...data]);
    setTxt("");

    // Auto-reply simulation
    setTimeout(async()=>{
      const reply = {listing_id:activeId,listing_title:listing?.title||"Anuncio",from_id:listing?.seller_id||"seller",from_name:listing?.seller_name||"Vendedor",to_id:user.id,text:"¡Gracias por tu interés! ¿Cuántas unidades necesitas y para cuándo?",created_at:new Date().toISOString()};
      const {data:rd} = await supabase.from("messages").insert([reply]).select();
      if(rd) setMessages(prev=>[...prev,...rd]);
      setSending(false);
    },1500);
  };

  return (
    <div style={{marginTop:58,height:"calc(100vh - 58px)",display:"grid",gridTemplateColumns:"270px 1fr"}}>
      <aside style={{background:"var(--ash)",borderRight:"1px solid var(--line)",overflowY:"auto"}}>
        <div style={{padding:"1rem 1.2rem",fontFamily:"'Bebas Neue',sans-serif",fontSize:"1rem",letterSpacing:"0.1em",color:"var(--sand)",borderBottom:"1px solid var(--line)"}}>CONVERSACIONES</div>
        {Object.keys(convos).length===0&&<div style={{padding:"2rem 1.2rem",color:"var(--mid)",fontSize:"0.8rem",textAlign:"center"}}>No tienes mensajes aún.</div>}
        {Object.values(convos).map(c=>{
          const last=c.msgs[c.msgs.length-1];
          const isA=activeId===c.id;
          return (
            <button key={c.id} onClick={()=>setActiveChatListing({id:c.id,title:c.title})}
              style={{display:"block",width:"100%",textAlign:"left",padding:"0.85rem 1.2rem",background:isA?"rgba(212,82,26,0.1)":"transparent",border:"none",borderBottom:"1px solid var(--line)",cursor:"pointer",borderLeft:isA?"3px solid var(--rust)":"3px solid transparent"}}>
              <div style={{fontWeight:600,fontSize:"0.8rem",color:"var(--sand)",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title}</div>
              <div style={{fontSize:"0.7rem",color:"var(--mid)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{last?.text}</div>
            </button>
          );
        })}
      </aside>
      <main style={{display:"flex",flexDirection:"column",background:"var(--pale)"}}>
        {!activeId?(
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"1rem",color:"var(--mid)"}}>
            <div style={{fontSize:"3rem"}}>💬</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.4rem",color:"var(--concrete)"}}>SELECCIONA UNA CONVERSACIÓN</div>
          </div>
        ):(
          <>
            <div style={{padding:"0.9rem 1.5rem",borderBottom:"1px solid rgba(42,40,37,0.1)",background:"#fff",fontWeight:600,fontSize:"0.88rem",color:"var(--concrete)"}}>{activeChatListing?.title||"Chat"}</div>
            <div style={{flex:1,overflowY:"auto",padding:"1.5rem",display:"flex",flexDirection:"column",gap:"0.75rem"}}>
              {activeMsgs.map((m,i)=>{
                const me=m.from_id===user.id;
                return (
                  <div key={m.id||i} style={{display:"flex",flexDirection:"column",alignItems:me?"flex-end":"flex-start"}}>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.56rem",color:"var(--mid)",marginBottom:3}}>{m.from_name}</div>
                    <div style={{background:me?"var(--rust)":"#fff",color:me?"#fff":"var(--concrete)",padding:"0.6rem 0.95rem",borderRadius:me?"12px 12px 2px 12px":"12px 12px 12px 2px",fontSize:"0.85rem",maxWidth:"70%",border:me?"none":"1px solid rgba(42,40,37,0.1)",lineHeight:1.6}}>{m.text}</div>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.52rem",color:"var(--mid)",marginTop:3}}>{new Date(m.created_at).toLocaleTimeString("es-PA",{hour:"2-digit",minute:"2-digit"})}</div>
                  </div>
                );
              })}
              {sending&&<div style={{display:"flex",alignItems:"center",gap:"0.5rem",color:"var(--mid)",fontSize:"0.75rem"}}><Spinner/>Respondiendo…</div>}
            </div>
            <div style={{padding:"1rem 1.5rem",borderTop:"1px solid rgba(42,40,37,0.1)",background:"#fff",display:"flex",gap:"0.75rem"}}>
              <input value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Escribe un mensaje… (Enter para enviar)" style={{flex:1,...S.formInput}}/>
              <button onClick={send} style={{...S.primaryBtn,padding:"0.6rem 1.2rem"}}>Enviar</button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ─── AUTH PAGES ───────────────────────────────────────────────────────────────
function AuthPage({mode, setPage, onAuth, showToast}) {
  const isLogin = mode==="login";
  const [form, setForm] = useState({name:"",email:"",password:""});
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const up = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async () => {
    setErr("");
    if(!form.email||!form.password) return setErr("Completa todos los campos.");
    if(!isLogin&&!form.name) return setErr("Ingresa tu nombre.");
    setLoading(true);
    try {
      if(isLogin){
        const {data,error} = await supabase.auth.signInWithPassword({email:form.email,password:form.password});
        if(error) throw error;
        const {data:profile} = await supabase.from("profiles").select("*").eq("id",data.user.id).single();
        onAuth({...data.user,...profile});
        setPage("home");
        showToast("¡Bienvenido de vuelta!");
      } else {
        const {data,error} = await supabase.auth.signUp({email:form.email,password:form.password});
        if(error) throw error;
        await supabase.from("profiles").insert([{id:data.user.id,name:form.name,email:form.email}]);
        onAuth({...data.user,name:form.name,email:form.email});
        setPage("home");
        showToast("¡Cuenta creada! Bienvenido a Surplenta.");
      }
    } catch(e){
      setErr(e.message==="Invalid login credentials"?"Email o contraseña incorrectos.":e.message||"Error. Intenta de nuevo.");
    }
    setLoading(false);
  };

  return (
    <div style={{marginTop:58,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"calc(100vh - 58px)",background:"var(--ash)",padding:"2rem"}}>
      <div style={{background:"#fff",borderRadius:4,padding:"2.5rem",width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}} className="au">
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2rem",color:"var(--concrete)",marginBottom:"0.25rem"}}>{isLogin?"INICIAR SESIÓN":"CREAR CUENTA"}</div>
        <p style={{color:"var(--mid)",fontSize:"0.82rem",marginBottom:"1.5rem"}}>{isLogin?"Bienvenido de vuelta.":"Únete al marketplace de la construcción."}</p>
        {err&&<div style={{background:"#fef0ed",border:"1px solid #f0a898",borderRadius:2,padding:"0.65rem 0.9rem",marginBottom:"1rem",fontSize:"0.8rem",color:"#c0392b"}}>{err}</div>}
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          {!isLogin&&<div><label style={S.formLabel}>Nombre</label><input value={form.name} onChange={e=>up("name",e.target.value)} placeholder="Tu nombre o empresa" style={S.formInput}/></div>}
          <div><label style={S.formLabel}>Email</label><input value={form.email} onChange={e=>up("email",e.target.value)} type="email" placeholder="correo@ejemplo.com" style={S.formInput}/></div>
          <div><label style={S.formLabel}>Contraseña</label><input value={form.password} onChange={e=>up("password",e.target.value)} type="password" placeholder="Mínimo 6 caracteres" style={S.formInput}/></div>
          <button onClick={submit} disabled={loading} style={{...S.primaryBtn,width:"100%",padding:"0.85rem",fontSize:"0.85rem",borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",opacity:loading?0.7:1}}>
            {loading&&<Spinner light/>}{loading?"Procesando…":isLogin?"Entrar":"Crear cuenta"}
          </button>
        </div>
        <div style={{textAlign:"center",marginTop:"1.25rem",fontSize:"0.8rem",color:"var(--mid)"}}>
          {isLogin?"¿No tienes cuenta? ":"¿Ya tienes cuenta? "}
          <button onClick={()=>setPage(isLogin?"register":"login")} style={{color:"var(--rust)",background:"none",border:"none",cursor:"pointer",fontWeight:600,fontSize:"0.8rem"}}>{isLogin?"Regístrate":"Inicia sesión"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [activeChatListing, setActiveChatListing] = useState(null);
  const [filter, setFilter] = useState({q:"",category:"Todos"});
  const [checkoutData, setCheckoutData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg,type="success")=>{
    setToast({msg,type});
    setTimeout(()=>setToast(null),3000);
  },[]);

  // Init: check session + load listings
  useEffect(()=>{
    (async()=>{
      const {data:{session}} = await supabase.auth.getSession();
      if(session){
        const {data:profile} = await supabase.from("profiles").select("*").eq("id",session.user.id).single();
        setUser({...session.user,...profile});
      }
      const {data:ls} = await supabase.from("listings").select("*").order("created_at",{ascending:false});
      setListings(ls||[]);
      setLoaded(true);
    })();
  },[]);

  // Load messages when user logs in
  useEffect(()=>{
    if(!user) return;
    (async()=>{
      const {data} = await supabase.from("messages").select("*").or(`from_id.eq.${user.id},to_id.eq.${user.id}`).order("created_at");
      setMessages(data||[]);
    })();
  },[user?.id]);

  const handleLogout = async() => {
    await supabase.auth.signOut();
    setUser(null);
    setPage("home");
    showToast("Sesión cerrada.");
  };

  const handlePublish = async(listing) => {
    const {data,error} = await supabase.from("listings").insert([listing]).select();
    if(!error&&data){ setListings(prev=>[...data,...prev]); return true; }
    return false;
  };

  const handleDelete = async(id) => {
    const {error} = await supabase.from("listings").delete().eq("id",id);
    if(!error){ setListings(prev=>prev.filter(l=>l.id!==id)); return true; }
    return false;
  };

  const unread = messages.filter(m=>user&&m.to_id===user.id).length;
  const needsAuth = ["publish","dashboard","orders"].includes(page)&&!user;
  const p = needsAuth?"login":page;

  if(!loaded) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"var(--ash)",flexDirection:"column",gap:"1rem"}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2rem",color:"var(--sand)",letterSpacing:"0.1em"}}>SURPL<span style={{color:"var(--rust)"}}>E</span>NTA</div>
      <Spinner light/>
    </div>
  );

  return (
    <>
      <style>{STYLES}</style>
      <Nav user={user} setPage={setPage} page={p} onLogout={handleLogout} unreadCount={unread}/>
      {p==="home"&&<HomePage listings={listings} setPage={setPage} setSelectedListing={setSelectedListing} setFilter={setFilter}/>}
      {p==="browse"&&<BrowsePage listings={listings} setPage={setPage} setSelectedListing={setSelectedListing} filter={filter}/>}
      {p==="listing"&&<ListingPage listing={selectedListing} user={user} setPage={setPage} setActiveChatListing={setActiveChatListing} showToast={showToast} setCheckoutData={setCheckoutData}/>}
      {p==="publish"&&<PublishPage user={user} setPage={setPage} onPublish={handlePublish} showToast={showToast}/>}
      {p==="dashboard"&&<DashboardPage user={user} listings={listings} setPage={setPage} setSelectedListing={setSelectedListing} onDelete={handleDelete} showToast={showToast}/>}
      {p==="messages"&&<MessagesPage user={user} messages={messages} setMessages={setMessages} listings={listings} activeChatListing={activeChatListing} setActiveChatListing={setActiveChatListing}/>}
      {p==="orders"&&<OrdersPage user={user} showToast={showToast}/>}
      {p==="checkout"&&<CheckoutPage listing={checkoutData?.listing} quantity={checkoutData?.quantity} user={user} setPage={setPage} showToast={showToast}/>}
      {(p==="login"||p==="register")&&<AuthPage mode={p} setPage={setPage} onAuth={setUser} showToast={showToast}/>}
      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
    </>
  );
}

// ─── ORDERS PAGE (ESCROW) ─────────────────────────────────────────────────────
function OrdersPage({user, showToast}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("buying");

  useEffect(()=>{
    if(!user) return;
    (async()=>{
      const {data} = await supabase.from("orders").select("*").or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order("created_at",{ascending:false});
      setOrders(data||[]);
      setLoading(false);
    })();
  },[user?.id]);

  const updateOrder = async(id, updates) => {
    const {data,error} = await supabase.from("orders").update(updates).eq("id",id).select().single();
    if(!error&&data){
      setOrders(prev=>prev.map(o=>o.id===id?data:o));
      return true;
    }
    return false;
  };

  const confirmShipped = async(order) => {
    const ok = await updateOrder(order.id, {seller_confirmed:true, status:"shipped", shipped_at: new Date().toISOString()});
    if(ok) showToast("Envío confirmado. Esperando confirmación del comprador.");
  };

  const confirmReceived = async(order) => {
    const updates = {buyer_confirmed:true, delivered_at: new Date().toISOString()};
    if(order.seller_confirmed) { updates.status = "released"; updates.released_at = new Date().toISOString(); }
    else { updates.status = "delivered"; }
    const ok = await updateOrder(order.id, updates);
    if(ok) showToast(order.seller_confirmed ? "¡Pago liberado al vendedor! Transacción completada." : "Recepción confirmada.");
  };

  const openDispute = async(order) => {
    const reason = prompt("Describe el problema con tu orden:");
    if(!reason) return;
    const ok = await updateOrder(order.id, {status:"disputed", dispute_reason:reason});
    if(ok) showToast("Disputa abierta. Surplenta revisará tu caso en 24-48 horas.","error");
  };

  const STATUS_LABELS = {
    pending:{l:"Pendiente de pago",c:"#f59e0b",bg:"#fef3c7"},
    paid:{l:"Pagado — en preparación",c:"#3b82f6",bg:"#dbeafe"},
    shipped:{l:"Enviado",c:"#8b5cf6",bg:"#ede9fe"},
    delivered:{l:"Entregado",c:"#10b981",bg:"#d1fae5"},
    released:{l:"Completado ✓",c:"#059669",bg:"#d1fae5"},
    disputed:{l:"En disputa ⚠️",c:"#ef4444",bg:"#fee2e2"},
    refunded:{l:"Reembolsado",c:"#6b7280",bg:"#f3f4f6"},
  };

  const myOrders = orders.filter(o => tab==="buying" ? o.buyer_id===user?.id : o.seller_id===user?.id);
  const buyingCount = orders.filter(o=>o.buyer_id===user?.id).length;
  const sellingCount = orders.filter(o=>o.seller_id===user?.id).length;

  return (
    <div style={{marginTop:58,maxWidth:860,margin:"58px auto 0",padding:"2.5rem 2rem"}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2.2rem",color:"var(--concrete)",marginBottom:"0.25rem"}}>MIS ÓRDENES</div>
      <p style={{color:"var(--mid)",fontSize:"0.85rem",marginBottom:"2rem"}}>Sistema de pago protegido — el dinero se libera cuando ambas partes confirman.</p>

      {/* TABS */}
      <div style={{display:"flex",gap:"0.5rem",marginBottom:"2rem",borderBottom:"2px solid rgba(42,40,37,0.1)",paddingBottom:"0"}}>
        {[["buying",`Comprando (${buyingCount})`],["selling",`Vendiendo (${sellingCount})`]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} style={{fontFamily:"'Space Mono',monospace",fontSize:"0.65rem",letterSpacing:"0.1em",textTransform:"uppercase",padding:"0.6rem 1.2rem",background:"none",border:"none",borderBottom:tab===v?"2px solid var(--rust)":"2px solid transparent",color:tab===v?"var(--rust)":"var(--mid)",cursor:"pointer",marginBottom:"-2px"}}>{l}</button>
        ))}
      </div>

      {loading ? <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}><Spinner/></div> :
       myOrders.length===0 ? (
        <div style={{textAlign:"center",padding:"4rem 2rem",color:"var(--mid)"}}>
          <div style={{fontSize:"3rem",marginBottom:"1rem"}}>📦</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.5rem",color:"var(--concrete)"}}>SIN ÓRDENES</div>
          <div style={{fontSize:"0.85rem",marginTop:"0.5rem"}}>{tab==="buying"?"Aún no has comprado nada.":"Aún no tienes ventas."}</div>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:"1.2rem"}}>
          {myOrders.map(order=>{
            const st = STATUS_LABELS[order.status]||STATUS_LABELS.pending;
            const isBuyer = order.buyer_id===user?.id;
            const canDispute = isBuyer && ["paid","shipped","delivered"].includes(order.status);
            const canConfirmShipped = !isBuyer && order.status==="paid" && !order.seller_confirmed;
            const canConfirmReceived = isBuyer && ["shipped","delivered"].includes(order.status) && !order.buyer_confirmed;

            return (
              <div key={order.id} style={{background:"#fff",border:"1px solid rgba(42,40,37,0.1)",borderRadius:4,padding:"1.5rem",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1rem",flexWrap:"wrap",gap:"0.5rem"}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:"0.95rem",color:"var(--concrete)",marginBottom:3}}>{order.listing_title}</div>
                    <div style={{fontSize:"0.75rem",color:"var(--mid)"}}>
                      {isBuyer ? `Vendedor: ${order.seller_name}` : `Comprador: ${order.buyer_name||order.buyer_email}`} · {new Date(order.created_at).toLocaleDateString("es-PA")}
                    </div>
                  </div>
                  <span style={{background:st.bg,color:st.c,fontFamily:"'Space Mono',monospace",fontSize:"0.6rem",letterSpacing:"0.08em",padding:"0.3rem 0.7rem",borderRadius:2,whiteSpace:"nowrap"}}>{st.l}</span>
                </div>

                {/* AMOUNTS */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.75rem",marginBottom:"1rem"}}>
                  {[["Total pagado",`$${Number(order.total_amount).toFixed(2)}`],["Comisión Surplenta",`$${Number(order.commission).toFixed(2)}`],["Pago al vendedor",`$${Number(order.seller_payout).toFixed(2)}`]].map(([k,v])=>(
                    <div key={k} style={{background:"var(--sand)",padding:"0.6rem 0.8rem",borderRadius:2}}>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.55rem",textTransform:"uppercase",color:"var(--mid)",marginBottom:3}}>{k}</div>
                      <div style={{fontWeight:700,fontSize:"0.9rem",color:"var(--concrete)"}}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* ESCROW PROGRESS */}
                <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"1rem",flexWrap:"wrap"}}>
                  {[["💳 Pago",true],["📦 Enviado",order.seller_confirmed||["shipped","delivered","released"].includes(order.status)],["✅ Recibido",order.buyer_confirmed||order.status==="released"],["💰 Liberado",order.status==="released"]].map(([l,done],i)=>(
                    <React.Fragment key={l}>
                      {i>0&&<div style={{width:20,height:1,background:done?"var(--rust)":"rgba(42,40,37,0.15)",flexShrink:0}}/>}
                      <div style={{display:"flex",alignItems:"center",gap:"0.3rem",fontFamily:"'Space Mono',monospace",fontSize:"0.58rem",color:done?"var(--rust)":"var(--mid)"}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:done?"var(--rust)":"rgba(42,40,37,0.2)",flexShrink:0}}/>
                        {l}
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                {/* DISPUTE REASON */}
                {order.dispute_reason&&<div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:2,padding:"0.75rem",marginBottom:"1rem",fontSize:"0.8rem",color:"#991b1b"}}>⚠️ Disputa: {order.dispute_reason}</div>}
                {order.admin_resolution&&<div style={{background:"#d1fae5",border:"1px solid #6ee7b7",borderRadius:2,padding:"0.75rem",marginBottom:"1rem",fontSize:"0.8rem",color:"#065f46"}}>✅ Resolución: {order.admin_resolution}</div>}

                {/* ACTIONS */}
                <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
                  {canConfirmShipped&&<button onClick={()=>confirmShipped(order)} style={{...S.primaryBtn,padding:"0.5rem 1rem",fontSize:"0.72rem"}}>📦 Confirmar envío</button>}
                  {canConfirmReceived&&<button onClick={()=>confirmReceived(order)} style={{...S.primaryBtn,padding:"0.5rem 1rem",fontSize:"0.72rem",background:"#2c6e49"}}>✅ Confirmar recepción</button>}
                  {canDispute&&<button onClick={()=>openDispute(order)} style={{...S.ghostBtn,padding:"0.5rem 1rem",fontSize:"0.72rem",color:"#ef4444",border:"1px solid #fca5a5"}}>⚠️ Abrir disputa</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── CHECKOUT PAGE (STRIPE ELEMENTS) ─────────────────────────────────────────
function CheckoutPage({listing, quantity, user, setPage, showToast}) {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [cardError, setCardError] = useState(null);
  const stripeRef = useRef(null);
  const cardRef = useRef(null);
  const mountedRef = useRef(null);

  const total = listing ? (listing.price * quantity).toFixed(2) : "0.00";
  const commission = listing ? (listing.price * quantity * 0.05).toFixed(2) : "0.00";

  useEffect(() => {
    if (!listing) return;
    (async () => {
      try {
        // Load Stripe.js dynamically
        if (!window.Stripe) {
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://js.stripe.com/v3/';
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
          });
        }
        const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        stripeRef.current = window.Stripe(pk);

        const res = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listing, quantity,
            buyerEmail: user?.email,
            buyerId: user?.id,
            buyerName: user?.name || user?.email,
          }),
        });
        const data = await res.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setLoading(false);
          // Mount card element
          setTimeout(() => {
            if (!mountedRef.current) return;
            const elements = stripeRef.current.elements();
            cardRef.current = elements.create('card', {
              style: {
                base: {
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '16px',
                  color: '#2a2825',
                  '::placeholder': { color: '#9a8f80' },
                },
              },
              hidePostalCode: true,
            });
            cardRef.current.mount(mountedRef.current);
            cardRef.current.on('ready', () => setCardReady(true));
            cardRef.current.on('change', e => setCardError(e.error ? e.error.message : null));
          }, 100);
        } else {
          showToast('Error al iniciar pago', 'error');
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        showToast('Error de conexión', 'error');
        setLoading(false);
      }
    })();
    return () => { if (cardRef.current) cardRef.current.destroy(); };
  }, [listing?.id]);

  const handlePay = async () => {
    if (!stripeRef.current || !cardRef.current || !clientSecret) return;
    setPaying(true);
    setCardError(null);
    const { error, paymentIntent } = await stripeRef.current.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardRef.current,
        billing_details: { email: user?.email, name: user?.name },
      },
    });
    if (error) {
      setCardError(error.message);
      setPaying(false);
    } else if (paymentIntent.status === 'succeeded') {
      // Save order to Supabase
      await supabase.from('orders').upsert({
        stripe_session_id: paymentIntent.id,
        listing_id: listing.id,
        listing_title: listing.title,
        buyer_id: user?.id,
        buyer_email: user?.email,
        buyer_name: user?.name || user?.email,
        seller_id: listing.seller_id,
        seller_name: listing.seller_name,
        quantity,
        unit_price: listing.price,
        total_amount: parseFloat(total),
        commission: parseFloat(commission),
        seller_payout: parseFloat(total) - parseFloat(commission),
        status: 'paid',
      }, { onConflict: 'stripe_session_id' });
      setPaid(true);
      setPaying(false);
    }
  };

  if (!listing) return null;

  if (paid) return (
    <div style={{marginTop:58,minHeight:'calc(100vh - 58px)',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--pale)'}}>
      <div style={{textAlign:'center',background:'#fff',padding:'3rem',borderRadius:8,maxWidth:440,boxShadow:'0 8px 32px rgba(0,0,0,0.08)'}}>
        <div style={{fontSize:'4rem',marginBottom:'1rem'}}>✅</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'2rem',color:'var(--concrete)',marginBottom:'0.5rem'}}>¡PAGO EXITOSO!</div>
        <p style={{color:'var(--mid)',fontSize:'0.88rem',marginBottom:'2rem',lineHeight:1.7}}>Tu orden fue procesada. El dinero queda en escrow hasta que ambas partes confirmen la entrega.</p>
        <div style={{background:'var(--sand)',borderRadius:4,padding:'1rem',marginBottom:'1.5rem',fontSize:'0.82rem',textAlign:'left'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{color:'var(--mid)'}}>Producto</span><span style={{fontWeight:600}}>{listing.title}</span></div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{color:'var(--mid)'}}>Cantidad</span><span style={{fontWeight:600}}>{quantity} {listing.unit}</span></div>
          <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--mid)'}}>Total pagado</span><span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.1rem'}}>${total}</span></div>
        </div>
        <button onClick={()=>setPage('orders')} style={{...S.primaryBtn,width:'100%',padding:'0.9rem',fontSize:'0.85rem',marginBottom:'0.5rem'}}>📦 Ver mis órdenes</button>
        <button onClick={()=>setPage('browse')} style={{...S.ghostBtn,width:'100%',padding:'0.7rem',fontSize:'0.78rem',color:'var(--concrete)',border:'1px solid rgba(42,40,37,0.2)'}}>Seguir comprando</button>
      </div>
    </div>
  );

  return (
    <div style={{marginTop:58,minHeight:'calc(100vh - 58px)',background:'var(--pale)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'3rem 1rem'}}>
      <div style={{width:'100%',maxWidth:520}}>
        <button onClick={()=>setPage('listing')} style={{...S.ghostBtn,marginBottom:'1.5rem'}}>← Volver</button>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'2rem',color:'var(--concrete)',marginBottom:'0.25rem'}}>CHECKOUT</div>
        <p style={{color:'var(--mid)',fontSize:'0.82rem',marginBottom:'2rem'}}>🔒 Pago seguro protegido por Stripe</p>

        {/* ORDER SUMMARY */}
        <div style={{background:'#fff',border:'1px solid rgba(42,40,37,0.1)',borderRadius:4,padding:'1.5rem',marginBottom:'1.5rem'}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mid)',marginBottom:'1rem'}}>Resumen de orden</div>
          <div style={{display:'flex',gap:'1rem',alignItems:'center',marginBottom:'1rem',paddingBottom:'1rem',borderBottom:'1px solid rgba(42,40,37,0.08)'}}>
            <div style={{width:56,height:56,background:'linear-gradient(140deg,#e8e0d0,#d4c8b4)',borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem',flexShrink:0}}>{CAT_EMOJIS[listing.category]||'📦'}</div>
            <div>
              <div style={{fontWeight:600,fontSize:'0.9rem',color:'var(--concrete)'}}>{listing.title}</div>
              <div style={{fontSize:'0.75rem',color:'var(--mid)',marginTop:2}}>{listing.seller_name} · {listing.location}</div>
            </div>
          </div>
          {[['Precio unitario',`$${Number(listing.price).toFixed(2)} / ${listing.unit}`],['Cantidad',`${quantity} ${listing.unit}`],['Subtotal',`$${total}`],['Comisión Surplenta (5%)',`$${commission}`]].map(([k,v])=>(
            <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:'0.82rem',marginBottom:6}}>
              <span style={{color:'var(--mid)'}}>{k}</span><span style={{fontWeight:500}}>{v}</span>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',borderTop:'1px solid rgba(42,40,37,0.1)',paddingTop:10,marginTop:8}}>
            <span style={{fontWeight:700,fontSize:'0.9rem'}}>Total</span>
            <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.4rem',color:'var(--concrete)'}}>${total} USD</span>
          </div>
        </div>

        {/* CARD FORM */}
        <div style={{background:'#fff',border:'1px solid rgba(42,40,37,0.1)',borderRadius:4,padding:'1.5rem'}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mid)',marginBottom:'1rem'}}>Datos de pago</div>
          {loading ? (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem',gap:'0.75rem',color:'var(--mid)',fontSize:'0.82rem'}}>
              <Spinner/> Cargando formulario de pago…
            </div>
          ) : (
            <>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mid)',marginBottom:'0.5rem'}}>Número de tarjeta</div>
              <div ref={mountedRef} style={{border:'1px solid rgba(42,40,37,0.18)',borderRadius:2,padding:'0.75rem 0.8rem',background:'var(--pale)',marginBottom:'1rem',minHeight:42}}/>
              {cardError && <div style={{color:'#c0392b',fontSize:'0.78rem',marginBottom:'1rem',background:'#fef0ed',padding:'0.5rem 0.75rem',borderRadius:2}}>{cardError}</div>}
              <button onClick={handlePay} disabled={paying||!cardReady} style={{...S.primaryBtn,width:'100%',padding:'0.9rem',fontSize:'0.88rem',background:'#2c6e49',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',opacity:(paying||!cardReady)?0.7:1}}>
                {paying?<Spinner light/>:'🔒'} {paying?'Procesando…':`Pagar $${total} USD`}
              </button>
              <div style={{textAlign:'center',marginTop:'0.75rem',fontFamily:"'Space Mono',monospace",fontSize:'0.58rem',color:'var(--mid)',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem'}}>
                🔒 Encriptado con SSL · Powered by Stripe
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
