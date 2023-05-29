import { Container, Row, Col } from "react-bootstrap";
import { useEffect, useState } from "react";
import LanguageLists from "../utils/LanguageLists.js";

export default function LanguageStats({ title, idToMessage, selectedId }) {
    
    const [shortnames, fullnames, combinednames, lanColorScale] = LanguageLists();
    const [langStats, setLangStats] = useState(shortnames.map((lan) => {return {lan: lan, count: 0, total: 0}}));

    useEffect(() => {
        // Whenever the messages change, run through them and count the languages
        var newLangStats = shortnames.map((lan) => {return {lan: lan, count: 0, total: 0}});
        var total = 0;
        for (let [_, message] of Object.entries(idToMessage)) {
            let idx = -1;
            if (selectedId !== undefined) {
                if (message.lan !== undefined && (message.chat === selectedId || message['sent-by'] === selectedId)) {
                    idx = shortnames.indexOf(message.lan);
                    total += 1;
                    newLangStats[idx].count += 1;
                }
            } else {
                if (message.lan !== undefined) {
                    idx = shortnames.indexOf(message.lan);
                }
                if (idx === -1) {
                    idx = shortnames.indexOf("unk");
                }
                total += 1;
                newLangStats[idx].count += 1;
            }
        }
        newLangStats.total = total;
        setLangStats(newLangStats);
    }, [idToMessage, selectedId]);

    return (
        <>
            { title.length > 0 &&
                <Col style={{ display: 'flex', alignItems: 'center' }}>
                    {title}:
                </Col>
            }
            <div
            style={{
                display: 'flex',
                height: '25px',
                borderRadius: '5px',
                overflow: 'hidden',
            }}
            >
            {langStats
                .filter((lanStat) => lanStat.count > 0)
                .map((lanStat, index) => {
                const percentage = Math.round((lanStat.count / langStats.total) * 100);
                const languageIndex = shortnames.indexOf(lanStat.lan);
                const languageColor = lanColorScale(lanStat.lan);
                const isFirst = index === 0;
                const isLast = index === langStats.filter((lanStat) => lanStat.count > 0).length - 1;
                const borderRad = isFirst ? '5px 0 0 5px' : (isLast ? '0 5px 5px 0' : '0');
        
                return (
                    <div
                    key={lanStat.lan}
                    style={{
                        flexBasis: `${percentage}%`,
                        backgroundColor: languageColor,
                        borderRadius: borderRad,
                    }}
                    title={`${fullnames[languageIndex]}: ${percentage}%`}
                    />
                );
                })}
            </div>
        </>
    );
}
