"use strict";(()=>{var e={};e.id=3682,e.ids=[3682],e.modules={3524:e=>{e.exports=require("@prisma/client")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},4770:e=>{e.exports=require("crypto")},6162:e=>{e.exports=require("stream")},1764:e=>{e.exports=require("util")},2085:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>x,patchFetch:()=>w,requestAsyncStorage:()=>y,routeModule:()=>h,serverHooks:()=>g,staticGenerationAsyncStorage:()=>f});var o={};t.r(o),t.d(o,{POST:()=>m});var s=t(9303),a=t(8716),n=t(670),i=t(7070),l=t(4770),p=t(2331),d=t(9178),u=t(6119),c=t(8867);async function m(e){try{let r=(0,d.z3)(e);if(!r)return i.NextResponse.json({error:"Unauthorized"},{status:401});if("ADMIN"!==r.role)return i.NextResponse.json({error:"Forbidden"},{status:403});let{userId:t}=await e.json();if(!t)return i.NextResponse.json({error:"userId required"},{status:400});let o=await p._.user.findUnique({where:{id:t}});if(!o)return i.NextResponse.json({error:"User not found"},{status:404});let s=function(){let e="abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789",r="";for(let t=0;t<12;t++)r+=e[(0,l.randomInt)(e.length)];return r}(),a=await (0,d.c_)(s);return await p._.user.update({where:{id:o.id},data:{passwordHash:a,mustChangePassword:!0}}),await (0,u.Cz)({to:o.email,subject:"⚡ Your Weekly Beats password was reset",html:(0,u.CL)(o.username,s)}),await (0,c.br)(o.id,`🔑 Your password was reset by an admin. Check your email for the temporary password.`),i.NextResponse.json({message:`Password reset for @${o.username}`,tempPassword:s,emailSentTo:o.email})}catch(e){return console.error("[POST /api/admin/reset-password]",e?.message??e),i.NextResponse.json({error:"Internal server error"},{status:500})}}let h=new s.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/admin/reset-password/route",pathname:"/api/admin/reset-password",filename:"route",bundlePath:"app/api/admin/reset-password/route"},resolvedPagePath:"/Users/luisgui/music-game/app/api/admin/reset-password/route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:y,staticGenerationAsyncStorage:f,serverHooks:g}=h,x="/api/admin/reset-password/route";function w(){return(0,n.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:f})}},9178:(e,r,t)=>{t.d(r,{Oe:()=>p,c_:()=>l,fT:()=>d,z3:()=>u});var o=t(1482),s=t.n(o),a=t(2023),n=t.n(a);let i=process.env.JWT_SECRET;if(!i)throw Error("JWT_SECRET environment variable is not set");async function l(e){return n().hash(e,12)}async function p(e,r){return n().compare(e,r)}function d(e){return s().sign(e,i,{expiresIn:"7d"})}function u(e){let r=function(e,r){if(e?.startsWith("Bearer "))return e.slice(7);if(r){let e=r.match(/(?:^|;\s*)token=([^;]+)/);return e?e[1]:null}return null}(e.headers.get("authorization"),e.headers.get("cookie"));if(!r)return null;try{return s().verify(r,i)}catch{return null}}},6119:(e,r,t)=>{async function o({to:e,subject:r,html:t}){let o=process.env.RESEND_API_KEY,s=process.env.EMAIL_FROM??"Weekly Beats <onboarding@resend.dev>";if(!o)return console.warn("[email] RESEND_API_KEY not set — skipping email send"),!1;try{let a=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${o}`,"Content-Type":"application/json"},body:JSON.stringify({from:s,to:e,subject:r,html:t})});if(!a.ok){let e=await a.text();return console.error("[email] Resend error:",a.status,e),!1}return!0}catch(e){return console.error("[email] Send failed:",e),!1}}function s(e,r){return`
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
  `.trim()}function a(e,r,t){var o;return o=`
    <h2 style="font-size: 20px; margin: 0 0 16px;">${r}</h2>
    <p style="line-height: 1.7; margin: 0 0 16px; color: #D0D4E8; white-space: pre-wrap;">Hi @${e},

${t}</p>
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
</html>`.trim()}function n(e,r){return`
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
  `.trim()}t.d(r,{$k:()=>a,CL:()=>n,Cz:()=>o,oe:()=>s})},8867:(e,r,t)=>{t.d(r,{Lh:()=>n,br:()=>s});var o=t(2331);async function s(e,r){try{await o._.notification.create({data:{userId:e,message:r}})}catch(e){console.warn("[notify] Failed:",e)}}async function a(e,r){if(0!==e.length)try{await o._.notification.createMany({data:e.map(e=>({userId:e,message:r}))})}catch(e){console.warn("[notify] Bulk failed:",e)}}async function n(e,r=[]){let t=await o._.user.findMany({where:{isActive:!0,id:{notIn:r}},select:{id:!0}});await a(t.map(e=>e.id),e)}},2331:(e,r,t)=>{t.d(r,{_:()=>s});var o=t(3524);let s=globalThis.prisma??new o.PrismaClient({log:["error"]})}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),o=r.X(0,[8948,5972,6944],()=>t(2085));module.exports=o})();