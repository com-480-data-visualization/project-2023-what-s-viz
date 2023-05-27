import { Container, Row, Col } from "react-bootstrap";
import { useEffect, useState } from "react";

// Languages again
const browserLanguages = navigator.languages.map((lan) => lan.slice(0, 2));
const shornames = Array.from(new Set([ ...["en", "de", "fr", "it", "unk"], ...browserLanguages]));
const fullnames = ["English", "German", "French", "Italian", "Unknown"];
var combinednames = fullnames.map(function(e, i) {
    return [e, shornames[i]];
});
//const lanColorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(shornames);

export default function LanguageStats({ idToMessage, selectedId }) {
    
    const [langStats, setLangStats] = useState(shornames.map((lan) => {return {lan: lan, count: 0, total: 0}}));

    useEffect(() => {
        // Whenever the messages change, run through them and count the languages
        var newLangStats = shornames.map((lan) => {return {lan: lan, count: 0, total: 0}});
        var total = 0;
        for (let [_, message] of Object.entries(idToMessage)) {
            let idx = -1;
            if (selectedId !== undefined) {
                if (message.lan !== undefined && (message.chat === selectedId || message['sent-by'] === selectedId)) {
                    idx = shornames.indexOf(message.lan);
                    total += 1;
                    newLangStats[idx].count += 1;
                }
            } else {
                if (message.lan !== undefined) {
                    idx = shornames.indexOf(message.lan);
                }
                if (idx === -1) {
                    idx = shornames.indexOf("unk");
                }
                total += 1;
                newLangStats[idx].count += 1;
            }
        }
        newLangStats.total = total;
        setLangStats(newLangStats);
    }, [idToMessage, selectedId]);

    return (
        <Container>
            {   
                // Only do this if at least one has more than zero
                langStats.filter((lanStat) => lanStat.count > 0).length > 0 &&
                // Write the percentages of each language per row
                langStats.map((lanStat) => {
                    if (lanStat === undefined || Math.round(lanStat.count / langStats.total * 100) === 0) return (<></>);
                    return (
                        <Row>
                            <Col>{fullnames[shornames.indexOf(lanStat.lan)]}</Col>
                            <Col>{Math.round(lanStat.count / langStats.total * 100)}%</Col>
                        </Row>
                    );
                })
            }
        </Container>
    );
}
