declare global {
  export interface Window {
    Go: any;
    // Will load the DB and create the correct tables in it
    loadSQL: () => void
    // Takes as input a function called for each QR code once the prvious one runs out
    // the argument given to this function is the QR string or success once done
    loginUser: (setQRCode:any, setLoggedIn:any) => void
    // Loggs out the user, does also delete the DB
    logoutUser: () => Promise<string>
    // The function called whenever new messages arrive
    handNewMsgs: (newMsgs:any) => void
    // The function called whenever information about new contacts/chats arrives
    handNewContacts: (newContacts:any) => void
    // The function called whenever information about new groups arrives
    handNewGroups: (newGroups:any) => void
  }
}

export {};
