/* Safelight — GPU develop engine (WebGL2). All edits are parametric; the source image is never modified. */
'use strict';

const Engine = (() => {

const VS = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = vec2(aPos.x*0.5+0.5, 0.5-aPos.y*0.5); gl_Position = vec4(aPos,0.0,1.0); }`;

const COMMON = `#version 300 es
precision highp float; precision highp int; precision highp sampler3D;
in vec2 vUv; out vec4 o;
uniform vec4 uView;
uniform vec4 uCrop; uniform float uAngle; uniform vec2 uFlip;
uniform vec4 uXf1; uniform vec4 uXf2; uniform float uK1;
uniform int uOrient; uniform vec2 uHalfO; uniform float uAs;
vec2 tc(vec2 uv){ return vec2(uv.x, 1.0-uv.y); }
float lumW(vec3 c){ return dot(c, vec3(0.2126,0.7152,0.0722)); }
vec2 outToQ(vec2 ouv){
  vec2 f = ouv*2.0-1.0;
  vec2 l = vec2(f.x*uCrop.z, f.y*uCrop.w);
  float c = cos(uAngle), s = sin(uAngle);
  vec2 q = uCrop.xy + vec2(c*l.x - s*l.y, s*l.x + c*l.y);
  q *= uFlip;
  q -= uXf2.yz;
  q /= uXf1.w;
  float cr = cos(-uXf1.z), sr = sin(-uXf1.z);
  q = vec2(cr*q.x - sr*q.y, sr*q.x + cr*q.y);
  q *= vec2(exp(-uXf2.x), exp(uXf2.x));
  float w = 1.0 + uXf1.x*q.y + uXf1.y*q.x;
  q /= max(w, 0.05);
  float r2 = dot(q,q)/dot(uHalfO,uHalfO);
  q *= 1.0 + uK1*r2;
  return q;
}
vec2 qToSrc(vec2 q){
  vec2 s;
  if(uOrient==1) s = vec2(q.y,-q.x); else if(uOrient==2) s = -q; else if(uOrient==3) s = vec2(-q.y,q.x); else s = q;
  return s/vec2(uAs,1.0)+0.5;
}
`;

const GEOM_FS = COMMON + `
uniform sampler2D uSrc; uniform float uLod; uniform float uSrcH;
uniform int uSpotN; uniform vec4 uSpA[24]; uniform vec4 uSpB[24];
uniform vec2 uCa; uniform vec2 uLv;
vec3 fetch(vec2 s, float lod){ return max(textureLod(uSrc, s, lod).rgb, 0.0); }
vec3 sampleSrc(vec2 s){
  vec3 c = fetch(s, uLod);
  for(int i=0;i<24;i++){
    if(i>=uSpotN) break;
    vec4 A = uSpA[i], B = uSpB[i];
    vec2 d = (s-A.xy)*vec2(uAs,1.0); float dist = length(d)/max(B.x,1e-5);
    if(dist<1.0){
      float w = (1.0 - smoothstep(1.0-B.y-0.001, 1.0, dist))*B.z;
      if(B.w>1.5){
        float m = (c.g+c.b)*0.5; if(c.r > m*1.3) c.r = mix(c.r, m*0.9, w);
      } else {
        vec2 so = s + (A.zw - A.xy);
        vec3 cc = fetch(so, uLod);
        if(B.w>0.5){ float hl = log2(max(B.x*uSrcH*0.35, 1.0)); cc += fetch(s,hl) - fetch(so,hl); }
        c = mix(c, max(cc,0.0), w);
      }
    }
  }
  return c;
}
void main(){
  vec2 ouv = mix(uView.xy, uView.zw, vUv);
  vec2 q = outToQ(ouv);
  vec2 s = qToSrc(q);
  if(s.x<0.0||s.y<0.0||s.x>1.0||s.y>1.0){ o = vec4(0.012,0.012,0.013,1.0); return; }
  vec3 c = sampleSrc(s);
  if(uCa.x!=0.0) c.r = sampleSrc(qToSrc(q*(1.0+uCa.x))).r;
  if(uCa.y!=0.0) c.b = sampleSrc(qToSrc(q*(1.0+uCa.y))).b;
  float r2 = dot(q,q)/dot(uHalfO,uHalfO);
  c *= max(0.0, 1.0 + uLv.x*pow(r2, mix(0.6, 2.2, uLv.y)));
  o = vec4(c,1.0);
}`;

const BLUR_FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uTex; uniform vec2 uStep; uniform float uSig;
void main(){
  vec2 t = vec2(vUv.x, 1.0-vUv.y);
  vec4 acc = vec4(0.0); float ws = 0.0;
  for(int i=-16;i<=16;i++){ float fi=float(i); float w=exp(-fi*fi/(2.0*uSig*uSig)); acc += w*texture(uTex, t+uStep*fi); ws += w; }
  o = acc/ws;
}`;

const MAIN_FS = COMMON + `
uniform sampler2D uGV, uB1, uB2, uB3, uLut, uBrA, uBrB;
uniform vec2 uVpx; uniform vec2 uOutPx; uniform float uViewScale;
uniform vec4 uP0, uP1, uP2, uP3, uP4, uP5, uP6, uP7, uP8;
uniform highp sampler3D uLut3; uniform vec2 uLut3P;
uniform float uBW; uniform float uShTint; uniform mat3 uCal;
uniform vec4 uHsl[8];
uniform vec4 uGrS, uGrM, uGrH, uGrG; uniform vec2 uGrBB;
uniform int uMN; uniform vec4 uMk0[8], uMk1[8], uMk2[8], uMk3[8], uMa0[8], uMa1[8], uMa2[8];
uniform int uShowClip; uniform int uShowMask;

float toS(float x){ x = max(x,0.0); return x<=0.0031308 ? 12.92*x : 1.055*pow(x,1.0/2.4)-0.055; }
vec3 toS3(vec3 c){ return vec3(toS(c.r),toS(c.g),toS(c.b)); }
vec3 rgb2hsv(vec3 c){
  vec4 K = vec4(0.0,-1.0/3.0,2.0/3.0,-1.0);
  vec4 p = mix(vec4(c.bg,K.wz), vec4(c.gb,K.xy), step(c.b,c.g));
  vec4 q = mix(vec4(p.xyw,c.r), vec4(c.r,p.yzx), step(p.x,c.r));
  float d = q.x-min(q.w,q.y); float e = 1.0e-10;
  return vec3(abs(q.z+(q.w-q.y)/(6.0*d+e)), d/(q.x+e), q.x);
}
vec3 hsv2rgb(vec3 c){ vec3 p = abs(fract(c.xxx+vec3(1.0,2.0/3.0,1.0/3.0))*6.0-3.0); return c.z*mix(vec3(1.0), clamp(p-1.0,0.0,1.0), c.y); }
const float HC[8] = float[8](0.0,30.0,60.0,120.0,180.0,240.0,270.0,300.0);
float bandW(float h, int i){
  float c = HC[i]; float d = h-c; if(d>180.0) d-=360.0; if(d<-180.0) d+=360.0;
  float nx = i==7 ? 60.0 : HC[i+1]-c; float pv = i==0 ? 60.0 : c-HC[i-1];
  float x = 1.0-abs(d)/(d>=0.0?nx:pv); return x>0.0 ? x*x*(3.0-2.0*x) : 0.0;
}
vec3 tintOf(vec4 g){ vec3 c = hsv2rgb(vec3(g.x,1.0,1.0)); return (c - lumW(c))*g.y*0.3; }
float hash(vec2 p){ p = fract(p*vec2(443.897,441.423)); p += dot(p, p.yx+19.19); return fract((p.x+p.y)*p.x); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }

float maskW(int i, vec2 suv, vec2 p, float Lin, vec3 hsvIn){
  vec4 k0=uMk0[i], k1=uMk1[i], k2=uMk2[i], k3=uMk3[i];
  float w = 1.0; int t = int(k0.x+0.5);
  if(t==0){
    vec2 a=(k1.xy-0.5)*vec2(uAs,1.0), b=(k1.zw-0.5)*vec2(uAs,1.0); vec2 ab=b-a;
    float tt = dot(p-a,ab)/max(dot(ab,ab),1e-8); w = 1.0-smoothstep(0.0,1.0,tt);
  } else if(t==1){
    vec2 c=(k1.xy-0.5)*vec2(uAs,1.0); vec2 d=p-c; float ca=cos(-k2.x), sa=sin(-k2.x);
    d = vec2(ca*d.x-sa*d.y, sa*d.x+ca*d.y); float e = length(d/max(k1.zw,vec2(1e-4)));
    w = 1.0-smoothstep(1.0-max(k2.y,0.002), 1.0, e);
  } else if(t==2){
    int ch = int(k2.z+0.5); vec4 bb = ch<4 ? texture(uBrA,suv) : texture(uBrB,suv); int c4 = ch-(ch/4)*4;
    w = c4==0?bb.r:(c4==1?bb.g:(c4==2?bb.b:bb.a));
  }
  if(k0.y>0.5) w = 1.0-w;
  int rt = int(k0.w+0.5);
  if(rt==1){ w *= smoothstep(k3.x-k3.z-0.001, k3.x, Lin)*(1.0-smoothstep(k3.y, k3.y+k3.z+0.001, Lin)); }
  else if(rt==2){ float dh=abs(hsvIn.x-k3.x); dh=min(dh,1.0-dh); w *= (1.0-smoothstep(k3.y*0.5, k3.y, dh))*smoothstep(0.03,0.12,hsvIn.y); }
  return w*k0.z;
}

void main(){
  vec2 ouv = mix(uView.xy, uView.zw, vUv);
  vec2 t = tc(vUv);
  vec3 lin = max(texture(uGV,t).rgb, 0.0);
  vec3 b1 = max(texture(uB1,t).rgb, 0.0);
  vec3 b2 = max(texture(uB2,tc(ouv)).rgb, 0.0);
  vec3 b3 = max(texture(uB3,tc(ouv)).rgb, 0.0);

  // noise reduction (luminance: edge-aware 5x5; color: wide chroma average)
  if(uP3.w>0.0){
    float L0 = sqrt(lumW(lin)); vec3 acc=vec3(0.0); float ws=0.0; float sg = mix(0.01, 0.12, 1.0-uP4.x);
    for(int y=-2;y<=2;y++) for(int x=-2;x<=2;x++){
      vec3 c = max(texture(uGV, t+vec2(float(x),float(y))*uVpx).rgb,0.0); float d = sqrt(lumW(c))-L0;
      float w = exp(-d*d/(2.0*sg*sg) - float(x*x+y*y)/6.0); acc += c*w; ws += w; }
    lin = mix(lin, acc/ws, uP3.w);
  }
  if(uP4.y>0.0){
    vec3 cs=vec3(0.0); for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++) cs += max(texture(uGV, t+vec2(float(x),float(y))*uVpx*3.0).rgb,0.0);
    cs /= 9.0; float lc = lumW(cs)+1e-5; vec3 cn = cs*(lumW(lin)/lc); lin = mix(lin, cn, uP4.y);
  }

  vec2 suv = qToSrc(outToQ(ouv));
  vec2 p = (suv-0.5)*vec2(uAs,1.0);
  vec3 vin = toS3(lin); float Lin = lumW(vin); vec3 hsvIn = rgb2hsv(clamp(vin,0.0,1.0));

  vec4 P0=uP0, P1=uP1, P2=uP2; float sat=uP3.x; float mOver=0.0;
  for(int i=0;i<8;i++){
    if(i>=uMN) break;
    float w = maskW(i, suv, p, Lin, hsvIn);
    P0 += w*uMa0[i];
    P1 += w*vec4(uMa1[i].xy, uMa2[i].zw);
    P2.xyz += w*vec3(uMa2[i].y, uMa1[i].z, uMa1[i].w);
    sat += w*uMa2[i].x;
    if(i==uShowMask) mOver = w;
  }

  vec3 g = exp(vec3(0.8*P0.x, -0.5*P0.y, -0.8*P0.x)); g /= lumW(g); g *= exp2(P0.z);
  lin *= g; b1 *= g; b2 *= g; b3 *= g;
  lin = uCal*lin;
  float ll = lumW(lin); lin.g *= 1.0 - uShTint*0.2*(1.0-smoothstep(0.0,0.2,ll));

  float dz = P2.z;
  if(dz>0.0){ float hz = min(min(b3.r,b3.g),b3.b); float k = clamp(dz*0.9*hz, 0.0, 0.95); lin = max((lin-k)/(1.0-k), 0.0); }
  else if(dz<0.0){ lin = mix(lin, vec3(lumW(b3)*0.5+0.35), -dz*0.6); }

  vec3 v = toS3(lin); float L = lumW(v);
  float Ls = lumW(toS3(b1)), Lm = lumW(toS3(b2)), Lb = lumW(toS3(b3));
  float L2 = L;
  L2 += P2.x*0.9*(L-Ls);
  float mid = 1.0-pow(abs(2.0*clamp(L,0.0,1.0)-1.0), 2.0);
  L2 += P2.y*0.8*(L-Lm)*mid;
  if(uP3.y>0.0){
    float dd = L-Ls; float e = abs(dd);
    float m = uP3.z>0.0 ? smoothstep(uP3.z*0.03, uP3.z*0.03+0.015, e) : 1.0;
    dd = mix(clamp(dd,-0.04,0.04), dd, uP7.x);
    L2 += uP3.y*dd*m;
  }
  float base = mix(L2, Lb, 0.5);
  float wsh = 1.0-smoothstep(0.0,0.6,base), whi = smoothstep(0.35,1.0,base);
  L2 += P1.y*0.32*wsh + P1.x*0.32*whi;
  L2 += P1.z*0.25*smoothstep(0.45,1.0,L2);
  L2 += P1.w*0.15*(1.0-smoothstep(0.0,0.35,L2));
  float Lc = clamp(L2,0.0,1.0); L2 += P0.w*(Lc-0.5)*Lc*(1.0-Lc)*4.0;
  float kk = smoothstep(0.0,0.06,L);
  v = mix(v+(L2-L), v*(L2/max(L,1e-4)), kk);
  float mx = max(max(v.r,v.g),v.b);
  if(mx>1.0){ float Lv=lumW(v); v = mix(v, vec3(min(Lv,1.0)), clamp((mx-1.0)*1.2,0.0,1.0)); }
  v = clamp(v,0.0,1.0);

  const float N = 1024.0;
  v = vec3(texture(uLut, vec2((v.r*(N-1.0)+0.5)/N,0.5)).r, texture(uLut, vec2((v.g*(N-1.0)+0.5)/N,0.5)).g, texture(uLut, vec2((v.b*(N-1.0)+0.5)/N,0.5)).b);

  vec3 hsv = rgb2hsv(v); L = lumW(v);
  float hS=0.0, sM=0.0, lA=0.0, bA=0.0;
  for(int i=0;i<8;i++){ float w = bandW(hsv.x*360.0, i); hS += w*uHsl[i].x; sM += w*uHsl[i].y; lA += w*uHsl[i].z; bA += w*uHsl[i].w; }
  if(uBW>0.5){
    v = vec3(clamp(L + bA*0.4*hsv.y, 0.0, 1.0));
  } else {
    hsv.x = fract(hsv.x + hS*(30.0/360.0)); hsv.y = clamp(hsv.y*(1.0+sM),0.0,1.0);
    v = hsv2rgb(hsv); v *= 1.0 + lA*0.45*hsv.y;
    L = lumW(v);
    float skin = 1.0-0.5*exp(-pow((hsv.x*360.0-25.0)/22.0,2.0));
    float vib = P2.w*(1.0-hsv.y)*skin;
    v = L + (v-L)*(1.0+vib)*(1.0+sat+max(dz,0.0)*0.15);
  }
  L = lumW(clamp(v,0.0,1.0));
  float Lg = clamp(L+uGrBB.y*0.25,0.0,1.0); float ex = mix(2.6,1.0,uGrBB.x);
  float wS = pow(1.0-Lg,ex), wH = pow(Lg,ex), wM = clamp(1.0-wS-wH,0.0,1.0);
  v += tintOf(uGrS)*wS + tintOf(uGrM)*wM + tintOf(uGrH)*wH + tintOf(uGrG);
  v += (uGrS.z*wS + uGrM.z*wM + uGrH.z*wH + uGrG.z)*0.25;

  if(uP8.x>0.0 || uP8.y>0.0){
    vec3 bs = toS3(b2); float lb = lumW(bs);
    if(uP8.x>0.0){ float k = smoothstep(0.62, 1.15, lb); v = 1.0-(1.0-v)*(1.0-clamp(vec3(1.0,0.32,0.12)*k*uP8.x*0.55,0.0,1.0)); }
    if(uP8.y>0.0){ vec3 gl = bs*smoothstep(0.35, 1.0, lb); v = 1.0-(1.0-clamp(v,0.0,1.0))*(1.0-clamp(gl*uP8.y*0.6,0.0,1.0)); }
  }
  if(uLut3P.x>0.0){
    float N = uLut3P.y; vec3 c = clamp(v,0.0,1.0)*((N-1.0)/N)+0.5/N;
    v = mix(v, texture(uLut3, c).rgb, uLut3P.x);
  }
  if(uP4.z>0.0 || uP4.w>0.0){
    float e = clamp(abs(L-Ls)*10.0,0.0,1.0); vec3 hh = rgb2hsv(clamp(v,0.0,1.0)); float hp = hh.x*360.0;
    float wp = exp(-pow((hp-285.0)/35.0,2.0))*uP4.z, wg = exp(-pow((hp-105.0)/35.0,2.0))*uP4.w;
    v = mix(v, vec3(lumW(v)), clamp((wp+wg)*e*3.0,0.0,1.0));
  }

  if(uP5.x!=0.0){
    vec2 c = ouv*2.0-1.0; float ar = uOutPx.x/uOutPx.y;
    vec2 cc = uP5.z>0.0 ? mix(c, c*vec2(ar,1.0)/max(ar,1.0), uP5.z) : c;
    float n = 2.0 + max(-uP5.z,0.0)*6.0;
    float d = pow(pow(abs(cc.x),n)+pow(abs(cc.y),n), 1.0/n);
    float r0 = mix(0.35, 1.45, uP5.y); float f = max(uP5.w, 0.02);
    float w = smoothstep(r0 - f*0.9, r0 + f*0.35, d);
    if(uP5.x<0.0) v *= 1.0 + uP5.x*w*(1.0-uP6.x*smoothstep(0.55,1.0,lumW(v)));
    else v = mix(v, vec3(1.0), uP5.x*w);
  }
  if(uP6.y>0.0){
    vec2 px = ouv*uOutPx/mix(0.8, 4.0, uP6.z);
    float n1 = vnoise(px), n2 = hash(floor(ouv*uOutPx));
    float gn = (mix(n1, n2, uP6.w*0.7)-0.5)*2.0;
    float Lq = lumW(clamp(v,0.0,1.0));
    vec3 gc = vec3(gn);
    if(uP8.w>0.0){ vec2 q = floor(ouv*uOutPx/mix(0.8,4.0,uP6.z)); gc += uP8.w*(vec3(hash(q+3.1), hash(q+7.7), hash(q+11.3))-0.5)*1.6; }
    v += gc*uP6.y*0.13*(0.35+0.65*(1.0-abs(2.0*Lq-1.0)));
  }
  if(uP8.z>0.0){
    float ar = uOutPx.x/uOutPx.y;
    if(ar < uP8.z){ float bar = (1.0-ar/uP8.z)*0.5; if(ouv.y<bar || ouv.y>1.0-bar) v = vec3(0.0); }
    else { float bar = (1.0-uP8.z/ar)*0.5; if(ouv.x<bar || ouv.x>1.0-bar) v = vec3(0.0); }
  }
  v = clamp(v,0.0,1.0);
  if(uShowClip==1){ float a=max(max(v.r,v.g),v.b), b=min(min(v.r,v.g),v.b); if(b>=0.996) v=vec3(1.0,0.2,0.25); else if(a<=0.004) v=vec3(0.2,0.45,1.0); }
  if(uShowMask>=0) v = mix(v, vec3(0.95,0.18,0.28), mOver*0.6);
  o = vec4(v,1.0);
}`;

/* ---------- geometry helpers shared with the UI ---------- */
function frame(img, p) {
  const odd = p.orient % 2 === 1;
  const Wo = odd ? img.h : img.w, Ho = odd ? img.w : img.h;
  return { hw: Wo / (2 * img.h), hh: Ho / (2 * img.h), Wo, Ho };
}
function geom(img, p, cropMode) {
  const F = frame(img, p);
  const c = (!cropMode && p.crop) ? p.crop : { cx: 0, cy: 0, hw: F.hw, hh: F.hh, angle: 0 };
  return {
    crop: [c.cx, c.cy, c.hw, c.hh], angle: cropMode ? 0 : c.angle * Math.PI / 180,
    flip: [p.flipH ? -1 : 1, p.flipV ? -1 : 1],
    xf1: [p.tVert * 0.008, p.tHorz * 0.006, p.tRot * Math.PI / 180, Math.max(0.1, p.tScale / 100)],
    xf2: [p.tAspect * 0.005, p.tX * 0.005, p.tY * 0.005, 0],
    k1: p.distortion * 0.003, orient: p.orient | 0, halfO: [F.hw, F.hh], As: img.w / img.h,
    outW: Math.max(1, Math.round(2 * c.hw * img.h)), outH: Math.max(1, Math.round(2 * c.hh * img.h))
  };
}
function outToSrc(G, u, v) {
  let fx = (u * 2 - 1) * G.crop[2], fy = (v * 2 - 1) * G.crop[3];
  const c = Math.cos(G.angle), s = Math.sin(G.angle);
  let qx = G.crop[0] + c * fx - s * fy, qy = G.crop[1] + s * fx + c * fy;
  qx *= G.flip[0]; qy *= G.flip[1];
  qx -= G.xf2[1]; qy -= G.xf2[2];
  qx /= G.xf1[3]; qy /= G.xf1[3];
  const cr = Math.cos(-G.xf1[2]), sr = Math.sin(-G.xf1[2]);
  [qx, qy] = [cr * qx - sr * qy, sr * qx + cr * qy];
  qx *= Math.exp(-G.xf2[0]); qy *= Math.exp(G.xf2[0]);
  const w = Math.max(0.05, 1 + G.xf1[0] * qy + G.xf1[1] * qx); qx /= w; qy /= w;
  const r2 = (qx * qx + qy * qy) / (G.halfO[0] ** 2 + G.halfO[1] ** 2); qx *= 1 + G.k1 * r2; qy *= 1 + G.k1 * r2;
  let sx, sy;
  if (G.orient === 1) { sx = qy; sy = -qx; } else if (G.orient === 2) { sx = -qx; sy = -qy; } else if (G.orient === 3) { sx = -qy; sy = qx; } else { sx = qx; sy = qy; }
  return [sx / G.As + 0.5, sy + 0.5];
}
function srcToOut(G, su, sv) {
  let x = [0.5, 0.5];
  for (let it = 0; it < 30; it++) {
    const f = outToSrc(G, x[0], x[1]); const ex = f[0] - su, ey = f[1] - sv;
    if (Math.abs(ex) + Math.abs(ey) < 1e-7) break;
    const e = 1e-4, fx = outToSrc(G, x[0] + e, x[1]), fy = outToSrc(G, x[0], x[1] + e);
    const a = (fx[0] - f[0]) / e, b = (fy[0] - f[0]) / e, c = (fx[1] - f[1]) / e, d = (fy[1] - f[1]) / e;
    const det = a * d - b * c || 1e-9;
    x[0] -= (d * ex - b * ey) / det; x[1] -= (-c * ex + a * ey) / det;
  }
  return x;
}

/* ---------- curve LUT ---------- */
function buildLut(p) {
  const N = 1024, data = new Float32Array(N * 4);
  const fm = U.monotone(p.curve.rgb), fr = U.monotone(p.curve.r), fg = U.monotone(p.curve.g), fb = U.monotone(p.curve.b);
  const s1 = p.pcS1 / 100, s2 = p.pcS2 / 100, s3 = p.pcS3 / 100;
  const bump = (x, a, b) => { if (x <= a || x >= b) return 0; const t = (x - a) / (b - a); const s = Math.sin(Math.PI * t); return s * s; };
  const param = (x) => U.clamp(x + 0.22 * (p.pcShadow / 100 * bump(x, 0, s2) + p.pcDark / 100 * bump(x, s1 * 0.4, s3) + p.pcLight / 100 * bump(x, s1, 1 - (1 - s3) * 0.4) + p.pcHigh / 100 * bump(x, s2, 1)), 0, 1);
  for (let i = 0; i < N; i++) {
    const x = i / (N - 1), m = U.clamp(fm(param(x)), 0, 1);
    data[i * 4] = U.clamp(fr(m), 0, 1); data[i * 4 + 1] = U.clamp(fg(m), 0, 1); data[i * 4 + 2] = U.clamp(fb(m), 0, 1); data[i * 4 + 3] = 1;
  }
  return data;
}
function calMatrix(p) {
  const prim = [[0, p.calRH, p.calRS], [1 / 3, p.calGH, p.calGS], [2 / 3, p.calBH, p.calBS]];
  const lw = [0.2126, 0.7152, 0.0722];
  const cols = prim.map(([h, dh, ds], i) => {
    let c = U.hsv2rgb(((h + dh / 100 * (30 / 360)) % 1 + 1) % 1, 1, 1);
    const L = c[0] * lw[0] + c[1] * lw[1] + c[2] * lw[2];
    const k = 1 + ds / 100 * 0.6; c = c.map(x => L + (x - L) * k);
    const L2 = c[0] * lw[0] + c[1] * lw[1] + c[2] * lw[2] || 1;
    const base = [0, 0, 0]; base[i] = 1;
    return c.map((x, j) => U.lerp(base[j], x * lw[i] / L2, 1));
  });
  // normalise rows so white stays white
  const M = [[cols[0][0], cols[1][0], cols[2][0]], [cols[0][1], cols[1][1], cols[2][1]], [cols[0][2], cols[1][2], cols[2][2]]];
  const ident = !(p.calRH || p.calRS || p.calGH || p.calGS || p.calBH || p.calBS);
  if (ident) return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  for (const row of M) { const s = row[0] + row[1] + row[2] || 1; row[0] /= s; row[1] /= s; row[2] /= s; }
  return new Float32Array([M[0][0], M[1][0], M[2][0], M[0][1], M[1][1], M[2][1], M[0][2], M[1][2], M[2][2]]);
}

/* ---------- engine ---------- */
function create(canvas) {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false });
  if (!gl) return null;
  const floatRT = !!gl.getExtension('EXT_color_buffer_float');
  gl.getExtension('OES_texture_float_linear');
  const RT_FMT = floatRT ? gl.RGBA16F : gl.RGBA8, RT_TYPE = floatRT ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;
  const MAXTEX = gl.getParameter(gl.MAX_TEXTURE_SIZE);

  function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  function prog(fs) {
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'aPos'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const loc = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); const name = info.name.replace(/\[0\]$/, ''); loc[name] = gl.getUniformLocation(p, info.name); }
    return { p, loc };
  }
  const P = { geom: prog(GEOM_FS), blur: prog(BLUR_FS), main: prog(MAIN_FS) };
  const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function tex(w, h, fmt, type, filter) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, fmt, w, h, 0, fmt === gl.RGBA8 ? gl.RGBA : gl.RGBA, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter || gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter || gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  const rts = {};
  function rt(name, w, h, fmt) {
    const key = name; let r = rts[key];
    if (r && r.w === w && r.h === h) return r;
    if (r) { gl.deleteTexture(r.t); gl.deleteFramebuffer(r.f); }
    const t = tex(w, h, fmt || RT_FMT, fmt === gl.RGBA8 ? gl.UNSIGNED_BYTE : RT_TYPE);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    r = rts[key] = { t, f, w, h }; return r;
  }
  const lutTex = gl.createTexture(); let lutKey = '';
  const luts = new Map();
  function tex3(size, data) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_3D, t);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    for (const w of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T, gl.TEXTURE_WRAP_R]) gl.texParameteri(gl.TEXTURE_3D, w, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGB16F, size, size, size, 0, gl.RGB, gl.FLOAT, data);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    return t;
  }
  const dummy3 = tex3(2, new Float32Array(24));
  function registerLut(id, size, data) { const old = luts.get(id); if (old) gl.deleteTexture(old.tex); luts.set(id, { tex: tex3(size, data), size }); }
  function removeLut(id) { const old = luts.get(id); if (old) { gl.deleteTexture(old.tex); luts.delete(id); } }
  const brushTex = [gl.createTexture(), gl.createTexture()]; let brushVer = -1;
  for (const t of [lutTex, ...brushTex]) {
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  }

  /* image upload: ImageBitmap (sRGB 8-bit) or half-float linear RGB (RAW) */
  function loadImage(src) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    let w, h, mip = true;
    if (src.half) {
      w = src.w; h = src.h; gl.pixelStorei(gl.UNPACK_ALIGNMENT, 2);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB16F, w, h, 0, gl.RGB, gl.HALF_FLOAT, src.half);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
      mip = floatRT;
    } else {
      w = src.width; h = src.height;
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, src);
    }
    if (mip) { try { gl.generateMipmap(gl.TEXTURE_2D); } catch (e) { mip = false; } if (gl.getError()) mip = false; }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return { tex: t, w, h, mip };
  }
  function freeImage(img) { if (img && img.tex) gl.deleteTexture(img.tex); }

  function setGeomUniforms(loc, G, view) {
    gl.uniform4fv(loc.uView, view); gl.uniform4fv(loc.uCrop, G.crop); gl.uniform1f(loc.uAngle, G.angle); gl.uniform2fv(loc.uFlip, G.flip);
    gl.uniform4fv(loc.uXf1, G.xf1); gl.uniform4fv(loc.uXf2, G.xf2); gl.uniform1f(loc.uK1, G.k1); gl.uniform1i(loc.uOrient, G.orient);
    gl.uniform2fv(loc.uHalfO, G.halfO); gl.uniform1f(loc.uAs, G.As);
  }
  function draw(target, w, h) { gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.f : null); gl.viewport(0, 0, w, h); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
  function bindTex(unit, t) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); }

  function geomPass(img, p, G, view, target, w, h, lod) {
    const { p: pr, loc } = P.geom; gl.useProgram(pr);
    setGeomUniforms(loc, G, view);
    bindTex(0, img.tex); gl.uniform1i(loc.uSrc, 0);
    gl.uniform1f(loc.uLod, img.mip ? Math.max(0, lod) : 0); gl.uniform1f(loc.uSrcH, img.h);
    const spots = p.spots.slice(0, 24); const A = new Float32Array(96), B = new Float32Array(96);
    spots.forEach((s, i) => { A.set([s.tx, s.ty, s.sx, s.sy], i * 4); B.set([s.r, s.feather / 100, s.opacity / 100, s.mode === 'heal' ? 1 : s.mode === 'redeye' ? 2 : 0], i * 4); });
    gl.uniform1i(loc.uSpotN, spots.length); gl.uniform4fv(loc.uSpA, A); gl.uniform4fv(loc.uSpB, B);
    gl.uniform2f(loc.uCa, p.caRed * 0.00004, p.caBlue * 0.00004);
    gl.uniform2f(loc.uLv, p.lensVig / 100, p.lensVigMid / 100);
    draw(target, w, h);
  }
  function blurPass(src, dst, tmp, sigma) {
    const { p: pr, loc } = P.blur; gl.useProgram(pr);
    const spacing = Math.max(1, sigma / 6), sig = Math.max(0.5, sigma / spacing);
    gl.uniform1f(loc.uSig, sig); gl.uniform1i(loc.uTex, 0);
    bindTex(0, src.t); gl.uniform2f(loc.uStep, spacing / src.w, 0); draw(tmp, tmp.w, tmp.h);
    bindTex(0, tmp.t); gl.uniform2f(loc.uStep, 0, spacing / tmp.h); draw(dst, dst.w, dst.h);
  }

  function uploadLut(p) {
    const key = JSON.stringify([p.curve, p.pcHigh, p.pcLight, p.pcDark, p.pcShadow, p.pcS1, p.pcS2, p.pcS3]);
    if (key === lutKey) return; lutKey = key;
    gl.bindTexture(gl.TEXTURE_2D, lutTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, 1024, 1, 0, gl.RGBA, gl.FLOAT, buildLut(p));
  }
  function uploadBrush(brush) {
    if (!brush || brush.version === brushVer) return; brushVer = brush.version;
    for (let k = 0; k < 2; k++) { gl.bindTexture(gl.TEXTURE_2D, brushTex[k]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, brush.w, brush.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, brush.data[k]); }
  }

  /* render: view = [u0,v0,u1,v1] of the output frame; w,h = pixel size of the target */
  function render(img, p, opt) {
    const { view = [0, 0, 1, 1], w, h, target = null, cropMode = false, showClip = false, showMask = -1, brush = null, scissor = null, tag = '' } = opt;
    const G = geom(img, p, cropMode);
    const longLo = 640; const ls = longLo / Math.max(G.outW, G.outH);
    const lw = Math.max(8, Math.round(G.outW * ls)), lh = Math.max(8, Math.round(G.outH * ls));
    const srcPerOut = (2 * G.crop[3] * img.h) / G.outH; // ~1
    const outPerView = G.outW * (view[2] - view[0]) / w;
    gl.disable(gl.SCISSOR_TEST);
    // low-res whole frame for large-radius effects
    const GL = rt(tag + 'gl', lw, lh), T1 = rt(tag + 't1', lw, lh), B2 = rt(tag + 'b2', lw, lh), B3 = rt(tag + 'b3', lw, lh);
    geomPass(img, p, G, [0, 0, 1, 1], GL, lw, lh, Math.log2(Math.max(1, G.outW / lw * srcPerOut)));
    blurPass(GL, B2, T1, Math.max(1, lw * 0.012));
    blurPass(GL, B3, T1, Math.max(2, lw * 0.05));
    // view-resolution geometry and small blur
    const GV = rt(tag + 'gv', w, h), T2 = rt(tag + 't2', w, h), B1 = rt(tag + 'b1', w, h);
    geomPass(img, p, G, view, GV, w, h, Math.log2(Math.max(1, outPerView * srcPerOut)));
    blurPass(GV, B1, T2, Math.max(0.6, (p.sharpRadius || 1) / Math.max(outPerView, 0.25)));
    uploadLut(p); uploadBrush(brush);
    const { p: pr, loc } = P.main; gl.useProgram(pr);
    setGeomUniforms(loc, G, view);
    [[GV.t, 'uGV'], [B1.t, 'uB1'], [B2.t, 'uB2'], [B3.t, 'uB3'], [lutTex, 'uLut'], [brushTex[0], 'uBrA'], [brushTex[1], 'uBrB']].forEach(([t, n], i) => { bindTex(i, t); gl.uniform1i(loc[n], i); });
    gl.uniform2f(loc.uVpx, 1 / w, 1 / h); gl.uniform2f(loc.uOutPx, G.outW, G.outH);
    const n = (x) => x / 100;
    gl.uniform4f(loc.uP0, n(p.temp), n(p.tint), p.exposure, n(p.contrast));
    gl.uniform4f(loc.uP1, n(p.highlights), n(p.shadows), n(p.whites), n(p.blacks));
    gl.uniform4f(loc.uP2, n(p.texture), n(p.clarity), n(p.dehaze), n(p.vibrance));
    gl.uniform4f(loc.uP3, n(p.saturation), p.sharpen / 100 * 1.6, n(p.sharpMask), n(p.nrLum));
    gl.uniform4f(loc.uP4, n(p.nrDetail), n(p.nrColor), n(p.defPurple), n(p.defGreen));
    gl.uniform4f(loc.uP5, n(p.vig), n(p.vigMid), n(p.vigRound), n(p.vigFeather));
    gl.uniform4f(loc.uP6, n(p.vigHigh), n(p.grain), n(p.grainSize), n(p.grainRough));
    gl.uniform4f(loc.uP7, n(p.sharpDetail), 0, 0, 0);
    gl.uniform4f(loc.uP8, n(p.halation || 0), n(p.glow || 0), +p.letterbox || 0, n(p.grainColor || 0));
    const L3 = p.lut && luts.get(p.lut.id);
    bindTex(7, null); gl.activeTexture(gl.TEXTURE7); gl.bindTexture(gl.TEXTURE_3D, L3 ? L3.tex : dummy3); gl.uniform1i(loc.uLut3, 7);
    gl.uniform2f(loc.uLut3P, L3 ? (p.lut.amount == null ? 1 : p.lut.amount / 100) : 0, L3 ? L3.size : 2);
    gl.uniform1f(loc.uBW, p.bw ? 1 : 0); gl.uniform1f(loc.uShTint, n(p.calShadow));
    gl.uniformMatrix3fv(loc.uCal, false, calMatrix(p));
    const hsl = new Float32Array(32); for (let i = 0; i < 8; i++) hsl.set([n(p.hslH[i]), n(p.hslS[i]), n(p.hslL[i]), n(p.bwMix[i])], i * 4);
    gl.uniform4fv(loc.uHsl, hsl);
    const gr = (k) => [p['g' + k + 'H'] / 360, n(p['g' + k + 'S']), n(p['g' + k + 'L']), 0];
    gl.uniform4fv(loc.uGrS, gr('s')); gl.uniform4fv(loc.uGrM, gr('m')); gl.uniform4fv(loc.uGrH, gr('h')); gl.uniform4fv(loc.uGrG, gr('g'));
    gl.uniform2f(loc.uGrBB, n(p.gradeBlend), n(p.gradeBalance));
    const masks = p.masks.slice(0, 8); const K = [0, 1, 2, 3, 4, 5, 6].map(() => new Float32Array(32));
    masks.forEach((m, i) => {
      const type = { linear: 0, radial: 1, brush: 2, range: 3 }[m.type];
      const g = m.geom || {}; const r = m.range || { type: 'none' };
      K[0].set([type, m.invert ? 1 : 0, m.hidden ? 0 : m.amount / 100, r.type === 'lum' ? 1 : r.type === 'color' ? 2 : 0], i * 4);
      if (type === 0) K[1].set([g.x0, g.y0, g.x1, g.y1], i * 4);
      if (type === 1) { K[1].set([g.cx, g.cy, g.rx, g.ry], i * 4); K[2].set([g.angle * Math.PI / 180, g.feather / 100, 0, 0], i * 4); }
      if (type === 2) K[2].set([0, 0, i, 0], i * 4);
      if (r.type === 'lum') K[3].set([r.lo / 100, r.hi / 100, r.smooth / 100, 0], i * 4);
      if (r.type === 'color') K[3].set([r.hue / 360, Math.max(0.02, r.tol / 100 * 0.5), 0, 0], i * 4);
      const a = m.adj;
      K[4].set([n(a.temp), n(a.tint), a.exposure, n(a.contrast)], i * 4);
      K[5].set([n(a.highlights), n(a.shadows), n(a.clarity), n(a.dehaze)], i * 4);
      K[6].set([n(a.saturation), n(a.texture), n(a.whites), n(a.blacks)], i * 4);
    });
    gl.uniform1i(loc.uMN, masks.length);
    ['uMk0', 'uMk1', 'uMk2', 'uMk3', 'uMa0', 'uMa1', 'uMa2'].forEach((nm, i) => gl.uniform4fv(loc[nm], K[i]));
    gl.uniform1i(loc.uShowClip, showClip ? 1 : 0); gl.uniform1i(loc.uShowMask, showMask);
    if (scissor) { gl.enable(gl.SCISSOR_TEST); gl.scissor(scissor[0], scissor[1], scissor[2], scissor[3]); }
    draw(target, w, h);
    gl.disable(gl.SCISSOR_TEST);
    return G;
  }

  function readTarget(t) {
    const px = new Uint8Array(t.w * t.h * 4); gl.bindFramebuffer(gl.FRAMEBUFFER, t.f);
    gl.readPixels(0, 0, t.w, t.h, gl.RGBA, gl.UNSIGNED_BYTE, px); return px;
  }
  /* render whole output to RGBA8 pixels (top-down) at given size, tiled */
  function renderPixels(img, p, W, H, brush) {
    const out = new Uint8ClampedArray(W * H * 4);
    const T = Math.min(2048, MAXTEX - 64), M = 16;
    for (let y0 = 0; y0 < H; y0 += T) for (let x0 = 0; x0 < W; x0 += T) {
      const tw = Math.min(T, W - x0), th = Math.min(T, H - y0);
      const ax = Math.max(0, x0 - M), ay = Math.max(0, y0 - M), bx = Math.min(W, x0 + tw + M), by = Math.min(H, y0 + th + M);
      const rw = bx - ax, rh = by - ay;
      const tgt = rt('tile', rw, rh, gl.RGBA8);
      render(img, p, { view: [ax / W, ay / H, bx / W, by / H], w: rw, h: rh, target: tgt, brush, tag: 'x' });
      const px = readTarget(tgt);
      for (let y = 0; y < th; y++) {
        const sy = (rh - 1) - (y0 - ay + y);
        const srcOff = (sy * rw + (x0 - ax)) * 4, dstOff = ((y0 + y) * W + x0) * 4;
        out.set(px.subarray(srcOff, srcOff + tw * 4), dstOff);
      }
    }
    return new ImageData(out, W, H);
  }
  /* small render for histogram/thumbnail: returns ImageData */
  function renderSmall(img, p, long, brush) {
    const G = geom(img, p, false); const s = long / Math.max(G.outW, G.outH);
    return renderPixels(img, p, Math.max(1, Math.round(G.outW * s)), Math.max(1, Math.round(G.outH * s)), brush);
  }
  return { gl, render, renderPixels, renderSmall, loadImage, freeImage, registerLut, removeLut, MAXTEX, floatRT };
}

return { create, geom, frame, outToSrc, srcToOut };
})();
