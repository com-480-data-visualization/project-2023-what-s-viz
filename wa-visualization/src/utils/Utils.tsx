import {bagWords} from '../state/types'
import { stopwords } from './Stopwords'
  
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
            return token.length > 2
            && !stopwords.includes(token)
            && token.indexOf("http") === -1
        })

        // Now build the bagOfWords
        let chat_id:string = messages[key].chat
        let sender = messages[key]["sent-by"]

        words.forEach((w: string) => {
            //Update chat
            if (!updated_value_bag[chat_id])
                updated_value_bag[chat_id] = {}
            if (!updated_value_bag[chat_id][w])
                updated_value_bag[chat_id][w] = 1;
            else
                updated_value_bag[chat_id][w] += 1;
            // Update sender
            if (!updated_value_bag[sender])
                updated_value_bag[sender] = {}
            if (!updated_value_bag[sender][w])
                updated_value_bag[sender][w] = 1;
            else
                updated_value_bag[chat_id][w] += 1;
        })
    })

    function reduceBagOfWord(prev: bagWords, updated_stats: bagWords) {
        let merged: bagWords = {}
        for (let [chat, words] of Object.entries(updated_stats)) {
            for (let [word, value] of Object.entries(words)) {
                if (prev.hasOwnProperty(chat)) {
                    merged[chat] = prev[chat]
                    if (merged[chat].hasOwnProperty(word)) {
                        merged[chat][word] += value
                    } else {
                        merged[chat][word] = value
                    }
                } else {
                    merged[chat] = {}
                    merged[chat][word] = value
                }
            }
        }
        return { ...prev, ...merged }
      }
    setBagOfWord((prev:any) => reduceBagOfWord(prev, updated_value_bag));
}

export {updateBagOfWord}

  // =============================================================== //