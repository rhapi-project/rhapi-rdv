import React from "react";

import {
  Button,
  Icon,
  Step,
  List,
  Divider,
  Dropdown,
  Header
} from "semantic-ui-react";

import _ from "lodash";


// Cet Component doit pouvoir être partagé entre MesRdv et PriseRdv => une prop/callback 'validation'
export default class HorairesDisponibles extends React.Component {

  componentWillMount() {
    this.setState({ jours: [], joursIndex: -1, motifId: this.props.motifId })
  }
  
  componentWillUpdate() {
    if (this.props.motifId != this.state.motifId) {
      this.setState({ jours: [], joursIndex: -1, motifId: this.props.motifId })
      this.loadNext();
    }
  }
  
  loadNext = () => {
    console.log(this.props.motifId);
    if (this.props.motifId > 0) {
      let params = this.props.patient;
      let index = this.state.joursIndex;
      if (index >= 0) {
        params.from = this.state.jours[index].informations.next;
      }
      params.planning = this.props.planningId;
      params.motif = this.props.motifId;
      this.props.client.Reservation.readAll(
        params,
        result => {
          let jours = this.state.jours;
          jours.push(result);
          let index = jours.length - 1;
          this.setState({ jours: jours, joursIndex: index});
        },
        datas => {
          // erreur
          // TODO : Afficher le message en utilisant un Component semantic à la place de 'alert'
          console.log(datas);
          alert(datas.internalMessage + " : " + datas.userMessage);
        }
      );
    }
  }
  
  first = () => {
    
  }
  
  next = () => {
    let index = this.state.joursIndex;
    if ( index <  this.state.jours.length - 1) {
      this.setState({joursIndex: index + 1});
    }
    else {
      this.loadNext();
    }
    
  }
  
  prev = () => {
    let index = this.state.joursIndex;
    if ( index >  0) {
      this.setState({joursIndex: index - 1});
    }
  }
  
  more = () => {
    
  }
  
  validation = (e, d) => {
    // TODO modal de confirmation
    this.props.validation(d.value);
  }

  render() {
    const horaires = this.state.joursIndex < 0 ? [] : this.state.jours[this.state.joursIndex].results;
    const messageDuJour = this.state.joursIndex < 0 ? '' : this.state.jours[this.state.joursIndex].informations.message;
    return (
      <React.Fragment>
        <Button.Group>
        <Button labelPosition='left' icon='left chevron' onClick={this.prev}/>
        <Button content={messageDuJour} />
        <Button labelPosition='right' icon='right chevron' onClick={this.next}/>
        </Button.Group>
        <List
          divided={true}
          selection={true}
          items={_.map(horaires, (horaire) => {return { header: horaire.split('T')[1].substr(0,5), value: horaire }})}
          onItemClick={ (e, d) => this.validation(e, d) }
        >
        </List>
        <Button
          onClick={() => this.more()}
          fluid={true}
          secondary={true}
        >
          Plus d'horaires
        </Button>
        <Divider hidden={true} />
      </React.Fragment>
    );
  }
}
