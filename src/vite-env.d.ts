/// <reference types="vite/client" />

declare module "apca-w3" {
  export function calcAPCA(textColor: string, backgroundColor: string): number;
  export function fontLookupAPCA(
    contrast: number,
    places?: number,
  ): Array<string | number>;
}
