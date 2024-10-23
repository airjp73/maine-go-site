import { Honeypot } from "remix-utils/honeypot/server";

export const honeypot = new Honeypot({
  randomizeNameFieldName: false,
  nameFieldName: "name__confirm",
  validFromFieldName: "from__confirm",
  encryptionSeed: import.meta.env.HONEYPOT_ENCRYPTION_SEED,
});

export const isHoneypotValid = (formData: FormData) => {
  try {
    honeypot.check(formData);
    return true;
  } catch (e) {
    return false;
  }
};
