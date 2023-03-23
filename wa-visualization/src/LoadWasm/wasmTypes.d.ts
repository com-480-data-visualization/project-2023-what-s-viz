declare global {
  export interface Window {
    Go: any;
    // Will load the DB and create the correct tables in it
    loadSQL: () => void
    // Takes as input a function called for each QR code once the prvious one runs out
    // the argument given to this function is the QR string or success once done
    loginUser: (setQRCode:any) => void

    // Testing functions
    initServer: (s: string)=>string
    handSetData: (setData:any) => void
  }
}

export {};
