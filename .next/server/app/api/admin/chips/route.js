"use strict";(()=>{var e={};e.id=7421,e.ids=[7421],e.modules={3524:e=>{e.exports=require("@prisma/client")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},4770:e=>{e.exports=require("crypto")},6162:e=>{e.exports=require("stream")},1764:e=>{e.exports=require("util")},2886:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>y,patchFetch:()=>g,requestAsyncStorage:()=>h,routeModule:()=>c,serverHooks:()=>f,staticGenerationAsyncStorage:()=>m});var n={};r.r(n),r.d(n,{POST:()=>d});var i=r(9303),a=r(8716),o=r(670),s=r(7070),l=r(2331),p=r(9178),u=r(8867);async function d(e){try{let t=(0,p.z3)(e);if(!t)return s.NextResponse.json({error:"Unauthorized"},{status:401});if("ADMIN"!==t.role)return s.NextResponse.json({error:"Forbidden"},{status:403});let{userId:r,chipSlug:n}=await e.json();if(!r||!n)return s.NextResponse.json({error:"userId and chipSlug required"},{status:400});let i=await l._.chip.findUnique({where:{slug:n}});if(!i)return s.NextResponse.json({error:`Chip "${n}" not found`},{status:404});let a=await l._.user.findUnique({where:{id:r}});if(!a)return s.NextResponse.json({error:"User not found"},{status:404});return await l._.userChip.upsert({where:{userId_chipId:{userId:r,chipId:i.id}},update:{quantity:{increment:1},lastAcquiredAt:new Date},create:{userId:r,chipId:i.id,quantity:1,lastAcquiredAt:new Date}}),await (0,u.br)(r,`⚡ Admin has gifted you a **${i.name}** chip (${i.rarity})! Check your profile to see it.`),s.NextResponse.json({message:`${i.name} given to @${a.username}`})}catch(e){return console.error("[POST /api/admin/chips]",e?.message??e),s.NextResponse.json({error:"Internal server error"},{status:500})}}let c=new i.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/admin/chips/route",pathname:"/api/admin/chips",filename:"route",bundlePath:"app/api/admin/chips/route"},resolvedPagePath:"/Users/luisgui/music-game/app/api/admin/chips/route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:h,staticGenerationAsyncStorage:m,serverHooks:f}=c,y="/api/admin/chips/route";function g(){return(0,o.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:m})}},9178:(e,t,r)=>{r.d(t,{Oe:()=>p,c_:()=>l,fT:()=>u,z3:()=>d});var n=r(1482),i=r.n(n),a=r(2023),o=r.n(a);let s=process.env.JWT_SECRET;if(!s)throw Error("JWT_SECRET environment variable is not set");async function l(e){return o().hash(e,12)}async function p(e,t){return o().compare(e,t)}function u(e){return i().sign(e,s,{expiresIn:"7d"})}function d(e){let t=function(e,t){if(e?.startsWith("Bearer "))return e.slice(7);if(t){let e=t.match(/(?:^|;\s*)token=([^;]+)/);return e?e[1]:null}return null}(e.headers.get("authorization"),e.headers.get("cookie"));if(!t)return null;try{return i().verify(t,s)}catch{return null}}},6119:(e,t,r)=>{async function n({to:e,subject:t,html:r}){let n=process.env.RESEND_API_KEY,i=process.env.EMAIL_FROM??"Weekly Beats <onboarding@resend.dev>";if(!n)return console.warn("[email] RESEND_API_KEY not set — skipping email send"),!1;try{let a=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${n}`,"Content-Type":"application/json"},body:JSON.stringify({from:i,to:e,subject:t,html:r})});if(!a.ok){let e=await a.text();return console.error("[email] Resend error:",a.status,e),!1}return!0}catch(e){return console.error("[email] Send failed:",e),!1}}function i(e,t){return`
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
  `.trim()}function a(e){return`
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
</html>`.trim()}function o(e,t,r,n,i){let o=1===r?"\uD83E\uDD47 1st place":2===r?"\uD83E\uDD48 2nd place":3===r?"\uD83E\uDD49 3rd place":null,s=o?`You finished <strong style="color:#FFD700;">${o}</strong>!`:"Here's how your week went.";return a(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">Week ${t} results are in</h2>
    <p style="line-height: 1.6; margin: 0 0 16px; color: #B0B5CC;">
      Hi <strong>@${e}</strong>, ${s}
    </p>
    ${i?`<p style="color:#888; margin:0 0 16px;">Theme: <em>${i}</em></p>`:""}
    <div style="background:#0E1228; border:2px solid #00E5FF; border-radius:4px; padding:16px; text-align:center; margin:24px 0;">
      <span style="font-size:14px; color:#888;">Points this week</span><br>
      <span style="font-family:'Courier New',monospace; font-size:28px; color:#00E5FF;">${n>=0?"+":""}${n}</span>
    </div>
    <p style="text-align:center; margin:24px 0;">
      <a href="https://devinsmusic.reviews"
         style="display:inline-block; padding:12px 28px; background:#FF2D87; color:#fff; text-decoration:none; border-radius:4px; font-weight:700;">
        SEE THE LADDER
      </a>
    </p>
  `)}function s(e,t,r){return a(`
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
  `.trim()}r.d(t,{$k:()=>s,B_:()=>o,CL:()=>l,Cz:()=>n,oe:()=>i})},8867:(e,t,r)=>{r.d(t,{Lh:()=>s,bT:()=>p,br:()=>a});var n=r(2331),i=r(6119);async function a(e,t){try{await n._.notification.create({data:{userId:e,message:t}})}catch(e){console.warn("[notify] Failed:",e)}}async function o(e,t){if(0!==e.length)try{await n._.notification.createMany({data:e.map(e=>({userId:e,message:t}))})}catch(e){console.warn("[notify] Bulk failed:",e)}}async function s(e,t=[]){let r=await n._.user.findMany({where:{isActive:!0,id:{notIn:t}},select:{id:!0}});await o(r.map(e=>e.id),e)}async function l(e,t,r){let a=await n._.user.findUnique({where:{id:e},select:{email:!0,emailOptIn:!0}});return!!a&&!!a.emailOptIn&&(0,i.Cz)({to:a.email,subject:t,html:r})}async function p(e){let t=await n._.weekCycle.findUnique({where:{id:e},select:{weekNumber:!0,theme:!0}});if(!t)return;let[r,o,s]=await Promise.all([n._.cycleResult.findMany({where:{cycleId:e},select:{userId:!0,position:!0}}),n._.submission.findMany({where:{cycleId:e},select:{userId:!0,user:{select:{username:!0}}}}),n._.pointsLedger.groupBy({by:["userId"],where:{cycleId:e},_sum:{amount:!0}})]),p=new Map(r.map(e=>[e.userId,e.position])),u=new Map(s.map(e=>[e.userId,e._sum.amount??0])),d=new Map(o.map(e=>[e.userId,e.user.username]));for(let e of Array.from(new Set(o.map(e=>e.userId)))){let r=p.get(e)??null,n=u.get(e)??0,o=1===r?"\uD83E\uDD47 1st place":2===r?"\uD83E\uDD48 2nd place":3===r?"\uD83E\uDD49 3rd place":"participation";await a(e,`✦ Week ${t.weekNumber} revealed — you earned **${n>=0?"+":""}${n}** points (${o}).`),await l(e,`⚡ Week ${t.weekNumber} results — Weekly Beats`,(0,i.B_)(d.get(e)??"player",t.weekNumber,r,n,t.theme))}for(let t of(await n._.chipActivation.findMany({where:{cycleId:e,status:"RESOLVED",targetUserId:{not:null},chip:{offensive:!0}},include:{chip:{select:{name:!0}},user:{select:{username:!0}}}})))t.targetUserId&&await a(t.targetUserId,`⚔️ You were hit by **${t.chip.name}** (from @${t.user.username}) this week.`);let c=await n._.chipActivation.findMany({where:{cycleId:e,status:"CANCELLED",chip:{offensive:!0}},include:{chip:{select:{name:!0}},user:{select:{username:!0}}}}),h={cleanse:"Cleanse",mirror_coat:"Mirror Coat",protect:"Protect"};for(let e of c){let t=e.effectData;if(!t?.blockedBy||!t?.defenderId)continue;let r=h[t.blockedBy]??"Your defense";await a(t.defenderId,`🛡️ Your ${r} blocked **${e.chip.name}** from @${e.user.username}!`)}}},2331:(e,t,r)=>{r.d(t,{_:()=>i});var n=r(3524);let i=globalThis.prisma??new n.PrismaClient({log:["error"]})}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),n=t.X(0,[8948,5972,6944],()=>r(2886));module.exports=n})();