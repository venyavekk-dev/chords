/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LEMONSQUEEZY_CHECKOUT_URL?: string;
  readonly VITE_UNLOCK_CODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
