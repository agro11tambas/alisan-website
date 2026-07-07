const sharp = require('sharp');
const path = require('path');

const imgPath = path.join(__dirname, 'public/image/1751788462_LOGO-ALISAN_cropped.png');
sharp(imgPath)
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    const counts = {};
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      const a = info.channels === 4 ? data[i+3] : 255;
      if (a > 200 && !(r > 240 && g > 240 && b > 240)) {
        // Round to nearest 10 to group similar colors
        const rr = Math.round(r/10)*10;
        const gg = Math.round(g/10)*10;
        const bb = Math.round(b/10)*10;
        const hex = `${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`;
        counts[hex] = (counts[hex] || 0) + 1;
      }
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    console.log('Top colors:');
    sorted.slice(0, 5).forEach(([hex, count]) => console.log(`#${hex}: ${count}`));
  });
