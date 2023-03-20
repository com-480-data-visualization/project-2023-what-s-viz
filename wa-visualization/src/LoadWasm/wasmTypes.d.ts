declare global {
  export interface Window {
    Go: any;
    initServer: (s: string)=>string
    handSetData: (setData:any) => void
    loadSQL: () => void
  }
}

export {};
