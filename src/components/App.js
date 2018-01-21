import React from "react";

import { Card, Image, Button } from "semantic-ui-react";

export default class App extends React.Component {
  render() {
    return (
      <Card.Group>
        <Card>
          <Card.Content>
            <Image floated="right" size="mini" src="/images/praticien.png" />
            <Card.Header>Praticien</Card.Header>
            <Card.Meta>
              Je suis un praticien ou un admininistrateur de la structure
            </Card.Meta>
            <Card.Description>
              Accès d'un praticien autorisé à la gestion des plannings du
              cabinet
            </Card.Description>
          </Card.Content>
          <Card.Content extra={true} textAlign="right">
            <Button
              basic={true}
              color="green"
              onClick={() => (window.location = "/Praticiens")}
            >
              OK
            </Button>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content>
            <Image floated="right" size="mini" src="/images/patient.png" />
            <Card.Header>Patient</Card.Header>
            <Card.Meta>Je suis un patient</Card.Meta>
            <Card.Description>
              Accès d'un patient à la gestion de ses rendez-vous
            </Card.Description>
          </Card.Content>
          <Card.Content extra={true} textAlign="right">
            <Button
              basic={true}
              color="green"
              onClick={() => (window.location = "/Patients")}
            >
              OK
            </Button>
          </Card.Content>
        </Card>
      </Card.Group>
    );
  }
}
