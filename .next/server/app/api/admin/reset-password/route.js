"use strict";(()=>{var e={};e.id=3682,e.ids=[3682],e.modules={3524:e=>{e.exports=require("@prisma/client")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},4770:e=>{e.exports=require("crypto")},6162:e=>{e.exports=require("stream")},1764:e=>{e.exports=require("util")},2085:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>w,patchFetch:()=>x,requestAsyncStorage:()=>f,routeModule:()=>h,serverHooks:()=>g,staticGenerationAsyncStorage:()=>y});var n={};t.r(n),t.d(n,{POST:()=>m});var a=t(9303),s=t(8716),o=t(670),i=t(7070),l=t(4770),p=t(2331),u=t(9178),d=t(6119),c=t(8867);async function m(e){try{let r=(0,u.z3)(e);if(!r)return i.NextResponse.json({error:"Unauthorized"},{status:401});if("ADMIN"!==r.role)return i.NextResponse.json({error:"Forbidden"},{status:403});let{userId:t}=await e.json();if(!t)return i.NextResponse.json({error:"userId required"},{status:400});let n=await p._.user.findUnique({where:{id:t}});if(!n)return i.NextResponse.json({error:"User not found"},{status:404});let a=function(){let e="abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789",r="";for(let t=0;t<12;t++)r+=e[(0,l.randomInt)(e.length)];return r}(),s=await (0,u.c_)(a);return await p._.user.update({where:{id:n.id},data:{passwordHash:s,mustChangePassword:!0}}),await (0,d.Cz)({to:n.email,subject:"⚡ Your Weekly Beats password was reset",html:(0,d.CL)(n.username,a)}),await (0,c.br)(n.id,`🔑 Your password was reset by an admin. Check your email for the temporary password.`),i.NextResponse.json({message:`Password reset for @${n.username}`,tempPassword:a,emailSentTo:n.email})}catch(e){return console.error("[POST /api/admin/reset-password]",e?.message??e),i.NextResponse.json({error:"Internal server error"},{status:500})}}let h=new a.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/admin/reset-password/route",pathname:"/api/admin/reset-password",filename:"route",bundlePath:"app/api/admin/reset-password/route"},resolvedPagePath:"/Users/luisgui/music-game/app/api/admin/reset-password/route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:f,staticGenerationAsyncStorage:y,serverHooks:g}=h,w="/api/admin/reset-password/route";function x(){return(0,o.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:y})}},9178:(e,r,t)=>{t.d(r,{Oe:()=>p,c_:()=>l,fT:()=>u,z3:()=>d});var n=t(1482),a=t.n(n),s=t(2023),o=t.n(s);let i=process.env.JWT_SECRET;if(!i)throw Error("JWT_SECRET environment variable is not set");async function l(e){return o().hash(e,12)}async function p(e,r){return o().compare(e,r)}function u(e){return a().sign(e,i,{expiresIn:"7d"})}function d(e){let r=function(e,r){if(e?.startsWith("Bearer "))return e.slice(7);if(r){let e=r.match(/(?:^|;\s*)token=([^;]+)/);return e?e[1]:null}return null}(e.headers.get("authorization"),e.headers.get("cookie"));if(!r)return null;try{return a().verify(r,i)}catch{return null}}},6119:(e,r,t)=>{async function n({to:e,subject:r,html:t}){let n=process.env.RESEND_API_KEY,a=process.env.EMAIL_FROM??"Weekly Beats <onboarding@resend.dev>";if(!n)return console.warn("[email] RESEND_API_KEY not set — skipping email send"),!1;try{let s=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${n}`,"Content-Type":"application/json"},body:JSON.stringify({from:a,to:e,subject:r,html:t})});if(!s.ok){let e=await s.text();return console.error("[email] Resend error:",s.status,e),!1}return!0}catch(e){return console.error("[email] Send failed:",e),!1}}function a(e,r){return`
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
      <a href="${r}"
         style="display: inline-block; padding: 14px 32px; background: #FF2D87; color: #fff;
                text-decoration: none; border-radius: 4px; font-weight: 700;
                font-family: -apple-system, sans-serif; letter-spacing: 0.5px;">
        RESET PASSWORD
      </a>
    </p>
    <p style="font-size: 13px; color: #888; line-height: 1.6;">
      Or paste this link into your browser:<br>
      <a href="${r}" style="color: #00E5FF; word-break: break-all;">${r}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #2A2F50; margin: 32px 0;">
    <p style="font-size: 12px; color: #666; line-height: 1.5;">
      If you didn't request this, you can safely ignore this email — your password won't change.
    </p>
  </div>
</body>
</html>
  `.trim()}function s(e){return`
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
</html>`.trim()}function o(e,r,t,n,a){let o=1===t?"\uD83E\uDD47 1st place":2===t?"\uD83E\uDD48 2nd place":3===t?"\uD83E\uDD49 3rd place":null,i=o?`You finished <strong style="color:#FFD700;">${o}</strong>!`:"Here's how your week went.";return s(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">Week ${r} results are in</h2>
    <p style="line-height: 1.6; margin: 0 0 16px; color: #B0B5CC;">
      Hi <strong>@${e}</strong>, ${i}
    </p>
    ${a?`<p style="color:#888; margin:0 0 16px;">Theme: <em>${a}</em></p>`:""}
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
  `)}function i(e,r,t){return s(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">${r}</h2>
    <p style="line-height: 1.7; margin: 0 0 16px; color: #D0D4E8; white-space: pre-wrap;">Hi @${e},

${t}</p>
  `)}function l(e,r){return`
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
      <code style="font-family: 'Courier New', monospace; font-size: 22px; color: #FFD700; letter-spacing: 2px;">${r}</code>
    </div>
    <p style="line-height: 1.6; color: #B0B5CC;">
      You'll be asked to set a new password the next time you log in.
    </p>
  </div>
</body>
</html>
  `.trim()}t.d(r,{$k:()=>i,B_:()=>o,CL:()=>l,Cz:()=>n,oe:()=>a})},8867:(e,r,t)=>{t.d(r,{Lh:()=>i,bT:()=>p,br:()=>s});var n=t(2331),a=t(6119);async function s(e,r){try{await n._.notification.create({data:{userId:e,message:r}})}catch(e){console.warn("[notify] Failed:",e)}}async function o(e,r){if(0!==e.length)try{await n._.notification.createMany({data:e.map(e=>({userId:e,message:r}))})}catch(e){console.warn("[notify] Bulk failed:",e)}}async function i(e,r=[]){let t=await n._.user.findMany({where:{isActive:!0,id:{notIn:r}},select:{id:!0}});await o(t.map(e=>e.id),e)}async function l(e,r,t){let s=await n._.user.findUnique({where:{id:e},select:{email:!0,emailOptIn:!0}});return!!s&&!!s.emailOptIn&&(0,a.Cz)({to:s.email,subject:r,html:t})}async function p(e){let r=await n._.weekCycle.findUnique({where:{id:e},select:{weekNumber:!0,theme:!0}});if(!r)return;let[t,o,i]=await Promise.all([n._.cycleResult.findMany({where:{cycleId:e},select:{userId:!0,position:!0}}),n._.submission.findMany({where:{cycleId:e},select:{userId:!0,user:{select:{username:!0}}}}),n._.pointsLedger.groupBy({by:["userId"],where:{cycleId:e},_sum:{amount:!0}})]),p=new Map(t.map(e=>[e.userId,e.position])),u=new Map(i.map(e=>[e.userId,e._sum.amount??0])),d=new Map(o.map(e=>[e.userId,e.user.username]));for(let e of Array.from(new Set(o.map(e=>e.userId)))){let t=p.get(e)??null,n=u.get(e)??0,o=1===t?"\uD83E\uDD47 1st place":2===t?"\uD83E\uDD48 2nd place":3===t?"\uD83E\uDD49 3rd place":"participation";await s(e,`✦ Week ${r.weekNumber} revealed — you earned **${n>=0?"+":""}${n}** points (${o}).`),await l(e,`⚡ Week ${r.weekNumber} results — Weekly Beats`,(0,a.B_)(d.get(e)??"player",r.weekNumber,t,n,r.theme))}for(let r of(await n._.chipActivation.findMany({where:{cycleId:e,status:"RESOLVED",targetUserId:{not:null},chip:{offensive:!0}},include:{chip:{select:{name:!0}},user:{select:{username:!0}}}})))r.targetUserId&&await s(r.targetUserId,`⚔️ You were hit by **${r.chip.name}** (from @${r.user.username}) this week.`);let c=await n._.chipActivation.findMany({where:{cycleId:e,status:"CANCELLED",chip:{offensive:!0}},include:{chip:{select:{name:!0}},user:{select:{username:!0}}}}),m={cleanse:"Cleanse",mirror_coat:"Mirror Coat",protect:"Protect"};for(let e of c){let r=e.effectData;if(!r?.blockedBy||!r?.defenderId)continue;let t=m[r.blockedBy]??"Your defense";await s(r.defenderId,`🛡️ Your ${t} blocked **${e.chip.name}** from @${e.user.username}!`)}}},2331:(e,r,t)=>{t.d(r,{_:()=>a});var n=t(3524);let a=globalThis.prisma??new n.PrismaClient({log:["error"]})}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),n=r.X(0,[8948,5972,6944],()=>t(2085));module.exports=n})();