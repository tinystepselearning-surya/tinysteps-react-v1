const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index.esm-CBIAImNe.js","assets/index.esm--kD0Wgs0.js"])))=>i.map(i=>d[i]);
import{d as ve,e as we,r as m,u as ke,j as s,L as J,_ as Q}from"./index-CYu5-m5p.js";import{u as Se}from"./useAuth-JS0GfMos.js";const v=8,K={s:"sss",a:"aaa",t:"t",p:"p",i:"iii",n:"nnn"},_=[{id:1,title:"Level 1",items:[{grapheme:"s",cue:"sss"},{grapheme:"a",cue:"aaa"},{grapheme:"t",cue:"t"},{grapheme:"i",cue:"iii"},{grapheme:"p",cue:"p"},{grapheme:"n",cue:"nnn"}],choicesCount:2},{id:2,title:"Level 2",items:[{grapheme:"c",cue:"c"},{grapheme:"k",cue:"k"},{grapheme:"e",cue:"e"},{grapheme:"h",cue:"h"},{grapheme:"r",cue:"r"},{grapheme:"m",cue:"m"},{grapheme:"d",cue:"d"}],choicesCount:2},{id:3,title:"Level 3",items:[{grapheme:"g",cue:"g"},{grapheme:"o",cue:"o"},{grapheme:"u",cue:"u"},{grapheme:"l",cue:"l"},{grapheme:"f",cue:"f"},{grapheme:"b",cue:"b"}],choicesCount:2},{id:4,title:"Level 4",items:[{grapheme:"ai",cue:"ay"},{grapheme:"j",cue:"j"},{grapheme:"oa",cue:"oh"},{grapheme:"ie",cue:"igh"},{grapheme:"ee",cue:"ee"},{grapheme:"or",cue:"or"}],choicesCount:3},{id:5,title:"Level 5",items:[{grapheme:"z",cue:"z"},{grapheme:"w",cue:"w"},{grapheme:"ng",cue:"ng"},{grapheme:"v",cue:"v"},{grapheme:"oo",cue:"oo (moon)",display:"oo"},{grapheme:"oo2",cue:"oo (book)",display:"oo"}],choicesCount:3},{id:6,title:"Level 6",items:[{grapheme:"y",cue:"y"},{grapheme:"x",cue:"x"},{grapheme:"ch",cue:"ch"},{grapheme:"sh",cue:"sh"},{grapheme:"th",cue:"th (thin)",display:"th"},{grapheme:"th2",cue:"th (this)",display:"th"}],choicesCount:3},{id:7,title:"Level 7",items:[{grapheme:"qu",cue:"kw"},{grapheme:"ou",cue:"ow"},{grapheme:"oi",cue:"oy"},{grapheme:"ue",cue:"yoo"},{grapheme:"er",cue:"er"},{grapheme:"ar",cue:"ar"}],choicesCount:3}],$="ts_phonics_unlocked_level",R="ts_phonics_level_bestStars_v1",F="ts_phonics_level_progress_v1",je=l=>{try{const n=l?`${R}:${l}`:R;let o=localStorage.getItem(n);if(!o&&l){const a=localStorage.getItem(R);if(a){try{localStorage.setItem(n,a)}catch{}o=a}}return o?JSON.parse(o):{}}catch{return{}}},se=(l,n)=>{try{const o=n?`${R}:${n}`:R;localStorage.setItem(o,JSON.stringify(l))}catch{}},q=l=>{try{const n=l?`${F}:${l}`:F;let o=localStorage.getItem(n);if(!o&&l){const a=localStorage.getItem(F);if(a){try{localStorage.setItem(n,a)}catch{}o=a}}return o?JSON.parse(o):{}}catch{return{}}},ne=(l,n)=>{try{const o=n?`${F}:${n}`:F;localStorage.setItem(o,JSON.stringify(l))}catch{}},Ne=(l,n,o)=>{try{const a=q(o);a[l]=n,ne(a,o)}catch{}},_e=(l,n)=>{try{const o=q(n);delete o[l],ne(o,n)}catch{}},z=l=>{try{const n=l?`${$}:${l}`:$;let o=localStorage.getItem(n);if(!o&&l){const h=localStorage.getItem($);if(h){try{localStorage.setItem(n,h)}catch{}o=h}}const a=o?parseInt(o,10):1;return Number.isFinite(a)&&a>=1?Math.min(7,a):1}catch{return 1}},Le=(l,n)=>{try{const o=n?`${$}:${n}`:$;localStorage.setItem(o,String(Math.min(7,Math.max(1,l))))}catch{}},H="phonics_letter_sound",ae=async l=>{try{const{doc:n,getDoc:o,getFirestore:a}=await Q(async()=>{const{doc:N,getDoc:f,getFirestore:S}=await import("./index.esm-CBIAImNe.js");return{doc:N,getDoc:f,getFirestore:S}},__vite__mapDeps([0,1])),h=a(),w=n(h,"kids",l,"gameProgress",H),g=await o(w);return g.exists()?g.data():null}catch(n){return console.error("Failed to read game progress:",n),null}},U=async(l,n)=>{try{const{doc:o,setDoc:a,getFirestore:h,serverTimestamp:w}=await Q(async()=>{const{doc:f,setDoc:S,getFirestore:j,serverTimestamp:y}=await import("./index.esm-CBIAImNe.js");return{doc:f,setDoc:S,getFirestore:j,serverTimestamp:y}},__vite__mapDeps([0,1])),g=h(),N=o(g,"kids",l,"gameProgress",H);await a(N,{...n,lastPlayedAt:w()},{merge:!0})}catch(o){console.error("Failed to save game progress:",o)}},re=l=>{if("speechSynthesis"in window){window.speechSynthesis.cancel();const n=new SpeechSynthesisUtterance(l);n.rate=.9,window.speechSynthesis.speak(n)}},oe=l=>{const n=l.items.map(h=>h.grapheme),o=[];let a="";for(let h=0;h<v;h++){const w=n.filter(y=>y!==a),g=w[Math.floor(Math.random()*w.length)];a=g;const f=n.filter(y=>y!==g).sort(()=>.5-Math.random()),S=Math.max(0,l.choicesCount-1),j=[g,...f.slice(0,S)];Math.random()>.5&&j.reverse(),o.push({target:g,choices:j})}return o},Ce=()=>{const[l]=ve(),n=we(),{user:o}=Se();let a=l.get("kidId")||"";const[h,w]=m.useState([]),[g,N]=m.useState(0),[f,S]=m.useState(0),[j,y]=m.useState(null),[ie,L]=m.useState(null),[E,D]=m.useState(!1),[d,T]=m.useState(null),[ce,Y]=m.useState(z(a)),C=ke();m.useEffect(()=>{if(!a)try{let e=localStorage.getItem("ts_active_kid_v1");if(!e&&o?.uid&&(e=localStorage.getItem(`ts_parent_selected_kid_v1:${o.uid}`)),e){const t=new URLSearchParams(l);t.set("kidId",e),C({pathname:n.pathname,search:t.toString()},{replace:!0})}}catch{}},[a,o?.uid,l,n.pathname,C]),m.useEffect(()=>{if(a)try{localStorage.setItem("ts_active_kid_v1",a)}catch{}},[a]);const I=e=>{if(!a)return e;const t=e.includes("?")?"&":"?";return e.includes("kidId=")?e:`${e}${t}kidId=${encodeURIComponent(a)}`},B=m.useRef([]),P=()=>{B.current.forEach(e=>clearTimeout(e)),B.current=[]},[M,X]=m.useState(()=>je(a)),[le,W]=m.useState(!1),V=m.useRef(null),Z=m.useRef(0),A=m.useRef(null),de=()=>window.matchMedia("(max-width: 767px)").matches;async function ee(){try{V.current?.requestFullscreen?await V.current.requestFullscreen():document.documentElement.requestFullscreen&&await document.documentElement.requestFullscreen();try{document.body.classList.add("ts-immersive-game")}catch{}if(de()&&screen.orientation?.lock)try{await screen.orientation.lock("landscape")}catch{}}catch{}}async function O(){try{try{document.body.classList.remove("ts-immersive-game")}catch{}if(document.fullscreenElement&&document.exitFullscreen&&await document.exitFullscreen().catch(()=>{}),screen.orientation?.unlock)try{screen.orientation.unlock()}catch{}}catch{}}const x=h[g],G=m.useCallback(e=>{P();const t=_.find(c=>c.id===e);w(oe(t)),N(0),S(0),y(null),L(null),D(!1)},[]),te=m.useCallback(async e=>{P(),T(e),D(!1),y(null),L(null);let t=null,c=null;if(a)try{const r=await ae(a);if(r&&(r.bestStarsByLevel&&(c={},Object.entries(r.bestStarsByLevel).forEach(([i,p])=>{const u=parseInt(i,10);isNaN(u)||(c[u]=p)})),r.resume&&r.resume.level===e)){const i=r.resume,p=_.find(u=>u.id===e);if(p&&i.round>=0&&i.round<v&&i.stars>=0&&i.stars<=v&&i.questions&&Array.isArray(i.questions)&&i.questions.length===v){const u=p.items.map(b=>b.grapheme);i.questions.every(b=>b&&typeof b=="object"&&b.target&&u.includes(b.target)&&Array.isArray(b.choices)&&b.choices.length===p.choicesCount&&b.choices.includes(b.target))&&(t={questions:i.questions,currentRound:i.round,starsEarned:i.stars,updatedAt:i.updatedAt||Date.now()})}}}catch(r){console.warn("Firestore load failed, falling back to localStorage:",r)}if(c){const r={...M,...c};X(r),se(r,a)}if(!t){const i=q(a)[e];i&&Array.isArray(i.questions)&&i.questions.length===v&&typeof i.currentRound=="number"&&i.currentRound>=0&&i.currentRound<v&&typeof i.starsEarned=="number"&&i.starsEarned>=0&&i.starsEarned<=v&&(t=i)}if(t)w(t.questions),N(t.currentRound),S(t.starsEarned);else{const r=_.find(p=>p.id===e),i=oe(r);w(i),N(0),S(0)}},[a,M]);m.useEffect(()=>{const e=l.get("level"),t=e?parseInt(e,10):NaN,c=z(a);Y(c),!Number.isNaN(t)&&t>=1&&t<=7&&t<=c&&(T(t),G(t))},[l,G]);const me=m.useCallback(()=>{if(x){const t=_.flatMap(r=>r.items).find(r=>r.grapheme===x.target),c=t?t.cue:K[x.target]||x.target;re(c)}},[x]);m.useEffect(()=>{if(x){const t=_.flatMap(r=>r.items).find(r=>r.grapheme===x.target),c=t?t.cue:K[x.target]||x.target;re(c)}},[x]),m.useEffect(()=>()=>{P(),O()},[]),m.useEffect(()=>{d&&h.length>0&&!E&&Ne(d,{starsEarned:f,currentRound:g,questions:h,updatedAt:Date.now()},a)},[d,f,g,h,E]),m.useEffect(()=>{if(!a||!d||h.length===0||E)return;const e=Date.now(),t=e-Z.current,c=()=>{U(a,{resume:{level:d,round:g,stars:f,questions:h,updatedAt:e},version:1}).catch(r=>console.warn("Firestore autosave failed:",r)),Z.current=e};return t>=3e3?c():(A.current&&clearTimeout(A.current),A.current=window.setTimeout(c,3e3-t)),()=>{A.current&&clearTimeout(A.current)}},[a,d,g,f,h,E]),m.useEffect(()=>{const e=()=>{if(!document.fullscreenElement)try{O()}catch{}};return document.addEventListener("fullscreenchange",e),()=>document.removeEventListener("fullscreenchange",e)},[]);const ue=e=>{if(!j)if(L(e),e===x.target){y("correct"),W(!0);const t=f+1;S(r=>r+1);const c=window.setTimeout(()=>{if(W(!1),g<v-1)N(r=>r+1),y(null),L(null);else{if(D(!0),d){const r=M[d]||0;if(t>r){const i={...M,[d]:t};X(i),se(i,a)}if(_e(d,a),a){const i={};Object.entries({...M,[d]:Math.max(r,t)}).forEach(([u,k])=>{i[u]=k});const p={bestStarsByLevel:i,resume:null,version:1};t>=6?(async()=>{try{const{doc:u,updateDoc:k,getFirestore:b,arrayUnion:he}=await Q(async()=>{const{doc:fe,updateDoc:xe,getFirestore:be,arrayUnion:ye}=await import("./index.esm-CBIAImNe.js");return{doc:fe,updateDoc:xe,getFirestore:be,arrayUnion:ye}},__vite__mapDeps([0,1])),pe=b(),ge=u(pe,"kids",a,"gameProgress",H);await k(ge,{...p,completedLevels:he(d)})}catch{const k=(await ae(a))?.completedLevels||[],b=Array.from(new Set([...k,d]));await U(a,{...p,completedLevels:b})}})().catch(u=>console.warn("Firestore completion save failed:",u)):U(a,p).catch(u=>console.warn("Firestore completion save failed:",u))}}if(d&&t>=6&&d<7){const r=Math.max(z(a),d+1);Le(r,a),Y(r)}}},700);B.current.push(c)}else{y("wrong");const t=window.setTimeout(()=>{y(null),L(null)},350);B.current.push(t)}};return s.jsx("div",{ref:V,className:"ts-phonics-mission-root",children:d?x?s.jsxs("div",{className:"relative min-h-screen overflow-hidden text-white flex flex-col items-center justify-center p-4",style:{background:"linear-gradient(180deg, #0a0618 0%, #1a1040 50%, #0f1b4a 100%)",boxShadow:"inset 0 0 200px rgba(0,0,0,0.8)"},children:[s.jsx("style",{children:`
        /* Animations */
        @keyframes sparkle { 
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; } 
          50% { transform: scale(1.15) rotate(180deg); opacity: 0.9; } 
        }
        @keyframes sparkleBurst {
          0% { transform: scale(0) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.2) rotate(180deg); opacity: 0.8; }
          100% { transform: scale(1.5) rotate(360deg); opacity: 0; }
        }
        @keyframes gentleShake { 
          0%, 100% { transform: translateX(0); } 
          25% { transform: translateX(-8px); } 
          75% { transform: translateX(8px); } 
        }
        @keyframes comet { 
          0% { transform: translate(-100vw, 0) rotate(-30deg); opacity: 0; } 
          10% { opacity: 0.6; } 
          90% { opacity: 0.6; } 
          100% { transform: translate(200vw, -50vh) rotate(-30deg); opacity: 0; } 
        }
        @keyframes twinkle { 
          0%, 100% { opacity: 0.3; } 
          50% { opacity: 0.8; } 
        }
        @keyframes drift { 
          0% { transform: translate(0, 0); } 
          100% { transform: translate(15px, -15px); } 
        }
        
        /* Starfield with pseudo-elements */
        .starfield { 
          position: absolute; 
          inset: 0; 
          pointer-events: none; 
        }
        .starfield::before, .starfield::after {
          content: ''; 
          position: absolute; 
          inset: 0;
          background-image:
            radial-gradient(circle at 15% 20%, white 1px, transparent 1.1px),
            radial-gradient(circle at 85% 30%, white 0.8px, transparent 0.9px),
            radial-gradient(circle at 40% 70%, white 1px, transparent 1.1px),
            radial-gradient(circle at 70% 50%, white 0.9px, transparent 1px);
          background-size: 120px 120px;
          animation: twinkle 6s ease-in-out infinite, drift 80s linear infinite;
        }
        .starfield::after { 
          background-size: 180px 180px; 
          animation-delay: -3s; 
          animation-duration: 8s, 120s;
        }

        /* Mission panel sparkle burst on correct */
        .mission-panel.show-sparkle::after {
          content: '✨';
          position: absolute;
          top: 20%;
          right: 10%;
          font-size: 3rem;
          animation: sparkleBurst 0.6s ease-out;
          pointer-events: none;
        }

        /* Immersive mode: hide site header/nav and remove top spacing */
        .ts-immersive-game header,
        .ts-immersive-game nav,
        .ts-immersive-game [role="banner"],
        .ts-immersive-game .site-header,
        .ts-immersive-game .navbar {
          display: none !important;
        }

        .ts-immersive-game body,
        .ts-immersive-game #root,
        .ts-immersive-game main,
        .ts-immersive-game .min-h-screen {
          padding-top: 0 !important;
          margin-top: 0 !important;
        }

        /* Button states */
        .choice-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .choice-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
        }
        .choice-btn:active {
          transform: scale(0.98);
        }
        .choice-btn.sparkle-correct {
          animation: sparkle 0.6s ease-out;
          background: rgba(45, 212, 191, 0.6) !important;
          border-color: rgba(45, 212, 191, 1) !important;
          box-shadow: 0 0 60px rgba(45, 212, 191, 0.9), 0 0 120px rgba(45, 212, 191, 0.6) !important;
        }
        .choice-btn.shake-wrong {
          animation: gentleShake 0.35s ease-in-out;
        }

        @keyframes confettiFall {
          0% { top: -10%; opacity: 1; }
          80% { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) { 
          * { animation: none !important; transition: none !important; } 
        }
      `}),s.jsx("div",{className:"starfield","aria-hidden":"true"}),s.jsx("div",{className:"absolute top-1/3 left-0 w-32 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-50",style:{animation:"comet 20s linear infinite 3s"},"aria-hidden":"true"}),d?s.jsx("button",{type:"button",onClick:()=>{a&&d&&h.length>0&&!E&&U(a,{resume:{level:d,round:g,stars:f,questions:h,updatedAt:Date.now()},version:1}).catch(e=>console.warn("Firestore save on exit failed:",e)),O(),P(),T(null),w([]),y(null),L(null),D(!1),S(0),N(0),C(I("/kids/games/phonics/letter-sound"),{replace:!0})},className:"absolute top-5 right-5 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all duration-200 font-semibold shadow-lg text-white hover:text-white focus:text-white",style:{zIndex:50},children:"← Back to Levels"}):s.jsx(J,{to:I("/kids/games/phonics"),className:"absolute top-5 right-5 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all duration-200 font-semibold shadow-lg",style:{zIndex:50},children:"← Back to Phonics Library"}),E?s.jsxs("div",{className:"text-center z-10 p-8 bg-black/30 backdrop-blur-md rounded-3xl border border-white/20",children:[s.jsx("h1",{className:"text-6xl font-bold text-yellow-300 mb-4",children:"Mission Complete!"}),s.jsx("div",{className:"text-5xl mb-6",children:Array.from({length:v},(e,t)=>s.jsx("span",{className:"text-3xl",children:t<f?"★":"☆"},t))}),s.jsxs("p",{className:"text-2xl mb-4",children:["You earned ",f," stars!"]}),s.jsxs("div",{className:"flex items-center justify-center gap-4",children:[s.jsx("button",{onClick:()=>{d&&(G(d),ee())},className:"px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-2xl text-lg font-bold shadow-xl",type:"button",children:"Play Again 🚀"}),s.jsx("button",{onClick:()=>{O(),P(),T(null),w([]),y(null),L(null),C(I("/kids/games/phonics/letter-sound"),{replace:!0})},className:"px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-lg font-semibold",type:"button",children:"Choose Level"}),d&&f>=6&&d<7&&s.jsx("button",{onClick:()=>{const e=d+1,t=z(a);e<=t&&(te(e),C({pathname:"/kids/games/phonics/letter-sound",search:"?level="+e},{replace:!0}))},className:"px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-lg font-bold text-white",type:"button",children:"Next Level ▶"})]})]}):s.jsxs("div",{className:"w-full max-w-6xl mx-auto z-10 px-4",children:[s.jsx("div",{className:"mb-6 flex justify-center gap-2","aria-label":`Progress: ${f} of ${v} stars earned`,children:Array.from({length:v},(e,t)=>s.jsx("span",{className:"text-3xl",children:t<f?"★":"☆"},t))}),s.jsx("div",{className:`mission-panel p-6 md:p-8 bg-black/30 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl relative ${j==="correct"?"show-sparkle":""}`,children:s.jsxs("div",{className:"flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-stretch",children:[s.jsxs("div",{className:"flex-1 flex flex-col items-center justify-center text-center",children:[s.jsx("p",{className:"text-xl md:text-2xl font-semibold mb-4 text-purple-200",children:"Tap the letter that says this sound:"}),s.jsx("div",{className:"text-8xl md:text-9xl lg:text-[10rem] font-bold text-white mb-6",children:(()=>{const t=_.flatMap(c=>c.items).find(c=>c.grapheme===x.target);return t?t.display||t.grapheme:x.target})()}),s.jsx("button",{onClick:me,className:"px-6 py-3 bg-white/20 rounded-xl hover:bg-white/30 text-lg md:text-xl font-semibold transition-colors shadow-lg",type:"button","aria-label":"Hear sound again",children:"🔊 Hear Again"})]}),s.jsx("div",{className:"flex-1 flex flex-col gap-4 md:gap-6 justify-center",children:x.choices.map(e=>s.jsx("button",{type:"button",onClick:()=>ue(e),"aria-label":`Choose ${(()=>{const c=_.flatMap(r=>r.items).find(r=>r.grapheme===e);return c?c.display||c.grapheme:e})()}`,className:`choice-btn p-6 md:p-8 rounded-2xl border-4 border-white/30 bg-white/10 flex items-center justify-center min-h-[100px] md:min-h-[120px]
                      ${j==="correct"&&e===x.target?"sparkle-correct":""}
                      ${j==="wrong"&&e===ie?"shake-wrong":""}
                    `,children:s.jsx("span",{className:"text-6xl md:text-7xl lg:text-8xl font-bold",children:(()=>{const c=_.flatMap(r=>r.items).find(r=>r.grapheme===e);return c?c.display||c.grapheme:e})()})},e))})]})}),j==="correct"&&s.jsx("div",{className:"mt-6 text-center text-3xl text-green-300 font-bold",children:"Great job! ✨"}),j==="wrong"&&s.jsx("div",{className:"mt-6 text-center text-3xl text-yellow-300 font-bold",children:"Try again! 🌟"}),!("speechSynthesis"in window)&&s.jsxs("p",{className:"mt-4 text-center text-sm text-gray-400",children:["Say the sound: /",K[x.target],"/"]}),le&&s.jsx("div",{style:{position:"fixed",inset:0,pointerEvents:"none",zIndex:60,overflow:"hidden"},"aria-hidden":"true",children:Array.from({length:24}).map((e,t)=>{const c=Math.random()*100,r=Math.random()*.3,i=1.2+Math.random()*.6,p=Math.random()*360,u=["#fbbf24","#34d399","#60a5fa","#f87171","#a78bfa","#fb923c"],k=u[Math.floor(Math.random()*u.length)];return s.jsx("div",{style:{position:"absolute",left:`${c}%`,top:"-10%",width:"10px",height:"10px",backgroundColor:k,borderRadius:"2px",animation:`confettiFall ${i}s linear ${r}s forwards`,transform:`rotate(${p}deg)`}},t)})})]})]}):s.jsxs("div",{className:"relative min-h-screen flex items-center justify-center text-white text-2xl font-semibold",style:{background:"linear-gradient(180deg, #0a0618 0%, #1a1040 50%, #0f1b4a 100%)",boxShadow:"inset 0 0 200px rgba(0,0,0,0.8)"},children:[s.jsx("div",{className:"starfield","aria-hidden":"true"}),"Loading Mission..."]}):s.jsxs("div",{className:"relative min-h-screen flex flex-col items-center justify-start py-12 px-4 overflow-hidden",style:{background:"linear-gradient(180deg, #050510 0%, #150a2b 35%, #0b2a5e 100%)",boxShadow:"inset 0 0 160px rgba(0,0,0,0.75)"},children:[s.jsx("style",{children:`
          .level-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:16px; max-width:900px; }
          .level-card { padding:18px; border-radius:16px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); cursor:pointer; }
          .level-card.locked { opacity:0.4; cursor:not-allowed; }
          @media (prefers-reduced-motion: reduce) { .level-card { transition:none !important } }
        `}),s.jsx(J,{to:I("/kids/games/phonics"),className:"absolute top-5 right-5 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all duration-200 font-semibold shadow-lg text-white hover:text-white focus:text-white",style:{zIndex:50},children:"← Back to Phonics Library"}),s.jsxs("div",{className:"w-full max-w-6xl mx-auto text-center mb-8",children:[s.jsx("h1",{className:"text-5xl font-bold text-white",children:"Choose Level"}),s.jsx("p",{className:"text-white/70 mt-2",children:"Pick a Jolly Phonics level to play"}),!a&&s.jsxs("div",{className:"mt-6 p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-lg max-w-md mx-auto",children:[s.jsx("p",{className:"text-yellow-200 font-semibold mb-3",children:"⚠️ No child selected"}),s.jsx("p",{className:"text-yellow-100/80 text-sm mb-4",children:"Please go back and choose a child to track progress."}),s.jsx(J,{to:I("/parent"),className:"inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors",children:"← Back to Parent Dashboard"})]})]}),s.jsx("div",{className:"level-grid w-full max-w-3xl mx-auto",children:_.map(e=>{const t=e.id>ce,c=M[e.id]||0,i=q(a)[e.id];let p="Not started",u=0;return c>=6?(p="Completed",u=c):i&&(i.starsEarned>0||i.currentRound>0)?(p="In progress",u=i.starsEarned):c>0&&(p="In progress",u=c),s.jsx("button",{type:"button","aria-label":`Level ${e.id} ${e.title}`,onClick:()=>{t||(te(e.id),ee())},className:`level-card ${t?"locked":""}`,children:s.jsxs("div",{className:"flex flex-col gap-3",children:[s.jsxs("div",{className:"flex items-center justify-between",children:[s.jsxs("div",{children:[s.jsx("div",{className:"text-2xl font-bold text-white",children:e.title}),s.jsx("div",{className:"text-sm text-white/80 mt-2",children:e.items.map(k=>k.display||k.grapheme).slice(0,6).join(" ")})]}),s.jsx("div",{className:"text-sm text-white/60",children:t?"Locked 🔒":"Play"})]}),s.jsxs("div",{className:"flex items-center justify-between",children:[s.jsx("div",{"aria-label":`Stars: ${u} of ${v}`,className:"text-yellow-300",children:Array.from({length:v}).map((k,b)=>s.jsx("span",{className:`text-sm mr-0.5 ${b<u?"text-yellow-300":"text-white/30"}`,children:"★"},b))}),s.jsx("div",{className:"text-sm text-white/60",children:p})]})]})},e.id)})})]})})};export{Ce as default};
