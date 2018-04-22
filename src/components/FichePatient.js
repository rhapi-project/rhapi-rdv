import React from "react";

import _ from "lodash";

import moment from "moment";

import {
  Accordion,
  Form,
  Divider,
  Message,
  Icon,
  Button,
  Grid
} from "semantic-ui-react";

import { SingleDatePicker } from "react-dates";

/**
 * A faire
 * Implémenter la gestion des rdv
 * Création d'une nouvelle fiche (avec le champ sécurité sociale)
 * Suppréssion d'une fiche
 * Vérification avant enregistrement (champs obligatoires)
 *
 * Ce qui est fait :
 * -> Modification et mise à jour des informations sur la fiche du patient
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

  componentWillMount() {
    this.setState({ activeIndex: 0 });
  }

  componentWillReceiveProps(next) {
    let patient = { ...next.patient };
    this.setState({
      patient: patient,
      saved: true,
      naissanceDate: moment(next.patient.naissance),
      naissanceFocused: false
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
    modifiedPatient[d.name] = d.value;
    this.props.onChange(modifiedPatient);
  };

  render() {
    //console.log(this.props.age)

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
                        {/*Photo*/}
                        <div style={{ textAlign: "center" }}>
                          {this.state.patient.idPhoto === 0 ? (
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
                            patient.nom +
                            "  " +
                            patient.prenom +
                            " - " +
                            (patient.genre === 2 ? "née" : "né") +
                            " le " +
                            _.split(this.props.age.naissanceSmall, " ")[0] +
                            " (" +
                            this.props.age.texte +
                            ")"}
                        </strong>
                        <Divider hidden={true} fitted={true} />

                        {"Création le " +
                          moment(this.props.patient.createdAt).format(
                            "dddd d MMMM YYYY à HH:mm"
                          )}
                        <Divider hidden={true} fitted={true} />
                        {"Dernière modification le " +
                          moment(this.props.patient.modifiedAt).format(
                            "dddd d MMMM YYYY à HH:mm"
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
                      required={true}
                      type="date"
                      label="Date de naissance"
                      name="naissance"
                    >
                      <SingleDatePicker
                        hideKeyboardShortcutsPanel={true}
                        withPortal={true}
                        isOutsideRange={() => false}
                        date={this.state.naissanceDate}
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
                      placeholder="Adresse du patient"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="Adresse (ligne 2)"
                      name="adresse2"
                      placeholder="Adresse du patient"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="Adresse (ligne 3)"
                      name="adresse3"
                      placeholder="Adresse du patient"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                  </Form.Group>

                  <Form.Group widths="equal">
                    <Form.Input
                      label="Code postal"
                      name="codePostal"
                      placeholder="Code postal"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="Ville"
                      name="ville"
                      placeholder="Ville"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="Pays"
                      name="pays"
                      placeholder="Pays"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                  </Form.Group>

                  <Divider horizontal>Contact</Divider>

                  <Form.Group widths="equal">
                    <Form.Input
                      label="Téléphone mobile"
                      name="telMobile"
                      placeholder="Téléphone mobile"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="Téléphone bureau"
                      name="telBureau"
                      placeholder="Téléphone bureau"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="Téléphone domicile"
                      name="telDomicile"
                      placeholder="Téléphone domicile"
                      onChange={(e, d) => this.handleChangeInput(e, d)}
                    />
                    <Form.Input
                      label="E-mail"
                      name="email"
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
