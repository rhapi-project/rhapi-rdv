import React from "react";

import { Button, Grid, Header, Icon } from "semantic-ui-react";

export default class NotFound extends React.Component {
  render() {
    return (
      <Grid
        textAlign="center"
        style={{ height: "100%" }}
        verticalAlign="middle"
      >
        <Grid.Column style={{ maxWidth: 450 }}>
          <Header as="h2" icon>
            <Icon name="settings" />
            Il n'y a rien ici !
            <Header.Subheader>
              Vous avez entré une adresse invalide.
            </Header.Subheader>
            <Button onClick={() => (window.location = "/")}>Accueil</Button>
          </Header>
        </Grid.Column>
      </Grid>
    );
  }
}
