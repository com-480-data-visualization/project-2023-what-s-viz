function isDataURL(s: string) {
    return !!s.match(isDataURL.regex);
}
/*eslint no-useless-escape: "off"*/
isDataURL.regex = /^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/i;

function fetchToBase64(obj: any) {
  let promises: Promise<void>[] = [];
  Object.keys(obj).forEach((key) => {
    let promise = new Promise<void>((resolve, reject) => {
      if (obj[key].avatar && !isDataURL(obj[key].avatar)) {
        // Not loaded from json which was stored
        // so fetch the image and convert it to a base64 data string
        fetch(obj[key].avatar, {mode: 'no-cors'})
          .then(res => res.blob())
          .then(blob => {
            let reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = function () {
              let base64data = reader.result;
              // replace the URL with the dataURL
              obj[key].avatar = base64data;
              resolve();
            }
          })
          .catch(err => {
            console.log("Error fetching image: ", err)
            reject();
          });
      } else {
        // Already loaded from json
        resolve();
      }
    });
    promises.push(promise);
  });
  return promises;
}

export default fetchToBase64;
