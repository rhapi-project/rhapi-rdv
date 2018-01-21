
import React from 'react';

import { Checkbox, Button, Form, Grid, Header, Segment, Divider } from 'semantic-ui-react'

import _ from 'lodash'

import queryString from 'query-string'; // add to package
import { Client } from 'rhapi-client';

import PriseRdv from './PriseRdv'
import MesRdv from './MesRdv'

var client = new Client(
    (datas, response) => {
        // TODO gestion globale des erreurs
        //console.log(datas);
        //if (datas.networkError === 401) { // eq response.statusCode === 401
        //    window.location.reload(); 
        //}
    }
);

export default class Patients extends React.Component {
    
    componentWillMount() {
        // ipp, nom, prenom, email, telMobile peuvent être passé en paramètre de l'url
        const params = queryString.parse(window.location.search);
        this.setState(
            {
                gestionRDV: false,
                identified: !(_.isUndefined(params.ipp) || _.isNull(params.ipp)),
                patient : params
            }
        );
    }
    
    componentDidMount() {
        client.authorize(
            //   auth url                     app token                username         password
            "https://auth-dev.rhapi.net", "bXlhcHA6bXlhcHBteWFwcA", "masteragenda", "masteragenda",
            () => { // success
                console.log("client ok");
            },
            (datas, response) => {
                console.log("erreur auth client");
            }
        );    
    }
    
    handleChange = (e, d) => {
        const patient = this.state.patient; 
        patient[d.name] = d.value;
        this.setState({ patient: patient });
    }
    
    gestionRDV = () => {
        let patient = this.state.patient;
        if (this.state.identified) {
            patient = _.omit(patient, ['nom', 'prenom', 'email', 'telMobile', 'password']);
        }
        else {
            patient = _.omit(patient, ['ipp', 'ipp2', 'password']);
        }
        
        // https://developer.mozilla.org/en-US/docs/Web/API/History_API
        //
        var stateObj = { '/': 'Patients' };
        window.history.pushState(stateObj, 'unused', '?' + queryString.stringify(patient));
        const loc = window.location.href;
        window.onpopstate = () => {
            window.location.href=loc;
        }
        
        this.setState( { gestionRDV: true });
    }
    
    render() {
        return (
            <React.Fragment>
            <Header size='medium'>Patients</Header>
            <Grid textAlign='center'>
            <Grid.Column style={{ maxWidth: 500 }}>
            {
                this.state.gestionRDV ?
                    this.state.identified ?
                    <MesRdv patient={ this.state.patient } identified={ true } client={ client } />
                    :
                    <PriseRdv patient={ this.state.patient } identified={ false } client={ client } />
                :
                <React.Fragment>
                    <Header size='medium'>
                    Je m'identifie pour accéder au service
                    </Header>
                    <Form onSubmit={ this.gestionRDV }  size='large'>
                        <Segment stacked={ true }>
                        <Checkbox 
                            label="Je dispose d'un identifiant personnel"
                            toggle={ true } 
                            checked={ this.state.identified } 
                            onChange={ (e, d) => { this.setState({ identified: d.checked }) } }
                        />
                        <Divider hidden={ true }/>
                        { 
                        this.state.identified ?
                        <React.Fragment>
                            <Form.Input
                                name='ipp'
                                fluid={ true }
                                icon='user'
                                iconPosition='left'
                                placeholder='Identifiant'
                                value={ _.isUndefined(this.state.patient.ipp) ? '' : this.state.patient.ipp }
                                required={ true }
                                type='text'
                                onChange={this.handleChange} 
                            />
                            <Form.Input
                                name='password'
                                fluid={ true }
                                icon='lock'
                                iconPosition='left'
                                placeholder='Mot de passe'
                                value={ _.isUndefined(this.state.patient.password) ? '' : this.state.patient.password }
                                type='password'
                                required={true}
                                onChange={this.handleChange} 
                            />
                        </React.Fragment>
                        :
                        <React.Fragment>
                            <Form.Input
                                name='nom'
                                fluid={ true }
                                icon='user'
                                iconPosition='left'
                                placeholder='Nom'
                                value={ _.isUndefined(this.state.patient.nom) ? '' : this.state.patient.nom }
                                type='text'
                                onChange={this.handleChange} 
                            />
                            <Form.Input
                                name='prenom'
                                fluid={ true }
                                icon='user'
                                iconPosition='left'
                                placeholder='Prénom'
                                value={ _.isUndefined(this.state.patient.prenom) ? '' : this.state.patient.prenom }
                                type='text'
                                onChange={this.handleChange} 
                            />
                            <Form.Input
                                name='email'
                                fluid={ true }
                                icon='mail'
                                iconPosition='left'
                                placeholder='Email'
                                value={ _.isUndefined(this.state.patient.email) ? '' : this.state.patient.email }
                                type='email'
                                required={true}
                                onChange={this.handleChange} 
                            />
                            <Form.Input
                                name='telMobile'
                                fluid={true}
                                icon='mobile'
                                iconPosition='left'
                                placeholder='Téléphone mobile'
                                value={ _.isUndefined(this.state.patient.telMobile) ? '' : this.state.patient.telMobile }
                                type='text'
                                onChange={this.handleChange} 
                            />
                        </React.Fragment> 
                        }
                        <Divider hidden={ true }/>
                        <Button 
                            type='submit' 
                            secondary={ true } 
                            fluid={ true } 
                        >
                            {  this.state.identified ? 'Gérer mes RDV' : 'Prendre un RDV' }
                        </Button>
                        </Segment>
                    </Form>
                </React.Fragment>     
            }
            </Grid.Column>
            </Grid>
            </React.Fragment>
        );
  }
}