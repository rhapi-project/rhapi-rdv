import React from "react";

//import _ from "lodash";

import {
  Header,
  Message,
  Divider,
  Button,
  Segment,
  Icon,
  Grid
} from "semantic-ui-react";

import { hsize } from "./Settings";

import { PatientSearch } from "./CalendarModalRdv";

import FichePatient from "./FichePatient";

/**
 * Bouton "Nouvelle recherche"
 * Il faut que ça puisse vider le Search
*/

export default class ProfilsPatients extends React.Component {
  componentWillMount() {
    this.setState({
      npatients: 0,
      praticien: "",
      patient: {},
      age: {},
      saved: true
      });
    this.reload();
  }


  reload = () => {
    //Pour récupérer le nombre de patients et le nom du praticien
    this.props.client.Patients.readAll(
      {limit: 1},
      result => {
        this.setState({
          npatients: result.informations.totalSize
        })
      },
      data => {
        console.log("Erreur lecture des patients");
        console.log(data);
      }
    );

    this.props.client.MonCompte.read(
      monProfil => {
        this.setState({
          praticien: monProfil.currentName  
        })
      },
      data => {
        console.log("Erreur lecture des informations sur le praticien");
        console.log(data);
      }
    )
  }

  onPatientChange = (id, texte) => {    
    console.log(id);
    this.props.client.Patients.read(
      id,
      {},
      patient => { //success
        console.log(patient);
        this.setState({ patient: patient });
      },
      data => { //Error
        console.log("Erreur");
        console.log(data);
      }
    );
    this.props.client.Patients.age(
      id,
      {},
      result => { // success
        console.log(result);
        this.setState({ age: result });
      },
      data => { // error
        console.log("Erreur");
      }
    )
  }

  newSearch = () => {
    // A revoir
    this.setState({
      patient: {}
    });
  }

  onChange = modifiedPatient => {
    this.setState({
      patient: modifiedPatient
    });
  }

  save = modifiedPatient => {

    this.props.client.Patients.update(
      modifiedPatient.id,
      modifiedPatient,
      patient => { // success
        this.setState({
          patient: patient,
          saved: true
        });
      },
      () => { // error
        this.setState({
          patient: modifiedPatient,
          saved: false
        });
        console.log("Erreur de sauvegarde");
      }
    );
  }


  render() {   
    //console.log(this.state);
    console.log(this.state.patient.civilite);
    return (
      <React.Fragment>
        <Header size={hsize}>Patients</Header>
        <Divider hidden={true} />
        <Segment>
          <Message floating icon={true}>
            <Icon name="doctor" size="big" />
            <Message.Content>
              <Message.Header>
                {this.state.praticien}
              </Message.Header>
              <p>
                Nombre de patients : {this.state.npatients}
              </p>
            </Message.Content>
          </Message>

          <Grid>
            <Grid.Row columns={6}>
              <Grid.Column>
                <PatientSearch
                  client={this.props.client}
                  patientChange={this.onPatientChange}
                  format= "NP" //TODO récupérer le format en configuration
                  />
              </Grid.Column>
              <Grid.Column>
                <Button
                  fluid={true}
                  onClick={this.newSearch}>Nouvelle Recherche</Button>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Segment>
        
        <Divider hidden={true} />

        <FichePatient
          patient={this.state.patient}
          age={this.state.age}
          save={this.save}
          saved={this.state.saved} />
            
      </React.Fragment>
    );
  }
}
