import os
# Open all files in the stopwords folder and for each do the following:
# read each word per line into an array of the name of the file without ending
# Return the array of stopwords for each file with its name
def getStopwords():
    stopwords = {}
    for filename in os.listdir('./stopwords'):
        # All stopwords are taken from https://www.ranks.nl/stopwords/
        if filename.endswith('.txt'):
            # create the name for this array
            name = filename.split('.')[0]
            # read each word per line into an array of the name of the file without ending
            with open('./stopwords/' + filename, 'r') as f:
                words = f.read().splitlines()
                for word in words:
                    # only add non empty words and strip them
                    word = word.strip()
                    if word != '':
                        if name in stopwords:
                            stopwords[name].append(word)
                        else:
                            stopwords[name] = [word]
    return stopwords

# Now we use the getStopwords() function to get the stopwords
# and write them to a file called Stopwords.tsx, where the format is
# const stopwords<key> = ['word1 of stopwords[key]', 'word2 of stopwords[key]', ...]
# for each key in stopwords
def writeStopwords(stopwords):
    with open('Stopwords.tsx', 'w') as f:
        # Write the stopwords to the file
        for key in stopwords:
            f.write(f"\nconst stopwords{key.capitalize()} = [")
            for word in stopwords[key]:
                f.write(f"\n\t\"{word}\",")
            f.write("\n]")
        # Now write the const export of all previous arrays as a flat array
        f.write("\n\nexport const stopwords = [")
        for key in stopwords:
            f.write(f"\n\t...stopwords{key.capitalize()},")
        f.write("\n]\n")

if __name__ == '__main__':
    stopwords = getStopwords()
    writeStopwords(stopwords)
    print(f"Done with {len(stopwords)} languages!")