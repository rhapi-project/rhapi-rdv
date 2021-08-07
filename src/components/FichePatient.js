import React from "react";

import _ from "lodash";

import moment from "moment";

import {
  Accordion,
  Form,
  Checkbox,
  Divider,
  Dropdown,
  Image,
  Message,
  Popup,
  Icon,
  Button,
  Grid
} from "semantic-ui-react";

import {
  codePostalRegex,
  emailRegex,
  telRegex,
  telFormat,
  civilite,
  camelDenomination,
  helpPopup,
  denominationDefaultFormat,
  affichageDenomination
} from "./Settings";

import ImageReader from "./ImageReader";

import RdvPassCard from "./RdvPassCard";

import DayPickerInput from "react-day-picker/DayPickerInput";
import MomentLocaleUtils, {
  formatDate,
  parseDate
} from "react-day-picker/moment";
import "react-day-picker/lib/style.css";

export default class FichePatient extends React.Component {
  /*civilites = [
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
  ];*/

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

  state = {
    activeIndex: 0,
    rdvPassCard: false,
    patient: {},
    saved: true,
    naissanceDate: null,
    modalPassword: false,
    newPassword: ""
  };

  static getDerivedStateFromProps(props, state) {
    if (props.patient !== state.patient) {
      return {
        patient: Object.assign({}, props.patient),
        saved: true,
        naissanceDate: moment(props.patient.naissance),
        modalPassword: false,
        newPassword: ""
      };
    }
    return null;
  }

  telephoneValide = numero => {
    for (let i = 0; i < telRegex.length; i++) {
      if (telRegex[i].test(numero)) {
        return true;
      }
    }
    return false;
  };

  conversionDenominationFormat = (champ, value) => {
    if (champ !== "nom" && champ !== "prenom") {
      return value;
    } else {
      switch (denominationDefaultFormat) {
        case "NP":
          return _.toUpper(value);
        case "Np":
          return champ === "nom" ? _.toUpper(value) : camelDenomination(value);
        case "PN":
          return _.toUpper(value);
        case "pN":
          return champ === "nom" ? _.toUpper(value) : camelDenomination(value);
        case "np":
          return camelDenomination(value);
        case "pn":
          return camelDenomination(value);
        default:
          return value;
      }
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
    //console.log(d.value);
    let modifiedPatient = this.state.patient;
    modifiedPatient.civilite = d.value;
    this.props.onChange(modifiedPatient);
  };

  handleChangeInput = (e, d) => {
    let modifiedPatient = this.state.patient;
    modifiedPatient[d.name] = this.conversionDenominationFormat(
      d.name,
      d.value
    );
    this.props.onChange(modifiedPatient);
  };

  changeAutorisation = (e, d) => {
    let modifiedPatient = this.state.patient;
    modifiedPatient.gestionRdvJO.reservation.autorisation = d.value;
    this.props.onChange(modifiedPatient);
  };

  changeAutoriseSMS = (e, d) => {
    let modifiedPatient = this.state.patient;
    modifiedPatient.gestionRdvJO.autoriseSMS = d.checked;
    this.props.onChange(modifiedPatient);
  };

  onImageChange = image => {
    let modifiedPatient = this.state.patient;
    modifiedPatient.profilJO.base64 = image;
    this.props.onChange(modifiedPatient);
  };

  rdvPassCardOpen = bool => {
    this.setState({ rdvPassCard: bool });
  };

  render() {
    let nofiche =
      _.isNull(this.state) ||
      _.isUndefined(this.state.patient) ||
      _.isUndefined(this.state.patient.id) ||
      this.state.patient.id < 1;

    let patient = {};
    if (!nofiche) {
      patient = this.state.patient;
    }

    return (
      <React.Fragment>
        {nofiche ? (
          <Message
            header="Aucun patient n'est actuellement sélectionné."
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
                        <Grid column="equal">
                          <Grid.Column />
                          <Grid.Column
                            width={12}
                            style={{ textAlign: "center" }}
                          >
                            {_.isEmpty(patient.profilJO.base64) ? (
                              <Icon name="user" size="massive" />
                            ) : (
                              <Image
                                src={patient.profilJO.base64}
                                centered={true}
                              />
                            )}
                            <Divider hidden={true} />
                            <ImageReader
                              image={
                                _.isEmpty(patient.profilJO.base64)
                                  ? ""
                                  : patient.profilJO.base64
                              }
                              content="Modifier"
                              icon="photo"
                              onImageChange={image => this.onImageChange(image)}
                            />
                          </Grid.Column>
                          <Grid.Column />
                        </Grid>
                      </Grid.Column>
                      <Grid.Column width={12}>
                        <strong>
                          {"#" +
                            this.props.patient.id +
                            " / " +
                            this.props.patient.ipp2 +
                            " / " +
                            (_.isUndefined(this.state.patient.civilite)
                              ? ""
                              : civilite(true, this.state.patient.civilite)) +
                            //this.civilite(true) +
                            "  " +
                            affichageDenomination(
                              denominationDefaultFormat,
                              this.state.patient.nom,
                              this.state.patient.prenom
                            ) +
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
                    <Form.Input label="Date de naissance" name="naissance">
                      <DayPickerInput
                        dayPickerProps={{
                          locale: "fr",
                          localeUtils: MomentLocaleUtils,
                          showOutsideDays: true
                        }}
                        format="L"
                        formatDate={formatDate}
                        parseDate={parseDate}
                        placeholder="JJ/MM/AAAA"
                        value={this.state.naissanceDate.toDate()}
                        onDayChange={day => {
                          let saved = this.state.saved;
                          if (day) {
                            patient.naissance = moment(day).format();
                            this.props.onChange(patient);
                          }
                          this.setState({
                            naissanceDate: moment(day),
                            saved: saved
                          });
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
                      value={civilite(false, this.state.patient.civilite)}
                      placeholder="Professeur..."
                      onChange={(e, d) => this.handleChangeCivilite(e, d)}
                    />

                    <Form.Input
                      label="N° de sécurité sociale"
                      name="nir"
                      value={patient.nir}
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
                      value={patient.adresse1}
                      placeholder="Adresse du patient"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="Adresse (ligne 2)"
                      name="adresse2"
                      value={patient.adresse2}
                      placeholder="Adresse du patient"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="Adresse (ligne 3)"
                      name="adresse3"
                      value={patient.adresse3}
                      placeholder="Adresse du patient"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                  </Form.Group>

                  <Form.Group widths="equal">
                    <Form.Input
                      label="Code postal"
                      name="codePostal"
                      error={
                        !codePostalRegex.test(patient.codePostal) &&
                        patient.codePostal !== ""
                      }
                      value={patient.codePostal}
                      placeholder="Code postal"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="Ville"
                      name="ville"
                      value={patient.ville}
                      placeholder="Ville"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="Pays"
                      name="pays"
                      value={patient.pays}
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
                        !this.telephoneValide(patient.telMobile) &&
                        patient.telMobile !== ""
                      }
                      value={telFormat(patient.telMobile)}
                      placeholder="Téléphone mobile"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="Téléphone bureau"
                      name="telBureau"
                      error={
                        !this.telephoneValide(patient.telBureau) &&
                        patient.telBureau !== ""
                      }
                      value={telFormat(patient.telBureau)}
                      placeholder="Téléphone bureau"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="Téléphone domicile"
                      name="telDomicile"
                      error={
                        !this.telephoneValide(patient.telDomicile) &&
                        patient.telDomicile !== ""
                      }
                      value={telFormat(patient.telDomicile)}
                      placeholder="Téléphone domicile"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="E-Mail"
                      name="email"
                      error={
                        !emailRegex.test(patient.email) && patient.email !== ""
                      }
                      value={patient.email}
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
                <Form>
                  <Form.Group widths="equal">
                    <Form.Input label="Autorisation SMS">
                      <Popup
                        trigger={
                          <Checkbox
                            toggle={true}
                            checked={patient.gestionRdvJO.autoriseSMS}
                            onChange={(e, d) => this.changeAutoriseSMS(e, d)}
                          />
                        }
                        content="Autoriser la réception de SMS pour ce patient"
                        position="bottom left"
                        on={helpPopup.on}
                        size={helpPopup.size}
                        inverted={helpPopup.inverted}
                      />
                    </Form.Input>

                    <Form.Input label="Niveau d'autorisation">
                      <Dropdown
                        fluid={true}
                        selection={true}
                        multiple={false}
                        options={this.autorisations}
                        value={patient.gestionRdvJO.reservation.autorisation}
                        onChange={(e, d) => this.changeAutorisation(e, d)}
                      />
                    </Form.Input>

                    <Form.Input label="Rendez-vous / Mot de passe">
                      <RdvPassCard
                        open={this.state.rdvPassCard}
                        rdvPassCardOpen={this.rdvPassCardOpen}
                        patient={this.state.patient}
                        denomination={
                          civilite(true, this.state.patient.civilite) +
                          " " +
                          affichageDenomination(
                            denominationDefaultFormat,
                            this.state.patient.nom,
                            this.state.patient.prenom
                          )
                        }
                        client={this.props.client}
                        saved={this.props.saved}
                        save={this.props.save}
                        patientReload={this.props.onPatientChange}
                      />
                      <Button
                        icon="list layout"
                        content="Rendez-vous"
                        onClick={() => this.rdvPassCardOpen(true)}
                      />
                    </Form.Input>
                  </Form.Group>
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
