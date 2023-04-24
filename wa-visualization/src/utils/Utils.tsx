import {bagWords} from '../state/types'
  
  // ============================= Utility fcts ============================ //
function updateBagOfWord(messages: any, setBagOfWord: any, bagOfWord: any) {
    // Smartly move this filter to another file
    // TODO add https://github.com/RalphGL/fuellwoerter/blob/master/fuellwoerter.txt
    let filters = ["the","of","and","a","to","in","is","you","that","it","he","was",
        "for","on","are","as","with","his","they","i","at","be","this","have","from",
        "or","one","had","by","word","but","not","what","all","were","we","when","your",
        "can","said","there","use","an","each","which","she","do","how","their","if",
        "will","up","other","about","out","many","then","them","these","so","some","her",
        "would","make","like","him","into","time","has","look","two","more","write",
        "go","see","no","way","my","than","first","water", "come","made","may","part", 
        "been","who","its","now","find","long","down","day","did","get"]
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
            && filters.indexOf(token) === -1
            && token.indexOf("http") === -1
        })

        // Now build the bagOfWords
        let chat_id:string = messages[key].chat
        let sender = messages[key]["sent-by"]

        if (!updated_value_bag[chat_id]) {
        updated_value_bag[chat_id] = {}
        }
        if (!updated_value_bag[sender]) {
        updated_value_bag[sender] = {}
        }
        words.forEach((w: string) => {
        if (!updated_value_bag[chat_id][w]) {
            // Get the old cound should it exist
            if (!bagOfWord[chat_id] || !bagOfWord[chat_id] || !bagOfWord[chat_id][w]) {
            updated_value_bag[chat_id][w] = 1;
            } else {
            updated_value_bag[chat_id][w] = bagOfWord[chat_id][w] + 1;
            }
        } else {
            updated_value_bag[chat_id][w] += 1;
        }
        if (!updated_value_bag[sender][w]) {
            // Get the old cound should it exist
            if (!bagOfWord[sender] || !bagOfWord[sender] || !bagOfWord[sender][w]) {
            updated_value_bag[sender][w] = 1;
            } else {
            updated_value_bag[sender][w] = bagOfWord[sender][w] + 1;
            }
        } else {
            updated_value_bag[chat_id][w] += 1;
        }
        })
    })

    // TODO might need to write again a reducer for concurrency reasons
    setBagOfWord(updated_value_bag)
}

export {updateBagOfWord}

  // =============================================================== //