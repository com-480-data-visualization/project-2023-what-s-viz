import { Navbar, Nav, Container } from "react-bootstrap";

const Navigation = () => {
  return (
    <>
      <Navbar bg="dark" variant="dark" expand="sm" fixed="top">
        <Container>
          <Navbar.Brand href={process.env.PUBLIC_URL + '/'}>
            <img
              src={require("../../public/logo.png")}
              width="30"
              height="30"
            />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav>
              <Nav.Link href={process.env.PUBLIC_URL + '/'}>Home</Nav.Link>
              <Nav.Link href={process.env.PUBLIC_URL + '/about'} >About</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
};

export default Navigation;

/* 
              <Nav.Link href={process.env.PUBLIC_URL + '/testing'} >Testing</Nav.Link>
*/