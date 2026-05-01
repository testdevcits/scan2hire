export * from "./api";
export { default as API } from "./axios";

export const generateQrId = async () => {
  const { qrApi } = await import("./api");
  const res = await qrApi.generate();
  return res.data;
};

export const saveCandidate = async (payload) => {
  const { candidateApi } = await import("./api");
  const res = await candidateApi.save(payload);
  return res.data;
};

export const sendOtp = async (payload) => {
  const { candidateApi } = await import("./api");
  const res = await candidateApi.sendOtp(payload);
  return res.data;
};

export const verifyOtp = async (payload) => {
  const { candidateApi } = await import("./api");
  const res = await candidateApi.verifyOtp(payload);
  return res.data;
};
