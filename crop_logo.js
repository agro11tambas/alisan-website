const sharp = require('sharp');
const path = require('path');

const input = path.join(__dirname, 'public/image/1751788462_LOGO-ALISAN.png');
const output = path.join(__dirname, 'public/image/1751788462_LOGO-ALISAN_cropped.png');

sharp(input)
  .trim()
  .toFile(output)
  .then(info => console.log('Cropped successfully:', info))
  .catch(err => console.error(err));
