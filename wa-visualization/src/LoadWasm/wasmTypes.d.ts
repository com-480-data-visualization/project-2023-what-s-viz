declare global {
  export interface Window {
    Go: any;
    // Will load the DB and create the correct tables in it
    loadSQL: () => void
    // Takes as input a function called for each QR code once the prvious one runs out
    // the argument given to this function is the QR string or success once done
    loginUser: (setQRCode:any) => void
    // Loggs out the user, does also delete the DB
    logoutUser: () => Promise<string>
    // The function called whenever new messages arrive
    handNewData: (newData:any) => void
  }
}

export {};
