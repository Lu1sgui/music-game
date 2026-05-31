"use strict";(()=>{var e={};e.id=8798,e.ids=[8798],e.modules={3524:e=>{e.exports=require("@prisma/client")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},4770:e=>{e.exports=require("crypto")},6162:e=>{e.exports=require("stream")},1764:e=>{e.exports=require("util")},2408:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>g,patchFetch:()=>x,requestAsyncStorage:()=>h,routeModule:()=>m,serverHooks:()=>f,staticGenerationAsyncStorage:()=>y});var o={};r.r(o),r.d(o,{POST:()=>c});var a=r(9303),n=r(8716),i=r(670),s=r(7070),l=r(2331),p=r(9178),d=r(6119),u=r(8867);async function c(e){try{let t=(0,p.z3)(e);if(!t)return s.NextResponse.json({error:"Unauthorized"},{status:401});if("ADMIN"!==t.role)return s.NextResponse.json({error:"Forbidden"},{status:403});let{message:r,email:o,subject:a}=await e.json();if(!r||"string"!=typeof r||!r.trim())return s.NextResponse.json({error:"message is required"},{status:400});let n=r.trim();await (0,u.Lh)(`📢 ${n}`);let i=0;if(o){let e="string"==typeof a&&a.trim()||"A message from Weekly Beats";for(let t of(await l._.user.findMany({where:{isActive:!0,emailOptIn:!0},select:{username:!0,email:!0}})))await (0,d.Cz)({to:t.email,subject:`📢 ${e}`,html:(0,d.$k)(t.username,e,n)})&&i++}return s.NextResponse.json({message:"Broadcast sent",emailed:i})}catch(e){return console.error("[POST /api/admin/broadcast]",e?.message??e),s.NextResponse.json({error:"Internal server error"},{status:500})}}let m=new a.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/admin/broadcast/route",pathname:"/api/admin/broadcast",filename:"route",bundlePath:"app/api/admin/broadcast/route"},resolvedPagePath:"/Users/luisgui/music-game/app/api/admin/broadcast/route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:h,staticGenerationAsyncStorage:y,serverHooks:f}=m,g="/api/admin/broadcast/route";function x(){return(0,i.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:y})}},9178:(e,t,r)=>{r.d(t,{Oe:()=>p,c_:()=>l,fT:()=>d,z3:()=>u});var o=r(1482),a=r.n(o),n=r(2023),i=r.n(n);let s=process.env.JWT_SECRET;if(!s)throw Error("JWT_SECRET environment variable is not set");async function l(e){return i().hash(e,12)}async function p(e,t){return i().compare(e,t)}function d(e){return a().sign(e,s,{expiresIn:"7d"})}function u(e){let t=function(e,t){if(e?.startsWith("Bearer "))return e.slice(7);if(t){let e=t.match(/(?:^|;\s*)token=([^;]+)/);return e?e[1]:null}return null}(e.headers.get("authorization"),e.headers.get("cookie"));if(!t)return null;try{return a().verify(t,s)}catch{return null}}},6119:(e,t,r)=>{async function o({to:e,subject:t,html:r}){let o=process.env.RESEND_API_KEY,a=process.env.EMAIL_FROM??"Weekly Beats <onboarding@resend.dev>";if(!o)return console.warn("[email] RESEND_API_KEY not set — skipping email send"),!1;try{let n=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${o}`,"Content-Type":"application/json"},body:JSON.stringify({from:a,to:e,subject:t,html:r})});if(!n.ok){let e=await n.text();return console.error("[email] Resend error:",n.status,e),!1}return!0}catch(e){return console.error("[email] Send failed:",e),!1}}function a(e,t){return`
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
  `.trim()}function n(e,t,r){var o;return o=`
    <h2 style="font-size: 20px; margin: 0 0 16px;">${t}</h2>
    <p style="line-height: 1.7; margin: 0 0 16px; color: #D0D4E8; white-space: pre-wrap;">Hi @${e},

${r}</p>
  `,`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; background:#0E1228; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 560px; margin: 40px auto; padding: 32px; background: #1A1E3A; border-radius: 8px; color: #E0E3F0;">
    <h1 style="color: #FF2D87; font-size: 24px; margin: 0 0 24px;">⚡ Weekly Beats</h1>
    ${o}
    <hr style="border: none; border-top: 1px solid #2A2F50; margin: 32px 0;">
    <p style="font-size: 12px; color: #666; line-height: 1.5;">
      You're receiving this because you opted in to Weekly Beats emails.
      You can turn these off anytime from your profile.
    </p>
  </div>
</body>
</html>`.trim()}function i(e,t){return`
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
  `.trim()}r.d(t,{$k:()=>n,CL:()=>i,Cz:()=>o,oe:()=>a})},8867:(e,t,r)=>{r.d(t,{Lh:()=>i,br:()=>a});var o=r(2331);async function a(e,t){try{await o._.notification.create({data:{userId:e,message:t}})}catch(e){console.warn("[notify] Failed:",e)}}async function n(e,t){if(0!==e.length)try{await o._.notification.createMany({data:e.map(e=>({userId:e,message:t}))})}catch(e){console.warn("[notify] Bulk failed:",e)}}async function i(e,t=[]){let r=await o._.user.findMany({where:{isActive:!0,id:{notIn:t}},select:{id:!0}});await n(r.map(e=>e.id),e)}},2331:(e,t,r)=>{r.d(t,{_:()=>a});var o=r(3524);let a=globalThis.prisma??new o.PrismaClient({log:["error"]})}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[8948,5972,6944],()=>r(2408));module.exports=o})();