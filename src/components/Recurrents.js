import React from "react";
import { Accordion, Form, Divider, Checkbox } from "semantic-ui-react";
import _ from "lodash";

import ColorPicker from "./ColorPicker";

import HorairesSemaine from "./HorairesSemaine";

import { Periode } from "./Conges";

import moment from "moment";

export default class Recurrents extends React.Component {
  state = { index: -1 };

  supprimer = i => {
    this.props.recurrents.splice(i, 1);
    this.setState({ index: -1 });
    this.props.onChange();
  };

  ajouter = () => {
    this.props.recurrents.push({
      titre: "Nouvel évènement",
      couleur: "#000000",
      recurrence: 0,
      from: 0, // à compter de la semaine...
      step: 0, // une semaine sur...
      start: "", // tous les ans periode du start à end
      end: "",
      background: true,
      horaires: [[], [], [], [], [], [], []]
    });
    this.props.onChange();
  };

  render() {
    let semainesOptions = [];
    _.times(53, i =>
      semainesOptions.push({
        value: i + 1,
        text: "" + (i + 1)
      })
    );
    return (
      <React.Fragment>
        <Accordion>
          {_.map(this.props.recurrents, (recurrent, i) => {
            return (
              <React.Fragment key={i}>
                <Accordion.Title
                  active={this.state.index === i}
                  index={i}
                  onClick={(e, d) =>
                    this.setState({
                      index: this.state.index === d.index ? -1 : d.index
                    })
                  }
                  icon="dropdown"
                  content={recurrent.titre}
                />

                <Accordion.Content active={this.state.index === i}>
                  <Accordion.Content>
                    <Form.Group widths={4}>
                      <Form.Input
                        label="Titre"
                        placeholder="Titre de l'évènement"
                        value={recurrent.titre}
                        onChange={(e, d) => {
                          recurrent.titre = d.value;
                          this.props.onChange();
                        }}
                      />
                      <Form.Input label="Couleur">
                        <ColorPicker
                          color={recurrent.couleur}
                          onChange={color => {
                            recurrent.couleur = color;
                            this.props.onChange();
                          }}
                        />
                      </Form.Input>
                      <Form.Input label="Afficher en arrière plan">
                        <Checkbox
                          toggle={true}
                          checked={recurrent.background}
                          onChange={(e, d) => {
                            recurrent.background = d.checked;
                            this.props.onChange();
                          }}
                        />
                      </Form.Input>
                      <Form.Input label="&nbsp;">
                        <Form.Button
                          content="Supprimer cet évènement"
                          icon="minus"
                          onClick={() => {
                            this.supprimer(i);
                          }}
                        />
                      </Form.Input>
                    </Form.Group>
                    <Form.Group>
                      <Form.Select
                        label="Récurrence"
                        options={[
                          {
                            text: "Toutes les semaines",
                            value: 0
                          },
                          {
                            text: "Une semaine sur...",
                            value: 1
                          },
                          {
                            text: "Tous les ans durant la période...",
                            value: 2
                          }
                        ]}
                        value={recurrent.recurrence}
                        onChange={(e, d) => {
                          recurrent.recurrence = d.value;
                          this.props.onChange();
                        }}
                      />
                      {recurrent.recurrence === 1 ? (
                        <React.Fragment>
                          <Form.Select
                            label="&nbsp;"
                            scrolling={true}
                            options={semainesOptions}
                            value={recurrent.step}
                            onChange={(e, d) => {
                              recurrent.step = d.value;
                              this.props.onChange();
                            }}
                          />
                          <span>
                            <br />
                            <br />à partir de la semaine...
                          </span>
                          <Form.Select
                            label="&nbsp;"
                            scrolling={true}
                            options={semainesOptions}
                            value={recurrent.from}
                            onChange={(e, d) => {
                              recurrent.from = d.value;
                              this.props.onChange();
                            }}
                          />
                        </React.Fragment>
                      ) : recurrent.recurrence === 2 ? (
                        <Form.Input label="&nbsp;">
                          <Periode
                            initialStartDate={moment(
                              _.isEmpty(recurrent.start)
                                ? Date()
                                : recurrent.start
                            )}
                            initialEndDate={moment(
                              _.isEmpty(recurrent.end) ? Date() : recurrent.end
                            )}
                            clearFocus={this.state.clearFocus}
                            onPeriodeChange={(start, end) => {
                              recurrent.start = start;
                              recurrent.end = end;
                              this.props.onChange();
                            }}
                          />
                        </Form.Input>
                      ) : (
                        ""
                      )}
                    </Form.Group>
                    {recurrent.recurrence === 2 ? (
                      ""
                    ) : (
                      <HorairesSemaine
                        style={{ padding: "20px" }}
                        horaires={recurrent.horaires}
                        onHorairesChange={this.props.onChange}
                        allday={true}
                      />
                    )}
                  </Accordion.Content>
                </Accordion.Content>
              </React.Fragment>
            );
          })}
        </Accordion>
        <Divider hidden={true} />
        <Form.Button
          content="Ajouter un évènement"
          icon="add"
          onClick={() => {
            this.ajouter();
          }}
        />
      </React.Fragment>
    );
  }
}
