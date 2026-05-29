"use strict";(()=>{var e={};e.id=9118,e.ids=[9118],e.modules={3524:e=>{e.exports=require("@prisma/client")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},4770:e=>{e.exports=require("crypto")},7366:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>y,patchFetch:()=>x,requestAsyncStorage:()=>c,routeModule:()=>h,serverHooks:()=>g,staticGenerationAsyncStorage:()=>m});var s={};r.r(s),r.d(s,{POST:()=>u});var o=r(9303),a=r(8716),i=r(670),n=r(7070),p=r(4770),l=r(2331),d=r(6119);async function u(e){try{let{email:t}=await e.json();if(!t)return n.NextResponse.json({error:"Email required"},{status:400});let r=await l._.user.findUnique({where:{email:t.toLowerCase().trim()}});if(r){await l._.passwordReset.updateMany({where:{userId:r.id,usedAt:null},data:{usedAt:new Date}});let e=(0,p.randomBytes)(32).toString("base64url"),t=(0,p.createHash)("sha256").update(e).digest("hex"),s=new Date(Date.now()+36e5);await l._.passwordReset.create({data:{userId:r.id,tokenHash:t,expiresAt:s}});let o=`https://devinsmusic.reviews/reset-password/${e}`;await (0,d.Cz)({to:r.email,subject:"⚡ Reset your Weekly Beats password",html:(0,d.oe)(r.username,o)})}return n.NextResponse.json({message:"If an account exists with that email, a password reset link has been sent."})}catch(e){return console.error("[POST /api/auth/forgot-password]",e?.message??e),n.NextResponse.json({error:"Internal server error"},{status:500})}}let h=new o.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/auth/forgot-password/route",pathname:"/api/auth/forgot-password",filename:"route",bundlePath:"app/api/auth/forgot-password/route"},resolvedPagePath:"/Users/luisgui/music-game/app/api/auth/forgot-password/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:c,staticGenerationAsyncStorage:m,serverHooks:g}=h,y="/api/auth/forgot-password/route";function x(){return(0,i.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:m})}},6119:(e,t,r)=>{async function s({to:e,subject:t,html:r}){let s=process.env.RESEND_API_KEY,o=process.env.EMAIL_FROM??"Weekly Beats <onboarding@resend.dev>";if(!s)return console.warn("[email] RESEND_API_KEY not set — skipping email send"),!1;try{let a=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${s}`,"Content-Type":"application/json"},body:JSON.stringify({from:o,to:e,subject:t,html:r})});if(!a.ok){let e=await a.text();return console.error("[email] Resend error:",a.status,e),!1}return!0}catch(e){return console.error("[email] Send failed:",e),!1}}function o(e,t){return`
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
  `.trim()}function a(e,t){return`
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
  `.trim()}r.d(t,{CL:()=>a,Cz:()=>s,oe:()=>o})},2331:(e,t,r)=>{r.d(t,{_:()=>o});var s=r(3524);let o=globalThis.prisma??new s.PrismaClient({log:["error"]})}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[8948,5972],()=>r(7366));module.exports=s})();