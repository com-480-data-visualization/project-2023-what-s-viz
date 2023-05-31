import { Container, Row, Col, Card } from 'react-bootstrap';
import React from 'react';
import { useState, useEffect } from 'react';

function About() {

  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    // Fetch GitHub profile data for team members
    const fetchGitHubProfiles = async () => {
      const members = [
        { name: 'Tobias Oberdoerfer', username: 'Toroto006' },
        { name: 'Jonas Blanc', username: 'jonasblanc' },
        { name: 'Hugo Lanfranchi', username: 'hugolan' },
      ];

      const updatedMembers = await Promise.all(
        members.map(async (member) => {
          const response = await fetch(`https://api.github.com/users/${member.username}`);
          const data = await response.json();
          return { ...member, avatarUrl: data.avatar_url };
        })
      );

      setTeamMembers(updatedMembers);
    };

    fetchGitHubProfiles();
  }, []);

  const acknowledgments = [
    {
      name: 'whatsmeow',
      description: 'The Go implementation of the WhatsApp Web API',
      githubUrl: 'https://github.com/tulir/whatsmeow'
    },
    {
      name: 'Go',
      description: 'An open source programming language that makes it easy to build simple, reliable, and efficient software',
      githubUrl: 'https://github.com/golang/go'
    },
    {
      name: 'NodeJS',
      description: 'A JavaScript runtime built on Chrome\'s V8 JavaScript engine',
      githubUrl: 'https://github.com/nodejs/node',
    },
    {
      name: 'React',
      description: 'A JavaScript library for building user interfaces',
      githubUrl: 'https://github.com/facebook/react'
    },
    {
      name: 'React-Bootstrap',
      description: 'The most popular HTML, CSS, and JS library for responsive, mobile-first web development',
      githubUrl: 'https://github.com/react-bootstrap/react-bootstrap'
    },
    {
      name: 'D3.js',
      description: 'A JavaScript library for manipulating documents based on data',
      githubUrl: 'https://github.com/d3/d3'
    },
    {
      name: 'd3Cloud',
      description: 'A word cloud layout written in JavaScript for D3.js',
      githubUrl: 'https://github.com/jasondavies/d3-cloud'
    },
    {
      name: 'SQL.js',
      description: 'A port of SQLite to WebAssembly for SQL database functionality in the browser',
      githubUrl: 'https://github.com/sql-js/sql.js'
    },
    {
      name: 'natural',
      description: 'General natural language processing library for node',
      githubUrl: 'https://github.com/NaturalNode/natural'
    }
  ];

  return (
    <Container>
      <Row>
        <Col>
          <h2>About Our Project</h2>
          <p>
            Welcome to our DataVisualization project! We are excited to present our innovative approach to utilizing WhatsApp data and providing valuable insights through data science and data visualization. Our project aims to unlock the hidden knowledge within the massive amount of WhatsApp data, allowing users to gain actionable insights without the hassle of manual analysis.
          </p>
        </Col>
      </Row>
      <Row>
        <Col>
          <h4>Dataset</h4>
        </Col>
      </Row>
      <Row>
        <Col>
          <p>
            At the core of our project is the utilization of WhatsApp chats, including messages, metadata, contacts, and group architecture, as our dataset. With over two billion monthly active users, WhatsApp is one of the leading messaging platforms, making it an abundant resource for analysis. We use a system that acts as a client for the WhatsApp API, allowing users to seamlessly access their data.
          </p>
          <p>
            Upon scanning a QR code and logging into our web application, users' WhatsApp data from the past three years is retrieved locally in their browser. As long as the user remains logged in, new messages are continuously integrated into our dynamic visualizations. The data goes through various layers and languages, but we primarily focus on the format received by the JavaScript layer, as it serves as the basis for our visualizations.
          </p>
          <p>
            Our dataset comprises tens of thousands of messages, along with hundreds of groups and contacts. We have three types of application messages: regular messages, contact information, and chat descriptions. Each message contains details such as the chat ID, message ID, message text, sender ID, and timestamp. Similarly, contact messages provide information like contact status, name, registration status, and avatar. Chat descriptions include details about the group, such as the avatar, name, owner ID, participants, and topic.
          </p>
        </Col>
      </Row>

      <Row>
        <Col>
          <h4>Problematic</h4>
          <p>
            We firmly believe that WhatsApp data is a treasure trove of information, which is evident from Meta's continued investment in it. Our project leverages data science and visualization tools to extract and present valuable knowledge hidden within this vast amount of data. By offering actionable insights, we aim to empower users in managing and maximizing their professional and personal networks.
          </p>
          <p>
            WhatsApp is widely used for communication with both family and friends, as well as professional contacts. The ease of communication on WhatsApp has led to its growing popularity, with many individuals and organizations relying on it for their daily activities. Our visualizations focus on providing users with an overview of their contact network, allowing them to understand the landscape of their connections and utilize them effectively.
          </p>
          <p>
            Through our visualizations, users can answer important questions about their network. Who are the individuals in their network, and how closely connected are they? Which contacts are connected to each other? In what context are these connections established? Once users have a good understanding of their network, they can delve deeper into specific contacts or groups. Our visualizations will highlight the main topics discussed, the most active times of contact, and the typical language used in communication.
          </p>
          <p>
            By providing easy access to these insights, our project aims to facilitate the management of professional and friendly networks, helping users make informed decisions and foster meaningfulconnections.
          </p>
        </Col>
      </Row>
      <Row>
        <Col>
          <h4>Related Work</h4>
          <p>
            While several WhatsApp chat analyzers exist, our project distinguishes itself with its real-time processing and dynamic visualization capabilities. Unlike other analyzers that require an uploaded backup of chats, our web system operates like WhatsApp Web, allowing users to scan a QR code and access their data seamlessly. This real-time processing enables users to witness statistics and visualizations change as they use WhatsApp.
          </p>
          <p>
            Existing solutions primarily focus on analyzing individual chats, as exporting all chats at once can be challenging. In contrast, our project provides an overarching view of all chats and contacts, presenting a comprehensive understanding of the user's WhatsApp network. We drew inspiration from population dynamics and existing chat analyzers to design our visualizations, incorporating elements from graphs and networks.
          </p>
          <p>
            It is worth noting that, due to privacy concerns and restrictions imposed by WhatsApp's terms of service, we do not store any user data or chat history on our servers. All data is processed and visualized locally in the user's browser. Our primary objective is to empower users by providing them with actionable insights without compromising their privacy or data security.
          </p>
        </Col>
      </Row>
       
      {/* Team Section */}
      <Row>
        <Col>
          <h4>Our team</h4>
        </Col>
      </Row>
      <Row>
        {teamMembers.map((member) => (
          <Col md={4} key={member.username} className="mb-4">
            <Card>
              <Card.Img variant="top" src={member.avatarUrl} />
              <Card.Body>
                <Card.Title>{member.name}</Card.Title>
                <Card.Link href={`https://github.com/${member.username}`} target="_blank" rel="noopener noreferrer">
                  GitHub Profile
                </Card.Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Acknowledgments Section */}
      <Row>
        <Col>
          <h4>Acknowledgments</h4>
          <p>
            We would like to express our sincere gratitude to the following open-source projects without which our work would not have been possible:
          </p>
        </Col>
      </Row>
      <Row>
        {acknowledgments.map((ack) => (
          <Col md={4} key={ack.name} className="mb-4">
            <Card>
              <Card.Body>
                <Card.Title>{ack.name}</Card.Title>
                <Card.Text>{ack.description}</Card.Text>
                <Card.Link href={ack.githubUrl} target="_blank" rel="noopener noreferrer">
                  GitHub Repository
                </Card.Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default About;