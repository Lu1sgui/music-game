"use strict";(()=>{var e={};e.id=3002,e.ids=[3002],e.modules={3524:e=>{e.exports=require("@prisma/client")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},4770:e=>{e.exports=require("crypto")},6162:e=>{e.exports=require("stream")},1764:e=>{e.exports=require("util")},8881:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>y,patchFetch:()=>g,requestAsyncStorage:()=>m,routeModule:()=>c,serverHooks:()=>f,staticGenerationAsyncStorage:()=>h});var a={};r.r(a),r.d(a,{POST:()=>d});var n=r(9303),i=r(8716),s=r(670),o=r(7070),l=r(2331),u=r(9178),p=r(8867);async function d(e){try{let{username:t,email:r,password:a,avatarSeed:n,avatarStyle:i}=await e.json();if(!t||!r||!a)return o.NextResponse.json({error:"username, email and password are required"},{status:400});if(t.length<3||t.length>30)return o.NextResponse.json({error:"Username must be 3–30 characters"},{status:400});if(a.length<8)return o.NextResponse.json({error:"Password must be at least 8 characters"},{status:400});let s=String(r).toLowerCase().trim();if(await l._.user.findFirst({where:{OR:[{email:{equals:s,mode:"insensitive"}},{username:{equals:t,mode:"insensitive"}}]}}))return o.NextResponse.json({error:"That email or username is already taken"},{status:409});let d=await (0,u.c_)(a),c=await l._.user.create({data:{username:t,email:s,passwordHash:d,avatarSeed:n??t,avatarStyle:i??"miniavs"}});try{let e=await l._.chip.findMany({where:{rarity:"COMMON",enabled:!0}});if(e.length>0){let t=e[Math.floor(Math.random()*e.length)];await l._.userChip.create({data:{userId:c.id,chipId:t.id,quantity:1,lastAcquiredAt:new Date}}),await (0,p.br)(c.id,`🎁 Welcome to the game! You've received a **${t.name}** chip as a welcome gift. Use it wisely!`)}}catch(e){console.error("[register] welcome gift failed:",e?.message??e)}let m=(0,u.fT)({userId:c.id,username:c.username,role:c.role});return o.NextResponse.json({token:m,user:{id:c.id,username:c.username,role:c.role,totalPoints:c.totalPoints,streakWeeks:c.streakWeeks,avatarSeed:c.avatarSeed,avatarStyle:c.avatarStyle}},{status:201})}catch(e){return console.error("[POST /api/auth/register]",e?.message??e),o.NextResponse.json({error:"Internal server error"},{status:500})}}let c=new n.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/auth/register/route",pathname:"/api/auth/register",filename:"route",bundlePath:"app/api/auth/register/route"},resolvedPagePath:"/Users/luisgui/music-game/app/api/auth/register/route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:m,staticGenerationAsyncStorage:h,serverHooks:f}=c,y="/api/auth/register/route";function g(){return(0,s.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:h})}},9178:(e,t,r)=>{r.d(t,{Oe:()=>u,c_:()=>l,fT:()=>p,z3:()=>d});var a=r(1482),n=r.n(a),i=r(2023),s=r.n(i);let o=process.env.JWT_SECRET;if(!o)throw Error("JWT_SECRET environment variable is not set");async function l(e){return s().hash(e,12)}async function u(e,t){return s().compare(e,t)}function p(e){return n().sign(e,o,{expiresIn:"7d"})}function d(e){let t=function(e,t){if(e?.startsWith("Bearer "))return e.slice(7);if(t){let e=t.match(/(?:^|;\s*)token=([^;]+)/);return e?e[1]:null}return null}(e.headers.get("authorization"),e.headers.get("cookie"));if(!t)return null;try{return n().verify(t,o)}catch{return null}}},6119:(e,t,r)=>{async function a({to:e,subject:t,html:r}){let a=process.env.RESEND_API_KEY,n=process.env.EMAIL_FROM??"Weekly Beats <onboarding@resend.dev>";if(!a)return console.warn("[email] RESEND_API_KEY not set — skipping email send"),!1;try{let i=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${a}`,"Content-Type":"application/json"},body:JSON.stringify({from:n,to:e,subject:t,html:r})});if(!i.ok){let e=await i.text();return console.error("[email] Resend error:",i.status,e),!1}return!0}catch(e){return console.error("[email] Send failed:",e),!1}}function n(e,t){return`
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
  `.trim()}function i(e){return`
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
</html>`.trim()}function s(e,t,r,a,n){let s=1===r?"\uD83E\uDD47 1st place":2===r?"\uD83E\uDD48 2nd place":3===r?"\uD83E\uDD49 3rd place":null,o=s?`You finished <strong style="color:#FFD700;">${s}</strong>!`:"Here's how your week went.";return i(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">Week ${t} results are in</h2>
    <p style="line-height: 1.6; margin: 0 0 16px; color: #B0B5CC;">
      Hi <strong>@${e}</strong>, ${o}
    </p>
    ${n?`<p style="color:#888; margin:0 0 16px;">Theme: <em>${n}</em></p>`:""}
    <div style="background:#0E1228; border:2px solid #00E5FF; border-radius:4px; padding:16px; text-align:center; margin:24px 0;">
      <span style="font-size:14px; color:#888;">Points this week</span><br>
      <span style="font-family:'Courier New',monospace; font-size:28px; color:#00E5FF;">${a>=0?"+":""}${a}</span>
    </div>
    <p style="text-align:center; margin:24px 0;">
      <a href="https://devinsmusic.reviews"
         style="display:inline-block; padding:12px 28px; background:#FF2D87; color:#fff; text-decoration:none; border-radius:4px; font-weight:700;">
        SEE THE LADDER
      </a>
    </p>
  `)}function o(e,t,r){return i(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">${t}</h2>
    <p style="line-height: 1.7; margin: 0 0 16px; color: #D0D4E8; white-space: pre-wrap;">Hi @${e},

${r}</p>
  `)}function l(e,t){return`
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
  `.trim()}r.d(t,{$k:()=>o,B_:()=>s,CL:()=>l,Cz:()=>a,oe:()=>n})},8867:(e,t,r)=>{r.d(t,{Lh:()=>o,bT:()=>u,br:()=>i});var a=r(2331),n=r(6119);async function i(e,t){try{await a._.notification.create({data:{userId:e,message:t}})}catch(e){console.warn("[notify] Failed:",e)}}async function s(e,t){if(0!==e.length)try{await a._.notification.createMany({data:e.map(e=>({userId:e,message:t}))})}catch(e){console.warn("[notify] Bulk failed:",e)}}async function o(e,t=[]){let r=await a._.user.findMany({where:{isActive:!0,id:{notIn:t}},select:{id:!0}});await s(r.map(e=>e.id),e)}async function l(e,t,r){let i=await a._.user.findUnique({where:{id:e},select:{email:!0,emailOptIn:!0}});return!!i&&!!i.emailOptIn&&(0,n.Cz)({to:i.email,subject:t,html:r})}async function u(e){let t=await a._.weekCycle.findUnique({where:{id:e},select:{weekNumber:!0,theme:!0}});if(!t)return;let[r,s,o]=await Promise.all([a._.cycleResult.findMany({where:{cycleId:e},select:{userId:!0,position:!0}}),a._.submission.findMany({where:{cycleId:e},select:{userId:!0,user:{select:{username:!0}}}}),a._.pointsLedger.groupBy({by:["userId"],where:{cycleId:e},_sum:{amount:!0}})]),u=new Map(r.map(e=>[e.userId,e.position])),p=new Map(o.map(e=>[e.userId,e._sum.amount??0])),d=new Map(s.map(e=>[e.userId,e.user.username]));for(let e of Array.from(new Set(s.map(e=>e.userId)))){let r=u.get(e)??null,a=p.get(e)??0,s=1===r?"\uD83E\uDD47 1st place":2===r?"\uD83E\uDD48 2nd place":3===r?"\uD83E\uDD49 3rd place":"participation";await i(e,`✦ Week ${t.weekNumber} revealed — you earned **${a>=0?"+":""}${a}** points (${s}).`),await l(e,`⚡ Week ${t.weekNumber} results — Weekly Beats`,(0,n.B_)(d.get(e)??"player",t.weekNumber,r,a,t.theme))}for(let t of(await a._.chipActivation.findMany({where:{cycleId:e,status:"RESOLVED",targetUserId:{not:null},chip:{offensive:!0}},include:{chip:{select:{name:!0}},user:{select:{username:!0}}}})))t.targetUserId&&await i(t.targetUserId,`⚔️ You were hit by **${t.chip.name}** (from @${t.user.username}) this week.`);let c=await a._.chipActivation.findMany({where:{cycleId:e,status:"CANCELLED",chip:{offensive:!0}},include:{chip:{select:{name:!0}},user:{select:{username:!0}}}}),m={cleanse:"Cleanse",mirror_coat:"Mirror Coat",protect:"Protect"};for(let e of c){let t=e.effectData;if(!t?.blockedBy||!t?.defenderId)continue;let r=m[t.blockedBy]??"Your defense";await i(t.defenderId,`🛡️ Your ${r} blocked **${e.chip.name}** from @${e.user.username}!`)}}},2331:(e,t,r)=>{r.d(t,{_:()=>n});var a=r(3524);let n=globalThis.prisma??new a.PrismaClient({log:["error"]})}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[8948,5972,6944],()=>r(8881));module.exports=a})();