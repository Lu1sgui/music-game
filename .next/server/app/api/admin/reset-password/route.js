"use strict";(()=>{var e={};e.id=3682,e.ids=[3682],e.modules={3524:e=>{e.exports=require("@prisma/client")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},4770:e=>{e.exports=require("crypto")},6162:e=>{e.exports=require("stream")},1764:e=>{e.exports=require("util")},2085:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>g,patchFetch:()=>x,requestAsyncStorage:()=>h,routeModule:()=>m,serverHooks:()=>y,staticGenerationAsyncStorage:()=>f});var s={};t.r(s),t.d(s,{POST:()=>c});var o=t(9303),a=t(8716),n=t(670),i=t(7070),p=t(2331),l=t(9178),d=t(6119),u=t(8867);async function c(e){try{let r=(0,l.z3)(e);if(!r)return i.NextResponse.json({error:"Unauthorized"},{status:401});if("ADMIN"!==r.role)return i.NextResponse.json({error:"Forbidden"},{status:403});let{userId:t}=await e.json();if(!t)return i.NextResponse.json({error:"userId required"},{status:400});let s=await p._.user.findUnique({where:{id:t}});if(!s)return i.NextResponse.json({error:"User not found"},{status:404});let o=function(){let e="abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789",r="";for(let t=0;t<12;t++)r+=e[Math.floor(Math.random()*e.length)];return r}(),a=await (0,l.c_)(o);return await p._.user.update({where:{id:s.id},data:{passwordHash:a,mustChangePassword:!0}}),await (0,d.Cz)({to:s.email,subject:"⚡ Your Weekly Beats password was reset",html:(0,d.CL)(s.username,o)}),await (0,u.b)(s.id,`🔑 Your password was reset by an admin. Check your email for the temporary password.`),i.NextResponse.json({message:`Password reset for @${s.username}`,tempPassword:o,emailSentTo:s.email})}catch(e){return console.error("[POST /api/admin/reset-password]",e?.message??e),i.NextResponse.json({error:"Internal server error"},{status:500})}}let m=new o.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/admin/reset-password/route",pathname:"/api/admin/reset-password",filename:"route",bundlePath:"app/api/admin/reset-password/route"},resolvedPagePath:"/Users/luisgui/music-game/app/api/admin/reset-password/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:h,staticGenerationAsyncStorage:f,serverHooks:y}=m,g="/api/admin/reset-password/route";function x(){return(0,n.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:f})}},9178:(e,r,t)=>{t.d(r,{Oe:()=>l,c_:()=>p,fT:()=>d,z3:()=>u});var s=t(1482),o=t.n(s),a=t(2023),n=t.n(a);let i=process.env.JWT_SECRET;if(!i)throw Error("JWT_SECRET environment variable is not set");async function p(e){return n().hash(e,12)}async function l(e,r){return n().compare(e,r)}function d(e){return o().sign(e,i,{expiresIn:"7d"})}function u(e){let r=function(e,r){if(e?.startsWith("Bearer "))return e.slice(7);if(r){let e=r.match(/(?:^|;\s*)token=([^;]+)/);return e?e[1]:null}return null}(e.headers.get("authorization"),e.headers.get("cookie"));if(!r)return null;try{return o().verify(r,i)}catch{return null}}},6119:(e,r,t)=>{async function s({to:e,subject:r,html:t}){let s=process.env.RESEND_API_KEY,o=process.env.EMAIL_FROM??"Weekly Beats <onboarding@resend.dev>";if(!s)return console.warn("[email] RESEND_API_KEY not set — skipping email send"),!1;try{let a=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${s}`,"Content-Type":"application/json"},body:JSON.stringify({from:o,to:e,subject:r,html:t})});if(!a.ok){let e=await a.text();return console.error("[email] Resend error:",a.status,e),!1}return!0}catch(e){return console.error("[email] Send failed:",e),!1}}function o(e,r){return`
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
  `.trim()}function a(e,r){return`
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
  `.trim()}t.d(r,{CL:()=>a,Cz:()=>s,oe:()=>o})},8867:(e,r,t)=>{t.d(r,{b:()=>o});var s=t(2331);async function o(e,r){try{await s._.notification.create({data:{userId:e,message:r}})}catch(e){console.warn("[notify] Failed:",e)}}},2331:(e,r,t)=>{t.d(r,{_:()=>o});var s=t(3524);let o=globalThis.prisma??new s.PrismaClient({log:["error"]})}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[8948,5972,6944],()=>t(2085));module.exports=s})();