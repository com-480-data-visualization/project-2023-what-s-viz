import { Container, Row, Col, Table } from "react-bootstrap";
import LanguageLists from "../utils/LanguageLists.js";

function Legend({}) {
  const [shornames, fullnames, combinednames, lanColorScale] = LanguageLists();
  
  return (
    <>
      <Row>
        <Col xs="3" style={{ display: 'flex', alignItems: 'center' }}>
            <p class="text-justify m-0">Legend:</p>
        </Col>
        <Col xs="9">
        <Table responsive className="m-0">
        <thead>
        <tr>
            {
            // For each of the fullnames create a col with this name and its color
            combinednames.map((lan, i) => (
                <th key={i} className="p-0 m-0"
                style={{
                    color: lanColorScale(lan[1]),
                    height: "1em",
                    width: "1em",
                }}>
                {lan[0]}
                </th>
            ))
            }
            </tr>
        </thead>
        </Table>
        </Col>
      </Row>
    </>
  );
}

export default Legend;
