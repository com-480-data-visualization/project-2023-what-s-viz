declare global {
  export interface Window {
    Go: any;
    initServer: (s: string)=>string
  }
}

export {};
