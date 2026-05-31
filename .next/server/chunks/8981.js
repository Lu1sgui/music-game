"use strict";exports.id=8981,exports.ids=[8981],exports.modules={9178:(e,t,r)=>{r.d(t,{Oe:()=>p,c_:()=>l,fT:()=>d,z3:()=>c});var i=r(1482),n=r.n(i),o=r(2023),a=r.n(o);let s=process.env.JWT_SECRET;if(!s)throw Error("JWT_SECRET environment variable is not set");async function l(e){return a().hash(e,12)}async function p(e,t){return a().compare(e,t)}function d(e){return n().sign(e,s,{expiresIn:"7d"})}function c(e){let t=function(e,t){if(e?.startsWith("Bearer "))return e.slice(7);if(t){let e=t.match(/(?:^|;\s*)token=([^;]+)/);return e?e[1]:null}return null}(e.headers.get("authorization"),e.headers.get("cookie"));if(!t)return null;try{return n().verify(t,s)}catch{return null}}},290:(e,t,r)=>{r.d(t,{JY:()=>c,$k:()=>l,WD:()=>p,d0:()=>d,oe:()=>o,B_:()=>s,Cz:()=>n,CL:()=>u});let i={flash:"pikachu",smokescreen:"cloud",substitute:"spooderman",recover:"chansey",swift:"pichu",haze:"wind","night-shade":"ghost-blue","swords-dance":"dancing-man","double-team":"users",disable:"lock",reflect:"surprised-pikachu",mimic:"eevee","confuse-ray":"psyduck","leech-seed":"bulbasaur","mega-drain":"chikorita",screech:"sound-high",metronome:"game-controller",spore:"jigglypuff",bide:"slowpoke","skull-bash":"t-rex",cushion:"koala-hug",spotlight:"star",insight:"magnifier",insurance:"umbrella",donation:"gift",toxic:"frog",payday:"meowth",protect:"squirtle",gamble:"maneki-neko",pickpocket:"scissors",bounty:"ribbon",cleanse:"sparkles",foresight:"owl-1",banker:"credit-card",mute:"sound-mute",usurp:"mario-jump","mirror-coat":"lapras",wildcard:"pinata",blackout:"moon",veto:"thumb-down",earthquake:"diglett","time-bomb":"clock",switcheroo:"magikarp",copycat:"copy",curse:"ghost-red",crown:"sunglasses",decree:"message",amnesty:"rainbow","double-header":"thumb-up","extra-time":"calendar"};async function n({to:e,subject:t,html:r}){let i=process.env.RESEND_API_KEY,n=process.env.EMAIL_FROM??"Weekly Beats <onboarding@resend.dev>";if(!i)return console.warn("[email] RESEND_API_KEY not set — skipping email send"),!1;try{let o=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${i}`,"Content-Type":"application/json"},body:JSON.stringify({from:n,to:e,subject:t,html:r})});if(!o.ok){let e=await o.text();return console.error("[email] Resend error:",o.status,e),!1}return!0}catch(e){return console.error("[email] Send failed:",e),!1}}function o(e,t){return`
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
</html>`.trim()}function s(e,t,r,i,n){let o=1===r?"\uD83E\uDD47 1st place":2===r?"\uD83E\uDD48 2nd place":3===r?"\uD83E\uDD49 3rd place":null,s=o?`You finished <strong style="color:#FFD700;">${o}</strong>!`:"Here's how your week went.";return a(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">Week ${t} results are in</h2>
    <p style="line-height: 1.6; margin: 0 0 16px; color: #B0B5CC;">
      Hi <strong>@${e}</strong>, ${s}
    </p>
    ${n?`<p style="color:#888; margin:0 0 16px;">Theme: <em>${n}</em></p>`:""}
    <div style="background:#0E1228; border:2px solid #00E5FF; border-radius:4px; padding:16px; text-align:center; margin:24px 0;">
      <span style="font-size:14px; color:#888;">Points this week</span><br>
      <span style="font-family:'Courier New',monospace; font-size:28px; color:#00E5FF;">${i>=0?"+":""}${i}</span>
    </div>
    <p style="text-align:center; margin:24px 0;">
      <a href="https://devinsmusic.reviews"
         style="display:inline-block; padding:12px 28px; background:#FF2D87; color:#fff; text-decoration:none; border-radius:4px; font-weight:700;">
        SEE THE LADDER
      </a>
    </p>
  `)}function l(e,t,r){return a(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">${t}</h2>
    <p style="line-height: 1.7; margin: 0 0 16px; color: #D0D4E8; white-space: pre-wrap;">Hi @${e},

${r}</p>
  `)}function p(e,t,r,n,o,s,l){let p=function(e,t="miniavs",r=80){return`https://api.dicebear.com/9.x/${t}/png?seed=${encodeURIComponent(e??"default")}&backgroundColor=0e1228&size=${r}`}(r,n??"miniavs",96),d=function(e,t=64){return`https://wsrv.nl/?url=raw.githubusercontent.com/shuqikhor/pixel-icons/main/icons/${i[e]??"surprised-pikachu"}.svg&output=png&w=${t}&h=${t}&fit=contain`}(o,96);return a(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">A chip was played on you</h2>
    <p style="line-height: 1.6; margin: 0 0 20px; color: #B0B5CC;">Hi <strong>@${e}</strong> — it's all out in the open now:</p>
    <div style="background:#0E1228; border:1px solid #2A2F50; border-radius:8px; padding:20px; text-align:center;">
      <table role="presentation" align="center" cellpadding="0" cellspacing="0"><tr>
        <td style="text-align:center; padding:0 14px;">
          <img src="${p}" width="64" height="64" alt="" style="border-radius:50%; border:2px solid #2A2F50; display:block; margin:0 auto;">
          <div style="font-size:13px; color:#B0B5CC; margin-top:6px;">@${t}</div>
        </td>
        <td style="text-align:center; font-size:22px; color:#FF2D87; padding:0 6px;">➜</td>
        <td style="text-align:center; padding:0 14px;">
          <img src="${d}" width="56" height="56" alt="${s}" style="display:block; margin:0 auto; image-rendering:pixelated;">
          <div style="font-size:13px; color:#FFD700; margin-top:6px;">${s}</div>
        </td>
      </tr></table>
      <p style="color:#E0E3F0; font-size:15px; margin:18px 0 0;">
        <strong>@${t}</strong> used <strong style="color:#FFD700;">${s}</strong> on you.
      </p>
      <p style="color:#B0B5CC; font-size:13px; line-height:1.5; margin:8px 0 0;">${l}</p>
    </div>
    <p style="text-align:center; margin:24px 0 0;">
      <a href="https://devinsmusic.reviews/chips"
         style="display:inline-block; padding:12px 28px; background:#FF2D87; color:#fff; text-decoration:none; border-radius:4px; font-weight:700;">
        PLAY YOUR CHIPS
      </a>
    </p>
  `)}function d(e,t,r){return a(`
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
  `)}function c(e,t,r,i){return a(`
    <h2 style="font-size: 20px; margin: 0 0 16px;">🏆 Achievement unlocked!</h2>
    <p style="line-height: 1.6; margin: 0 0 20px; color: #B0B5CC;">Nice one, <strong>@${e}</strong> — you earned:</p>
    <div style="background:#0E1228; border:2px solid #FFD700; border-radius:8px; padding:18px; text-align:center;">
      <div style="font-family:'Courier New',monospace; font-size:22px; color:#FFD700;">${t}</div>
      <p style="color:#B0B5CC; font-size:14px; line-height:1.5; margin:10px 0 0;">${r}</p>
      ${i?`<div style="margin-top:14px; display:inline-block; background:rgba(0,229,255,.1); border:1px solid #00E5FF; color:#00E5FF; border-radius:4px; padding:6px 12px; font-size:13px;">🎁 ${i}</div>`:""}
    </div>
    <p style="text-align:center; margin:24px 0 0;">
      <a href="https://devinsmusic.reviews/profile"
         style="display:inline-block; padding:12px 28px; background:#FF2D87; color:#fff; text-decoration:none; border-radius:4px; font-weight:700;">
        SEE YOUR BADGES
      </a>
    </p>
  `)}function u(e,t){return`
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
  `.trim()}},8867:(e,t,r)=>{r.d(t,{Lh:()=>p,bT:()=>c,br:()=>s,du:()=>u});var i=r(2331),n=r(3524),o=r(290);let a=new Set([n.ChipEffect.SWITCHEROO,n.ChipEffect.COPYCAT,n.ChipEffect.MUTE]);async function s(e,t){try{await i._.notification.create({data:{userId:e,message:t}})}catch(e){console.warn("[notify] Failed:",e)}}async function l(e,t){if(0!==e.length)try{await i._.notification.createMany({data:e.map(e=>({userId:e,message:t}))})}catch(e){console.warn("[notify] Bulk failed:",e)}}async function p(e,t=[]){let r=await i._.user.findMany({where:{isActive:!0,id:{notIn:t}},select:{id:!0}});await l(r.map(e=>e.id),e)}async function d(e,t,r){let n=await i._.user.findUnique({where:{id:e},select:{email:!0,emailOptIn:!0}});return!!n&&!!n.emailOptIn&&(0,o.Cz)({to:n.email,subject:t,html:r})}async function c(e){let t=await i._.weekCycle.findUnique({where:{id:e},select:{weekNumber:!0,theme:!0}});if(!t)return;let[r,n,l]=await Promise.all([i._.cycleResult.findMany({where:{cycleId:e},select:{userId:!0,position:!0}}),i._.submission.findMany({where:{cycleId:e},select:{userId:!0,user:{select:{username:!0}}}}),i._.pointsLedger.groupBy({by:["userId"],where:{cycleId:e},_sum:{amount:!0}})]),p=new Map(r.map(e=>[e.userId,e.position])),c=new Map(l.map(e=>[e.userId,e._sum.amount??0])),u=new Map(n.map(e=>[e.userId,e.user.username]));for(let e of Array.from(new Set(n.map(e=>e.userId)))){let r=p.get(e)??null,i=c.get(e)??0,n=1===r?"\uD83E\uDD47 1st place":2===r?"\uD83E\uDD48 2nd place":3===r?"\uD83E\uDD49 3rd place":"participation";await s(e,`✦ Week ${t.weekNumber} revealed — you earned **${i>=0?"+":""}${i}** points (${n}).`),await d(e,`⚡ Week ${t.weekNumber} results — Weekly Beats`,(0,o.B_)(u.get(e)??"player",t.weekNumber,r,i,t.theme))}for(let t of(await i._.chipActivation.findMany({where:{cycleId:e,status:"RESOLVED",targetUserId:{not:null},chip:{offensive:!0}},include:{chip:{select:{name:!0,slug:!0,description:!0,effectType:!0}},user:{select:{username:!0,avatarSeed:!0,avatarStyle:!0}},targetUser:{select:{id:!0,username:!0,email:!0,emailOptIn:!0}}}})))t.targetUserId&&t.targetUser&&(await s(t.targetUserId,`⚔️ You were hit by **${t.chip.name}** (from @${t.user.username}) this week.`),t.targetUser.emailOptIn&&!a.has(t.chip.effectType)&&await (0,o.Cz)({to:t.targetUser.email,subject:`⚔️ ${t.chip.name} was played on you — Weekly Beats`,html:(0,o.WD)(t.targetUser.username,t.user.username,t.user.avatarSeed,t.user.avatarStyle,t.chip.slug,t.chip.name,t.chip.description)}));for(let t of(await i._.userAchievement.findMany({where:{cycleId:e},include:{achievement:{select:{name:!0,description:!0,pointsBonus:!0,rewardChipSlug:!0}},user:{select:{email:!0,emailOptIn:!0,username:!0}}}})))if(await s(t.userId,`🏆 Achievement unlocked: **${t.achievement.name}**!`),t.user.emailOptIn){let e=[t.achievement.pointsBonus?`+${t.achievement.pointsBonus} pts`:null,t.achievement.rewardChipSlug?`${t.achievement.rewardChipSlug} chip`:null].filter(Boolean).join(" + ")||null;await (0,o.Cz)({to:t.user.email,subject:`🏆 Achievement unlocked — Weekly Beats`,html:(0,o.JY)(t.user.username,t.achievement.name,t.achievement.description,e)})}let m=await i._.chipActivation.findMany({where:{cycleId:e,status:"CANCELLED",chip:{offensive:!0}},include:{chip:{select:{name:!0}},user:{select:{username:!0}}}}),h={cleanse:"Cleanse",mirror_coat:"Mirror Coat",protect:"Protect"};for(let e of m){let t=e.effectData;if(!t?.blockedBy||!t?.defenderId)continue;let r=h[t.blockedBy]??"Your defense";await s(t.defenderId,`🛡️ Your ${r} blocked **${e.chip.name}** from @${e.user.username}!`)}}async function u(e,t,r){let n=await i._.user.findUnique({where:{id:e},select:{username:!0,email:!0,emailOptIn:!0}});n&&(await s(e,`👑 You're the Game Master for week ${t}! Set the theme and score the songs.`),n.emailOptIn&&await (0,o.Cz)({to:n.email,subject:`👑 You're this week's Game Master — Weekly Beats`,html:(0,o.d0)(n.username,t,r)}))}},2331:(e,t,r)=>{r.d(t,{_:()=>n});var i=r(3524);let n=globalThis.prisma??new i.PrismaClient({log:["error"]})}};