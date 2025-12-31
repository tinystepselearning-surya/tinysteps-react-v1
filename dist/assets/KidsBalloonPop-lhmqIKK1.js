const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/recordLevelResult-CZiE3JEy.js","assets/index-uo92nVyq.js","assets/index-CxgC9bed.css"])))=>i.map(i=>d[i]);
import{l as Re,u as Ee,r as c,_ as De,j as e,L as he}from"./index-uo92nVyq.js";const te=[{id:1,title:"Level 1",letters:["s","a","t","i","p","n"],balloonCount:6,speedMin:8,speedMax:14},{id:2,title:"Level 2",letters:["c","k","e","h","r","m"],balloonCount:6,speedMin:8,speedMax:15},{id:3,title:"Level 3",letters:["d","g","o","u","l","f","b"],balloonCount:7,speedMin:9,speedMax:16},{id:4,title:"Level 4",letters:["ai","j","oa","ie","ee","or"],balloonCount:6,speedMin:9,speedMax:16},{id:5,title:"Level 5",letters:["z","w","ng","v","oo"],balloonCount:5,speedMin:10,speedMax:17},{id:6,title:"Level 6",letters:["y","x","ch","sh","th"],balloonCount:5,speedMin:10,speedMax:18},{id:7,title:"Level 7",letters:["qu","ou","oi","ue","er","ar"],balloonCount:6,speedMin:11,speedMax:18}],oe=10,ie=typeof window<"u"&&window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches,$=(i,r)=>Math.random()*(r-i)+i,A=i=>i[Math.floor(Math.random()*i.length)],we=i=>i?`ts_balloonpop_progress_${i}`:"ts_balloonpop_progress_guest",Ae=i=>{if(typeof window>"u")return{unlocked:1,completed:{}};try{const r=we(i),l=localStorage.getItem(r);if(!l)return{unlocked:1,completed:{}};const f=JSON.parse(l);return{unlocked:f.unlocked||1,completed:f.completed||{}}}catch(r){return console.error("Failed to load progress",r),{unlocked:1,completed:{}}}},Be=(i,r)=>{if(!(typeof window>"u"))try{const l=we(i);localStorage.setItem(l,JSON.stringify(r))}catch(l){console.error("Failed to save progress",l)}},Ie=12,Xe=16,R=(i,r,l,f,k)=>{for(let u=0;u<25;u++){const G=$(10,90),I=$(110,170);if(!k.some(ne=>{const T=Math.abs(G-ne.x),j=Math.abs(I-ne.y);return T<Ie&&j<Xe}))return{id:i,letter:A(r),x:G,y:I,speed:$(l,f),wobblePhase:$(0,Math.PI*2)}}const g=k.length+1,P=g>1?76/(g-1):0,n=12+i%g*P,B=110+i%3*18;return{id:i,letter:A(r),x:n,y:B,speed:$(l,f),wobblePhase:$(0,Math.PI*2)}},D=(i,r,l)=>{const f=i.filter(u=>u.letter===r&&!u.isPopping).length;if(f>=l)return i;const k=l-f,g=i.filter(u=>u.letter!==r&&!u.isPopping),P=g.filter(u=>u.y>=-10&&u.y<=95),n=P.length>=k?P.slice(0,k):[...P,...g.slice(0,k-P.length)],B=new Set(n.map(u=>u.id));return i.map(u=>B.has(u.id)?{...u,letter:r}:u)},ge=["linear-gradient(135deg, #667eea 0%, #764ba2 100%)","linear-gradient(135deg, #f093fb 0%, #f5576c 100%)","linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)","linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)","linear-gradient(135deg, #fa709a 0%, #fee140 100%)","linear-gradient(135deg, #30cfd0 0%, #330867 100%)"],Ye=()=>{try{const i=window.AudioContext||window.webkitAudioContext;if(!i)return;const r=new i,l=r.createOscillator(),f=r.createGain();l.connect(f),f.connect(r.destination),l.frequency.setValueAtTime(320,r.currentTime),l.frequency.exponentialRampToValueAtTime(120,r.currentTime+.08),f.gain.setValueAtTime(.12,r.currentTime),f.gain.exponentialRampToValueAtTime(.01,r.currentTime+.12),l.type="sine",l.start(r.currentTime),l.stop(r.currentTime+.12),setTimeout(()=>{try{r.close()}catch{}},200)}catch(i){console.debug("Audio context blocked or unavailable",i)}},_e={s:"sss",a:"a",t:"t",i:"ih",p:"p",n:"nn",c:"k",k:"k",e:"eh",h:"h",r:"rr",m:"mm",d:"d",g:"g",o:"oh",u:"uh",l:"ll",f:"ff",b:"b",j:"j",z:"z",w:"w",v:"v",y:"y",x:"ks",sh:"sh",ch:"ch",th:"th",ng:"ng",qu:"kw",ai:"ay",oa:"oh",ie:"eye",ee:"ee",oo:"oo",ou:"ow",oi:"oy",ue:"yoo",or:"or",er:"er",ar:"ar"};let le=null;const $e=()=>{if(!le){const i=window.AudioContext||window.webkitAudioContext;i&&(le=new i)}return le},U=i=>{try{const r=$e();if(!r)return;const l=r.createOscillator(),f=r.createGain();l.connect(f),f.connect(r.destination),l.frequency.value=i.freq,l.type=i.type||"sine",f.gain.value=i.gain||.1,l.start(r.currentTime),l.stop(r.currentTime+i.durMs/1e3)}catch(r){console.debug("Audio error",r)}},qe=()=>{U({freq:800,durMs:120,gain:.08}),setTimeout(()=>U({freq:1e3,durMs:100,gain:.06}),60)},ze=()=>{U({freq:200,durMs:150,type:"square",gain:.07})},Oe=()=>{[523,659,784,1047].forEach((r,l)=>{setTimeout(()=>U({freq:r,durMs:200,gain:.09}),l*80)})},be=i=>{if(U({freq:600,durMs:150,gain:.08}),typeof window<"u"&&"speechSynthesis"in window&&!ie)try{const r=new SpeechSynthesisUtterance(_e[i]||i);r.volume=.3,r.rate=.9,r.pitch=1.1,setTimeout(()=>window.speechSynthesis.speak(r),200)}catch(r){console.debug("Speech synthesis error",r)}},We=()=>{const[i]=Re(),r=Ee(),l=i.get("kidId")||"",f=i.get("level"),k=f?parseInt(f,10):null,[g,P]=c.useState(()=>Ae(l)),n=k?te.find(t=>t.id===k):null,B=c.useCallback(t=>{const a=new URLSearchParams;l&&a.set("kidId",l),r(`${t}?${a.toString()}`)},[l,r]),u=c.useCallback(()=>{B("/kids/games/phonics/balloon-pop")},[B]),G=c.useCallback(async t=>{if(t>g.unlocked){console.warn("Level not unlocked yet");return}W(!0),ee(null),X(!1),await new Promise(o=>setTimeout(o,50));try{const o=z.current;if(!o){console.warn("Container not ready");return}o.requestFullscreen?await o.requestFullscreen():o.webkitRequestFullscreen?await o.webkitRequestFullscreen():o.webkitEnterFullscreen&&await o.webkitEnterFullscreen()}catch(o){console.warn("Fullscreen blocked or unavailable",o),X(!0),setTimeout(()=>X(!1),4e3)}const a=new URLSearchParams;l&&a.set("kidId",l),a.set("level",t.toString()),r(`/kids/games/phonics/balloon-pop?${a.toString()}`,{replace:!0});const s=te.find(o=>o.id===t);if(s){const o=[];for(let p=0;p<s.balloonCount;p++)o.push(R(p,s.letters,s.speedMin,s.speedMax,o));const m=A(s.letters),d=Math.min(2,s.balloonCount,s.letters.length);C(D(o,m,d)),V(m),J(0),H(3),K(0),Q(0),T(!1),q(!1),Z(!1),F.current=Date.now()}},[l,r,g.unlocked]),[I,C]=c.useState([]),[ne,T]=c.useState(!1),[j,q]=c.useState(!1),[N,W]=c.useState(!1),[Ue,ye]=c.useState(!1),[ve,X]=c.useState(!1),[b,V]=c.useState(""),[Y,J]=c.useState(0),[w,H]=c.useState(3),[M,K]=c.useState(0),[S,Q]=c.useState(0),[E,Z]=c.useState(!1),[ce,ee]=c.useState(null),[ke,de]=c.useState(!1),[je,ue]=c.useState(0),[Ce,Ne]=c.useState([]),[Me,Se]=c.useState(0),L=c.useRef(null),_=c.useRef(null),F=c.useRef(Date.now()),z=c.useRef(null),Fe=c.useRef(Date.now()),se=c.useRef(!1);c.useRef(null),c.useRef(!1),c.useCallback(async()=>{W(!0),T(!0),ee(null),X(!1);try{const t=z.current;if(!t)return;t.requestFullscreen?await t.requestFullscreen():t.webkitRequestFullscreen?await t.webkitRequestFullscreen():t.webkitEnterFullscreen&&await t.webkitEnterFullscreen()}catch(t){console.warn("Fullscreen blocked or unavailable",t),X(!0),setTimeout(()=>X(!1),4e3)}},[]);const ae=c.useCallback(()=>{W(!1),T(!1),q(!1);try{document.exitFullscreen?document.exitFullscreen().catch(()=>{}):document.webkitExitFullscreen&&document.webkitExitFullscreen()}catch{}u()},[u,l,n,j,Y,S]);c.useEffect(()=>{const t=()=>{const a=!!(document.fullscreenElement||document.webkitFullscreenElement);ye(a),!a&&N&&(W(!1),T(!1),u())};return document.addEventListener("fullscreenchange",t),document.addEventListener("webkitfullscreenchange",t),()=>{document.removeEventListener("fullscreenchange",t),document.removeEventListener("webkitfullscreenchange",t)}},[N,u]),c.useEffect(()=>{j&&N&&b&&!E&&w>0&&be(b)},[b,j,N,E,w]),c.useEffect(()=>(N?document.body.style.overflow="hidden":document.body.style.overflow="",()=>{document.body.style.overflow=""}),[N]);const pe=c.useCallback(t=>{n&&C(a=>{const s=a.filter(p=>p.id!==t),o=R(t,n.letters,n.speedMin,n.speedMax,s),m=a.map(p=>p.id===t?o:p),d=Math.min(2,n.balloonCount,n.letters.length);return D(m,b,d)})},[n,b]),fe=c.useCallback(t=>{if(!n)return t||"";if(n.letters.length===1)return n.letters[0];let a=A(n.letters),s=0;for(;a===t&&s<8;)a=A(n.letters),s+=1;const o=Math.min(2,n.balloonCount,n.letters.length);return C(m=>D(m,a,o)),F.current=Date.now(),a},[n]),me=c.useCallback(()=>{if(!n)return;T(!1),Z(!0),se.current=!1,Oe(),typeof window<"u"&&"speechSynthesis"in window&&!ie&&setTimeout(()=>{try{const s=new SpeechSynthesisUtterance("Level complete!");s.volume=.4,s.rate=1,window.speechSynthesis.speak(s)}catch(s){console.debug("Speech error",s)}},400);const t=S===0?3:S===1?2:1,a={unlocked:Math.min(7,Math.max(g.unlocked,n.id+1)),completed:{...g.completed,[n.id]:{stars:t,bestScore:Math.max(g.completed[n.id]?.bestScore||0,Y)}}};P(a),Be(l,a),l&&(async()=>{try{const{recordLevelResult:s}=await De(async()=>{const{recordLevelResult:d}=await import("./recordLevelResult-CZiE3JEy.js");return{recordLevelResult:d}},__vite__mapDeps([0,1,2])),o={"subtopic:letter_sounds":{attempts:M+S,correct:M,wrong:S}},m=await s({kidId:l,gameId:"balloon-pop",progressDocId:"phonics_balloon_pop",levelId:n.id,completed:!0,stars:t,score:M,accuracyPct:M>0?M/(M+S)*100:0,tagDeltas:o});console.info("[recordLevelResult] Success",m)}catch(s){console.error("[recordLevelResult] Failed (non-blocking):",s)}})()},[n,S,M,Y,g,l]),Pe=c.useCallback(()=>{if(!n||n.id>=7)return;const t=n.id+1,a=te.find(p=>p.id===t);if(!a)return;const s=[];for(let p=0;p<a.balloonCount;p++)s.push(R(p,a.letters,a.speedMin,a.speedMax,s));const o=A(a.letters),m=Math.min(2,a.balloonCount,a.letters.length);C(D(s,o,m)),V(o),F.current=Date.now(),J(0),H(3),K(0),Q(0),Z(!1),q(!1);const d=new URLSearchParams;l&&d.set("kidId",l),d.set("level",t.toString()),r(`/kids/games/phonics/balloon-pop?${d.toString()}`,{replace:!0})},[n,l,r]),xe=c.useCallback(()=>{if(!n)return;const t=[];for(let o=0;o<n.balloonCount;o++)t.push(R(o,n.letters,n.speedMin,n.speedMax,t));const a=A(n.letters),s=Math.min(2,n.balloonCount,n.letters.length);C(D(t,a,s)),V(a),F.current=Date.now(),J(0),H(3),K(0),Q(0),Z(!1),q(!1)},[n]),Te=c.useCallback(t=>{const a=I.find(s=>s.id===t);!a||a.isPopping||(Ye(),C(s=>s.map(o=>o.id===t?{...o,isPopping:!0,popAt:Date.now()}:o)),setTimeout(()=>{if(a.letter===b){if(qe(),F.current=Date.now(),z.current){const s=z.current.getBoundingClientRect(),o=a.x/100*s.width,m=Math.max(5,Math.min(85,a.y))/100*s.height;Ne(d=>[...d,{id:Date.now(),x:o,y:m,until:Date.now()+300}])}J(s=>s+1),K(s=>{const o=s+1;return o>=oe&&setTimeout(()=>me(),300),o}),V(s=>fe(s))}else ze(),Se(Date.now()+250),Q(s=>s+1),H(s=>s-1),ee("Try again!"),setTimeout(()=>ee(null),800);pe(t)},220))},[I,b,me,fe,pe]),Le=()=>{de(!0),setTimeout(()=>de(!1),400)};return c.useEffect(()=>{if(!j||!N||!n||E||w<=0){L.current&&(cancelAnimationFrame(L.current),L.current=null),_.current=null;return}const t=Math.min(2,n.balloonCount,n.letters.length);if(ie){const s=setInterval(()=>{const o=Date.now();o-F.current>4e3&&(ue(o+800),F.current=o),C(m=>{let d=m.map(x=>{if(x.isPopping)return x;let y=x.y-3;if(y<-25){const h=m.filter(v=>v.id!==x.id);return R(x.id,n.letters,n.speedMin,n.speedMax,h)}return{...x,y}});const p=d.filter(x=>!x.isPopping);if(p.length<n.balloonCount){const x=n.balloonCount-p.length;for(let y=0;y<x;y++){const h=Math.max(...d.map(v=>v.id),-1)+1;d.push(R(h,n.letters,n.speedMin,n.speedMax,d))}}return D(d,b,t)})},120);return()=>clearInterval(s)}const a=s=>{_.current||(_.current=s);const o=(s-_.current)/1e3,m=Math.min(.033,o);_.current=s;const d=Date.now();d-F.current>4e3&&(ue(d+800),F.current=d),C(p=>{let x=p.map(h=>{if(h.isPopping)return h;let v=h.y-h.speed*m;if(v<-25){const O=p.filter(re=>re.id!==h.id);return R(h.id,n.letters,n.speedMin,n.speedMax,O)}return{...h,y:v}});const y=x.filter(h=>!h.isPopping);if(y.length<n.balloonCount){const h=n.balloonCount-y.length;for(let v=0;v<h;v++){const O=Math.max(...x.map(re=>re.id),-1)+1;x.push(R(O,n.letters,n.speedMin,n.speedMax,x))}}return D(x,b,t)}),L.current=requestAnimationFrame(a)};return L.current=requestAnimationFrame(a),()=>{L.current&&cancelAnimationFrame(L.current),L.current=null,_.current=null}},[j,N,n,E,w,b]),c.useEffect(()=>{w<=0&&T(!1)},[w]),N?e.jsxs("div",{ref:z,className:"fixed inset-0 z-[9999] overflow-hidden",style:{background:"linear-gradient(180deg, #87CEEB 0%, #B0E8FF 40%, #E0F6FF 70%, #F0F9FF 100%)",width:"100vw",height:"100vh"},children:[e.jsx("style",{children:`
				@keyframes hintPulse {
					0%, 100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
					50% { transform: translate(-50%, -50%) scale(1.15); box-shadow: 0 0 40px rgba(251, 191, 36, 0.8), 0 0 80px rgba(251, 191, 36, 0.4); }
				}
				@keyframes targetShake {
					0%, 100% { transform: translateX(-50%) translateY(0); }
					25% { transform: translateX(-50%) translateY(-5px) rotate(-3deg); }
					75% { transform: translateX(-50%) translateY(-5px) rotate(3deg); }
				}
				@keyframes sparkleFade {
					0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
					50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
					100% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
				}
				@keyframes confettiFall {
					0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
					100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
				}
				@keyframes cloudDrift {
					0% { transform: translateX(-15vw); }
					100% { transform: translateX(115vw); }
				}
				@keyframes cloudDrift2 {
					0% { transform: translateX(-20vw); }
					100% { transform: translateX(120vw); }
				}
				@keyframes cloudDrift3 {
					0% { transform: translateX(-10vw) translateY(0); }
					50% { transform: translateX(55vw) translateY(-8px); }
					100% { transform: translateX(120vw) translateY(0); }
				}
				@keyframes birdFly {
					0% { transform: translateX(-60px) translateY(0) rotateY(0deg); }
					25% { transform: translateX(20vw) translateY(-15px) rotateY(0deg); }
					50% { transform: translateX(45vw) translateY(-5px) rotateY(180deg); }
					75% { transform: translateX(70vw) translateY(-20px) rotateY(180deg); }
					100% { transform: translateX(110vw) translateY(5px) rotateY(180deg); }
				}
				@keyframes birdFly2 {
					0% { transform: translateX(-80px) translateY(10px); }
					40% { transform: translateX(35vw) translateY(-10px); }
					100% { transform: translateX(115vw) translateY(15px); }
				}
				@keyframes sunPulse {
					0%, 100% { transform: scale(1); opacity: 0.95; }
					50% { transform: scale(1.08); opacity: 1; }
				}
				@keyframes sunRays {
					0%, 100% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
				@keyframes targetBounce {
					0%, 100% { transform: translate(-50%, 0) scale(1); }
					50% { transform: translate(-50%, -12px) scale(1.05); }
				}
				@keyframes targetGlow {
					0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.4), 0 8px 24px rgba(0,0,0,0.3); }
					50% { box-shadow: 0 0 35px rgba(251, 191, 36, 0.9), 0 0 70px rgba(251, 191, 36, 0.6), 0 8px 24px rgba(0,0,0,0.3); }
				}
				@keyframes targetBounceExtra {
					0%, 100% { transform: translate(-50%, 0) scale(1); }
					25% { transform: translate(-50%, -18px) scale(1.1); }
					50% { transform: translate(-50%, -8px) scale(1.08); }
					75% { transform: translate(-50%, -14px) scale(1.09); }
				}
				@keyframes balloonWobble {
					0%, 100% { transform: translateX(0); }
					25% { transform: translateX(3px); }
					75% { transform: translateX(-3px); }
				}

				/* Cloud styling */
				.cloud {
					position: absolute;
					background: rgba(255, 255, 255, 0.85);
					border-radius: 100px;
					pointer-events: none;
					filter: blur(1px);
					box-shadow: 0 2px 8px rgba(255,255,255,0.5);
				}
				.cloud::before, .cloud::after {
					content: '';
					position: absolute;
					background: rgba(255, 255, 255, 0.85);
					border-radius: 100%;
					filter: blur(1px);
				}
				.cloud-1 { width: 140px; height: 60px; top: 12%; left: 0; animation: cloudDrift 90s linear infinite; }
				.cloud-1::before { width: 70px; height: 70px; top: -35px; left: 15px; }
				.cloud-1::after { width: 90px; height: 90px; top: -45px; right: 15px; }

				.cloud-2 { width: 120px; height: 50px; top: 28%; left: 0; animation: cloudDrift2 110s linear infinite; animation-delay: -30s; }
				.cloud-2::before { width: 60px; height: 60px; top: -30px; left: 20px; }
				.cloud-2::after { width: 75px; height: 75px; top: -38px; right: 20px; }

				.cloud-3 { width: 100px; height: 45px; top: 55%; left: 0; animation: cloudDrift3 95s ease-in-out infinite; animation-delay: -60s; }
				.cloud-3::before { width: 50px; height: 50px; top: -25px; left: 15px; }
				.cloud-3::after { width: 65px; height: 65px; top: -32px; right: 18px; }

				.cloud-4 { width: 110px; height: 48px; top: 70%; left: 0; animation: cloudDrift 105s linear infinite; animation-delay: -15s; }
				.cloud-4::before { width: 55px; height: 55px; top: -28px; left: 18px; }
				.cloud-4::after { width: 70px; height: 70px; top: -35px; right: 16px; }

				/* Sun with rays */
				.sun {
					position: absolute;
					top: 6%;
					right: 10%;
					width: 100px;
					height: 100px;
					pointer-events: none;
				}
				.sun-core {
					position: absolute;
					inset: 15%;
					border-radius: 50%;
					background: radial-gradient(circle at 35% 35%, #FFF9E6, #FFD700 40%, #FFA500 80%);
					box-shadow: 0 0 40px rgba(255, 215, 0, 0.8), 0 0 80px rgba(255, 215, 0, 0.4);
					animation: sunPulse 6s ease-in-out infinite;
				}
				.sun-rays {
					position: absolute;
					inset: 0;
					animation: sunRays 60s linear infinite;
				}
				.sun-rays::before, .sun-rays::after {
					content: '';
					position: absolute;
					inset: 0;
					background: conic-gradient(from 0deg, 
						transparent 0deg, transparent 10deg,
						rgba(255, 215, 0, 0.15) 12deg, rgba(255, 215, 0, 0.15) 13deg,
						transparent 15deg, transparent 40deg,
						rgba(255, 215, 0, 0.15) 42deg, rgba(255, 215, 0, 0.15) 43deg,
						transparent 45deg, transparent 85deg,
						rgba(255, 215, 0, 0.15) 87deg, rgba(255, 215, 0, 0.15) 88deg,
						transparent 90deg, transparent 130deg,
						rgba(255, 215, 0, 0.15) 132deg, rgba(255, 215, 0, 0.15) 133deg,
						transparent 135deg, transparent 175deg,
						rgba(255, 215, 0, 0.15) 177deg, rgba(255, 215, 0, 0.15) 178deg,
						transparent 180deg
					);
					border-radius: 50%;
				}
				.sun-rays::after {
					transform: rotate(45deg);
				}

				/* Birds */
				.bird {
					position: absolute;
					font-size: 20px;
					pointer-events: none;
					opacity: 0.7;
				}
				.bird-1 { top: 18%; left: 0; animation: birdFly 35s ease-in-out infinite; }
				.bird-2 { top: 35%; left: 0; animation: birdFly2 28s linear infinite; animation-delay: -10s; }
				.bird-3 { top: 48%; left: 0; animation: birdFly 40s ease-in-out infinite; animation-delay: -20s; }

				/* Target button animations */
				.target-button {
					animation: targetBounce 2s ease-in-out infinite, targetGlow 2s ease-in-out infinite;
				}
				.target-button.bounce-extra {
					animation: targetBounceExtra 0.4s ease-out, targetGlow 2s ease-in-out infinite;
				}

				/* Pop burst animation */
				@keyframes popBurst {
					0% { 
						transform: translate(-50%, -50%) scale(1);
						opacity: 1;
					}
					100% { 
						transform: translate(-50%, -50%) scale(3);
						opacity: 0;
					}
				}
				@keyframes popScale {
					0% { transform: translate(-50%, -50%) scale(1); }
					50% { transform: translate(-50%, -50%) scale(0.6); }
					100% { transform: translate(-50%, -50%) scale(0); }
				}
				.burst-particle {
					position: absolute;
					width: 8px;
					height: 8px;
					border-radius: 50%;
					background: radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,215,0,0.6));
					animation: popBurst 0.22s ease-out forwards;
				}

				@media (prefers-reduced-motion: reduce) {
					.cloud, .bird, .sun-core, .sun-rays, .target-button { animation: none !important; }
				}
			`}),e.jsxs("div",{className:"sun",children:[e.jsx("div",{className:"sun-rays"}),e.jsx("div",{className:"sun-core"})]}),e.jsx("div",{className:"cloud cloud-1"}),e.jsx("div",{className:"cloud cloud-2"}),e.jsx("div",{className:"cloud cloud-3"}),e.jsx("div",{className:"cloud cloud-4"}),e.jsx("div",{className:"bird bird-1",children:"🕊️"}),e.jsx("div",{className:"bird bird-2",children:"🐦"}),e.jsx("div",{className:"bird bird-3",children:"🕊️"}),!j&&!E&&w>0&&e.jsx("div",{className:"absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm",children:e.jsx("button",{onClick:()=>q(!0),className:"px-16 py-8 bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:via-green-600 hover:to-green-700 text-white text-5xl font-black rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-200 animate-bounce",style:{animation:"bounce 1.5s ease-in-out infinite",boxShadow:"0 0 60px rgba(34, 197, 94, 0.6), 0 20px 50px rgba(0,0,0,0.5)"},children:"🎈 Tap to Start! 🎈"})}),e.jsx("button",{onClick:ae,className:"absolute top-4 right-4 z-50 px-4 py-2 bg-red-500/90 hover:bg-red-600 text-white font-semibold rounded-full shadow-lg backdrop-blur-sm",children:"✕ Exit"}),e.jsxs("div",{className:"absolute top-4 left-1/2 -translate-x-1/2 z-40 flex gap-4 items-center bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-xl border border-white/50",children:[e.jsx("div",{className:"text-sm font-semibold text-gray-800",children:n?.title||"Level"}),e.jsxs("div",{className:"text-sm font-semibold text-gray-800",children:["Score: ",e.jsx("span",{className:"font-bold text-green-600",children:Y})]}),e.jsxs("div",{className:"text-sm font-semibold text-gray-800",children:["Lives: ",e.jsx("span",{className:"font-bold text-red-600",children:w})]}),e.jsxs("div",{className:"text-sm font-semibold text-gray-800",children:["Progress: ",e.jsxs("span",{className:"font-bold text-blue-600",children:[M,"/",oe]})]})]}),e.jsxs("div",{className:"absolute top-20 left-6 z-30 flex items-center gap-3",children:[e.jsxs("div",{className:"text-white/70 text-sm font-medium backdrop-blur-sm bg-black/10 px-3 py-1.5 rounded-lg",children:["👆 Tap the balloon with letter: ",e.jsx("span",{className:"font-bold text-white text-lg",children:b})]}),e.jsx("button",{onClick:()=>be(b),className:"px-3 py-1.5 bg-blue-500/90 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-lg backdrop-blur-sm transition-all",style:{touchAction:"manipulation"},children:"🔊 Hear Again"})]}),ve&&e.jsx("div",{className:"absolute top-20 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg z-50",children:"Tap fullscreen icon / allow fullscreen"}),Ce.map(t=>e.jsx("div",{className:"absolute pointer-events-none z-50",style:{left:t.x,top:t.y,width:60,height:60,background:"radial-gradient(circle, rgba(255,223,0,0.9) 0%, rgba(255,193,7,0.6) 40%, transparent 70%)",borderRadius:"50%",animation:"sparkleFade 0.3s ease-out forwards"}},t.id)),e.jsx("div",{className:"absolute inset-0 flex items-center justify-center",style:{paddingBottom:150,paddingTop:100},children:I.map(t=>{const a=Date.now(),s=(a-Fe.current)*.001,o=Math.sin((s+(t.wobblePhase||0))*2)*10,m=t.letter===b&&!t.isPopping&&a<je;if(t.isPopping){const d=Array.from({length:10},(p,x)=>{const y=x/10*Math.PI*2,h=25,v=Math.cos(y)*h,O=Math.sin(y)*h;return e.jsx("div",{className:"burst-particle",style:{left:"50%",top:"50%",transform:`translate(calc(-50% + ${v}px), calc(-50% + ${O}px))`}},x)});return e.jsx("div",{className:"absolute",style:{left:`calc(${t.x}% + ${o}px)`,top:`${Math.max(5,Math.min(85,t.y))}%`,width:95,height:115,pointerEvents:"none",zIndex:25},children:d},t.id)}return e.jsxs("button",{onClick:()=>{w>0&&j&&!t.isPopping&&Te(t.id)},"aria-label":`Balloon ${t.letter}`,className:"absolute focus:outline-none focus:ring-4 focus:ring-yellow-400",style:{left:`${t.x}%`,top:`${Math.max(5,Math.min(85,t.y))}%`,transform:`translate3d(${o}px, -50%, 0) translateX(-50%)`,width:95,height:140,zIndex:20,background:"transparent",border:"none",cursor:"pointer",padding:8,willChange:"transform",animation:m?"hintPulse 0.8s ease-in-out":"none",touchAction:"manipulation",userSelect:"none",WebkitUserSelect:"none"},children:[e.jsx("div",{style:{position:"absolute",left:"50%",bottom:0,width:2,height:25,background:"linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.1))",transform:"translateX(-50%)",borderRadius:"1px"}}),e.jsxs("div",{style:{position:"absolute",left:"50%",top:0,transform:"translateX(-50%)",width:95,height:115,borderRadius:"50% 50% 50% 50% / 60% 60% 40% 40%",background:ge[t.id%ge.length],boxShadow:"0 12px 35px rgba(0,0,0,0.35), inset 0 -3px 10px rgba(0,0,0,0.2)",display:"flex",alignItems:"center",justifyContent:"center"},children:[e.jsx("div",{style:{position:"absolute",top:"15%",left:"20%",width:"35%",height:"40%",borderRadius:"50%",background:"radial-gradient(ellipse at center, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 40%, transparent 70%)",transform:"rotate(-25deg)",pointerEvents:"none"}}),e.jsx("span",{style:{fontSize:t.letter.length>1?32:38,fontWeight:900,color:"#fff",textShadow:"2px 2px 8px rgba(0,0,0,0.5), 0 0 4px rgba(0,0,0,0.3)",zIndex:1},children:t.letter})]}),e.jsx("div",{style:{position:"absolute",left:"50%",bottom:22,width:8,height:10,background:"rgba(0,0,0,0.4)",transform:"translateX(-50%) rotate(45deg)",borderRadius:"2px"}})]},t.id)})}),w>0&&j&&e.jsx("button",{onClick:Le,className:"absolute left-1/2 px-8 py-4 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 rounded-full font-black text-white focus:outline-none focus:ring-4 focus:ring-yellow-500",style:{bottom:24,transform:"translateX(-50%)",zIndex:30,pointerEvents:"auto",border:"4px solid rgba(255,255,255,0.9)",animation:Date.now()<Me?"targetShake 0.25s ease-in-out":ke?"targetBounceExtra 0.4s ease-out":"targetBounce 2s ease-in-out infinite",touchAction:"manipulation",userSelect:"none",WebkitUserSelect:"none"},children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("span",{className:"text-xl opacity-80",children:"POP:"}),e.jsx("span",{className:`${b.length>1?"text-5xl":"text-6xl"} drop-shadow-lg`,children:b})]})}),ce&&e.jsx("div",{className:"absolute top-20 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-6 py-3 rounded-full text-lg font-bold shadow-lg z-50",children:ce}),E&&n&&(()=>{se.current||(se.current=!0);const t=Array.from({length:25},(a,s)=>({id:s,left:Math.random()*100,color:["#FF6B6B","#4ECDC4","#45B7D1","#FFA07A","#98D8C8","#F7DC6F"][s%6],delay:Math.random()*.5,duration:1.2+Math.random()*.6}));return e.jsxs("div",{className:"absolute inset-0 bg-gradient-to-br from-purple-600/95 via-pink-500/95 to-orange-500/95 flex flex-col items-center justify-center text-center z-50 backdrop-blur-sm",children:[t.map(a=>e.jsx("div",{className:"absolute pointer-events-none",style:{left:`${a.left}%`,top:0,width:10,height:10,backgroundColor:a.color,animation:`confettiFall ${a.duration}s ease-in forwards`,animationDelay:`${a.delay}s`}},a.id)),e.jsx("div",{className:"text-8xl mb-4 animate-bounce",children:"🎉"}),e.jsxs("h2",{className:"text-6xl font-bold text-white mb-2",children:[n.title," Complete!"]}),e.jsx("div",{className:"text-7xl mb-4",children:S===0?"⭐⭐⭐":S===1?"⭐⭐":"⭐"}),e.jsxs("p",{className:"text-3xl text-white mb-8",children:["Score: ",e.jsx("span",{className:"font-bold text-yellow-200",children:Y})]}),e.jsxs("div",{className:"flex gap-4 flex-wrap justify-center",children:[n.id<7&&n.id+1<=g.unlocked&&e.jsx("button",{onClick:Pe,className:"px-8 py-4 bg-green-600 hover:bg-green-700 rounded-2xl text-2xl font-bold text-white shadow-2xl transform hover:scale-105 transition-all",style:{touchAction:"manipulation"},children:"➡️ Next Level"}),e.jsx("button",{onClick:xe,className:"px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl text-2xl font-bold text-white shadow-2xl transform hover:scale-105 transition-all",style:{touchAction:"manipulation"},children:"🔄 Replay"}),e.jsx("button",{onClick:ae,className:"px-8 py-4 bg-gray-700 hover:bg-gray-800 rounded-2xl text-2xl font-bold text-white shadow-2xl transform hover:scale-105 transition-all",style:{touchAction:"manipulation"},children:"⬅️ Back to Levels"})]})]})})(),w<=0&&!E&&e.jsxs("div",{className:"absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center z-50",children:[e.jsx("h2",{className:"text-5xl font-bold text-white mb-4",children:"Game Over"}),e.jsxs("p",{className:"text-2xl text-white mb-2",children:["Score: ",e.jsx("span",{className:"font-bold text-yellow-300",children:Y})]}),e.jsxs("p",{className:"text-xl text-white/80 mb-8",children:["You got ",M," out of ",oe," correct"]}),e.jsxs("div",{className:"flex gap-4",children:[e.jsx("button",{onClick:xe,className:"px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-semibold text-white shadow-lg",style:{touchAction:"manipulation"},children:"🔄 Try Again"}),e.jsx("button",{onClick:ae,className:"px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-xl text-lg font-semibold text-white shadow-lg",style:{touchAction:"manipulation"},children:"⬅️ Back to Levels"})]})]})]}):e.jsxs("div",{className:"min-h-screen flex flex-col items-center justify-start py-8 px-4",style:{background:"linear-gradient(180deg, #667eea 0%, #764ba2 100%)"},children:[e.jsx("style",{children:`
					.level-card { padding:18px; border-radius:16px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); cursor:pointer; transition:all 0.2s ease; }
					.level-card:hover:not(.locked) { background:rgba(255,255,255,0.08); transform:translateY(-2px); }
					.level-card.locked { opacity:0.4; cursor:not-allowed; }
					@media (prefers-reduced-motion: reduce) { .level-card { transition:none !important; transform:none !important; } }
				`}),e.jsx(he,{to:l?`/kids/games/phonics?kidId=${encodeURIComponent(l)}`:"/kids/games/phonics",className:"absolute top-5 right-5 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all duration-200 font-semibold shadow-lg text-white",style:{zIndex:50},children:"← Back to Phonics Library"}),e.jsxs("div",{className:"w-full max-w-6xl mx-auto text-center mb-8",children:[e.jsx("h1",{className:"text-5xl font-bold text-white",children:"Choose Level"}),e.jsx("p",{className:"text-white/70 mt-2",children:"Pick a Jolly Phonics level to play Balloon Pop"}),!l&&e.jsxs("div",{className:"mt-6 p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-lg max-w-md mx-auto",children:[e.jsx("p",{className:"text-yellow-200 font-semibold mb-3",children:"⚠️ No child selected"}),e.jsx("p",{className:"text-yellow-100/80 text-sm mb-4",children:"Please go back and choose a child to track progress."}),e.jsx(he,{to:"/parent",className:"inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors",children:"← Back to Parent Dashboard"})]})]}),e.jsx("div",{className:"w-full max-w-3xl mx-auto grid grid-cols-1 gap-4",children:te.map(t=>{const a=t.id>g.unlocked,s=g.completed[t.id],o=s?"⭐".repeat(s.stars):"";return e.jsx("button",{type:"button","aria-label":`Level ${t.id} ${t.title}`,onClick:()=>{a||G(t.id)},className:`level-card ${a?"locked":""}`,children:e.jsx("div",{className:"flex flex-col gap-3",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"text-left flex-1",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"text-2xl font-bold text-white",children:t.title}),s&&e.jsx("div",{className:"text-base",children:o})]}),e.jsx("div",{className:"text-sm text-white/80 mt-2",children:t.letters.join(" ")}),s&&e.jsxs("div",{className:"text-xs text-green-300 mt-1 font-semibold",children:["Completed • Best: ",s.bestScore]})]}),e.jsx("div",{className:"text-sm text-white/60 font-semibold",children:a?"🔒 Locked":"▶ Play"})]})})},t.id)})})]})};export{We as default};
