import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase.js";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CATEGORIES = ["Todos","Bloques","Acero","Madera","Techos","Plomería","Cemento","Pintura","Pisos","Eléctrico","Herramientas","Ferretería","Ventanas"];
const CONDITIONS = { new:"Nuevo", used:"Usado", bulk:"Al mayor" };
const CAT_IMAGES = {
  Bloques:"https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80&fit=crop",
  Acero:"https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&q=80&fit=crop",
  Madera:"https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=400&q=80&fit=crop",
  Techos:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80&fit=crop",
  Plomería:"https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80&fit=crop",
  Cemento:"https://images.unsplash.com/photo-1517578430898-be07c4a6c2cd?w=400&q=80&fit=crop",
  Pintura:"https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&q=80&fit=crop",
  Pisos:"https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80&fit=crop",
  Eléctrico:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80&fit=crop",
  Herramientas:"https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80&fit=crop",
  Ferretería:"https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400&q=80&fit=crop",
  Ventanas:"https://images.unsplash.com/photo-1527030280862-64139fba04ca?w=400&q=80&fit=crop",
  default:"https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&q=80&fit=crop"
};
const CAT_EMOJIS = CAT_IMAGES;

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
    {"&#9733;".repeat(Math.round(val))}{"&#9734;".repeat(5-Math.round(val))}
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
      <div style={{height:140,background:"#1a1917",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
        <img src={CAT_IMAGES[listing.category]||CAT_IMAGES.default} alt={listing.category} style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.85}}/>
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
          <span style={{fontSize:"0.65rem",color:"var(--mid)"}}>{listing.location}</span>
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
          {[
            {bg:"https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=120&q=80&fit=crop",label:"Bloques"},
            {bg:"https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=120&q=80&fit=crop",label:"Acero"},
            {bg:"https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=120&q=80&fit=crop",label:"Madera"},
            {bg:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&q=80&fit=crop",label:"Techos"},
            {bg:"https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=120&q=80&fit=crop",label:"Plomeria"},
          ].map((e,i)=>(
            <div key={i} style={{background:"linear-gradient(160deg,rgba(50,45,38,0.9),rgba(26,25,23,0.95))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2.5rem",gridRow:i===0||i===3?"span 2":"auto"}}>
              <span style={{opacity:0.35}}>{e}</span>
            </div>
          ))}
        </div>
      </div>
      {/* TRUST */}
      <div style={{background:"var(--rust)",padding:"0.8rem 3rem",display:"flex",alignItems:"center",justifyContent:"space-around",flexWrap:"wrap",gap:"0.75rem"}}>
        {["Vendedores verificados","Entrega en Panamá","Pagos seguros","Chat directo"].map(t=>(
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
          {Object.entries(CAT_IMAGES).filter(([c])=>c!=="default").map(([cat,img])=>(
            <button key={cat} onClick={()=>{setFilter({q:"",category:cat});setPage("browse");}}
              style={{background:"#fff",padding:"1.5rem 1rem",border:"none",textAlign:"left",display:"flex",flexDirection:"column",gap:"0.5rem",cursor:"pointer",transition:"background .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="#faf5ed"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
              <div style={{width:40,height:40,borderRadius:3,overflow:"hidden",background:"#e8e0d0"}}>
                <img src={img} alt={cat} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              </div>
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
          {[["01","Busca","Explora miles de anuncios. Filtra por categoría, ubicación o precio."],["02","Contacta","Chatea directo con el vendedor para negociar y coordinar."],["03","Paga seguro","Tu dinero en escrow hasta confirmar la entrega."],["04","Recibe en obra","Entrega a domicilio o retiro en punto. Califica al vendedor."]].map(([ic,ti,de],i)=>(
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
            <div style={{fontSize:"3rem",marginBottom:"1rem"}}></div>
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
          <div style={{borderRadius:4,height:280,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",marginBottom:"1.5rem",overflow:"hidden",background:"#1a1917"}}>
            <img src={CAT_IMAGES[listing.category]||CAT_IMAGES.default} alt={listing.category} style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.9}}/>
            <div style={{position:"absolute",top:12,left:12}}><Badge type={listing.condition}/></div>
          </div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.62rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--rust)",marginBottom:8}}>{listing.category}</div>
          <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2.2rem",letterSpacing:"0.03em",color:"var(--concrete)",lineHeight:1.1,marginBottom:"1rem"}}>{listing.title}</h1>
          <p style={{fontSize:"0.9rem",lineHeight:1.8,color:"var(--mid)",marginBottom:"1.5rem"}}>{listing.description}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem"}}>
            {[["Ubicación",listing.location],["Cantidad mín.",`${listing.min_qty||1} ${listing.unit}`],["Condición",CONDITIONS[listing.condition]||listing.condition],["Publicado",new Date(listing.created_at).toLocaleDateString("es-PA")]].map(([k,v])=>(
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
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:"var(--mid)"}}>ITBMS (7%)</span><span style={{color:"var(--mid)"}}>${(listing.price*qty*0.07).toFixed(2)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid rgba(42,40,37,0.1)",paddingTop:6,marginTop:4}}><span style={{fontWeight:600}}>Total</span><span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.2rem"}}>${(listing.price*qty*1.07).toFixed(2)} USD</span></div>
              <div style={{fontSize:"0.65rem",color:"var(--mid)",marginTop:4}}>Comisión 5% descontada al vendedor</div>
            </div>
            <button onClick={buyNow} style={{...S.primaryBtn,width:"100%",padding:"0.9rem",fontSize:"0.85rem",borderRadius:2,marginBottom:"0.5rem",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",background:"#2c6e49"}}>
               Comprar ahora
            </button>
            <button onClick={contact} style={{...S.ghostBtn,width:"100%",padding:"0.75rem",fontSize:"0.78rem",borderRadius:2,textAlign:"center",color:"var(--concrete)",border:"1px solid rgba(42,40,37,0.2)"}}>Contactar vendedor</button>
          </div>
          <div style={{background:"#fff",border:"1px solid rgba(42,40,37,0.12)",borderRadius:4,padding:"1.2rem"}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.58rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--mid)",marginBottom:"0.75rem"}}>Vendedor</div>
            <div style={{fontWeight:600,fontSize:"0.95rem",color:"var(--concrete)",marginBottom:4}}>{listing.seller_name||"Vendedor"}</div>
            <StarRating val={listing.seller_rating||5}/>
            <div style={{marginTop:"0.75rem",fontFamily:"'Space Mono',monospace",fontSize:"0.6rem",color:"var(--mid)"}}>Pago protegido por Stripe</div>
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
            {[["Anuncios",mine.length],["Miembro desde",new Date(user.created_at||Date.now()).toLocaleDateString("es-PA")]].map(([k,v])=>(
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
              <div style={{width:48,height:48,borderRadius:4,overflow:"hidden",margin:"0 auto 0.75rem",background:"#e8e0d0"}}><img src={CAT_IMAGES.default} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.5}}/></div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.3rem",color:"var(--concrete)"}}>NINGÚN ANUNCIO AÚN</div>
              <p style={{color:"var(--mid)",fontSize:"0.82rem",marginTop:"0.5rem"}}>Publica tu primer material.</p>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
              {mine.map(l=>(
                <div key={l.id} style={{background:"#fff",border:"1px solid rgba(42,40,37,0.1)",borderRadius:4,padding:"1rem 1.2rem",display:"flex",alignItems:"center",gap:"1rem"}}>
                  <div style={{width:44,height:44,borderRadius:4,overflow:"hidden",flexShrink:0,background:"#1a1917"}}>
                    <img src={CAT_IMAGES[l.category]||CAT_IMAGES.default} alt={l.category} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  </div>
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
            <div style={{width:48,height:48,borderRadius:"50%",background:"var(--line)",margin:"0 auto"}}></div>
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


// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer({setPage}) {
  const NavLink = ({label, onClick}) => (
    <button onClick={onClick} style={{display:"block",background:"none",border:"none",cursor:"pointer",fontSize:"0.78rem",color:"var(--mid)",marginBottom:"0.5rem",textAlign:"left",padding:0,fontFamily:"'DM Sans',sans-serif",transition:"color .15s"}}
      onMouseEnter={e=>e.target.style.color="var(--sand)"}
      onMouseLeave={e=>e.target.style.color="var(--mid)"}
    >{label}</button>
  );
  return (
    <footer style={{background:"var(--ash)",borderTop:"1px solid var(--line)",padding:"3rem 3rem 2rem"}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:"3rem",marginBottom:"2.5rem"}}>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.8rem",color:"var(--sand)",letterSpacing:"0.1em",marginBottom:"0.75rem"}}>
              SURPL<span style={{color:"var(--rust)"}}>E</span>NTA
            </div>
            <p style={{fontSize:"0.8rem",color:"var(--mid)",lineHeight:1.9,maxWidth:"30ch",marginBottom:"1.5rem"}}>El marketplace de materiales de construcción de Panamá. Compra y vende con pago protegido por escrow.</p>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.6rem",color:"var(--mid)",letterSpacing:"0.05em"}}>surplenta.com.pa</div>
          </div>
          <div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.58rem",letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--steel)",marginBottom:"1.2rem"}}>Marketplace</div>
            <NavLink label="Explorar materiales" onClick={()=>setPage("browse")}/>
            <NavLink label="Publicar anuncio" onClick={()=>setPage("publish")}/>
            <NavLink label="Mis ordenes" onClick={()=>setPage("orders")}/>
            <NavLink label="Mi cuenta" onClick={()=>setPage("dashboard")}/>
          </div>
          <div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.58rem",letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--steel)",marginBottom:"1.2rem"}}>Soporte</div>
            <NavLink label="Como funciona" onClick={()=>setPage("how")}/>
            <NavLink label="Como pagar" onClick={()=>setPage("how")}/>
            <NavLink label="Sistema escrow" onClick={()=>setPage("how")}/>
            <NavLink label="Contacto" onClick={()=>setPage("contact")}/>
          </div>
          <div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.58rem",letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--steel)",marginBottom:"1.2rem"}}>Legal</div>
            <NavLink label="Terminos de uso" onClick={()=>setPage("terms")}/>
            <NavLink label="Privacidad" onClick={()=>setPage("privacy")}/>
            <NavLink label="Aviso legal" onClick={()=>setPage("legal")}/>
          </div>
        </div>
        <div style={{borderTop:"1px solid var(--line)",paddingTop:"1.5rem",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"1rem"}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.6rem",color:"var(--mid)",letterSpacing:"0.05em"}}>
            © 2026 Surplenta. Todos los derechos reservados.
          </div>
          <div style={{display:"flex",gap:"2rem"}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.58rem",color:"var(--mid)"}}>Pagos procesados por Stripe</div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:"0.58rem",color:"var(--mid)"}}>Hecho en Panama</div>
          </div>
        </div>
      </div>
    </footer>
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

  // Init: check session + load listings + handle /admin route
  useEffect(()=>{
    if(window.location.pathname === '/admin') setPage('adminlogin');
    (async()=>{
      const {data:{session}} = await supabase.auth.getSession();
      if(session){
        const {data:profile} = await supabase.from("profiles").select("*").eq("id",session.user.id).single();
        setUser({...session.user,...profile, role: profile?.role || 'user'});
        if(profile?.role === 'admin' && window.location.pathname === '/admin') setPage('admin');
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
      {p==="how"&&<HowItWorksPage setPage={setPage}/>}
      {p==="terms"&&<TermsPage setPage={setPage}/>}
      {p==="privacy"&&<PrivacyPage setPage={setPage}/>}
      {p==="legal"&&<TermsPage setPage={setPage}/>}
      {p==="contact"&&<ContactPage setPage={setPage}/>}
      {p==="admin"&&<AdminPanel user={user} setPage={setPage} showToast={showToast}/>}
      {p==="adminlogin"&&<AdminLoginPage setPage={setPage} onAuth={setUser} showToast={showToast}/>}
      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
      <Footer setPage={setPage}/>
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
    disputed:{l:"En disputa",c:"#ef4444",bg:"#fee2e2"},
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
          <div style={{width:56,height:56,borderRadius:4,overflow:"hidden",margin:"0 auto 1rem",background:"#e8e0d0"}}><img src={CAT_IMAGES.default} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.4}}/></div>
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
                  {[["Pago",true],["Enviado",order.seller_confirmed||["shipped","delivered","released"].includes(order.status)],["Recibido",order.buyer_confirmed||order.status==="released"],["Liberado",order.status==="released"]].map(([l,done],i)=>(
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
                {order.dispute_reason&&<div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:2,padding:"0.75rem",marginBottom:"1rem",fontSize:"0.8rem",color:"#991b1b"}}>Disputa: {order.dispute_reason}</div>}
                {order.admin_resolution&&<div style={{background:"#d1fae5",border:"1px solid #6ee7b7",borderRadius:2,padding:"0.75rem",marginBottom:"1rem",fontSize:"0.8rem",color:"#065f46"}}>Resolución: {order.admin_resolution}</div>}

                {/* ACTIONS */}
                <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
                  {canConfirmShipped&&<button onClick={()=>confirmShipped(order)} style={{...S.primaryBtn,padding:"0.5rem 1rem",fontSize:"0.72rem"}}>Confirmar envío</button>}
                  {canConfirmReceived&&<button onClick={()=>confirmReceived(order)} style={{...S.primaryBtn,padding:"0.5rem 1rem",fontSize:"0.72rem",background:"#2c6e49"}}>Confirmar recepción</button>}
                  {canDispute&&<button onClick={()=>openDispute(order)} style={{...S.ghostBtn,padding:"0.5rem 1rem",fontSize:"0.72rem",color:"#ef4444",border:"1px solid #fca5a5"}}>Abrir disputa</button>}
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

  const subtotal = listing ? (listing.price * quantity).toFixed(2) : "0.00";
  const tax = listing ? (listing.price * quantity * 0.07).toFixed(2) : "0.00";
  const total = listing ? (listing.price * quantity * 1.07).toFixed(2) : "0.00";
  const commission = listing ? (listing.price * quantity * 0.05).toFixed(2) : "0.00";
  const sellerPayout = listing ? (listing.price * quantity * (1 - 0.05)).toFixed(2) : "0.00";

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
        seller_payout: parseFloat(sellerPayout),
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
        <div style={{width:56,height:56,borderRadius:'50%',background:'#d1fae5',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1rem',fontSize:'1.5rem',color:'#065f46',fontWeight:700}}>OK</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'2rem',color:'var(--concrete)',marginBottom:'0.5rem'}}>¡PAGO EXITOSO!</div>
        <p style={{color:'var(--mid)',fontSize:'0.88rem',marginBottom:'2rem',lineHeight:1.7}}>Tu orden fue procesada. El dinero queda en escrow hasta que ambas partes confirmen la entrega.</p>
        <div style={{background:'var(--sand)',borderRadius:4,padding:'1rem',marginBottom:'1.5rem',fontSize:'0.82rem',textAlign:'left'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{color:'var(--mid)'}}>Producto</span><span style={{fontWeight:600}}>{listing.title}</span></div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{color:'var(--mid)'}}>Cantidad</span><span style={{fontWeight:600}}>{quantity} {listing.unit}</span></div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:'var(--mid)'}}>ITBMS (7%)</span><span style={{fontWeight:500}}>${tax}</span></div>
          <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--mid)'}}>Total pagado</span><span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.1rem'}}>${total} USD</span></div>
        </div>
        <button onClick={()=>setPage('orders')} style={{...S.primaryBtn,width:'100%',padding:'0.9rem',fontSize:'0.85rem',marginBottom:'0.5rem'}}>Ver mis órdenes</button>
        <button onClick={()=>setPage('browse')} style={{...S.ghostBtn,width:'100%',padding:'0.7rem',fontSize:'0.78rem',color:'var(--concrete)',border:'1px solid rgba(42,40,37,0.2)'}}>Seguir comprando</button>
      </div>
    </div>
  );

  return (
    <div style={{marginTop:58,minHeight:'calc(100vh - 58px)',background:'var(--pale)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'3rem 1rem'}}>
      <div style={{width:'100%',maxWidth:520}}>
        <button onClick={()=>setPage('listing')} style={{...S.ghostBtn,marginBottom:'1.5rem'}}>← Volver</button>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'2rem',color:'var(--concrete)',marginBottom:'0.25rem'}}>CHECKOUT</div>
        <p style={{color:'var(--mid)',fontSize:'0.82rem',marginBottom:'2rem'}}>Pago seguro protegido por Stripe</p>

        {/* ORDER SUMMARY */}
        <div style={{background:'#fff',border:'1px solid rgba(42,40,37,0.1)',borderRadius:4,padding:'1.5rem',marginBottom:'1.5rem'}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mid)',marginBottom:'1rem'}}>Resumen de orden</div>
          <div style={{display:'flex',gap:'1rem',alignItems:'center',marginBottom:'1rem',paddingBottom:'1rem',borderBottom:'1px solid rgba(42,40,37,0.08)'}}>
            <div style={{width:56,height:56,borderRadius:4,flexShrink:0,overflow:'hidden',background:'#1a1917'}}>
              <img src={CAT_IMAGES[listing.category]||CAT_IMAGES.default} alt={listing.category} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </div>
            <div>
              <div style={{fontWeight:600,fontSize:'0.9rem',color:'var(--concrete)'}}>{listing.title}</div>
              <div style={{fontSize:'0.75rem',color:'var(--mid)',marginTop:2}}>{listing.seller_name} · {listing.location}</div>
            </div>
          </div>
          {[['Precio unitario',`$${Number(listing.price).toFixed(2)} / ${listing.unit}`],['Cantidad',`${quantity} ${listing.unit}`],['Subtotal',`$${subtotal}`],['ITBMS (7%)',`$${tax}`]].map(([k,v])=>(
            <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:'0.82rem',marginBottom:6}}>
              <span style={{color:'var(--mid)'}}>{k}</span><span style={{fontWeight:500}}>{v}</span>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',borderTop:'1px solid rgba(42,40,37,0.1)',paddingTop:10,marginTop:8}}>
            <span style={{fontWeight:700,fontSize:'0.9rem'}}>Total</span>
            <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.4rem',color:'var(--concrete)'}}>${total} USD</span>
            <div style={{fontSize:'0.7rem',color:'var(--mid)',marginTop:4,textAlign:'right'}}>Comisión 5% descontada al vendedor</div>
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
                {paying?<Spinner light/>:'SSL'} {paying?'Procesando…':`Pagar $${total} USD (incl. ITBMS)`}
              </button>
              <div style={{textAlign:'center',marginTop:'0.75rem',fontFamily:"'Space Mono',monospace",fontSize:'0.58rem',color:'var(--mid)',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem'}}>
                SSL Encriptado con SSL · Powered by Stripe
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── STATIC PAGES ─────────────────────────────────────────────────────────────
function StaticPage({title, setPage, children}) {
  return (
    <div style={{marginTop:58,maxWidth:760,margin:"58px auto 0",padding:"3rem 2rem 4rem"}}>
      <button onClick={()=>setPage("home")} style={{...S.ghostBtn,marginBottom:"2rem"}}>← Volver</button>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2.5rem",color:"var(--concrete)",marginBottom:"2rem",letterSpacing:"0.03em"}}>{title}</div>
      <div style={{fontSize:"0.88rem",lineHeight:1.9,color:"var(--mid)"}}>{children}</div>
    </div>
  );
}

function HowItWorksPage({setPage}) {
  const steps = [
    ["Crea tu cuenta","Regístrate gratis en menos de un minuto. Solo necesitas tu correo electrónico."],
    ["Explora o publica","Busca materiales por categoría, precio o ubicación. O publica tu inventario con fotos y precio."],
    ["Compra con seguridad","Al hacer clic en Comprar ahora, el pago queda retenido en escrow — ni el vendedor ni Surplenta lo toca aún."],
    ["Confirma la entrega","Cuando recibes el material, confirmas la recepción. El vendedor confirma el envío. Al confirmar ambos, el pago se libera automáticamente."],
    ["Resolución de disputas","Si hay algún problema, abre una disputa y el equipo de Surplenta mediará en un plazo de 24-48 horas."],
  ];
  return (
    <StaticPage title="COMO FUNCIONA" setPage={setPage}>
      <div style={{display:"flex",flexDirection:"column",gap:"2rem",marginTop:"1rem"}}>
        {steps.map(([t,d],i)=>(
          <div key={i} style={{display:"flex",gap:"1.5rem",alignItems:"flex-start"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2rem",color:"var(--rust)",lineHeight:1,flexShrink:0,width:36}}>{i+1}</div>
            <div>
              <div style={{fontWeight:600,fontSize:"0.95rem",color:"var(--concrete)",marginBottom:6}}>{t}</div>
              <div style={{fontSize:"0.85rem",color:"var(--mid)",lineHeight:1.8}}>{d}</div>
            </div>
          </div>
        ))}
      </div>
    </StaticPage>
  );
}

function TermsPage({setPage}) {
  return (
    <StaticPage title="TERMINOS DE USO" setPage={setPage}>
      <p style={{marginBottom:"1.5rem"}}>Al usar Surplenta aceptas los siguientes términos. Surplenta es un marketplace que conecta compradores y vendedores de materiales de construcción en la República de Panamá.</p>
      <div style={{fontWeight:600,color:"var(--concrete)",marginBottom:8,marginTop:"1.5rem"}}>1. Uso del servicio</div>
      <p style={{marginBottom:"1rem"}}>Surplenta es una plataforma de intermediación. No somos propietarios de los materiales listados. La responsabilidad sobre la descripción, calidad y entrega de los productos recae en los vendedores.</p>
      <div style={{fontWeight:600,color:"var(--concrete)",marginBottom:8,marginTop:"1.5rem"}}>2. Pagos y escrow</div>
      <p style={{marginBottom:"1rem"}}>Los pagos se procesan a través de Stripe. El dinero queda retenido en escrow hasta que ambas partes confirmen la transacción. Surplenta cobra una comisión del 5% al vendedor por cada transacción exitosa.</p>
      <div style={{fontWeight:600,color:"var(--concrete)",marginBottom:8,marginTop:"1.5rem"}}>3. ITBMS</div>
      <p style={{marginBottom:"1rem"}}>Se aplica el Impuesto de Transferencia de Bienes Corporales Muebles y la Prestación de Servicios (ITBMS) del 7% conforme a la legislación panameña vigente.</p>
      <div style={{fontWeight:600,color:"var(--concrete)",marginBottom:8,marginTop:"1.5rem"}}>4. Disputas</div>
      <p style={{marginBottom:"1rem"}}>En caso de disputa, Surplenta mediará y emitirá una resolución en un plazo de 24 a 48 horas hábiles. La decisión de Surplenta es final en materia de liberación o devolución de fondos en escrow.</p>
      <div style={{fontWeight:600,color:"var(--concrete)",marginBottom:8,marginTop:"1.5rem"}}>5. Jurisdicción</div>
      <p>Este acuerdo se rige por las leyes de la República de Panamá. Cualquier controversia se resolverá ante los tribunales competentes de la Ciudad de Panamá.</p>
    </StaticPage>
  );
}

function PrivacyPage({setPage}) {
  return (
    <StaticPage title="POLITICA DE PRIVACIDAD" setPage={setPage}>
      <p style={{marginBottom:"1.5rem"}}>En Surplenta tomamos la privacidad de tus datos con seriedad. Esta política describe cómo recopilamos, usamos y protegemos tu información.</p>
      <div style={{fontWeight:600,color:"var(--concrete)",marginBottom:8,marginTop:"1.5rem"}}>Datos que recopilamos</div>
      <p style={{marginBottom:"1rem"}}>Nombre, correo electrónico, información de pago (procesada por Stripe, nunca almacenada por Surplenta), historial de transacciones y anuncios publicados.</p>
      <div style={{fontWeight:600,color:"var(--concrete)",marginBottom:8,marginTop:"1.5rem"}}>Uso de los datos</div>
      <p style={{marginBottom:"1rem"}}>Usamos tus datos para procesar transacciones, enviarte notificaciones relacionadas con tus órdenes y mejorar la plataforma. No vendemos ni compartimos tus datos con terceros para fines comerciales.</p>
      <div style={{fontWeight:600,color:"var(--concrete)",marginBottom:8,marginTop:"1.5rem"}}>Seguridad</div>
      <p style={{marginBottom:"1rem"}}>Todos los datos se almacenan de forma segura en Supabase con cifrado en tránsito y en reposo. Los pagos son procesados exclusivamente por Stripe bajo los estándares PCI DSS.</p>
      <div style={{fontWeight:600,color:"var(--concrete)",marginBottom:8,marginTop:"1.5rem"}}>Contacto</div>
      <p>Para ejercer tus derechos de acceso, rectificación o eliminación de datos, escríbenos a privacidad@surplenta.com.pa</p>
    </StaticPage>
  );
}

function ContactPage({setPage}) {
  const [form, setForm] = useState({name:"",email:"",msg:""});
  const [sent, setSent] = useState(false);
  return (
    <StaticPage title="CONTACTO" setPage={setPage}>
      {sent ? (
        <div style={{background:"#d1fae5",border:"1px solid #6ee7b7",borderRadius:4,padding:"1.5rem",textAlign:"center"}}>
          <div style={{fontWeight:600,color:"#065f46",marginBottom:4}}>Mensaje enviado</div>
          <div style={{fontSize:"0.82rem",color:"#047857"}}>Nos pondremos en contacto contigo en un plazo de 24 horas.</div>
        </div>
      ) : (
        <div style={{maxWidth:480}}>
          <p style={{marginBottom:"2rem"}}>Tienes preguntas, sugerencias o necesitas ayuda? Escríbenos.</p>
          <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            <div><label style={S.formLabel}>Nombre</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={S.formInput} placeholder="Tu nombre"/></div>
            <div><label style={S.formLabel}>Correo</label><input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} type="email" style={S.formInput} placeholder="tu@correo.com"/></div>
            <div><label style={S.formLabel}>Mensaje</label><textarea value={form.msg} onChange={e=>setForm(f=>({...f,msg:e.target.value}))} style={{...S.formInput,height:120,resize:"vertical"}} placeholder="Como podemos ayudarte?"/></div>
            <button onClick={()=>{ if(form.name&&form.email&&form.msg) setSent(true); }} style={{...S.primaryBtn,padding:"0.85rem",fontSize:"0.85rem"}}>Enviar mensaje</button>
          </div>
        </div>
      )}
    </StaticPage>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({user, setPage, showToast}) {
  const [tab, setTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [config, setConfig] = useState({commission_rate:"0.05", tax_rate:"0.07"});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') { setPage('home'); return; }
    loadAll();
  }, [user?.id]);

  const loadAll = async () => {
    setLoading(true);
    const [ls, os, us, cfg] = await Promise.all([
      supabase.from('listings').select('*').order('created_at', {ascending:false}),
      supabase.from('orders').select('*').order('created_at', {ascending:false}),
      supabase.from('profiles').select('*').order('created_at', {ascending:false}),
      supabase.from('config').select('*'),
    ]);
    const allListings = ls.data || [];
    const allOrders = os.data || [];
    const allUsers = us.data || [];
    setListings(allListings);
    setOrders(allOrders);
    setUsers(allUsers);
    setDisputes(allOrders.filter(o => o.status === 'disputed'));
    if (cfg.data) {
      const c = {};
      cfg.data.forEach(r => c[r.key] = r.value);
      setConfig(c);
    }
    const totalRevenue = allOrders.filter(o=>o.status==='released').reduce((s,o)=>s+Number(o.commission),0);
    const totalVolume = allOrders.filter(o=>['paid','shipped','delivered','released'].includes(o.status)).reduce((s,o)=>s+Number(o.total_amount),0);
    setStats({
      totalListings: allListings.length,
      activeListings: allListings.filter(l=>!l.removed).length,
      totalOrders: allOrders.length,
      paidOrders: allOrders.filter(o=>o.status==='paid').length,
      completedOrders: allOrders.filter(o=>o.status==='released').length,
      disputedOrders: allOrders.filter(o=>o.status==='disputed').length,
      totalUsers: allUsers.length,
      bannedUsers: allUsers.filter(u=>u.banned).length,
      totalRevenue,
      totalVolume,
    });
    setLoading(false);
  };

  const deleteListing = async (id) => {
    if (!confirm('Eliminar este anuncio?')) return;
    const {error} = await supabase.from('listings').delete().eq('id', id);
    if (!error) { setListings(p=>p.filter(l=>l.id!==id)); showToast('Anuncio eliminado'); }
  };

  const banUser = async (u) => {
    const reason = u.banned ? null : prompt('Razon del ban:');
    if (!u.banned && !reason) return;
    const {error} = await supabase.from('profiles').update({banned:!u.banned, ban_reason:reason}).eq('id', u.id);
    if (!error) {
      setUsers(p=>p.map(x=>x.id===u.id?{...x,banned:!u.banned,ban_reason:reason}:x));
      showToast(u.banned ? 'Usuario desbaneado' : 'Usuario baneado');
    }
  };

  const resolveDispute = async (order, resolution, refund) => {
    const newStatus = refund ? 'refunded' : 'released';
    const {error} = await supabase.from('orders').update({
      status: newStatus,
      admin_resolution: resolution,
      released_at: new Date().toISOString(),
    }).eq('id', order.id);
    if (!error) {
      setOrders(p=>p.map(o=>o.id===order.id?{...o,status:newStatus,admin_resolution:resolution}:o));
      setDisputes(p=>p.filter(o=>o.id!==order.id));
      showToast(refund ? 'Reembolso procesado' : 'Pago liberado al vendedor');
    }
  };

  const saveConfig = async () => {
    await Promise.all(Object.entries(config).map(([key,value]) =>
      supabase.from('config').update({value, updated_at:new Date().toISOString()}).eq('key', key)
    ));
    showToast('Configuracion guardada');
  };

  const TABS = [['stats','Estadisticas'],['listings','Anuncios'],['orders','Ordenes'],['disputes','Disputas'],['users','Usuarios'],['config','Configuracion']];

  const StatCard = ({label, value, sub, accent}) => (
    <div style={{background:'#fff',border:'1px solid rgba(42,40,37,0.1)',borderRadius:4,padding:'1.25rem 1.5rem',borderLeft:`3px solid ${accent||'var(--rust)'}`}}>
      <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mid)',marginBottom:6}}>{label}</div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'2rem',color:'var(--concrete)',lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:'0.72rem',color:'var(--mid)',marginTop:4}}>{sub}</div>}
    </div>
  );

  if (!user || user.role !== 'admin') return null;

  return (
    <div style={{marginTop:58,minHeight:'calc(100vh-58px)',background:'var(--pale)'}}>
      {/* ADMIN HEADER */}
      <div style={{background:'var(--ash)',borderBottom:'1px solid var(--line)',padding:'1rem 2rem',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.4rem',color:'var(--sand)',letterSpacing:'0.1em'}}>PANEL DE ADMINISTRACION</div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.58rem',color:'var(--mid)',marginTop:2}}>Surplenta · Admin: {user.name}</div>
        </div>
        {disputes.length > 0 && (
          <div style={{background:'#ef4444',color:'#fff',fontFamily:"'Space Mono',monospace",fontSize:'0.62rem',padding:'0.4rem 0.9rem',borderRadius:2}}>
            {disputes.length} disputa{disputes.length>1?'s':''} pendiente{disputes.length>1?'s':''}
          </div>
        )}
      </div>

      {/* TABS */}
      <div style={{background:'#fff',borderBottom:'1px solid rgba(42,40,37,0.1)',padding:'0 2rem',display:'flex',gap:0}}>
        {TABS.map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} style={{fontFamily:"'Space Mono',monospace",fontSize:'0.62rem',letterSpacing:'0.08em',textTransform:'uppercase',padding:'0.85rem 1.2rem',background:'none',border:'none',borderBottom:tab===v?'2px solid var(--rust)':'2px solid transparent',color:tab===v?'var(--rust)':'var(--mid)',cursor:'pointer',position:'relative'}}>
            {l}
            {v==='disputes'&&disputes.length>0&&<span style={{position:'absolute',top:8,right:4,background:'#ef4444',color:'#fff',borderRadius:'50%',width:14,height:14,fontSize:'0.5rem',display:'flex',alignItems:'center',justifyContent:'center'}}>{disputes.length}</span>}
          </button>
        ))}
      </div>

      <div style={{padding:'2rem',maxWidth:1200,margin:'0 auto'}}>
        {loading ? <div style={{display:'flex',justifyContent:'center',padding:'4rem'}}><Spinner/></div> : <>

        {/* STATS */}
        {tab==='stats'&&stats&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'1rem',marginBottom:'2rem'}}>
              <StatCard label="Volumen total" value={`$${stats.totalVolume.toFixed(0)}`} sub="en ordenes procesadas" accent="#2c6e49"/>
              <StatCard label="Comisiones ganadas" value={`$${stats.totalRevenue.toFixed(2)}`} sub="ordenes completadas" accent="var(--rust)"/>
              <StatCard label="Ordenes totales" value={stats.totalOrders} sub={`${stats.completedOrders} completadas`}/>
              <StatCard label="En proceso" value={stats.paidOrders} sub="esperando confirmacion" accent="#f59e0b"/>
              <StatCard label="Disputas activas" value={stats.disputedOrders} sub="requieren atencion" accent="#ef4444"/>
              <StatCard label="Anuncios activos" value={stats.activeListings} sub={`${stats.totalListings} total`} accent="#8b5cf6"/>
              <StatCard label="Usuarios" value={stats.totalUsers} sub={`${stats.bannedUsers} baneados`}/>
            </div>
            <div style={{background:'#fff',border:'1px solid rgba(42,40,37,0.1)',borderRadius:4,padding:'1.5rem'}}>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',marginBottom:'1rem'}}>Ultimas 5 ordenes</div>
              {orders.slice(0,5).map(o=>(
                <div key={o.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.75rem 0',borderBottom:'1px solid rgba(42,40,37,0.06)',fontSize:'0.82rem'}}>
                  <div>
                    <div style={{fontWeight:600,color:'var(--concrete)'}}>{o.listing_title}</div>
                    <div style={{fontSize:'0.72rem',color:'var(--mid)',marginTop:2}}>{o.buyer_email} → {o.seller_name}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontWeight:700,color:'var(--concrete)'}}>${Number(o.total_amount).toFixed(2)}</div>
                    <div style={{fontSize:'0.68rem',color:'var(--mid)',marginTop:2}}>{o.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LISTINGS */}
        {tab==='listings'&&(
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.3rem',color:'var(--concrete)',marginBottom:'1rem'}}>TODOS LOS ANUNCIOS ({listings.length})</div>
            <div style={{background:'#fff',border:'1px solid rgba(42,40,37,0.1)',borderRadius:4,overflow:'hidden'}}>
              {listings.map((l,i)=>(
                <div key={l.id} style={{display:'grid',gridTemplateColumns:'1fr auto auto auto',gap:'1rem',alignItems:'center',padding:'0.9rem 1.25rem',borderBottom:i<listings.length-1?'1px solid rgba(42,40,37,0.06)':'none'}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:'0.85rem',color:'var(--concrete)'}}>{l.title}</div>
                    <div style={{fontSize:'0.72rem',color:'var(--mid)',marginTop:2}}>{l.seller_name} · {l.category} · ${l.price}/{l.unit}</div>
                  </div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.62rem',color:'var(--mid)'}}>{l.location}</div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.6rem',color:'var(--mid)'}}>{new Date(l.created_at).toLocaleDateString('en-US')}</div>
                  <button onClick={()=>deleteListing(l.id)} style={{...S.ghostBtn,fontSize:'0.62rem',color:'#ef4444',border:'1px solid #fca5a5',padding:'0.3rem 0.7rem'}}>Eliminar</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ORDERS */}
        {tab==='orders'&&(
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.3rem',color:'var(--concrete)',marginBottom:'1rem'}}>TODAS LAS ORDENES ({orders.length})</div>
            <div style={{background:'#fff',border:'1px solid rgba(42,40,37,0.1)',borderRadius:4,overflow:'hidden'}}>
              {orders.map((o,i)=>(
                <div key={o.id} style={{display:'grid',gridTemplateColumns:'1fr auto auto auto',gap:'1rem',alignItems:'center',padding:'0.9rem 1.25rem',borderBottom:i<orders.length-1?'1px solid rgba(42,40,37,0.06)':'none'}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:'0.85rem',color:'var(--concrete)'}}>{o.listing_title}</div>
                    <div style={{fontSize:'0.72rem',color:'var(--mid)',marginTop:2}}>Comprador: {o.buyer_email} · Vendedor: {o.seller_name}</div>
                  </div>
                  <div style={{fontWeight:700,fontSize:'0.85rem',color:'var(--concrete)'}}>${Number(o.total_amount).toFixed(2)}</div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.6rem',padding:'0.25rem 0.6rem',borderRadius:2,background:o.status==='released'?'#d1fae5':o.status==='disputed'?'#fee2e2':o.status==='paid'?'#dbeafe':'#f3f4f6',color:o.status==='released'?'#065f46':o.status==='disputed'?'#991b1b':o.status==='paid'?'#1e40af':'#374151'}}>{o.status}</div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.6rem',color:'var(--mid)'}}>{new Date(o.created_at).toLocaleDateString('en-US')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DISPUTES */}
        {tab==='disputes'&&(
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.3rem',color:'var(--concrete)',marginBottom:'1rem'}}>DISPUTAS ACTIVAS ({disputes.length})</div>
            {disputes.length===0 ? (
              <div style={{background:'#fff',border:'1px solid rgba(42,40,37,0.1)',borderRadius:4,padding:'3rem',textAlign:'center',color:'var(--mid)',fontSize:'0.85rem'}}>No hay disputas activas.</div>
            ) : disputes.map(o=>(
              <div key={o.id} style={{background:'#fff',border:'1px solid #fca5a5',borderRadius:4,padding:'1.5rem',marginBottom:'1rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem'}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:'0.95rem',color:'var(--concrete)'}}>{o.listing_title}</div>
                    <div style={{fontSize:'0.75rem',color:'var(--mid)',marginTop:3}}>Comprador: {o.buyer_email} · Vendedor: {o.seller_name} · Total: ${Number(o.total_amount).toFixed(2)}</div>
                  </div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.6rem',color:'#991b1b'}}>{new Date(o.created_at).toLocaleDateString('en-US')}</div>
                </div>
                <div style={{background:'#fee2e2',borderRadius:2,padding:'0.75rem',marginBottom:'1rem',fontSize:'0.8rem',color:'#991b1b'}}>Razon: {o.dispute_reason}</div>
                <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>
                  <button onClick={()=>{const r=prompt('Resolucion (pago liberado al vendedor):');if(r)resolveDispute(o,r,false);}} style={{...S.primaryBtn,padding:'0.5rem 1rem',fontSize:'0.72rem',background:'#2c6e49'}}>Liberar pago al vendedor</button>
                  <button onClick={()=>{const r=prompt('Resolucion (reembolso al comprador):');if(r)resolveDispute(o,r,true);}} style={{...S.primaryBtn,padding:'0.5rem 1rem',fontSize:'0.72rem',background:'#ef4444'}}>Reembolsar al comprador</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* USERS */}
        {tab==='users'&&(
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.3rem',color:'var(--concrete)',marginBottom:'1rem'}}>USUARIOS ({users.length})</div>
            <div style={{background:'#fff',border:'1px solid rgba(42,40,37,0.1)',borderRadius:4,overflow:'hidden'}}>
              {users.map((u,i)=>(
                <div key={u.id} style={{display:'grid',gridTemplateColumns:'1fr auto auto auto',gap:'1rem',alignItems:'center',padding:'0.9rem 1.25rem',borderBottom:i<users.length-1?'1px solid rgba(42,40,37,0.06)':'none',opacity:u.banned?0.6:1}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:'0.85rem',color:'var(--concrete)'}}>{u.name} {u.role==='admin'&&<span style={{fontFamily:"'Space Mono',monospace",fontSize:'0.55rem',background:'var(--rust)',color:'#fff',padding:'0.15rem 0.4rem',borderRadius:2,marginLeft:6}}>ADMIN</span>}</div>
                    <div style={{fontSize:'0.72rem',color:'var(--mid)',marginTop:2}}>{u.email} · Desde {new Date(u.created_at).toLocaleDateString('en-US')}</div>
                    {u.ban_reason&&<div style={{fontSize:'0.68rem',color:'#ef4444',marginTop:2}}>Baneado: {u.ban_reason}</div>}
                  </div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.6rem',color:u.banned?'#ef4444':'#2c6e49'}}>{u.banned?'BANEADO':'ACTIVO'}</div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.6rem',color:'var(--mid)',textTransform:'uppercase'}}>{u.role}</div>
                  {u.role!=='admin'&&<button onClick={()=>banUser(u)} style={{...S.ghostBtn,fontSize:'0.62rem',color:u.banned?'#2c6e49':'#ef4444',border:`1px solid ${u.banned?'#6ee7b7':'#fca5a5'}`,padding:'0.3rem 0.7rem'}}>{u.banned?'Desbanear':'Banear'}</button>}
                  {u.role==='admin'&&<div style={{width:60}}/>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONFIG */}
        {tab==='config'&&(
          <div style={{maxWidth:480}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.3rem',color:'var(--concrete)',marginBottom:'1.5rem'}}>CONFIGURACION DE PLATAFORMA</div>
            <div style={{background:'#fff',border:'1px solid rgba(42,40,37,0.1)',borderRadius:4,padding:'1.5rem',display:'flex',flexDirection:'column',gap:'1.25rem'}}>
              <div>
                <label style={S.formLabel}>Comision de Surplenta (%)</label>
                <input type="number" step="0.01" min="0" max="0.5" value={(parseFloat(config.commission_rate||0.05)*100).toFixed(1)}
                  onChange={e=>setConfig(c=>({...c,commission_rate:(parseFloat(e.target.value)/100).toString()}))}
                  style={S.formInput}/>
                <div style={{fontSize:'0.72rem',color:'var(--mid)',marginTop:4}}>Porcentaje que Surplenta descuenta del pago al vendedor. Actual: {(parseFloat(config.commission_rate||0.05)*100).toFixed(1)}%</div>
              </div>
              <div>
                <label style={S.formLabel}>ITBMS (%)</label>
                <input type="number" step="0.01" min="0" max="0.3" value={(parseFloat(config.tax_rate||0.07)*100).toFixed(1)}
                  onChange={e=>setConfig(c=>({...c,tax_rate:(parseFloat(e.target.value)/100).toString()}))}
                  style={S.formInput}/>
                <div style={{fontSize:'0.72rem',color:'var(--mid)',marginTop:4}}>Impuesto aplicado al comprador. Ley panameña: 7%</div>
              </div>
              <div>
                <label style={S.formLabel}>Pago minimo al vendedor (USD)</label>
                <input type="number" step="1" min="1" value={config.min_payout||10}
                  onChange={e=>setConfig(c=>({...c,min_payout:e.target.value}))}
                  style={S.formInput}/>
              </div>
              <button onClick={saveConfig} style={{...S.primaryBtn,padding:'0.85rem',fontSize:'0.85rem'}}>Guardar cambios</button>
            </div>
          </div>
        )}

        </>}
      </div>
    </div>
  );
}

// ─── ADMIN LOGIN ───────────────────────────────────────────────────────────────
function AdminLoginPage({setPage, onAuth, showToast}) {
  const [form, setForm] = useState({email:'',password:''});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr(''); setLoading(true);
    const {data, error} = await supabase.auth.signInWithPassword({email:form.email, password:form.password});
    if (error) { setErr('Credenciales incorrectas'); setLoading(false); return; }
    const {data:profile} = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    if (!profile || profile.role !== 'admin') {
      await supabase.auth.signOut();
      setErr('No tienes permisos de administrador.');
      setLoading(false); return;
    }
    onAuth({...data.user, ...profile});
    setPage('admin');
    showToast('Bienvenido al panel de administracion');
    setLoading(false);
  };

  return (
    <div style={{minHeight:'100vh',background:'var(--ash)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:4,padding:'2.5rem',width:'100%',maxWidth:380,boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.8rem',color:'var(--concrete)',marginBottom:'0.25rem',letterSpacing:'0.05em'}}>ADMIN</div>
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.15em',color:'var(--mid)',textTransform:'uppercase',marginBottom:'2rem'}}>Surplenta · Acceso restringido</div>
        {err&&<div style={{background:'#fef0ed',border:'1px solid #f0a898',borderRadius:2,padding:'0.65rem',marginBottom:'1rem',fontSize:'0.8rem',color:'#c0392b'}}>{err}</div>}
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          <div><label style={S.formLabel}>Email</label><input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} type="email" style={S.formInput} placeholder="admin@surplenta.com.pa"/></div>
          <div><label style={S.formLabel}>Contrasena</label><input value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} type="password" style={S.formInput} onKeyDown={e=>e.key==='Enter'&&submit()}/></div>
          <button onClick={submit} disabled={loading} style={{...S.primaryBtn,width:'100%',padding:'0.85rem',fontSize:'0.85rem',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',opacity:loading?0.7:1}}>
            {loading&&<Spinner light/>}{loading?'Verificando...':'Entrar al panel'}
          </button>
        </div>
        <button onClick={()=>setPage('home')} style={{display:'block',width:'100%',textAlign:'center',marginTop:'1.25rem',fontSize:'0.78rem',color:'var(--mid)',background:'none',border:'none',cursor:'pointer'}}>Volver a Surplenta</button>
      </div>
    </div>
  );
}
