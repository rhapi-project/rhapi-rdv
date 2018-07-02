import React from "react";

import _ from "lodash";

import {
  Header,
  Message,
  Divider,
  Button,
  Checkbox,
  Form,
  Icon
} from "semantic-ui-react";

import {
  codePostalRegex,
  emailRegex,
  hsize,
  telRegex,
  telFormat
} from "./Settings";

import SmsHistory from "./SmsHistory";

/*
  TODO : Warning à éviter sur l'interface du Profil
  Ce warning se produit quand il y a des champs input dont la value est initialement undefined ou vide
  A corriger
  =>  https://github.com/reactstrap/reactstrap/issues/570
*/

const defaultProfil = {
  currentName: "",
  userName: "",
  userPassword: "",
  passwordConfirm: "",
  sms: false, // modal historique SMS
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
  componentWillMount() {
    this.setState({ saved: true, passwordConfirm: "", ...defaultProfil });
  }

  componentDidMount() {
    this.reload();
  }

  reload = () => {
    this.props.client.MonCompte.read(
      monProfil => {
        //console.log(monProfil);
        if (!_.isEmpty(monProfil.account)) {
          //monProfil.account.telBureau = telFormat(monProfil.account.telBureau);
          //monProfil.account.telMobile = telFormat(monProfil.account.telMobile);
          this.setState({
            ...monProfil,
            changePassword: false,
            saved: true
          });
        } else {
          let account = defaultProfil.account;

          this.setState({
            ...monProfil,
            changePassword: false,
            saved: true,
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
    if (
      _.includes(["currentName", "userPassword", "passwordConfirm"], d.name)
    ) {
      let obj = this.state;
      obj[d.name] = e.target.value;
      //this.setState({ obj }); -- cette ligne une erreur car elle met dans le state tout l'objet en créant un champ
      //erreur corrigée à la ligne suivante
      this.setState({ ...obj, saved: false });
    } else {
      //Modification dans l'objet account
      let obj = this.state.account;
      let key = d.name;
      if (key === "telBureau" || key === "telMobile") {
        obj[key] = telFormat(e.target.value);
      } else {
        obj[key] = e.target.value;
      }
      this.setState({ account: obj, saved: false });
    }
  };

  //Une fonction qui vérifie si tous les champs obligatoires sont renseignés
  verification = () => {
    let valideForm =
      this.state.currentName !== "" &&
      this.state.account.nom !== "" &&
      this.state.account.prenom !== "" &&
      this.state.account.adresse1 !== "" &&
      this.state.account.ville !== "" &&
      this.state.account.pays !== "" &&
      this.formatsValides();
    return this.state.changePassword
      ? valideForm &&
          this.state.userPassword !== "" &&
          this.state.userPassword === this.state.passwordConfirm
      : valideForm;
  };

  codePostalValide = code => {
    return codePostalRegex.test(code);
  };

  //Les formats valides :
  //  01 12 45 78 14 pattern 1 (ou sans espace)
  //  01.12.45.78.14 pattern 2
  //  +33 6 00 00 00 00 pattern 3 (ou sans espace)
  //  00 33 6 00 00 00 00 pattern 4 (ou sans espace)
  telephoneValide = numero => {
    for (let i = 0; i < telRegex.length; i++) {
      if (telRegex[i].test(numero)) {
        return true;
      }
    }
    return false;
  };

  emailValide = email => {
    return emailRegex.test(email);
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
      this.setState({ passwordConfirm: "" });
      let obj = this.state;
      //console.log(this.state);
      _.unset(obj, "passwordConfirm");
      _.unset(obj, "saved");
      _.unset(obj, "changePassword");
      _.unset(obj, "sms");
      if (!this.state.changePassword) {
        // si le mot de passe n'est pas modifié, on ne le met pas à jour dans la BDD
        _.unset(obj, "userPassword");
      }
      //console.log(obj);
      this.props.client.MonCompte.update(
        obj,
        monProfil => {
          //success
          console.log(monProfil);
          this.setState({
            ...monProfil,
            saved: true
          });
          this.reload();
        },
        data => {
          console.log(data);
          console.log("La sauvegarde a échoué !");
          this.setState({
            saved: false
          });
          //this.reload();
        }
      );
    } else {
      return;
    }
  };

  smsHistoryOpen = bool => {
    this.setState({
      sms: bool
    });
  };

  render() {
    //console.log(this.state);
    return (
      <div id="profil">
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

          <Form.Input label="Changer le mot de passe">
            <Checkbox
              toggle={true}
              checked={this.state.changePassword}
              onChange={(e, d) =>
                this.setState({ changePassword: !this.state.changePassword })
              }
            />
          </Form.Input>

          <Form.Group widths="equal">
            <Form.Input
              required={true}
              label="Mot de passe"
              type="password"
              disabled={!this.state.changePassword}
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
              disabled={!this.state.changePassword}
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
              label="E-Mail"
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

          <SmsHistory
            sms={this.state.sms}
            smsHistoryOpen={this.smsHistoryOpen}
            client={this.props.client}
          />
          <Button onClick={this.reload}>Annuler / Actualiser</Button>
          <Button primary={!this.state.saved} onClick={this.save}>
            Sauvegarder
          </Button>
        </Form>
        <Divider hidden={true} />
      </div>
    );
  }
}
