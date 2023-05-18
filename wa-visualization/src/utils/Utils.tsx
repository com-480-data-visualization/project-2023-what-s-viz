import {bagWords} from '../state/types'
import {stopwords} from './Stopwords'
  
  // ============================= Utility fcts ============================ //
function updateBagOfWord(messages: any, setBagOfWord: any, bagOfWord: any) {
    // The value bag is per chat and user in that chat
    let updated_value_bag: bagWords = {}

    //let count_words = 0
    Object.keys(messages).forEach((key) => {      
        // Use either an actual stemmer or just the tokenizer to get the root of the words
        //let words = natural.PorterStemmer.tokenizeAndStem(messages[key].message)
        // let tokenizer = new natural.WordTokenizer();
        //let words = tokenizer.tokenize(messages[key].message)
        let words = messages[key].message.split(" ")
        .map((token: string) => token.toLowerCase())
        .filter((token: string) => {
            return token.indexOf("http") === -1 &&
                !stopwords.includes(token) &&
                //stopwords.indexOf(token) === -1 &&
                token.length > 2
            }
        )
        // Now build the bagOfWords
        let chat_id:string = messages[key].chat
        let sender = messages[key]["sent-by"]

        words.forEach((w: string) => {
            //Update chat
            if (!updated_value_bag[chat_id])
                updated_value_bag[chat_id] = {}
            if (!updated_value_bag[chat_id][w])
                updated_value_bag[chat_id][w] = {'c': 1, 'lang': messages[key].language, 'lan':messages[key].lan};
            else
                updated_value_bag[chat_id][w]['c'] += 1;
            // Update sender
            if (!updated_value_bag[sender])
                updated_value_bag[sender] = {}
            if (!updated_value_bag[sender][w])
                updated_value_bag[sender][w] = {'c': 1, 'lang': messages[key].language, 'lan':messages[key].lan};
            else
                updated_value_bag[sender][w]['c'] += 1;
        })
    })

    function reduceBagOfWord(prev: bagWords, updated_stats: bagWords) {
        let merged: bagWords = {}
        for (let [chat, words] of Object.entries(updated_stats)) {
            for (let [word, wordObj] of Object.entries(words)) {
                if (prev.hasOwnProperty(chat)) {
                    merged[chat] = prev[chat]
                } else if (!merged.hasOwnProperty(chat)) {
                    merged[chat] = {}
                }
                if (merged[chat].hasOwnProperty(word)) {
                    let value = wordObj['c'];
                    merged[chat][word]['c'] += value;
                } else {
                    merged[chat][word] = wordObj;
                }
            }
        }
        return { ...prev, ...merged }
      }
    setBagOfWord((prev:any) => reduceBagOfWord(prev, updated_value_bag));
}

export {updateBagOfWord}

  // =============================================================== //