import { hasLightNeutralBackground } from "../../employees/utils/photoBackground";

export const validateAadhaarLetterFormat = (file) => {
  if (!file || file.type === "application/pdf") return Promise.resolve(true);
  return new Promise((resolve) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = image.width / image.height;
      resolve(ratio >= 0.65 && ratio <= 0.85);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    image.src = url;
  });
};

export const validateWhiteBackgroundDocument = (file) => {
  if (!file || file.type === "application/pdf") return Promise.resolve(true);

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(image.src);
      resolve(
        hasLightNeutralBackground(
          context.getImageData(0, 0, canvas.width, canvas.height).data,
          canvas.width,
          canvas.height
        )
      );
    };
    image.onerror = () => resolve(false);
    image.src = URL.createObjectURL(file);
  });
};
