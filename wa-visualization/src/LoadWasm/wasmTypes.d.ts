declare global {
  export interface Window {
    Go: any;
    initServer: (s: string)=>string
    handSetData: (setData:any) => void
    handSQL: (SQL:any) => void
  }
}

export {};
