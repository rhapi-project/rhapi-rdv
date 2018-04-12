import React from "react";

//import _ from "lodash";

import { Header, Message, Divider, Button } from "semantic-ui-react";

import { hsize } from "./Settings";

export default class Configuration extends React.Component {
  componentWillMount() {
    //this.setState({
    //    ... à faire
    //});

    this.reload();
  }

  reload = () => {
    this.props.client.MonCompte.read(
      monProfil => {
        console.log(monProfil);
        this.setState({
          ...monProfil
        });
      },
      data => {
        console.log("erreur");
        console.log(data);
      }
    );
  };

  save = () => {
    /*
      this.props.client.MonCompte.update(
          .... à faire
      );
      */
  };

  render() {
    return (
      <React.Fragment>
        <Header size={hsize}>Profil</Header>
        <Message>
         TODO : Réaliser ici un formulaire pour afficher/modifier le profil utilisateur
        </Message>
        <Button onClick={this.save}>Sauvegarder les modifications</Button>
        <Divider hidden={true} />
      </React.Fragment>
    );
  }
}
