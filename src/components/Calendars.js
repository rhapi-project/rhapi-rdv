import _ from "lodash";

import React from "react";

import { Dropdown, Grid } from "semantic-ui-react";

import Calendar from "./Calendar";

import CalendarPanel from "./CalendarPanel";

import "react-dates/lib/css/_datepicker.css";
import "react-dates/initialize";

export default class Calendars extends React.Component {
  componentWillMount() {
    this.setState({ plannings: [], index: -1 });
    this.reload();
  }

  reload = () => {
    this.props.client.Plannings.mesPlannings(
      {},
      result => {
        let index = result.results.length > 0 ? 0 : -1;
        this.setState({ plannings: result.results, index: index });
      },
      datas => {
        console.log(datas);
      }
    );
  };

  onPlanningChange = (e, d) => {
    this.setState({ index: d.value });
  };

  render() {
    return (
      <React.Fragment>
        <Grid divided="vertically">
          <Grid.Row columns={2}>
            <Grid.Column width={3} style={{ maxWidth: 340 }}>
              <Dropdown
                value={this.state.index}
                onChange={this.onPlanningChange}
                placeholder="Choisir le(s) planning(s) à afficher"
                fluid={false}
                selection={true}
                multiple={false}
                options={_.map(this.state.plannings, (planning, i) => {
                  return {
                    text: planning.titre,
                    value: i
                  };
                })}
              />
              <CalendarPanel
                client={this.props.client}
                couleur={
                  this.state.index < 0
                    ? ""
                    : this.state.plannings[this.state.index].couleur
                }
                planning={
                  this.state.index < 0
                    ? "0"
                    : this.state.plannings[this.state.index].id
                }
                handleExternalRefetch={externalRefetch =>
                  this.setState({ externalRefetch: externalRefetch })
                }
              />
            </Grid.Column>
            <Grid.Column width={13}>
              {this.state.index < 0 ? (
                ""
              ) : (
                <Calendar
                  client={this.props.client}
                  couleur={
                    this.state.index < 0
                      ? ""
                      : this.state.plannings[this.state.index].couleur
                  }
                  options={
                    this.state.index < 0
                      ? {}
                      : this.state.plannings[this.state.index].optionsJO
                  }
                  planning={
                    this.state.index < 0
                      ? "0"
                      : this.state.plannings[this.state.index].id
                  }
                  externalRefetch={this.state.externalRefetch}
                />
              )}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </React.Fragment>
    );
  }
}
