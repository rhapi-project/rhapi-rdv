import React from "react";

import _ from "lodash";

import moment from "moment";

import {
  Header,
  Segment,
  Accordion,
  Form,
  Divider,
  Message,
  Icon,
  Button,
  Grid
} from "semantic-ui-react";

import { hsize } from "./Settings";

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
  componentWillReceiveProps(next) {
    console.log(next.patient);
    let patient = {...next.patient};
    this.setState({
      patient: patient,
      activeIndex: 0,
      saved: true
    });
  }

  civilite = () =>  {
    if (this.state.patient.civilite === "0" ||
         this.state.patient.civilite === "" || 
         this.state.patient.civilite === "4" ||
         this.state.patient.civilite === "Autre") {
      return "";
    } else if (this.state.patient.civilite === "1") {
      return "Monsieur";
    } else if (this.state.patient.civilite === "2") {
      return "Madame";
    } else if (this.state.patient.civilite === "3") {
      return "Mademoiselle";
    } else {
      return this.state.patient.civilite;
    } 
  }

  handleClickAccordion = (e, i) => {
    if (this.state.activeIndex === i) {
      this.setState({ activeIndex: -1 });
    } else {
      this.setState({ activeIndex: i});
    }
  }

  handleChangeGenre = value => {
    let modifiedPatient = this.state.patient;
    modifiedPatient.genre = value;
    this.setState({
      patient: modifiedPatient,
      saved: false
    });
    //this.props.modification();
    console.log(this.state.patient.genre);
  }

  handleChangeCivilite = (e, d) => {
    let modifiedPatient = this.state.patient;
    modifiedPatient.civilite = d.value;
    this.setState({
      patient: modifiedPatient,
      saved: false
    });
    //this.props.modification();
  }

  handleChangeInput = (e, d) => {
    let modifiedPatient = this.state.patient;
    modifiedPatient[d.name] = d.value;
    this.setState({
      patient: modifiedPatient,
      saved: false
    });
  }

  annuler = () => {
    let patient={...this.props.patient};
    this.setState({
      patient: patient,
      activeIndex: 0,
      saved: true
    });
  }

  save = () => {
    this.props.save(this.state.patient);
    if (this.props.saved) {
      this.setState({
        saved: true
      });
    }
  }

  render() {

    //console.log(this.props.age)

    let nofiche = (_.isNull(this.state) ||
      _.isUndefined(this.state.patient) ||
      _.isUndefined(this.state.patient.id) || 
      this.state.patient.id < 1);

    const civiliteOptions = [
      {
        text: "Madame",
        value: "2"
      },
       {
        text: "Mademoiselle",
        value: "3"
      },
      {
        text: "Monsieur",
        value: "1"
      },
      {
        text: "Enfant",
        value: "4"
      }
    ];
    
    return (
      <React.Fragment>
        {
          (!nofiche && !this.state.saved)
            ? 
              <Message
                floating={true}
                negative={true}
                icon={true}>
                <Icon name="warning circle" color="red" size="big" />
                <Message.Content>
                  <Message.Header>
                    Des modifications ont été faites sur cette fiche
                  </Message.Header>
                  <p>
                    Pensez à faire une sauvegarde ou annulez les modifications !
                  </p>
                </Message.Content>
              </Message>
            : (!this.props.saved)
              ?
                <Message
                  floating={true}
                  negative={true}
                  icon={true}>
                  <Icon name="warning circle" color="red" size="big" />
                  <Message.Content>
                    <Message.Header>
                      La sauvegarde des modifications a échoué
                    </Message.Header>
                    <p>
                      Une erreur est survenue lors de la sauvegarde. Veuillez réessayer !
                    </p>
                  </Message.Content>
                </Message>
              : ""
        }
        <Header size={hsize}>Fiche du patient</Header>
        { nofiche 
          ? 
            <Message 
              compact={true}
              header="Pas de patient sélectionné"
              content="Consultez une fiche d'un patient ou créez en une nouvelle" />
          : 
          <Segment>
            <Accordion fluid={true} styled={true}>
              <Accordion.Title
                active={this.state.activeIndex === 0}
                onClick={(e) => this.handleClickAccordion(e, 0)}>
                <Icon name="dropdown" />
                Informations générales
              </Accordion.Title>
              <Accordion.Content active={this.state.activeIndex === 0}>
                <Form>

                  <Grid divided={true}>
                    <Grid.Row columns={3}>
                      <Grid.Column>
                        {/*Photo*/}
                        <div style={{ textAlign: "center" }}>
                          {
                            (this.state.patient.idPhoto === 0)
                              ? <Icon name="user" size="massive" />
                              : "" //Mettre la vraie photo du patient
                          }
                        </div>
                      </Grid.Column>
                      <Grid.Column>
                        <strong>{"#" + this.props.patient.id + " / " + this.props.patient.ipp2}</strong>
                        <Divider hidden={true} />
                        <Divider hidden={true} />
                        <span>{this.civilite() + "  " + this.state.patient.nom + "  " + this.state.patient.prenom}</span>
                        <Divider hidden={true} />
                        <span>
                          {
                            (this.state.patient.nir !== "")
                              ? "Sécurité sociale : " + this.state.patient.nir
                              : ""
                          }
                        </span>
                      </Grid.Column>
                      <Grid.Column>
                        <span /*style={{float: "right"}}*/>
                          {
                            "Fiche créée le " + moment(this.props.patient.createdAt).format("LLLL") + 
                            ",  modifiée le " + moment(this.props.patient.modifiedAt).format("LLLL")
                          }
                        </span>
                        <Divider hidden={true} />
                        <span /*style={{float: "right"}}*/>
                          {
                            ((this.state.patient.genre === 2) ? "née" : "né") + " le " +
                             _.split(this.props.age.naissanceSmall," ")[0] + "  -  " + this.props.age.texte
                          }
                        </span>
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
                      value={this.state.patient.nom}
                      onChange={(e, d) => this.handleChangeInput(e, d)} />
                    <Form.Input
                      required={true} 
                      label="Prénom"
                      name="prenom"
                      placeholder="Prénom du patient"
                      value={this.state.patient.prenom}
                      onChange={(e, d) => this.handleChangeInput(e, d)} />
                    <Form.Input
                      required={true}
                      type="date"
                      label="Date de naissance"
                      name="naissance"
                      placeholder="Date de naissance"
                      value={moment(this.state.patient.naissance).format('yyyy/MM/DD')} />
                  </Form.Group>
                  <Form.Group inline>
                    <label>Genre</label>
                    <Form.Radio
                      label="F"
                      value={2}
                      checked={this.state.patient.genre === 2}
                      onChange={(e) => this.handleChangeGenre(2)} />
                    <Form.Radio
                      label="M"
                      value={1}
                      checked={this.state.patient.genre === 1}
                      onChange={(e) => this.handleChangeGenre(1)} />

                    <Form.Dropdown
                      selection
                      label="Civilité"
                      placeholder="Votre civilité"
                      value={this.state.patient.civilite}
                      options={civiliteOptions} 
                      onChange={(e, d) => this.handleChangeCivilite(e, d)} />

                    <Form.Input
                      label="Autre"
                      name="civilite"
                      value={(this.civilite() === "" ||
                              this.civilite() === "Monsieur" ||
                              this.civilite() === "Madame" ||
                              this.civilite() === "Mademoiselle")
                                ? ""
                                : this.state.patient.civilite
                              }
                      placeholder="ex : Professeur..." 
                      onChange={(e, d) => this.handleChangeInput(e, d)} />

                  </Form.Group>

                  {/*<Form.Group widths="equal">

                    <Form.Dropdown
                      selection
                      label="Civilité"
                      placeholder="Votre civilité"
                      value={this.state.patient.civilite}
                      options={civiliteOptions} 
                      onChange={(e, d) => this.handleChangeCivilite(e, d)} />

                    <Form.Input
                      label="Autre"
                      name="civilite"
                      value={(this.civilite() === "" ||
                              this.civilite() === "Monsieur" ||
                              this.civilite() === "Madame" ||
                              this.civilite() === "Mademoiselle")
                                ? ""
                                : this.state.patient.civilite
                              }
                      placeholder="ex : Professeur..." 
                      onChange={(e, d) => this.handleChangeInput(e, d)} />


                    <Form.Input
                      label="Sécurité sociale"
                      name="nir"
                      disabled={(this.state.patient.nir !== "")}
                      onChange={(e, d) => this.handleChangeInput(e, d)} />
                  </Form.Group>*/}

                </Form>
              </Accordion.Content>

              <Accordion.Title
                active={this.state.activeIndex === 1}
                onClick={(e) => this.handleClickAccordion(e, 1)}>
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
                      onChange={(e, d) => this.handleChangeInput(e, d)} />
                    <Form.Input
                      label="Adresse (ligne 2)"
                      name="adresse2"
                      placeholder="Adresse du patient"
                      onChange={(e, d) => this.handleChangeInput(e, d)} />
                    <Form.Input
                      label="Adresse (ligne 3)"
                      name="adresse3"
                      placeholder="Adresse du patient"
                      onChange={(e, d) => this.handleChangeInput(e, d)} />
                  </Form.Group>

                  <Form.Group widths="equal">
                    <Form.Input
                      label="Code postal"
                      name="codePostal"
                      placeholder="Code postal"
                      onChange={(e, d) => this.handleChangeInput(e, d)} />
                    <Form.Input
                      label="Ville"
                      name="ville"
                      placeholder="Ville"
                      onChange={(e, d) => this.handleChangeInput(e, d)} />
                    <Form.Input
                      label="Pays"
                      name="pays"
                      placeholder="Pays"
                      onChange={(e, d) => this.handleChangeInput(e, d)} />
                  </Form.Group>

                  <Divider hidden={true} />

                  <Divider horizontal>Contact</Divider>

                  <Form.Group widths="equal">
                    <Form.Input
                      label="Téléphone mobile"
                      name="telMobile"
                      placeholder="Téléphone mobile"
                      onChange={(e, d) => this.handleChangeInput(e, d)} />
                    <Form.Input 
                      label="Téléphone bureau"
                      name="telBureau"
                      placeholder="Téléphone bureau"
                      onChange={(e, d) => this.handleChangeInput(e, d)} />
                    <Form.Input 
                      label="Téléphone domicile"
                      name="telDomicile"
                      placeholder="Téléphone domicile"
                      onChange={(e, d) => this.handleChangeInput(e, d)} />
                    <Form.Input 
                      label="E-mail"
                      name="email"
                      placeholder="exemple@exemple.fr"
                      onChange={(e, d) => this.handleChangeInput(e, d)} />
                  </Form.Group>

                  <Divider hidden={true} />
                </Form>
              </Accordion.Content>

              <Accordion.Title
                active={this.state.activeIndex === 2}
                onClick={(e) => this.handleClickAccordion(e, 2)}>
                <Icon name="dropdown" />
                Gestion des rendez-vous
              </Accordion.Title>
              <Accordion.Content active={this.state.activeIndex === 2}>
                {/*Coder la gestion des rdv ici*/}
              </Accordion.Content>

              <Accordion.Title
                active={this.state.activeIndex === 3}
                onClick={(e) => this.handleClickAccordion(e, 3)}>
                <Icon name="dropdown" />
                Informations médicales
              </Accordion.Title>
              <Accordion.Content active={this.state.activeIndex === 3}>
                {/*Coder les champs d'informations administratives ici*/}
              </Accordion.Content>

              <Accordion.Title
                active={this.state.activeIndex === 4}
                onClick={(e) => this.handleClickAccordion(e, 4)}>
                <Icon name="dropdown" />
                Informations administratives
              </Accordion.Title>
              <Accordion.Content active={this.state.activeIndex === 4}>
                {/*Infos administratives ici*/}
              </Accordion.Content>
            </Accordion>
          </Segment>
        }

        <Divider hidden={true} />

        <Button
          color={(!nofiche) ? "red" : ""}>Supprimer la fiche</Button>
        <Button>Créer une nouvelle fiche</Button>
        <Button
          onClick={this.annuler}>Annuler/Actualiser</Button>
        <Button
          color={(!nofiche && !this.state.saved)
                  ? "blue"
                  : ""
                }
          onClick={this.save}>Sauvegarder les modifications</Button>

      </React.Fragment>
    );
  }
} 