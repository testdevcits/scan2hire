import { hasLightNeutralBackground } from "./photoBackground";

const photo = (background, portrait = false) => {
  const pixels = new Uint8ClampedArray(100 * 100 * 4);
  for (let y = 0; y < 100; y++)
    for (let x = 0; x < 100; x++) {
      const subject = portrait && (y > 55 || (x > 20 && x < 80));
      pixels.set([...(subject ? [40, 35, 30] : background), 255], (y * 100 + x) * 4);
    }
  return pixels;
};

test("accepts white and shadowed off-white portraits despite dark clothing", () => {
  expect(hasLightNeutralBackground(photo([255, 255, 255], true), 100, 100)).toBe(true);
  expect(hasLightNeutralBackground(photo([213, 210, 205], true), 100, 100)).toBe(true);
});

test("rejects dark and coloured backgrounds", () => {
  expect(hasLightNeutralBackground(photo([90, 90, 90]), 100, 100)).toBe(false);
  expect(hasLightNeutralBackground(photo([170, 210, 255]), 100, 100)).toBe(false);
});
