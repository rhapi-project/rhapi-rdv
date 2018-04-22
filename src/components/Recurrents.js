import React from "react";
import { Accordion, Form, Divider, Checkbox } from "semantic-ui-react";
import _ from "lodash";

import ColorPicker from "./ColorPicker";

import HorairesSemaine from "./HorairesSemaine";

export default class Recurrents extends React.Component {
  componentWillMount() {
    this.setState({ index: -1 });
  }

  componentWillReceiveProps(next) {
    this.setState({});
  }

  supprimer = i => {
    this.props.recurrents.splice(i, 1);
    this.setState({ index: -1 });
    this.props.onChange();
  };

  ajouter = () => {
    this.props.recurrents.push({
      titre: "Nouvel évènement",
      couleur: "#000000",
      start: "",
      end: "",
      recurrence: 0,
      background: true,
      horaires: [[], [], [], [], [], [], []]
    });
    this.props.onChange();
  };

  render() {
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
                    <HorairesSemaine
                      style={{ padding: "20px" }}
                      horaires={recurrent.horaires}
                      onHorairesChange={this.props.onChange}
                      allday={true}
                    />
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
