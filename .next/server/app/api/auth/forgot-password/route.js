"use strict";(()=>{var e={};e.id=9118,e.ids=[9118],e.modules={3524:e=>{e.exports=require("@prisma/client")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},4770:e=>{e.exports=require("crypto")},7366:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>y,patchFetch:()=>f,requestAsyncStorage:()=>h,routeModule:()=>g,serverHooks:()=>x,staticGenerationAsyncStorage:()=>m});var o={};r.r(o),r.d(o,{POST:()=>c});var i=r(9303),s=r(8716),n=r(670),a=r(7070),p=r(4770),l=r(2331),d=r(290),u=r(5062);async function c(e){try{let{email:t}=await e.json();if(!t)return a.NextResponse.json({error:"Email required"},{status:400});let r=String(t).toLowerCase().trim(),o=(0,u.h)(`forgot:${r}`,3,36e5),i=(0,u.h)(`forgot-ip:${(0,u.j)(e)}`,10,36e5);if(!o.ok||!i.ok)return a.NextResponse.json({message:"If an account exists with that email, a password reset link has been sent."});let s=await l._.user.findFirst({where:{email:{equals:r,mode:"insensitive"}}});if(s){await l._.passwordReset.updateMany({where:{userId:s.id,usedAt:null},data:{usedAt:new Date}});let e=(0,p.randomBytes)(32).toString("base64url"),t=(0,p.createHash)("sha256").update(e).digest("hex"),r=new Date(Date.now()+36e5);await l._.passwordReset.create({data:{userId:s.id,tokenHash:t,expiresAt:r}});let o=`https://devinsmusic.reviews/reset-password/${e}`;await (0,d.Cz)({to:s.email,subject:"⚡ Reset your Weekly Beats password",html:(0,d.oe)(s.username,o)})}return a.NextResponse.json({message:"If an account exists with that email, a password reset link has been sent."})}catch(e){return console.error("[POST /api/auth/forgot-password]",e?.message??e),a.NextResponse.json({error:"Internal server error"},{status:500})}}let g=new i.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/auth/forgot-password/route",pathname:"/api/auth/forgot-password",filename:"route",bundlePath:"app/api/auth/forgot-password/route"},resolvedPagePath:"/Users/luisgui/music-game/app/api/auth/forgot-password/route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:h,staticGenerationAsyncStorage:m,serverHooks:x}=g,y="/api/auth/forgot-password/route";function f(){return(0,n.patchFetch)({serverHooks:x,staticGenerationAsyncStorage:m})}},290:(e,t,r)=>{r.d(t,{JY:()=>u,$k:()=>p,WD:()=>l,d0:()=>d,oe:()=>s,B_:()=>a,Cz:()=>i,CL:()=>c});let o={flash:"pikachu",smokescreen:"cloud",substitute:"spooderman",recover:"chansey",swift:"pichu",haze:"wind","night-shade":"ghost-blue","swords-dance":"dancing-man","double-team":"users",disable:"lock",reflect:"surprised-pikachu",mimic:"eevee","confuse-ray":"psyduck","leech-seed":"bulbasaur","mega-drain":"chikorita",screech:"sound-high",metronome:"game-controller",spore:"jigglypuff",bide:"slowpoke","skull-bash":"t-rex",cushion:"koala-hug",spotlight:"star",insight:"magnifier",insurance:"umbrella",donation:"gift",toxic:"frog",payday:"meowth",protect:"squirtle",gamble:"maneki-neko",pickpocket:"scissors",bounty:"ribbon",cleanse:"sparkles",foresight:"owl-1",banker:"credit-card",mute:"sound-mute",usurp:"mario-jump","mirror-coat":"lapras",wildcard:"pinata",blackout:"moon",veto:"thumb-down",earthquake:"diglett","time-bomb":"clock",switcheroo:"magikarp",copycat:"copy",curse:"ghost-red",crown:"sunglasses",decree:"message",amnesty:"rainbow","double-header":"thumb-up","extra-time":"calendar"};async function i({to:e,subject:t,html:r}){let o=process.env.RESEND_API_KEY,i=process.env.EMAIL_FROM??"Weekly Beats <onboarding@resend.dev>";if(!o)return console.warn("[email] RESEND_API_KEY not set — skipping email send"),!1;try{let s=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${o}`,"Content-Type":"application/json"},body:JSON.stringify({from:i,to:e,subject:t,html:r})});if(!s.ok){let e=await s.text();return console.error("[email] Resend error:",s.status,e),!1}return!0}catch(e){return console.error("[email] Send failed:",e),!1}}function s(e,t){return`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Reset your password</title></head>
<body style="margin:0; padding:0; background:#0E1228; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 560px; margin: 40px auto; padding: 32px; background: #1A1E3A; border-radius: 8px; color: #E0E3F0;">
    <h1 style="color: #FF2D87; font-size: 24px; margin: 0 0 24px;">⚡ Weekly Beats</h1>
    <h2 style="font-size: 20px; margin: 0 0 16px;">Reset your password</h2>
    <p style="line-height: 1.6; margin: 0 0 24px; color: #B0B5CC;">
      Hi <strong>@${e}</strong>, we received a request to reset your password.
      Click the button below to set a new one. This link expires in <strong>1 hour</strong>.
    </p>
    <p style="text-align: center; margin: 32px 0;">
      <a href="${t}"
         style="display: inline-block; padding: 14px 32px; background: #FF2D87; color: #fff;
                text-decoration: none; border-radius: 4px; font-weight: 700;
                font-family: -apple-system, sans-serif; letter-spacing: 0.5px;">
        RESET PASSWORD
      </a>
    </p>
    <p style="font-size: 13px; color: #888; line-height: 1.6;">
      Or paste this link into your browser:<br>
      <a href="${t}" style="color: #00E5FF; word-break: break-all;">${t}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #2A2F50; margin: 32px 0;">
    <p style="font-size: 12px; color: #666; line-height: 1.5;">
      If you didn't request this, you can safely ignore this email — your password won't change.
    </p>
  </div>
</body>
</html>
  `.trim()}function n(e){return`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; background:#0E1228; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 560px; margin: 40px auto; padding: 32px; background: #1A1E3A; border-radius: 8px; color: #E0E3F0;">
    <h1 style="color: #FF2D87; font-size: 24px; margin: 0 0 24px;">⚡ Weekly Beats</h1>
    ${e}
    <hr style="border: none; border-top: 1px solid #2A2F50; margin: 32px 0;">
    <p style="font-size: 12px; color: #666; line-height: 1.5;">
      You're receiving this because you opted in to Weekly Beats emails.
      You can turn these off anytime from your profile.
    </p>
  </div>
</body>
</html>`.trim()}function a(e,t,r,o,i){let s=1===r?"\uD83E\uDD47 1st place":2===r?"\uD83E\uDD48 2nd place":3===r?"\uD83E\uDD49 3rd place":null,a=s?`You finished <strong style="color:#FFD700;">${s}</strong>!`:"Here's how your week went.";return n(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">Week ${t} results are in</h2>
    <p style="line-height: 1.6; margin: 0 0 16px; color: #B0B5CC;">
      Hi <strong>@${e}</strong>, ${a}
    </p>
    ${i?`<p style="color:#888; margin:0 0 16px;">Theme: <em>${i}</em></p>`:""}
    <div style="background:#0E1228; border:2px solid #00E5FF; border-radius:4px; padding:16px; text-align:center; margin:24px 0;">
      <span style="font-size:14px; color:#888;">Points this week</span><br>
      <span style="font-family:'Courier New',monospace; font-size:28px; color:#00E5FF;">${o>=0?"+":""}${o}</span>
    </div>
    <p style="text-align:center; margin:24px 0;">
      <a href="https://devinsmusic.reviews"
         style="display:inline-block; padding:12px 28px; background:#FF2D87; color:#fff; text-decoration:none; border-radius:4px; font-weight:700;">
        SEE THE LADDER
      </a>
    </p>
  `)}function p(e,t,r){return n(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">${t}</h2>
    <p style="line-height: 1.7; margin: 0 0 16px; color: #D0D4E8; white-space: pre-wrap;">Hi @${e},

${r}</p>
  `)}function l(e,t,r,i,s,a,p){let l=function(e,t="miniavs",r=80){return`https://api.dicebear.com/9.x/${t}/png?seed=${encodeURIComponent(e??"default")}&backgroundColor=0e1228&size=${r}`}(r,i??"miniavs",96),d=function(e,t=64){return`https://wsrv.nl/?url=raw.githubusercontent.com/shuqikhor/pixel-icons/main/icons/${o[e]??"surprised-pikachu"}.svg&output=png&w=${t}&h=${t}&fit=contain`}(s,96);return n(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">A chip was played on you</h2>
    <p style="line-height: 1.6; margin: 0 0 20px; color: #B0B5CC;">Hi <strong>@${e}</strong> — it's all out in the open now:</p>
    <div style="background:#0E1228; border:1px solid #2A2F50; border-radius:8px; padding:20px; text-align:center;">
      <table role="presentation" align="center" cellpadding="0" cellspacing="0"><tr>
        <td style="text-align:center; padding:0 14px;">
          <img src="${l}" width="64" height="64" alt="" style="border-radius:50%; border:2px solid #2A2F50; display:block; margin:0 auto;">
          <div style="font-size:13px; color:#B0B5CC; margin-top:6px;">@${t}</div>
        </td>
        <td style="text-align:center; font-size:22px; color:#FF2D87; padding:0 6px;">➜</td>
        <td style="text-align:center; padding:0 14px;">
          <img src="${d}" width="56" height="56" alt="${a}" style="display:block; margin:0 auto; image-rendering:pixelated;">
          <div style="font-size:13px; color:#FFD700; margin-top:6px;">${a}</div>
        </td>
      </tr></table>
      <p style="color:#E0E3F0; font-size:15px; margin:18px 0 0;">
        <strong>@${t}</strong> used <strong style="color:#FFD700;">${a}</strong> on you.
      </p>
      <p style="color:#B0B5CC; font-size:13px; line-height:1.5; margin:8px 0 0;">${p}</p>
    </div>
    <p style="text-align:center; margin:24px 0 0;">
      <a href="https://devinsmusic.reviews/chips"
         style="display:inline-block; padding:12px 28px; background:#FF2D87; color:#fff; text-decoration:none; border-radius:4px; font-weight:700;">
        PLAY YOUR CHIPS
      </a>
    </p>
  `)}function d(e,t,r){return n(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">👑 You're this week's Game Master!</h2>
    <p style="line-height: 1.7; margin: 0 0 16px; color: #B0B5CC;">
      Hi <strong>@${e}</strong>, you've been chosen to host <strong>Week ${t}</strong>.
    </p>
    ${r?`<p style="color:#888; margin:0 0 16px;">Theme: <em>${r}</em></p>`:""}
    <div style="background:#0E1228; border:1px solid #2A2F50; border-radius:8px; padding:16px 18px; color:#D0D4E8; font-size:14px; line-height:1.7;">
      As GM you'll:
      <ul style="margin:8px 0 0; padding-left:18px;">
        <li>Set this week's theme (optional)</li>
        <li>Listen to every submission <strong>anonymously</strong> after Friday's close</li>
        <li>Pick the podium — 🥇 1st, 🥈 2nd, 🥉 3rd — before Monday</li>
      </ul>
    </div>
    <p style="text-align:center; margin:24px 0 0;">
      <a href="https://devinsmusic.reviews/gm"
         style="display:inline-block; padding:12px 28px; background:#9B59B6; color:#fff; text-decoration:none; border-radius:4px; font-weight:700;">
        OPEN THE GM PANEL
      </a>
    </p>
  `)}function u(e,t,r,o){return n(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">🏆 Achievement unlocked!</h2>
    <p style="line-height: 1.6; margin: 0 0 20px; color: #B0B5CC;">Nice one, <strong>@${e}</strong> — you earned:</p>
    <div style="background:#0E1228; border:2px solid #FFD700; border-radius:8px; padding:18px; text-align:center;">
      <div style="font-family:'Courier New',monospace; font-size:22px; color:#FFD700;">${t}</div>
      <p style="color:#B0B5CC; font-size:14px; line-height:1.5; margin:10px 0 0;">${r}</p>
      ${o?`<div style="margin-top:14px; display:inline-block; background:rgba(0,229,255,.1); border:1px solid #00E5FF; color:#00E5FF; border-radius:4px; padding:6px 12px; font-size:13px;">🎁 ${o}</div>`:""}
    </div>
    <p style="text-align:center; margin:24px 0 0;">
      <a href="https://devinsmusic.reviews/profile"
         style="display:inline-block; padding:12px 28px; background:#FF2D87; color:#fff; text-decoration:none; border-radius:4px; font-weight:700;">
        SEE YOUR BADGES
      </a>
    </p>
  `)}function c(e,t){return`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your temporary password</title></head>
<body style="margin:0; padding:0; background:#0E1228; font-family: -apple-system, sans-serif;">
  <div style="max-width: 560px; margin: 40px auto; padding: 32px; background: #1A1E3A; border-radius: 8px; color: #E0E3F0;">
    <h1 style="color: #FF2D87; font-size: 24px; margin: 0 0 24px;">⚡ Weekly Beats</h1>
    <h2 style="font-size: 20px; margin: 0 0 16px;">Your password was reset</h2>
    <p style="line-height: 1.6; margin: 0 0 24px; color: #B0B5CC;">
      Hi <strong>@${e}</strong>, an administrator has reset your password. Your temporary password is:
    </p>
    <div style="background: #0E1228; border: 2px solid #FFD700; border-radius: 4px; padding: 16px; text-align: center; margin: 24px 0;">
      <code style="font-family: 'Courier New', monospace; font-size: 22px; color: #FFD700; letter-spacing: 2px;">${t}</code>
    </div>
    <p style="line-height: 1.6; color: #B0B5CC;">
      You'll be asked to set a new password the next time you log in.
    </p>
  </div>
</body>
</html>
  `.trim()}},2331:(e,t,r)=>{r.d(t,{_:()=>i});var o=r(3524);let i=globalThis.prisma??new o.PrismaClient({log:["error"]})},5062:(e,t,r)=>{r.d(t,{h:()=>i,j:()=>s});let o=new Map;function i(e,t,r){let i=Date.now();!function(e){if(!(o.size<5e3))for(let[t,r]of Array.from(o.entries()))e>r.resetAt&&o.delete(t)}(i);let s=o.get(e);return!s||i>s.resetAt?(o.set(e,{count:1,resetAt:i+r}),{ok:!0,remaining:t-1,retryAfter:0}):(s.count++,s.count>t)?{ok:!1,remaining:0,retryAfter:Math.ceil((s.resetAt-i)/1e3)}:{ok:!0,remaining:t-s.count,retryAfter:0}}function s(e){let t=e.headers.get("x-forwarded-for");return t?t.split(",")[0].trim():e.headers.get("x-real-ip")?.trim()||"unknown"}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[8948,5972],()=>r(7366));module.exports=o})();