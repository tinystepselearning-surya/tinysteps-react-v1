const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-uo92nVyq.js","assets/index-CxgC9bed.css"])))=>i.map(i=>d[i]);
import{l as Ie,o as Ae,n as $e,r as d,u as De,j as s,L as de,_ as me}from"./index-uo92nVyq.js";import{recordLevelResult as ze}from"./recordLevelResult-CZiE3JEy.js";const N=8,Se={s:"sss",a:"aaa",t:"t",p:"p",i:"iii",n:"nnn"},R=[{id:1,title:"Level 1",items:[{grapheme:"s",cue:"sss"},{grapheme:"a",cue:"aaa"},{grapheme:"t",cue:"t"},{grapheme:"i",cue:"iii"},{grapheme:"p",cue:"p"},{grapheme:"n",cue:"nnn"}],choicesCount:2},{id:2,title:"Level 2",items:[{grapheme:"c",cue:"c"},{grapheme:"k",cue:"k"},{grapheme:"e",cue:"e"},{grapheme:"h",cue:"h"},{grapheme:"r",cue:"r"},{grapheme:"m",cue:"m"},{grapheme:"d",cue:"d"}],choicesCount:2},{id:3,title:"Level 3",items:[{grapheme:"g",cue:"g"},{grapheme:"o",cue:"o"},{grapheme:"u",cue:"u"},{grapheme:"l",cue:"l"},{grapheme:"f",cue:"f"},{grapheme:"b",cue:"b"}],choicesCount:2},{id:4,title:"Level 4",items:[{grapheme:"ai",cue:"ay"},{grapheme:"j",cue:"j"},{grapheme:"oa",cue:"oh"},{grapheme:"ie",cue:"igh"},{grapheme:"ee",cue:"ee"},{grapheme:"or",cue:"or"}],choicesCount:3},{id:5,title:"Level 5",items:[{grapheme:"z",cue:"z"},{grapheme:"w",cue:"w"},{grapheme:"ng",cue:"ng"},{grapheme:"v",cue:"v"},{grapheme:"oo",cue:"oo (moon)",display:"oo"},{grapheme:"oo2",cue:"oo (book)",display:"oo"}],choicesCount:3},{id:6,title:"Level 6",items:[{grapheme:"y",cue:"y"},{grapheme:"x",cue:"x"},{grapheme:"ch",cue:"ch"},{grapheme:"sh",cue:"sh"},{grapheme:"th",cue:"th (thin)",display:"th"},{grapheme:"th2",cue:"th (this)",display:"th"}],choicesCount:3},{id:7,title:"Level 7",items:[{grapheme:"qu",cue:"kw"},{grapheme:"ou",cue:"ow"},{grapheme:"oi",cue:"oy"},{grapheme:"ue",cue:"yoo"},{grapheme:"er",cue:"er"},{grapheme:"ar",cue:"ar"}],choicesCount:3}],W="ts_phonics_unlocked_level",K="ts_phonics_level_bestStars_v1",Q="ts_phonics_level_progress_v1";let ue=null;const Te=()=>(ue||(ue=new(window.AudioContext||window.webkitAudioContext)),ue),Be=()=>{try{const o=Te(),c=o.currentTime,n=t=>{const h=o.sampleRate*.12,S=o.createBuffer(1,h,o.sampleRate),b=S.getChannelData(0);for(let w=0;w<h;w++)b[w]=Math.random()*2-1;const M=o.createBufferSource();M.buffer=S;const g=o.createBiquadFilter();g.type="bandpass",g.frequency.value=1700,g.Q.value=2.5;const y=o.createGain();y.gain.setValueAtTime(0,t),y.gain.linearRampToValueAtTime(.12,t+.002),y.gain.exponentialRampToValueAtTime(.001,t+.1),M.connect(g),g.connect(y),y.connect(o.destination),M.start(t),M.stop(t+.12)};n(c),n(c+.13)}catch(o){console.warn("Clap sound failed:",o)}},Oe=o=>{try{const c=o?`${K}:${o}`:K;let n=localStorage.getItem(c);if(!n&&o){const t=localStorage.getItem(K);if(t){try{localStorage.setItem(c,t)}catch{}n=t}}return n?JSON.parse(n):{}}catch{return{}}},Me=(o,c)=>{try{const n=c?`${K}:${c}`:K;localStorage.setItem(n,JSON.stringify(o))}catch{}},ee=o=>{try{const c=o?`${Q}:${o}`:Q;let n=localStorage.getItem(c);if(!n&&o){const t=localStorage.getItem(Q);if(t){try{localStorage.setItem(c,t)}catch{}n=t}}return n?JSON.parse(n):{}}catch{return{}}},Le=(o,c)=>{try{const n=c?`${Q}:${c}`:Q;localStorage.setItem(n,JSON.stringify(o))}catch{}},Ue=(o,c,n)=>{try{const t=ee(n);t[o]=c,Le(t,n)}catch{}},qe=(o,c)=>{try{const n=ee(c);delete n[o],Le(n,c)}catch{}},H=o=>{try{const c=o?`${W}:${o}`:W;let n=localStorage.getItem(c);if(!n&&o){const h=localStorage.getItem(W);if(h){try{localStorage.setItem(c,h)}catch{}n=h}}const t=n?parseInt(n,10):1;return Number.isFinite(t)&&t>=1?Math.min(7,t):1}catch{return 1}},Ve=(o,c)=>{try{const n=c?`${W}:${c}`:W;localStorage.setItem(n,String(Math.min(7,Math.max(1,o))))}catch{}},pe="phonics_letter_sound",je=async o=>{try{const{doc:c,getDoc:n,getFirestore:t}=await me(async()=>{const{doc:M,getDoc:g,getFirestore:y}=await import("./index-uo92nVyq.js").then(w=>w.aW);return{doc:M,getDoc:g,getFirestore:y}},__vite__mapDeps([0,1])),h=t(),S=c(h,"kids",o,"gameProgress",pe),b=await n(S);return b.exists()?b.data():null}catch(c){return console.error("Failed to read game progress:",c),null}},Z=async(o,c)=>{try{const{doc:n,setDoc:t,getFirestore:h,serverTimestamp:S}=await me(async()=>{const{doc:g,setDoc:y,getFirestore:w,serverTimestamp:j}=await import("./index-uo92nVyq.js").then(te=>te.aW);return{doc:g,setDoc:y,getFirestore:w,serverTimestamp:j}},__vite__mapDeps([0,1])),b=h(),M=n(b,"kids",o,"gameProgress",pe);await t(M,{...c,lastPlayedAt:S()},{merge:!0})}catch(n){console.error("Failed to save game progress:",n)}},Ne=o=>{if("speechSynthesis"in window){window.speechSynthesis.cancel();const c=new SpeechSynthesisUtterance(o);c.rate=.9,window.speechSynthesis.speak(c)}},Ce=o=>{const c=o.items.map(h=>h.grapheme),n=[];let t="";for(let h=0;h<N;h++){const S=c.filter(j=>j!==t),b=S[Math.floor(Math.random()*S.length)];t=b;const g=c.filter(j=>j!==b).sort(()=>.5-Math.random()),y=Math.max(0,o.choicesCount-1),w=[b,...g.slice(0,y)];Math.random()>.5&&w.reverse(),n.push({target:b,choices:w})}return n},Ke=()=>{const[o]=Ie(),c=Ae(),{user:n}=$e();let t=o.get("kidId")||"";const[h,S]=d.useState([]),[b,M]=d.useState(0),[g,y]=d.useState(0),[w,j]=d.useState(null),[te,_]=d.useState(null),[$,J]=d.useState(!1),[m,Y]=d.useState(null),[Re,he]=d.useState(H(t)),T=De();d.useEffect(()=>{if(!t)try{let e=localStorage.getItem("ts_active_kid_v1");if(!e&&n?.uid&&(e=localStorage.getItem(`ts_parent_selected_kid_v1:${n.uid}`)),e){const r=new URLSearchParams(o);r.set("kidId",e),T({pathname:c.pathname,search:r.toString()},{replace:!0})}}catch{}},[t,n?.uid,o,c.pathname,T]),d.useEffect(()=>{if(t)try{localStorage.setItem("ts_active_kid_v1",t)}catch{}},[t]);const B=e=>{if(!t)return e;const r=e.includes("?")?"&":"?";return e.includes("kidId=")?e:`${e}${r}kidId=${encodeURIComponent(t)}`},O=d.useRef([]),U=()=>{O.current.forEach(e=>clearTimeout(e)),O.current=[]},[D,ge]=d.useState(()=>Oe(t)),se=d.useRef(null),re=d.useRef(!1),z=d.useRef(0),q=d.useRef(0),ae=d.useRef(0),E=d.useRef({}),[_e,fe]=d.useState(!1),[xe,be]=d.useState([]),oe=d.useRef(null),ye=d.useRef(0),V=d.useRef(null),Ee=()=>window.matchMedia("(max-width: 767px)").matches;async function we(){try{oe.current?.requestFullscreen?await oe.current.requestFullscreen():document.documentElement.requestFullscreen&&await document.documentElement.requestFullscreen();try{document.body.classList.add("ts-immersive-game")}catch{}if(Ee()&&screen.orientation?.lock)try{await screen.orientation.lock("landscape")}catch{}}catch{}}async function X(){try{try{document.body.classList.remove("ts-immersive-game")}catch{}if(document.fullscreenElement&&document.exitFullscreen&&await document.exitFullscreen().catch(()=>{}),screen.orientation?.unlock)try{screen.orientation.unlock()}catch{}}catch{}}const v=h[b],ne=d.useCallback(e=>{U();const r=R.find(i=>i.id===e);S(Ce(r)),M(0),y(0),j(null),_(null),J(!1)},[]),ve=d.useCallback(async e=>{U(),Y(e),J(!1),j(null),_(null),se.current=Date.now(),re.current=!1,z.current=0,q.current=0,ae.current=0,E.current={};let r=null,i=null;if(t)try{const l=await je(t);if(l&&(l.bestStarsByLevel&&(i={},Object.entries(l.bestStarsByLevel).forEach(([a,p])=>{const u=parseInt(a,10);isNaN(u)||(i[u]=p)})),l.resume&&l.resume.level===e)){const a=l.resume,p=R.find(u=>u.id===e);if(p&&a.round>=0&&a.round<N&&a.stars>=0&&a.stars<=N&&a.questions&&Array.isArray(a.questions)&&a.questions.length===N){const u=p.items.map(x=>x.grapheme);a.questions.every(x=>x&&typeof x=="object"&&x.target&&u.includes(x.target)&&Array.isArray(x.choices)&&x.choices.length===p.choicesCount&&x.choices.includes(x.target))&&(r={questions:a.questions,currentRound:a.round,starsEarned:a.stars,updatedAt:a.updatedAt||Date.now()})}}}catch(l){console.warn("Firestore load failed, falling back to localStorage:",l)}if(i){const l={...D,...i};ge(l),Me(l,t)}if(!r){const a=ee(t)[e];a&&Array.isArray(a.questions)&&a.questions.length===N&&typeof a.currentRound=="number"&&a.currentRound>=0&&a.currentRound<N&&typeof a.starsEarned=="number"&&a.starsEarned>=0&&a.starsEarned<=N&&(r=a)}if(r)S(r.questions),M(r.currentRound),y(r.starsEarned);else{const l=R.find(p=>p.id===e),a=Ce(l);S(a),M(0),y(0)}},[t,D]);d.useEffect(()=>{const e=o.get("level"),r=e?parseInt(e,10):NaN,i=H(t);he(i),!Number.isNaN(r)&&r>=1&&r<=7&&r<=i&&(Y(r),ne(r))},[o,ne]);const Fe=d.useCallback(()=>{if(v){const r=R.flatMap(l=>l.items).find(l=>l.grapheme===v.target),i=r?r.cue:Se[v.target]||v.target;Ne(i)}},[v]);d.useEffect(()=>{if(v){const r=R.flatMap(l=>l.items).find(l=>l.grapheme===v.target),i=r?r.cue:Se[v.target]||v.target;Ne(i)}},[v]),d.useEffect(()=>()=>{U(),X()},[]),d.useEffect(()=>{m&&h.length>0&&!$&&Ue(m,{starsEarned:g,currentRound:b,questions:h,updatedAt:Date.now()},t)},[m,g,b,h,$]),d.useEffect(()=>{if(!t||!m||h.length===0||$)return;const e=Date.now(),r=e-ye.current,i=()=>{Z(t,{resume:{level:m,round:b,stars:g,questions:h,updatedAt:e},version:1}).catch(l=>console.warn("Firestore autosave failed:",l)),ye.current=e};return r>=3e3?i():(V.current&&clearTimeout(V.current),V.current=window.setTimeout(i,3e3-r)),()=>{V.current&&clearTimeout(V.current)}},[t,m,b,g,h,$]),d.useEffect(()=>{const e=()=>{if(!document.fullscreenElement)try{X()}catch{}};return document.addEventListener("fullscreenchange",e),()=>document.removeEventListener("fullscreenchange",e)},[]);const ke=(e,r)=>{const i=e.toLowerCase().trim().replace(/\d+$/,"");i&&(E.current[i]||(E.current[i]={attempts:0,correct:0,wrong:0}),E.current[i].attempts+=1,r==="correct"?E.current[i].correct+=1:E.current[i].wrong+=1)},Pe=e=>{if(!w)if(_(e),z.current++,e===v.target){if(q.current++,ke(v.target,"correct"),j("correct"),fe(!0),Be(),!window.matchMedia("(prefers-reduced-motion: reduce)").matches){const a=[];let p=0;const u=["#FFD54A","#FF7A59","#FF4D8D","#7C5CFF","#2EE6A6","#FFFFFF"],f=(k,L,F)=>Math.max(L,Math.min(F,k));[{x:14,y:86,count:24},{x:86,y:86,count:24},{x:50,y:88,count:24}].forEach(k=>{const L=f(k.x,6,94),F=f(k.y,8,92);for(let P=0;P<k.count;P++){const I=(-140+Math.random()*100)*Math.PI/180,A=220+Math.random()*200,ie=Math.cos(I)*A,le=Math.sin(I)*A;a.push({id:p++,x:`${L}vw`,y:`${F}vh`,dx:ie,dy:le,rot:Math.random()*720-360,delayMs:Math.random()*450,durMs:1800+Math.random()*800,sizePx:4+Math.random()*4,color:u[Math.floor(Math.random()*u.length)]})}}),[{x:92,y:18,count:12,angleMin:140,angleMax:220},{x:8,y:14,count:12,angleMin:-40,angleMax:40}].forEach(k=>{const L=f(k.x,6,94),F=f(k.y,8,92);for(let P=0;P<k.count;P++){const I=(k.angleMin+Math.random()*(k.angleMax-k.angleMin))*Math.PI/180,A=120+Math.random()*120,ie=Math.cos(I)*A,le=Math.sin(I)*A;a.push({id:p++,x:`${L}vw`,y:`${F}vh`,dx:ie,dy:le,rot:Math.random()*720-360,delayMs:Math.random()*450,durMs:1800+Math.random()*800,sizePx:4+Math.random()*3,color:u[Math.floor(Math.random()*u.length)]})}}),be(a);const G=window.setTimeout(()=>{be([])},3e3);O.current.push(G)}const i=g+1;y(a=>a+1);const l=window.setTimeout(()=>{if(fe(!1),b<N-1)M(a=>a+1),j(null),_(null);else{if(J(!0),m){const a=D[m]||0;if(i>a){const p={...D,[m]:i};ge(p),Me(p,t)}if(qe(m,t),t&&se.current&&!re.current){re.current=!0;const u=Date.now()-se.current,f=Math.round(u/1e3),x=z.current>0?q.current/z.current:0;R.find(C=>C.id===m),(async()=>{try{const C={};Object.entries(E.current).forEach(([k,L])=>{L.attempts>0&&(C[`letter:${k}`]={attempts:L.attempts,correct:L.correct,wrong:L.wrong})}),z.current>0&&(C["subtopic:letter_sounds"]={attempts:z.current,correct:q.current,wrong:ae.current});const G=await ze({kidId:t,gameId:"letter-sound-match",progressDocId:"phonics_letter_sound",levelId:m,completed:!0,stars:i,score:q.current,accuracyPct:x*100,durationSec:f,tagDeltas:C});console.info("[recordLevelResult] Success",G)}catch(C){console.error("[recordLevelResult] Failed (non-blocking):",C)}})()}if(t){const p={};Object.entries({...D,[m]:Math.max(a,i)}).forEach(([f,x])=>{p[f]=x});const u={bestStarsByLevel:p,resume:null,version:1};i>=6?(async()=>{try{const{doc:f,updateDoc:x,getFirestore:C,arrayUnion:G}=await me(async()=>{const{doc:F,updateDoc:P,getFirestore:ce,arrayUnion:I}=await import("./index-uo92nVyq.js").then(A=>A.aW);return{doc:F,updateDoc:P,getFirestore:ce,arrayUnion:I}},__vite__mapDeps([0,1])),k=C(),L=f(k,"kids",t,"gameProgress",pe);await x(L,{...u,completedLevels:G(m)})}catch{const x=(await je(t))?.completedLevels||[],C=Array.from(new Set([...x,m]));await Z(t,{...u,completedLevels:C})}})().catch(f=>console.warn("Firestore completion save failed:",f)):Z(t,u).catch(f=>console.warn("Firestore completion save failed:",f))}}if(m&&i>=6&&m<7){const a=Math.max(H(t),m+1);Ve(a,t),he(a)}}},4e3);O.current.push(l)}else{ae.current++,ke(v.target,"wrong"),j("wrong");const r=window.setTimeout(()=>{j(null),_(null)},350);O.current.push(r)}};return s.jsx("div",{ref:oe,className:"ts-phonics-mission-root",children:m?v?s.jsxs("div",{className:"relative overflow-hidden text-white flex flex-col items-center justify-center",style:{position:"fixed",inset:0,width:"100vw",height:"100vh",zIndex:40,backgroundImage:'url("/games/phonics/letter-sound-match/bg.png")',backgroundSize:"cover",backgroundPosition:"center",backgroundRepeat:"no-repeat"},children:[s.jsx("style",{children:`
        /* Animations */
        /* Pop animation used for answer feedback (scale-only, no rotation) */
        @keyframes pop {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* Simplified sparkle used for small flashes (scale-only, no rotate)
           Keeps visual sparkle but avoids any rotation on answer buttons */
        @keyframes sparkle { 
          0%, 100% { transform: scale(1); opacity: 1; } 
          50% { transform: scale(1.15); opacity: 0.95; } 
        }
        @keyframes sparkleBurst {
          0% { transform: scale(0); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.9; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes gentleShake { 
          0%, 100% { transform: translateX(0); } 
          25% { transform: translateX(-8px); } 
          75% { transform: translateX(8px); } 
        }
        @keyframes boomingPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 140, 66, 0.4); }
          50% { transform: scale(1.06); box-shadow: 0 0 40px rgba(255, 140, 66, 0.8), 0 0 60px rgba(255, 107, 53, 0.6); }
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
          animation: pop 220ms cubic-bezier(.2,.9,.2,1);
          background: rgba(45, 212, 191, 0.6) !important;
          border-color: rgba(45, 212, 191, 1) !important;
          box-shadow: 0 0 60px rgba(45, 212, 191, 0.95), 0 0 140px rgba(45, 212, 191, 0.6) !important;
        }
        .choice-btn.shake-wrong {
          animation: gentleShake 0.35s ease-in-out;
        }
        .choice-btn.glow-wrong {
          animation: pop 220ms cubic-bezier(.2,.9,.2,1);
          background: rgba(239, 68, 68, 0.6) !important;
          border-color: rgba(239, 68, 68, 1) !important;
          box-shadow: 0 0 60px rgba(239, 68, 68, 0.95), 0 0 140px rgba(239, 68, 68, 0.6) !important;
        }

        /* Explicit utility classes for answer glow styling (kept for clarity and future use) */
        .answerGlowGreen {
          animation: pop 220ms cubic-bezier(.2,.9,.2,1);
          background: rgba(45, 212, 191, 0.6) !important;
          border-color: rgba(45, 212, 191, 1) !important;
          box-shadow: 0 0 60px rgba(45, 212, 191, 0.95), 0 0 140px rgba(45, 212, 191, 0.6) !important;
        }
        .answerGlowRed {
          animation: pop 220ms cubic-bezier(.2,.9,.2,1);
          background: rgba(239, 68, 68, 0.6) !important;
          border-color: rgba(239, 68, 68, 1) !important;
          box-shadow: 0 0 60px rgba(239, 68, 68, 0.95), 0 0 140px rgba(239, 68, 68, 0.6) !important;
        }
        .listen-btn-booming {
          animation: boomingPulse 1.8s ease-in-out infinite;
        }

        @keyframes confettiFall {
          0% { top: -10%; opacity: 1; }
          85% { opacity: 1; }
          100% { top: 120%; opacity: 0; }
        }

        @keyframes fireworkBurst {
          0% { transform: translate3d(0, 0, 0) scale(0.9) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translate3d(var(--dx), var(--dy), 0) scale(1) rotate(var(--rot)); opacity: 0; }
        }

        @keyframes fireworkFlash {
          0% { transform: scale(0.6); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) { 
          * { animation: none !important; transition: none !important; }
          .listen-btn-booming { animation: none !important; transform: scale(1) !important; }
        }
      `}),m?s.jsx("button",{type:"button",onClick:()=>{t&&m&&h.length>0&&!$&&Z(t,{resume:{level:m,round:b,stars:g,questions:h,updatedAt:Date.now()},version:1}).catch(e=>console.warn("Firestore save on exit failed:",e)),X(),U(),Y(null),S([]),j(null),_(null),J(!1),y(0),M(0),T(B("/kids/games/phonics/letter-sound"),{replace:!0})},className:"absolute top-5 right-5 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all duration-200 font-semibold shadow-lg text-white hover:text-white focus:text-white",style:{zIndex:50},children:"← Back to Levels"}):s.jsx(de,{to:B("/kids/games/phonics"),className:"absolute top-5 right-5 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all duration-200 font-semibold shadow-lg",style:{zIndex:50},children:"← Back to Phonics Library"}),$?s.jsxs("div",{className:"text-center z-10 p-8 bg-black/30 backdrop-blur-md rounded-3xl border border-white/20",children:[s.jsx("h1",{className:"text-6xl font-bold text-yellow-300 mb-4",children:"Mission Complete!"}),s.jsx("div",{className:"text-5xl mb-6",children:Array.from({length:N},(e,r)=>s.jsx("span",{className:"text-3xl",children:r<g?"★":"☆"},r))}),s.jsxs("p",{className:"text-2xl mb-4",children:["You earned ",g," stars!"]}),s.jsxs("div",{className:"flex items-center justify-center gap-4",children:[s.jsx("button",{onClick:()=>{m&&(ne(m),we())},className:"px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-2xl text-lg font-bold shadow-xl",type:"button",children:"Play Again 🚀"}),s.jsx("button",{onClick:()=>{X(),U(),Y(null),S([]),j(null),_(null),T(B("/kids/games/phonics/letter-sound"),{replace:!0})},className:"px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-lg font-semibold",type:"button",children:"Choose Level"}),m&&g>=6&&m<7&&s.jsx("button",{onClick:()=>{const e=m+1,r=H(t);e<=r&&(ve(e),T({pathname:"/kids/games/phonics/letter-sound",search:"?level="+e},{replace:!0}))},className:"px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-lg font-bold text-white",type:"button",children:"Next Level ▶"})]})]}):s.jsxs("div",{className:"w-full h-full flex flex-col items-center justify-center px-4",style:{zIndex:10,paddingTop:60},children:[s.jsx("div",{className:"absolute top-6 left-1/2 transform -translate-x-1/2 flex justify-center gap-2","aria-label":`Progress: ${g} of ${N} stars earned`,style:{zIndex:20},children:Array.from({length:N},(e,r)=>s.jsx("span",{className:"text-4xl drop-shadow-lg",style:{filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.5))"},children:r<g?"★":"☆"},r))}),s.jsx("div",{className:"absolute top-24 left-1/2 text-3xl md:text-4xl font-bold text-gray-800 drop-shadow-lg text-center",style:{transform:"translateX(-50%)",width:"min(1100px, 92vw)",textShadow:"2px 2px 4px rgba(255,255,255,0.5), 0 0 8px rgba(255,255,255,0.3)",zIndex:20},children:"Tap the letter that says this sound"}),s.jsx("div",{className:"w-full flex items-center justify-center",style:{maxWidth:1280,margin:"0 auto",padding:"0 56px"},children:s.jsxs("div",{className:"flex flex-col md:flex-row items-center justify-center",style:{gap:"160px",transform:"translateY(24px)"},children:[s.jsxs("div",{className:"flex flex-col items-center justify-center gap-6",children:[s.jsx("button",{onClick:Fe,type:"button","aria-label":"Listen to sound",className:"listen-btn-booming relative flex items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95",style:{width:340,height:340,background:"linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%)",border:"8px solid rgba(255,255,255,0.9)",touchAction:"manipulation",userSelect:"none",WebkitUserSelect:"none"},children:s.jsx("img",{src:"/games/phonics/letter-sound-match/listen.png",alt:"Listen",style:{width:"70%",height:"70%",objectFit:"contain",pointerEvents:"none"}})}),s.jsx("div",{className:"text-4xl font-bold text-gray-800",style:{textShadow:"2px 2px 4px rgba(255,255,255,0.6)"},children:"listen"})]}),s.jsx("div",{className:"flex flex-col items-stretch justify-center",style:{gap:"34px",width:420},children:v.choices.map(e=>{const i=R.flatMap(u=>u.items).find(u=>u.grapheme===e),l=i?i.display||i.grapheme:e,a=e===v.target,p=e===te&&!a;return s.jsx("button",{type:"button",onClick:()=>Pe(e),"aria-label":`Choose ${l}`,className:`choice-btn flex items-center justify-center rounded-3xl shadow-xl font-black text-gray-800 transition-all
                      ${w==="correct"&&a?"sparkle-correct":""}
                      ${w==="wrong"&&p?"glow-wrong shake-wrong":""}
                    `,style:{height:160,background:"linear-gradient(135deg, #FFDAB9 0%, #FFB88C 100%)",border:"6px solid rgba(139, 69, 19, 0.4)",fontSize:l.length>1?"5rem":"6rem",fontFamily:'"Comic Sans MS","Comic Sans",cursive',touchAction:"manipulation",userSelect:"none",WebkitUserSelect:"none"},children:l.toLowerCase()},e)})})]})}),w==="correct"&&s.jsx("div",{className:"absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center text-4xl text-green-400 font-bold drop-shadow-lg",style:{zIndex:30,textShadow:"2px 2px 6px rgba(0,0,0,0.8)"},children:"Great job! ✨"}),w==="wrong"&&s.jsx("div",{className:"absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center text-4xl text-yellow-300 font-bold drop-shadow-lg",style:{zIndex:30,textShadow:"2px 2px 6px rgba(0,0,0,0.8)"},children:"Try again! 🌟"}),_e&&s.jsx("div",{style:{position:"fixed",inset:0,pointerEvents:"none",zIndex:60,overflow:"hidden"},"aria-hidden":"true",children:Array.from({length:50}).map((e,r)=>{const i=Math.random()*100,l=Math.random()*.6,a=2.8+Math.random()*1.4,p=Math.random()*360,u=["#fbbf24","#34d399","#60a5fa","#f87171","#a78bfa","#fb923c"],f=u[Math.floor(Math.random()*u.length)];return s.jsx("div",{style:{position:"absolute",left:`${i}%`,top:"-10%",width:"10px",height:"10px",backgroundColor:f,borderRadius:"2px",animation:`confettiFall ${a}s linear ${l}s forwards`,transform:`rotate(${p}deg)`}},r)})}),xe.length>0&&s.jsx("div",{style:{position:"fixed",inset:0,pointerEvents:"none",zIndex:60,overflow:"hidden"},"aria-hidden":"true",children:xe.map(e=>s.jsx("div",{style:{position:"absolute",left:e.x,top:e.y,width:e.sizePx,height:e.sizePx,backgroundColor:e.color,borderRadius:"2px","--dx":`${e.dx}px`,"--dy":`${e.dy}px`,"--rot":`${e.rot}deg`,animation:`fireworkBurst ${e.durMs}ms ease-out ${e.delayMs}ms forwards`}},e.id))})]})]}):s.jsxs("div",{className:"relative min-h-screen flex items-center justify-center text-white text-2xl font-semibold",style:{background:"linear-gradient(180deg, #0a0618 0%, #1a1040 50%, #0f1b4a 100%)",boxShadow:"inset 0 0 200px rgba(0,0,0,0.8)"},children:[s.jsx("div",{className:"starfield","aria-hidden":"true"}),"Loading Mission..."]}):s.jsxs("div",{className:"relative min-h-screen flex flex-col items-center justify-start py-12 px-4 overflow-hidden",style:{background:"linear-gradient(180deg, #050510 0%, #150a2b 35%, #0b2a5e 100%)",boxShadow:"inset 0 0 160px rgba(0,0,0,0.75)"},children:[s.jsx("style",{children:`
          .level-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:16px; max-width:900px; }
          .level-card { padding:18px; border-radius:16px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); cursor:pointer; }
          .level-card.locked { opacity:0.4; cursor:not-allowed; }
          @media (prefers-reduced-motion: reduce) { .level-card { transition:none !important } }
        `}),s.jsx(de,{to:B("/kids/games/phonics"),className:"absolute top-5 right-5 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all duration-200 font-semibold shadow-lg text-white hover:text-white focus:text-white",style:{zIndex:50},children:"← Back to Phonics Library"}),s.jsxs("div",{className:"w-full max-w-6xl mx-auto text-center mb-8",children:[s.jsx("h1",{className:"text-5xl font-bold text-white",children:"Choose Level"}),s.jsx("p",{className:"text-white/70 mt-2",children:"Pick a Jolly Phonics level to play"}),!t&&s.jsxs("div",{className:"mt-6 p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-lg max-w-md mx-auto",children:[s.jsx("p",{className:"text-yellow-200 font-semibold mb-3",children:"⚠️ No child selected"}),s.jsx("p",{className:"text-yellow-100/80 text-sm mb-4",children:"Please go back and choose a child to track progress."}),s.jsx(de,{to:B("/parent"),className:"inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors",children:"← Back to Parent Dashboard"})]})]}),s.jsx("div",{className:"level-grid w-full max-w-3xl mx-auto",children:R.map(e=>{const r=e.id>Re,i=D[e.id]||0,a=ee(t)[e.id];let p="Not started",u=0;return i>=6?(p="Completed",u=i):a&&(a.starsEarned>0||a.currentRound>0)?(p="In progress",u=a.starsEarned):i>0&&(p="In progress",u=i),s.jsx("button",{type:"button","aria-label":`Level ${e.id} ${e.title}`,onClick:()=>{r||(ve(e.id),we())},className:`level-card ${r?"locked":""}`,children:s.jsxs("div",{className:"flex flex-col gap-3",children:[s.jsxs("div",{className:"flex items-center justify-between",children:[s.jsxs("div",{children:[s.jsx("div",{className:"text-2xl font-bold text-white",children:e.title}),s.jsx("div",{className:"text-sm text-white/80 mt-2",children:e.items.map(f=>f.display||f.grapheme).slice(0,6).join(" ")})]}),s.jsx("div",{className:"text-sm text-white/60",children:r?"Locked 🔒":"Play"})]}),s.jsxs("div",{className:"flex items-center justify-between",children:[s.jsx("div",{"aria-label":`Stars: ${u} of ${N}`,className:"text-yellow-300",children:Array.from({length:N}).map((f,x)=>s.jsx("span",{className:`text-sm mr-0.5 ${x<u?"text-yellow-300":"text-white/30"}`,children:"★"},x))}),s.jsx("div",{className:"text-sm text-white/60",children:p})]})]})},e.id)})})]})})};export{Ke as default};
