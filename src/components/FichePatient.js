import React from "react";

import _ from "lodash";

import moment from "moment";

import {
  Accordion,
  Form,
  Checkbox,
  Divider,
  Dropdown,
  Message,
  Modal,
  Icon,
  Button,
  Grid
} from "semantic-ui-react";

import {
  codePostalRegex,
  emailRegex,
  telRegex,
  denominationDefaultFormat
} from "./Settings";

import RdvPassCard from "./RdvPassCard";

import { SingleDatePicker } from "react-dates";

/**
 * A faire
 * Vérification avant enregistrement (champs obligatoires)
 *
 * Ce qui est fait :
 * -> Modification et mise à jour des informations sur la fiche du patient
 * -> Création d'une nouvelle fiche
 * -> Suppression d'une fiche
 * -> Gestion des rdv (Problème avec le mot de passe)
 */

/* inutile depuis que défini par défaut en backend
const gestionRdvJO = {
  autoriseSMS: false,
  reservation: {
    autorisation: 0, // à voir
    password: ""
  }
};
*/

export default class FichePatient extends React.Component {
  civilites = [
    {
      text: "",
      shorttext: "",
      value: 0
    },
    {
      text: "Monsieur",
      shorttext: "M.",
      value: 1
    },
    {
      text: "Madame",
      shorttext: "Mme",
      value: 2,
      hidden: true
    },
    {
      text: "Mademoiselle",
      shorttext: "Mlle",
      value: 3
    },
    {
      text: "Enfant",
      shorttext: "Enfant",
      value: 4
    }
  ];

  civilitesNouvelles = [
    {
      text: "",
      shorttext: "",
      value: 0
    },
    {
      text: "Monsieur",
      shorttext: "M.",
      value: 1
    },
    {
      text: "Madame",
      shorttext: "Mme",
      value: 2,
      hidden: true
    },
    /*{
        text: "Mademoiselle",
        shorttext: "Mlle",
        value: 3
      },*/
    {
      text: "Enfant",
      shorttext: "Enfant",
      value: 4
    }
  ];

  autorisations = [
    {
      text: "Niveau d'autorisation 0",
      value: 0
    },
    {
      text: "Niveau d'autorisation 1",
      value: 1
    },
    {
      text: "Niveau d'autorisation 2",
      value: 2
    },
    {
      text: "Niveau d'autorisation 3",
      value: 3
    }
  ];

  componentWillMount() {
    this.setState({ activeIndex: 0 });
  }

  componentWillReceiveProps(next) {
    let patient = { ...next.patient };
    /* inutile depuis que défini par défaut en backend
    if (_.isEmpty(patient.gestionRdvJO)) {
      patient.gestionRdvJO = gestionRdvJO;
    }
    */
    this.setState({
      patient: patient,
      saved: true,
      naissanceDate: moment(next.patient.naissance),
      naissanceFocused: false,
      modalPassword: false,
      newPassword: "",
      print: false
    });
  }

  civilite = short => {
    if (_.isUndefined(this.state.patient.civilite)) {
      return "";
    }
    let civiliteNum = 1 * this.state.patient.civilite;
    let civiliteStr = "" + this.state.patient.civilite;
    if (!isNaN(civiliteNum)) {
      if (civiliteNum < this.civilites.length) {
        civiliteStr = short
          ? this.civilites[civiliteNum].shorttext
          : civiliteNum === 3 // Mademoiselle (obsolète) est géré comme un texte libre (autre)
            ? this.civilites[civiliteNum].text
            : "";
      } else {
        civiliteStr = "";
      }
    }
    return civiliteStr;
  };

  telephoneValide = numero => {
    for (let i = 0; i < telRegex.length; i++) {
      if (telRegex[i].test(numero)) {
        return true;
      }
    }
    return false;
  };

  camelDenomination = text => {
    let result = "";
    let prev = "";
    for (let i = 0; i < text.length; i++) {
      let c = text[i];
      if (i === 0 || prev === " " || prev === "'" || prev === "-") {
        c = _.toUpper(c);
      } else {
        c = _.toLower(c);
      }
      prev = c;
      result += c;
    }
    return result;
  };

  conversionDenominationFormat = (champ, value) => {
    if (champ !== "nom" && champ !== "prenom") {
      return value;
    } else {
      switch (denominationDefaultFormat) {
        case "NP":
          return _.toUpper(value);
        case "Np":
          return champ === "nom"
            ? _.toUpper(value)
            : this.camelDenomination(value);
        case "PN":
          return _.toUpper(value);
        case "pN":
          return champ === "nom"
            ? _.toUpper(value)
            : this.camelDenomination(value);
        case "np":
          return this.camelDenomination(value);
        case "pn":
          return this.camelDenomination(value);
        default:
          return value;
      }
    }
  };

  affichageDenomination = () => {
    switch (denominationDefaultFormat) {
      case "NP":
        return (
          _.toUpper(this.state.patient.nom) +
          " " +
          _.toUpper(this.state.patient.prenom)
        );
      case "Np":
        return (
          _.toUpper(this.state.patient.nom) +
          " " +
          this.camelDenomination(this.state.patient.prenom)
        );
      case "PN":
        return (
          _.toUpper(this.state.patient.prenom) +
          " " +
          _.toUpper(this.state.patient.nom)
        );
      case "pN":
        return (
          this.camelDenomination(this.state.patient.prenom) +
          " " +
          _.toUpper(this.state.patient.nom)
        );
      case "np":
        return (
          this.camelDenomination(this.state.patient.nom) +
          " " +
          this.camelDenomination(this.state.patient.prenom)
        );
      case "pn":
        return (
          this.camelDenomination(this.state.patient.prenom) +
          " " +
          this.camelDenomination(this.state.patient.nom)
        );
      default:
        return this.state.patient.nom + " " + this.state.patient.prenom;
    }
  };

  handleClickAccordion = (e, i) => {
    if (this.state.activeIndex === i) {
      this.setState({ activeIndex: -1 });
    } else {
      this.setState({ activeIndex: i });
    }
  };

  handleChangeGenre = value => {
    let modifiedPatient = this.state.patient;
    modifiedPatient.genre = value;
    this.props.onChange(modifiedPatient);
  };

  handleChangeCivilite = (e, d) => {
    console.log(d.value);
    let modifiedPatient = this.state.patient;
    modifiedPatient.civilite = d.value;
    this.props.onChange(modifiedPatient);
  };

  handleChangeInput = (e, d) => {
    let modifiedPatient = this.state.patient;
    if (d.name === "password") {
      // modification dans l'objet gestionRdvJO
      modifiedPatient.gestionRdvJO.reservation.password = e.target.value;
      /*this.setState({
        patient: modifiedPatient
      });*/
    } else {
      //modifiedPatient[d.name] = d.value;
      modifiedPatient[d.name] = this.conversionDenominationFormat(
        d.name,
        d.value
      );
    }
    this.props.onChange(modifiedPatient);
  };

  changeAutorisation = (e, d) => {
    let modifiedPatient = this.state.patient;
    modifiedPatient.gestionRdvJO.reservation.autorisation = d.value;
    this.setState({
      patient: modifiedPatient
    });
    this.props.onChange(modifiedPatient);
  };

  changeAutoriseSMS = (e, d) => {
    let modifiedPatient = this.state.patient;
    modifiedPatient.gestionRdvJO.autoriseSMS = d.checked;
    this.setState({
      patient: modifiedPatient
    });
    this.props.onChange(modifiedPatient);
  };

  verificationPassword = () => {
    return (
      this.state.patient.gestionRdvJO.reservation.password ===
      this.state.patient.passwordConfirm
    );
  };

  makePasswd = () => {
    let passwd = "";
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (let i = 0; i < 6; i++) {
      let c = Math.floor(Math.random() * chars.length + 1);
      passwd += chars.charAt(c);
    }
    return passwd;
  };

  render() {
    //console.log(this.state.passwordConfirm);
    console.log(this.state.naissanceDate);
    let nofiche =
      _.isNull(this.state) ||
      _.isUndefined(this.state.patient) ||
      _.isUndefined(this.state.patient.id) ||
      this.state.patient.id < 1;

    let patient = {};
    if (!nofiche) {
      patient = this.state.patient;
      console.log(this.state.patient.gestionRdvJO.reservation.password);
      //console.log(this.state.patient.passwordConfirm);
    }

    return (
      <React.Fragment>
        {nofiche ? (
          <Message
            header="Aucun patient n'est actuellement sélectionné"
            content="Vous pouvez créer une nouvelle fiche ou effectuer une recherche sur celles existantes."
          />
        ) : (
          <div style={{ paddingRight: "5px" }}>
            {/*Accordion right margin*/}
            <Accordion fluid={true} styled={true}>
              <Accordion.Title
                active={this.state.activeIndex === 0}
                onClick={e => this.handleClickAccordion(e, 0)}
              >
                <Icon name="dropdown" />
                Informations générales
              </Accordion.Title>
              <Accordion.Content active={this.state.activeIndex === 0}>
                <Form>
                  <Grid divided={true}>
                    <Grid.Row>
                      <Grid.Column width={4}>
                        {/*
                            Photo de profil voir le nouveau champ patient.profilJO et plus exactement
                            patient.profilJO.base64 qui doit contenir l'image/la photo de profil au format base 64
                            IMPORTANT : pour ne pas prendre trop de place en bdd, l'image doit se limiter à 128 x 128 pixels
                            Pour charger une image, la convertir en base 64 puis la placer dans patient.profilJO.base64 
                            https://stackoverflow.com/questions/22172604/convert-image-url-to-base64/22172860 
                            => s'inspirer du dernier exemple et de sa démo sur jsfiddle : 
                            https://jsfiddle.net/vibs2006/ed9j7epr/
                            Pour afficher une image on doit juste avoir quelque chose comme :
                            <img src="data:image/png;base64, iVBORw0KGgoAA...AANSUhEUgkJggg==" alt="Mon profil" />
                            soit pour nous :
                            <img src={patient.profilJO.base64} alt="Mon profil" />
                          */}
                        <div style={{ textAlign: "center" }}>
                          {_.isEmpty(this.state.patient.profilJO.base64) ? (
                            <Icon name="user" size="massive" />
                          ) : (
                            ""
                          ) //Mettre la vraie photo du patient
                          }
                        </div>
                      </Grid.Column>
                      <Grid.Column width={12}>
                        <strong>
                          {"#" +
                            this.props.patient.id +
                            " / " +
                            this.props.patient.ipp2 +
                            " / " +
                            this.civilite(true) +
                            "  " +
                            this.affichageDenomination() +
                            "  " +
                            (_.isNull(patient.naissance) ||
                            _.isNull(this.state.naissanceDate)
                              ? ""
                              : " - " +
                                (patient.genre === 2 ? "née" : "né") +
                                " le " +
                                _.split(this.props.age.naissanceSmall, " ")[0] +
                                " (" +
                                this.props.age.texte +
                                ")")}
                        </strong>
                        <Divider hidden={true} fitted={true} />

                        {"Création le " +
                          moment(this.props.patient.createdAt).format(
                            "dddd D MMMM YYYY à HH:mm"
                          )}
                        <Divider hidden={true} fitted={true} />
                        {"Dernière modification le " +
                          moment(this.props.patient.modifiedAt).format(
                            "dddd D MMMM YYYY à HH:mm"
                          )}
                      </Grid.Column>
                    </Grid.Row>
                  </Grid>

                  <Divider hidden={true} />

                  <Form.Group widths="equal">
                    <Form.Input
                      required={true}
                      label="Nom"
                      name="nom"
                      placeholder="Nom de patient"
                      value={patient.nom}
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      required={true}
                      label="Prénom"
                      name="prenom"
                      placeholder="Prénom du patient"
                      value={patient.prenom}
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      //required={true}
                      label="Date de naissance"
                      name="naissance"
                    >
                      <SingleDatePicker
                        placeholder="JJ/MM/AAAA"
                        hideKeyboardShortcutsPanel={true}
                        withPortal={true}
                        isOutsideRange={() => false}
                        date={
                          _.isNull(this.state.patient.naissance)
                            ? null
                            : this.state.naissanceDate
                        }
                        numberOfMonths={1}
                        readOnly={false}
                        onClose={() => {
                          this.setState({ naissanceFocused: false });
                        }}
                        onDateChange={naissanceDate => {
                          let saved = this.state.saved;
                          if (naissanceDate) {
                            patient.naissance = naissanceDate.format();
                            this.props.onChange(patient);
                          }
                          this.setState({ naissanceDate, saved });
                          //eq => this.setState({naissanceDate: naissanceDate, saved: saved});
                        }}
                        focused={this.state.naissanceFocused}
                        onFocusChange={() => {}}
                      />
                      <Button
                        icon="calendar"
                        onClick={() => {
                          this.setState({ naissanceFocused: true });
                        }}
                      />
                    </Form.Input>
                  </Form.Group>
                  <Form.Group inline>
                    <label>Genre</label>
                    <Form.Radio
                      label="F"
                      value={2}
                      checked={patient.genre === 2}
                      onChange={e => this.handleChangeGenre(2)}
                    />
                    <Form.Radio
                      label="M"
                      value={1}
                      checked={patient.genre === 1}
                      onChange={e => this.handleChangeGenre(1)}
                    />

                    <Form.Dropdown
                      label="Civilité"
                      placeholder="Votre civilité"
                      value={1 * patient.civilite}
                      selection={true}
                      multiple={false}
                      options={this.civilitesNouvelles}
                      onChange={(e, d) => this.handleChangeCivilite(e, d)}
                    />

                    <Form.Input
                      label="Autre"
                      name="civilite"
                      value={this.civilite(false)}
                      placeholder="Professeur..."
                      onChange={(e, d) => this.handleChangeCivilite(e, d)}
                    />

                    <Form.Input
                      label="N° de sécurité sociale"
                      name="nir"
                      value={this.state.patient.nir}
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                  </Form.Group>
                </Form>
              </Accordion.Content>

              <Accordion.Title
                active={this.state.activeIndex === 1}
                onClick={e => this.handleClickAccordion(e, 1)}
              >
                <Icon name="dropdown" />
                Adresse et contact
              </Accordion.Title>
              <Accordion.Content active={this.state.activeIndex === 1}>
                <Form>
                  <Form.Group widths="equal">
                    <Form.Input
                      label="Adresse (ligne 1)"
                      name="adresse1"
                      value={this.state.patient.adresse1}
                      placeholder="Adresse du patient"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="Adresse (ligne 2)"
                      name="adresse2"
                      value={this.state.patient.adresse2}
                      placeholder="Adresse du patient"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="Adresse (ligne 3)"
                      name="adresse3"
                      value={this.state.patient.adresse3}
                      placeholder="Adresse du patient"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                  </Form.Group>

                  <Form.Group widths="equal">
                    <Form.Input
                      label="Code postal"
                      name="codePostal"
                      error={
                        !codePostalRegex.test(this.state.patient.codePostal) &&
                        this.state.patient.codePostal !== ""
                      }
                      value={this.state.patient.codePostal}
                      placeholder="Code postal"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="Ville"
                      name="ville"
                      value={this.state.patient.ville}
                      placeholder="Ville"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="Pays"
                      name="pays"
                      value={this.state.patient.pays}
                      placeholder="Pays"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                  </Form.Group>

                  <Divider horizontal>Contact</Divider>

                  <Form.Group widths="equal">
                    <Form.Input
                      label="Téléphone mobile"
                      name="telMobile"
                      error={
                        !this.telephoneValide(this.state.patient.telMobile) &&
                        this.state.patient.telMobile !== ""
                      }
                      value={this.state.patient.telMobile}
                      placeholder="Téléphone mobile"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="Téléphone bureau"
                      name="telBureau"
                      error={
                        !this.telephoneValide(this.state.patient.telBureau) &&
                        this.state.patient.telBureau !== ""
                      }
                      value={this.state.patient.telBureau}
                      placeholder="Téléphone bureau"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="Téléphone domicile"
                      name="telDomicile"
                      error={
                        !this.telephoneValide(this.state.patient.telDomicile) &&
                        this.state.patient.telDomicile !== ""
                      }
                      value={this.state.patient.telDomicile}
                      placeholder="Téléphone domicile"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="E-mail"
                      name="email"
                      error={
                        !emailRegex.test(this.state.patient.email) &&
                        this.state.patient.email !== ""
                      }
                      value={this.state.patient.email}
                      placeholder="exemple@exemple.fr"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                  </Form.Group>
                </Form>
              </Accordion.Content>

              <Accordion.Title
                active={this.state.activeIndex === 2}
                onClick={e => this.handleClickAccordion(e, 2)}
              >
                <Icon name="dropdown" />
                Gestion des rendez-vous
              </Accordion.Title>
              <Accordion.Content active={this.state.activeIndex === 2}>
                {/*Coder la gestion des rdv ici*/}
                <Form>
                  <Form.Input label="Autorisation SMS">
                    <Checkbox
                      toggle={true}
                      checked={this.state.patient.gestionRdvJO.autoriseSMS}
                      onChange={(e, d) => this.changeAutoriseSMS(e, d)}
                    />
                  </Form.Input>

                  <Form.Group widths="equal">
                    <Form.Input label="Niveau d'autorisation">
                      <Dropdown
                        fluid={true}
                        selection={true}
                        multiple={false}
                        options={this.autorisations}
                        value={
                          this.state.patient.gestionRdvJO.reservation
                            .autorisation
                        }
                        onChange={(e, d) => this.changeAutorisation(e, d)}
                      />
                    </Form.Input>

                    <Form.Input
                      label="Mot de passe"
                      name="password"
                      type="password"
                      error={!this.verificationPassword()}
                      //error={this.state.patient.gestionRdvJO.reservation.password !== this.state.password}
                      value={
                        this.state.patient.gestionRdvJO.reservation.password
                      }
                      //value="" //Provisoirement
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />

                    <Form.Input
                      label="Confirmation mot de passe"
                      name="passwordConfirm"
                      type="password"
                      error={!this.verificationPassword()}
                      //error={this.state.patient.gestionRdvJO.reservation.password !== this.state.password}
                      value={this.state.patient.passwordConfirm}
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                  </Form.Group>

                  <Form.Group>
                    {/*<Form.Input label="Générer automatiquement un mot de passe">
                      <Button
                        onClick={() => {
                          let passwd = this.makePasswd();
                          this.setState({
                            newPassword: passwd,
                            modalPassword: true
                          });
                        }}
                      >
                        Générer
                      </Button>
                    </Form.Input>*/}
                    <Form.Input label="Liste rendez-vous à partir de la date d'aujourd'hui">
                      <RdvPassCard
                        idPatient={this.state.patient.id}
                        icon="calendar"
                        label="Rendez-vous"
                        client={this.props.client}
                        newPassword={password => {
                          let modifiedPatient = this.state.patient;
                          modifiedPatient.gestionRdvJO.reservation.password = password;
                          this.props.onChange(modifiedPatient);
                        }}
                      />
                    </Form.Input>
                  </Form.Group>

                  <Modal size="tiny" open={this.state.modalPassword}>
                    <Modal.Header>Infos</Modal.Header>
                    <Modal.Content>
                      <p>
                        id : #{this.state.patient.id} <br />
                        Mot de passe : {this.state.newPassword}
                      </p>
                    </Modal.Content>
                    <Modal.Actions>
                      <Button
                        negative={true}
                        onClick={() => this.setState({ modalPassword: false })}
                      >
                        Annuler
                      </Button>
                      <Button
                        positive={true}
                        onClick={() => {
                          let modifiedPatient = this.state.patient;
                          modifiedPatient.gestionRdvJO.reservation.password = this.state.newPassword;
                          modifiedPatient.passwordConfirm = this.state.newPassword;
                          this.props.onChange(modifiedPatient);
                          this.setState({
                            modalPassword: false
                          });
                        }}
                      >
                        Valider
                      </Button>
                      <Button
                        primary={true}
                        icon="print"
                        labelPosition="right"
                        content="Imprimer"
                        onClick={() => {
                          let modifiedPatient = this.state.patient;
                          modifiedPatient.gestionRdvJO.reservation.password = this.state.newPassword;
                          modifiedPatient.passwordConfirm = this.state.newPassword;
                          this.props.onChange(modifiedPatient);
                          this.props.print();
                          this.setState({
                            modalPassword: false
                          });
                        }}
                      />
                    </Modal.Actions>
                  </Modal>
                </Form>
              </Accordion.Content>

              <Accordion.Title
                active={this.state.activeIndex === 3}
                onClick={e => this.handleClickAccordion(e, 3)}
              >
                <Icon name="dropdown" />
                Informations médicales
              </Accordion.Title>
              <Accordion.Content active={this.state.activeIndex === 3}>
                {/*Coder les champs d'informations administratives ici*/}
              </Accordion.Content>

              <Accordion.Title
                active={this.state.activeIndex === 4}
                onClick={e => this.handleClickAccordion(e, 4)}
              >
                <Icon name="dropdown" />
                Informations administratives
              </Accordion.Title>
              <Accordion.Content active={this.state.activeIndex === 4}>
                {/*Infos administratives ici*/}
              </Accordion.Content>
            </Accordion>
          </div>
        )}
      </React.Fragment>
    );
  }
}
