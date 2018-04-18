import React from "react";

import _ from "lodash";

import {
  Header,
  Message,
  Divider,
  Button,
  Form,
  Segment,
  Icon,
  Grid
} from "semantic-ui-react";

import { hsize } from "./Settings";

export default class ProfilsPatients extends React.Component {
  render() {
    return (
      <React.Fragment>
        <Header size={hsize}>Patients</Header>
        <Divider hidden={true} />
      </React.Fragment>
    );
  }
}
