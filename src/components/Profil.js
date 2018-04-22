import React from "react";

import _ from "lodash";

import {
  Header,
  Message,
  Divider,
  Button,
  Form,
  Icon
} from "semantic-ui-react";

import { hsize } from "./Settings";

/**
 * Avant de sauvegarder les modifications,
 * On vérifie d'abord si tous les champs obligatoires sont renseignés
 * et que les formats du code postal, n° de téléphone et adresse e-mail sont valides. (regex)
 */

const defaultProfil = {
  currentName: "",
  userName: "",
  userPassword: "",
  passwordConfirm: "",
  account: {
    nom: "",
    prenom: "",
    adresse1: "",
    adresse2: "",
    adresse3: "",
    codePostal: "",
    ville: "",
    pays: "",
    telMobile: "",
    telBureau: "",
    email: ""
  }
};

export default class Profil extends React.Component {
  state = { saved: true, passwordConfirm: "", ...defaultProfil };

  componentWillMount() {
    this.reload();
  }

  reload = () => {
    this.props.client.MonCompte.read(
      monProfil => {
        if (!_.isEmpty(monProfil.account)) {
          this.setState({
            ...monProfil
          });
        } else {
          let account = defaultProfil.account;
          this.setState({
            ...monProfil,
            account
          });
        }
      },
      data => {
        console.log("erreur");
        console.log(data);
      }
    );
  };

  //gestion des "onChange" dans les input
  handleChangeInput = (e, d) => {
    console.log("handleChangeInput");
    if (
      _.includes(["currentName", "userPassword", "passwordConfirm"], d.name)
    ) {
      let obj = { saved: false };
      obj[d.name] = e.target.value;
      this.setState({ obj });
    } else {
      //Modification dans l'objet account
      let obj = this.state.account;
      obj[d.name] = e.target.value;
      this.setState({ account: obj, saved: false });
    }
  };

  //Une fonction qui vérifie si tous les champs obligatoires sont renseignés
  verification = () => {
    return (
      this.state.currentName !== "" &&
      (this.state.userPassword === "" ||
        this.state.userPassword === this.state.passwordConfirm) &&
      this.state.account.nom !== "" &&
      this.state.account.prenom !== "" &&
      this.state.account.adresse1 !== "" &&
      this.state.account.codePostal !== "" &&
      this.state.account.ville !== "" &&
      this.state.account.pays !== "" &&
      this.state.account.telMobile !== "" &&
      this.state.account.telBureau !== "" &&
      this.state.account.email !== ""
    );
  };

  codePostalValide = code => {
    let pattern = /^[0-9]{5}$/;
    return pattern.test(code);
  };

  //Les formats valides :
  //  01 12 45 78 14 pattern 1 (ou sans espace)
  //  01.12.45.78.14 pattern 2
  //  +33 6 00 00 00 00 pattern 3 (ou sans espace)
  //  00 33 6 00 00 00 00 pattern 4 (ou sans espace)
  telephoneValide = numero => {
    let pattern1 = /^0[1-9]([\s.]?[0-9]{2}){4}$/; //pattern 1 et 2
    let pattern3 = /^\+[1-9][0-9]{1,2}(\s)?[1-9](\s?[0-9]{2}){4}$/;
    let pattern4 = /^00(\s)?[1-9][0-9]{1,2}([1-9])(\s?[0-9]{2}){4}$/;
    return (
      pattern1.test(numero) || pattern3.test(numero) || pattern4.test(numero)
    );
  };

  emailValide = email => {
    let pattern = /(^\w)([\w+.-])*([\w+-])*(@)([\w+.-])+\.([a-z]{2,4})$/i;
    return pattern.test(email);
  };

  formatsValides = () => {
    return (
      this.codePostalValide(this.state.account.codePostal) &&
      this.telephoneValide(this.state.account.telMobile) &&
      this.telephoneValide(this.state.account.telBureau) &&
      this.emailValide(this.state.account.email)
    );
  };

  save = () => {
    if (this.verification() && this.formatsValides()) {
      let obj = this.state;
      _.unset(obj, "passwordConfirm");
      _.unset(obj, "saved");
      this.props.client.MonCompte.update(
        obj,
        monProfil => {
          //success
          this.setState({
            ...monProfil,
            saved: true
          });
        },
        () => {
          console.log("La sauvegarde a échoué !");
          this.reload();
        }
      );
    } else {
      return;
    }
  };

  render() {
    console.log(this.state.saved);
    return (
      <React.Fragment>
        <Header size={hsize}>Profil</Header>
        {this.state.saved ? (
          <Message
            header={"Bienvenue " + this.state.userName}
            content="Voici les données de votre profil utilisateur."
          />
        ) : (
          <Message
            warning={true}
            header="Modifications non sauvegardées"
            content={
              "Les dernières modifications effectuées ne sont pas sauvegardées. Vous pouvez annuler pour revenir à la version précédente."
            }
          />
        )}

        <Form>
          <Form.Input
            required={true}
            label="Nom courant"
            placeholder="Dr Jean DUPONT"
            value={this.state.currentName}
            name="currentName"
            onChange={(e, d) => this.handleChangeInput(e, d)}
          />

          <Form.Group widths="equal">
            <Form.Input
              required={true}
              label="Mot de passe"
              type="password"
              error={
                this.state.userPassword !== this.state.passwordConfirm
                  ? true
                  : false
              }
              value={this.state.userPassword}
              name="userPassword"
              onChange={(e, d) => this.handleChangeInput(e, d)}
            />
            <Form.Input
              required={true}
              label="Confirmer le mot de passe"
              type="password"
              error={
                this.state.userPassword !== this.state.passwordConfirm
                  ? true
                  : false
              }
              value={this.state.passwordConfirm}
              name="passwordConfirm"
              onChange={(e, d) => this.handleChangeInput(e, d)}
            />
          </Form.Group>

          <Divider />

          <Form.Group widths="equal">
            <Form.Input
              required={true}
              label="Prénom"
              placeholder="Votre prénom"
              value={this.state.account.prenom}
              name="prenom"
              onChange={(e, d) => this.handleChangeInput(e, d)}
            />
            <Form.Input
              required={true}
              label="Nom"
              placeholder="Votre nom"
              name="nom"
              value={this.state.account.nom}
              onChange={(e, d) => this.handleChangeInput(e, d)}
            />
          </Form.Group>

          <Form.Group widths="equal">
            <Form.Input
              required={true}
              label="Adresse"
              placeholder="Votre adresse"
              name="adresse1"
              value={this.state.account.adresse1}
              onChange={(e, d) => this.handleChangeInput(e, d)}
            />
            <Form.Input
              label="Adresse (ligne 2)"
              placeholder="Votre adresse"
              value={this.state.account.adresse2}
              name="adresse2"
              onChange={(e, d) => this.handleChangeInput(e, d)}
            />
            <Form.Input
              label="Adresse (ligne 3)"
              placeholder="Votre adresse"
              name="adresse3"
              value={this.state.account.adresse3}
              onChange={(e, d) => this.handleChangeInput(e, d)}
            />
          </Form.Group>

          <Form.Group widths="equal">
            <Form.Input
              required={true}
              label="Code postal"
              placeholder="Code postal"
              name="codePostal"
              error={
                this.codePostalValide(this.state.account.codePostal) ||
                this.state.account.codePostal === ""
                  ? false
                  : true
              }
              value={this.state.account.codePostal}
              onChange={(e, d) => this.handleChangeInput(e, d)}
            />
            <Form.Input
              required={true}
              label="Ville"
              placeholder="Votre ville"
              name="ville"
              value={this.state.account.ville}
              onChange={(e, d) => this.handleChangeInput(e, d)}
            />
            <Form.Input
              required={true}
              label="Pays"
              placeholder="Votre pays"
              name="pays"
              value={this.state.account.pays}
              onChange={(e, d) => this.handleChangeInput(e, d)}
            />
          </Form.Group>

          <Divider hidden={true} />
          <Divider horizontal>Contact</Divider>

          <Form.Group widths="equal">
            <Form.Input
              required={true}
              label="Téléphone mobile"
              value={this.state.account.telMobile}
              name="telMobile"
              error={
                this.telephoneValide(this.state.account.telMobile) ||
                this.state.account.telMobile === ""
                  ? false
                  : true
              }
              onChange={(e, d) => this.handleChangeInput(e, d)}
            />
            <Form.Input
              required={true}
              label="Téléphone bureau"
              value={this.state.account.telBureau}
              name="telBureau"
              error={
                this.telephoneValide(this.state.account.telBureau) ||
                this.state.account.telBureau === ""
                  ? false
                  : true
              }
              onChange={(e, d) => this.handleChangeInput(e, d)}
            />
            <Form.Input
              required={true}
              label="E-mail"
              placeholder="exemple@exemple.com"
              name="email"
              error={
                this.emailValide(this.state.account.email) ||
                this.state.account.email === ""
                  ? false
                  : true
              }
              value={this.state.account.email}
              onChange={(e, d) => this.handleChangeInput(e, d)}
            />
          </Form.Group>

          {!this.verification() && !this.state.saved ? (
            <Form.Group>
              <p>
                <strong>Les champs obligatoires ( </strong>
                <sup>
                  <Icon name="asterisk" color="red" size="mini" />
                </sup>
                <strong>) doivent être renseignés !</strong>
              </p>
            </Form.Group>
          ) : (
            <p />
          )}

          <Divider hidden={true} />
          <Button onClick={this.reload}>Annuler / Actualiser</Button>

          <Button primary={!this.state.saved} onClick={this.save}>
            Sauvegarder
          </Button>
        </Form>
        <Divider hidden={true} />
      </React.Fragment>
    );
  }
}
