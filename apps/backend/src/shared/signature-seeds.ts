/**
 * Base64-encoded SVG placeholder signatures for use in system settings seed.
 * These are decorative cursive-style signatures for the two certificate slots.
 */

const sig1Svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70">
  <path d="M10,50 C20,20 35,15 45,30 C55,45 50,55 60,40 C70,25 80,20 90,35 C100,50 95,55 105,42
           C115,30 120,25 130,38 C138,48 135,55 145,45 C155,35 160,28 170,40 C178,50 175,58 185,48
           C192,40 198,35 210,42"
        fill="none" stroke="#1a1a3e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M15,58 C40,62 80,63 120,61 C155,59 185,60 205,58"
        fill="none" stroke="#1a1a3e" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
</svg>`;

const sig2Svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70">
  <path d="M8,45 C15,18 28,12 40,28 C50,40 48,52 58,38 C68,24 75,18 88,30
           C98,40 94,50 106,36 C118,22 125,18 138,32 C148,43 144,53 155,42
           C164,33 170,26 182,38 C190,46 188,54 200,46 C207,40 212,36 218,40"
        fill="none" stroke="#1a1a3e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5,35 C10,20 20,14 30,22" fill="none" stroke="#1a1a3e" stroke-width="2"
        stroke-linecap="round" opacity="0.7"/>
  <path d="M12,60 C45,64 90,65 135,62 C170,60 198,61 215,59"
        fill="none" stroke="#1a1a3e" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
</svg>`;

export const SIGNATURE_1_BASE64 = `data:image/svg+xml;base64,${Buffer.from(sig1Svg).toString("base64")}`;
export const SIGNATURE_2_BASE64 = `data:image/svg+xml;base64,${Buffer.from(sig2Svg).toString("base64")}`;
