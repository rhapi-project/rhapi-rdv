
//React
import React from 'react';
import {render} from 'react-dom';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';

import { Header } from 'semantic-ui-react'

//CSS
import './css/index.css';
import '../node_modules/semantic-ui-css/semantic.min.css';

//Components
import App from './components/App';
import NotFound from './components/Notfound';
import Patients from './components/Patients';


render((
    <React.Fragment>
    <Header size='large'>RHAPI RDV</Header>
    <Router>
        <Switch>
            <Route exact={ true } path="/" component={App}/>
            <Route path="/Patients/" component={Patients}/>
            <Route component={NotFound} />
        </Switch>
    </Router>
    </React.Fragment>
),document.getElementById('root'));
