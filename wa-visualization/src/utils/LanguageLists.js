import * as d3 from "d3";

// Languages again
const browserLanguages = navigator.languages.map((lan) => lan.slice(0, 2));
const shornames = Array.from(new Set([ ...["en", "de", "fr", "it", "unk"], ...browserLanguages]));
const fullnames = ["English", "German", "French", "Italian", "Unknown"];
var combinednames = fullnames.map(function(e, i) {
return [e, shornames[i]];
});
const lanColorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(shornames);

export default function LanguageLists() {
    return [shornames, fullnames, combinednames, lanColorScale];
}