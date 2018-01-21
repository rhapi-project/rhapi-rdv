import React from 'react';

import { Button, Icon, Step, List, Divider, Dropdown, Header} from 'semantic-ui-react';

import _ from 'lodash'

import MesRdv from './MesRdv'

export default class PriseRdv extends React.Component {

    componentWillMount() {
        
        let patient = { };
        if (this.props.identified) {
            patient.ipp = this.props.patient.ipp;
            patient.password = this.props.patient.password;
        }
        else {
            if (!_.isUndefined(this.props.patient.nom)) patient.nom = this.props.patient.nom;
            if (!_.isUndefined(this.props.patient.prenom)) patient.prenom = this.props.patient.prenom;
            if (!_.isUndefined(this.props.patient.email)) patient.email = this.props.patient.email;
            if (!_.isUndefined(this.props.patient.telMobile)) patient.telMobile = this.props.patient.telMobile;
        }
        
        this.setState({ // default state
            patient: patient,
            plannings: [],
            motifs: [], 
            currentPlanningId: 0, 
            currentMotifId: 0,
            currentMotifIndex: null,
            currentMotifText: '',
            horairesDisponibles: [],
            horaireDisponibleNext: '',
            horaire: '',
            completed: false,
            voirMesRdv: false
        });
        
        
        this.props.client.Reservation.mesPlannings(
            patient,
            (result) => {
                this.setState({ plannings : result.results });
            },
            (datas) => {
                // erreur
                // TODO : Afficher le message en utilisant un Component semantic à la place de 'alert'
                console.log(datas);
                alert(datas.internalMessage + " : " + datas.userMessage); 
            }
        );
    }
    
    onPlanningChange = (e, d) => {
        const planning = this.state.plannings[d.value];
        if (planning.id !== this.state.currentPlanningId) {
            this.setState({ 
                motifs: planning.motifs, 
                currentMotifId: 0, 
                currentMotifIndex: null, 
                currentPlanningId: planning.id, 
                horairesDisponibles: [],
                horaireDisponibleNext: ''
            })
        }
    }
    
    onMotifChange = (e, d) => {
        let index = d.value;
        if (_.isNull(index)) {
            return;
        }
        let motif = this.state.motifs[index];
        let motifId = motif.id;
        if (motifId) {
            let params = this.state.patient;
            params.planning = this.state.currentPlanningId;
            params.motif = motifId;
            this.props.client.Reservation.readAll(
                params,
                (result) => {
                    this.setState({ horairesDisponibles : result.results });
                    this.setState({ horaireDisponibleNext : result.informations.next });
                },
                (datas) => {
                    // erreur
                    // TODO : Afficher le message en utilisant un Component semantic à la place de 'alert'
                    console.log(datas);
                    alert(datas.internalMessage + " : " + datas.userMessage); 
                }
            );
        }
        
        this.setState({ currentMotifId: motifId, currentMotifIndex: index });
    }
    
    createRdv = (e, d) => {
        let params = this.state.patient;
        params.planning = this.state.currentPlanningId;
        params.motif = this.state.currentMotifId;
        params.startAt = d.content;
        this.props.client.Reservation.create(
            params,
            (result) => {
                this.setState({ completed: true, horaire: d.content });
            },
            (datas) => {
                // erreur
                // TODO : Afficher le message en utilisant un Component semantic à la place de 'alert'
                console.log(datas);
                alert(datas.internalMessage + " : " + datas.userMessage); 
            }
        );
    }
    
    render() {
        
        if (this.state.voirMesRdv) {
            return (<MesRdv patient={ this.state.patient } identified={ true } client={ this.props.client } />)
        }
        
        return (
            <React.Fragment>
            <Header size='medium'>
                Prendre un rendez-vous
            </Header>
            <Step.Group vertical={ true }>
                <Step completed={ this.state.currentPlanningId !== 0 }>
                    <Icon name='calendar' />
                    <Step.Content>
                        <Step.Title>Planning</Step.Title>
                        <Step.Description>Je choisis le planning d'un praticien</Step.Description>
                        <Divider hidden={ true} />
                    </Step.Content>
                    <Dropdown 
                        onChange={ this.onPlanningChange }
                        placeholder="Je choisis le planning d'un praticien" 
                        fluid={ true } 
                        selection={ true } 
                        options={ 
                            _.map(this.state.plannings, (planning, i) => {
                                return ({
                                    text: planning.titre,
                                    value: i,
                                    image: { avatar: true, src: './images/praticien.png' }
                                });
                            })
                        }
                    />
                </Step>
                { 
                    this.state.motifs.length === 0 ? '' :
                    <Step completed={ this.state.currentMotifId !== 0 }>
                        <Icon name='info' />
                        <Step.Content>
                            <Step.Title>Motif du rendez-vous</Step.Title>
                            <Step.Description>Je précise le motif du RDV</Step.Description>
                            <Divider hidden={ true} />
                        </Step.Content>
                        <Dropdown
                            onChange={ this.onMotifChange }
                            placeholder='Je précise le motif du RDV' 
                            fluid={ true } 
                            selection={ true }
                            value= { this.state.currentMotifIndex }
                            options={ 
                                _.map(this.state.motifs, (motif, i) => {
                                    return ({
                                        text: motif.motif,
                                        value: i
                                    });
                                })
                            }
                        />
                    </Step>
                }
                { 
                    (this.state.currentMotifId === 0 || this.state.currentPlanningId === 0) ? '' :
                    <Step completed={ this.state.completed && this.props.identified } >
                        <Icon name={  this.state.completed && !this.props.identified ? 'mail outline' : 'add to calendar' } />
                        <Step.Content>
                            <Step.Title>
                            { 
                                this.state.completed ? 
                                'Mon RDV : ' + this.state.horaire : 
                                'Je choisis un horaire'
                            }
                            </Step.Title>
                            <Step.Description>
                            { 
                                this.state.completed ?
                                    this.props.identified ? 
                                    'Mon nouveau rendez-vous est bien enregistré' : 
                                    "Un mail de confirmation vient de m'être adressé pour valider définivement ce rendez-vous. " + 
                                    "Il me reste à ouvrir ce mail et à cliquer sur le lien proposé dans (un délai maximum de 5 mn)."
                                :
                                'Je choisis un horaire parmis ceux qui me sont proposés'
                            }
                            </Step.Description>
                            <Divider hidden={ true} />
                        </Step.Content>
                    </Step>
                }
                </Step.Group>
                {
                    this.state.completed ?
                    <React.Fragment> 
                    {
                        this.props.identified ?
                        <React.Fragment>
                        <Button
                            onClick={ () => this.setState({ voirMesRdv: true }) }
                            fluid={ true }
                            secondary= { true }
                        >
                            Voir mes rendez-vous
                        </Button>
                        <Divider hidden={ true }/>
                        </React.Fragment>
                        : 
                        ''
                    }
                    </React.Fragment>
                    :
                    <List 
                        divided={ true }
                        selection={ true }
                        items={ this.state.horairesDisponibles }
                        onItemClick= { this.createRdv }
                    />
                }
                <Button
                    onClick={ () => window.location.reload() }
                    fluid={ true }
                    secondary= { true }
                >
                    { this.state.completed ? 'Déconnexion' : 'Annuler cette prise de RDV' }
                </Button>
            </React.Fragment>
        )
    }
}