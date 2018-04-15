import React from "react";

//import _ from "lodash";

import {
  Header,
  Message,
  Divider,
  Button,
  Form,
  Segment,
  Icon
} from "semantic-ui-react";

import { hsize } from "./Settings";

//css

//import "../css/Profil.css";

export default class Configuration extends React.Component {
  componentWillMount() {
    this.setState({
      //Initialisation du state : valeurs par défaut
      currentName: "",
      userName: "",
      userPassword: "",
      account: {
        nom: "",
        prenom: "",
        genre: 0,
        adresse1: "",
        adresse2: "",
        adresse3: "",
        codePostal: "",
        ville: "",
        pays: "",
        telDomicile: "",
        telMobile: "",
        telBureau: "",
        email: ""
      }
    });
    //faire quelque chose qui puisse mettre un state par defaut
    //écrire account

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

  //gestion des bouton radios "Genre"
  //handleChangeChecked = (e, { value }) => this.setState({value});

  save = () => {
    /*
      this.props.client.MonCompte.update(
        ... à faire
      );
      some github test
      */
  };

  render() {
    console.log(this.state);
    return (
      <React.Fragment>
        <Header size={hsize}>Profil</Header>

        {/*Le formulaire de saisie de données*/}
        <Segment className="formulaire">
          <Form>
            <Message floating positive>
              Vous êtes connectés en tant que :{" "}
              <strong>{this.state.userName}</strong>
              <Icon name="checkmark" color="green" size="big" />
            </Message>

            <Form.Input
              required
              label="Nom courant"
              placeholder="ex : Dr Jean DUPONT"
            />

            <Form.Group widths="equal">
              <Form.Input required label="Mot de passe" type="password" />
              <Form.Input
                required
                label="Confirmer le mot de passe"
                type="password"
              />
            </Form.Group>

            <Divider />

            <Form.Group widths="equal">
              <Form.Input label="Prénom" placeholder="Votre prénom" />
              <Form.Input label="Nom" placeholder="Votre nom" />
            </Form.Group>

            <Form.Group inline>
              <label>Genre</label>
              <Form.Radio label="F" value="2" />
              <Form.Radio label="M" value="1" />
            </Form.Group>

            <Form.Group widths="equal">
              <Form.Input label="Adresse 1" placeholder="Votre adresse" />
              <Form.Input label="Adresse 2" placeholder="Votre adresse" />
              <Form.Input label="Adresse 3" placeholder="Votre adresse" />
            </Form.Group>

            <Form.Group widths="equal">
              <Form.Input label="Code postal" placeholder="Code postal" />
              <Form.Input label="Ville" />
              <Form.Input label="Pays" />
            </Form.Group>

            <Divider hidden />
            <Divider horizontal>Contact</Divider>

            <Form.Group widths="equal">
              <Form.Input label="Téléphone mobile" />
              <Form.Input label="Téléphone bureau" />
              <Form.Input label="Téléphone domicile" />
            </Form.Group>

            <Form.Input
              required
              label="E-mail"
              placeholder="exemple@exemple.com"
            />
          </Form>
        </Segment>

        <Button onClick={this.save}>Sauvegarder les modifications</Button>
        <Divider hidden={true} />
      </React.Fragment>
    );
  }
}
