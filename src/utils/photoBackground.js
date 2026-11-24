// Check the upper corners/sides, where a portrait's background is visible.
// The bottom edge commonly contains clothing and should not count against it.
export const hasLightNeutralBackground = (pixels, width, height) => {
  const regions = [
    [0, 0, 0.15, 0.18], [0.85, 0, 1, 0.18],
    [0, 0.18, 0.08, 0.55], [0.92, 0.18, 1, 0.55],
  ];
  let passingRegions = 0;
  for (const [left, top, right, bottom] of regions) {
    let light = 0;
    let total = 0;
    for (let y = Math.floor(top * height); y < Math.ceil(bottom * height); y++) {
      for (let x = Math.floor(left * width); x < Math.ceil(right * width); x++) {
        const offset = (y * width + x) * 4;
        const channels = [pixels[offset], pixels[offset + 1], pixels[offset + 2]];
        // Allow mild shadows and off-white backgrounds, but not coloured ones.
        if (pixels[offset + 3] >= 240 && Math.min(...channels) >= 185 && Math.max(...channels) - Math.min(...channels) <= 32 && channels.reduce((sum, channel) => sum + channel, 0) / 3 >= 200) light++;
        total++;
      }
    }
    if (total && light / total >= 0.55) passingRegions++;
  }
  return passingRegions >= 2;
};

export const hasWhitePhotoBackground = (file) => new Promise((resolve, reject) => {
  const image = new Image();
  const url = URL.createObjectURL(file);
  image.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, 100, 100);
      resolve(hasLightNeutralBackground(context.getImageData(0, 0, 100, 100).data, 100, 100));
    } catch (error) { reject(error); }
    finally { URL.revokeObjectURL(url); }
  };
  image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Unable to read photo")); };
  image.src = url;
});
