"use strict";(()=>{var e={};e.id=9118,e.ids=[9118],e.modules={3524:e=>{e.exports=require("@prisma/client")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},4770:e=>{e.exports=require("crypto")},7366:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>f,patchFetch:()=>x,requestAsyncStorage:()=>g,routeModule:()=>h,serverHooks:()=>y,staticGenerationAsyncStorage:()=>m});var o={};r.r(o),r.d(o,{POST:()=>c});var s=r(9303),a=r(8716),n=r(670),i=r(7070),p=r(4770),l=r(2331),d=r(6119),u=r(5062);async function c(e){try{let{email:t}=await e.json();if(!t)return i.NextResponse.json({error:"Email required"},{status:400});let r=String(t).toLowerCase().trim(),o=(0,u.h)(`forgot:${r}`,3,36e5),s=(0,u.h)(`forgot-ip:${(0,u.j)(e)}`,10,36e5);if(!o.ok||!s.ok)return i.NextResponse.json({message:"If an account exists with that email, a password reset link has been sent."});let a=await l._.user.findFirst({where:{email:{equals:r,mode:"insensitive"}}});if(a){await l._.passwordReset.updateMany({where:{userId:a.id,usedAt:null},data:{usedAt:new Date}});let e=(0,p.randomBytes)(32).toString("base64url"),t=(0,p.createHash)("sha256").update(e).digest("hex"),r=new Date(Date.now()+36e5);await l._.passwordReset.create({data:{userId:a.id,tokenHash:t,expiresAt:r}});let o=`https://devinsmusic.reviews/reset-password/${e}`;await (0,d.Cz)({to:a.email,subject:"⚡ Reset your Weekly Beats password",html:(0,d.oe)(a.username,o)})}return i.NextResponse.json({message:"If an account exists with that email, a password reset link has been sent."})}catch(e){return console.error("[POST /api/auth/forgot-password]",e?.message??e),i.NextResponse.json({error:"Internal server error"},{status:500})}}let h=new s.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/auth/forgot-password/route",pathname:"/api/auth/forgot-password",filename:"route",bundlePath:"app/api/auth/forgot-password/route"},resolvedPagePath:"/Users/luisgui/music-game/app/api/auth/forgot-password/route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:g,staticGenerationAsyncStorage:m,serverHooks:y}=h,f="/api/auth/forgot-password/route";function x(){return(0,n.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:m})}},6119:(e,t,r)=>{async function o({to:e,subject:t,html:r}){let o=process.env.RESEND_API_KEY,s=process.env.EMAIL_FROM??"Weekly Beats <onboarding@resend.dev>";if(!o)return console.warn("[email] RESEND_API_KEY not set — skipping email send"),!1;try{let a=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${o}`,"Content-Type":"application/json"},body:JSON.stringify({from:s,to:e,subject:t,html:r})});if(!a.ok){let e=await a.text();return console.error("[email] Resend error:",a.status,e),!1}return!0}catch(e){return console.error("[email] Send failed:",e),!1}}function s(e,t){return`
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
</html>`.trim()}function n(e,t,r,o,s){let n=1===r?"\uD83E\uDD47 1st place":2===r?"\uD83E\uDD48 2nd place":3===r?"\uD83E\uDD49 3rd place":null,i=n?`You finished <strong style="color:#FFD700;">${n}</strong>!`:"Here's how your week went.";return a(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">Week ${t} results are in</h2>
    <p style="line-height: 1.6; margin: 0 0 16px; color: #B0B5CC;">
      Hi <strong>@${e}</strong>, ${i}
    </p>
    ${s?`<p style="color:#888; margin:0 0 16px;">Theme: <em>${s}</em></p>`:""}
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
  `)}function i(e,t,r){return a(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">${t}</h2>
    <p style="line-height: 1.7; margin: 0 0 16px; color: #D0D4E8; white-space: pre-wrap;">Hi @${e},

${r}</p>
  `)}function p(e,t){return`
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
  `.trim()}r.d(t,{$k:()=>i,B_:()=>n,CL:()=>p,Cz:()=>o,oe:()=>s})},2331:(e,t,r)=>{r.d(t,{_:()=>s});var o=r(3524);let s=globalThis.prisma??new o.PrismaClient({log:["error"]})},5062:(e,t,r)=>{r.d(t,{h:()=>s,j:()=>a});let o=new Map;function s(e,t,r){let s=Date.now();!function(e){if(!(o.size<5e3))for(let[t,r]of Array.from(o.entries()))e>r.resetAt&&o.delete(t)}(s);let a=o.get(e);return!a||s>a.resetAt?(o.set(e,{count:1,resetAt:s+r}),{ok:!0,remaining:t-1,retryAfter:0}):(a.count++,a.count>t)?{ok:!1,remaining:0,retryAfter:Math.ceil((a.resetAt-s)/1e3)}:{ok:!0,remaining:t-a.count,retryAfter:0}}function a(e){let t=e.headers.get("x-forwarded-for");return t?t.split(",")[0].trim():e.headers.get("x-real-ip")?.trim()||"unknown"}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[8948,5972],()=>r(7366));module.exports=o})();