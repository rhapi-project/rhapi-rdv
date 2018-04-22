import React from "react";

import { Card, Icon, Button } from "semantic-ui-react";

export default class App extends React.Component {
  render() {
    return (
      <Card.Group style={{ marginTop: 10 }}>
        <Card>
          <Card.Content>
            <Card.Header textAlign="right">
              <Icon name="doctor" size="large" />
            </Card.Header>
            <Card.Header>Je suis un praticien</Card.Header>
            <Card.Description>
              Je suis un praticien ou un admininistrateur autorisé
            </Card.Description>
          </Card.Content>
          <Card.Content extra={true} textAlign="right">
            <Button
              onClick={() => {
                window.location.hash = "#Praticiens";
                window.location.reload();
              }}
            >
              OK
            </Button>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content>
            <Card.Header textAlign="right">
              <Icon name="user" size="large" />
            </Card.Header>
            <Card.Header>Je suis un patient</Card.Header>
            <Card.Description>
              J'accède à la gestion de mes rendez-vous
            </Card.Description>
          </Card.Content>
          <Card.Content extra={true} textAlign="right">
            <Button
              onClick={() => {
                window.location.hash = "#Patients";
                window.location.reload();
              }}
            >
              OK
            </Button>
          </Card.Content>
        </Card>
      </Card.Group>
    );
  }
}
