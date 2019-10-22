import React from "react";

import {
  Button,
  Form,
  Grid,
  Icon,
  Image,
  Message,
  Modal,
  Ref
} from "semantic-ui-react";

import _ from "lodash";

export default class ImageReader extends React.Component {
  state = {
    open: false,
    errorPhoto: false,
    image: null,
    photoPreview: false
  };

  componentDidMount() {
    this.setState({ image: this.props.image });
  }

  static getDerivedStateFromProps(props, state) {
    if (props.image !== state.image) {
      return { image: props.image };
    }
    return null;
  }

  base64Photo = (e, d) => {
    let filesSelected = document.getElementById(d.id).files;
    //console.log(filesSelected);
    if (
      !(
        filesSelected[0].type === "image/png" ||
        filesSelected[0].type === "image/jpeg"
      )
    ) {
      this.setState({
        errorPhoto: true // format incorrect
      });
      return;
    }

    if (filesSelected.length > 0) {
      let fileToLoad = filesSelected[0];
      //console.log(fileToLoad);
      let fileReader = new FileReader();

      fileReader.onload = fileLoadedEvent => {
        let srcData = fileLoadedEvent.target.result;
        // srcData -> base64

        let newImage = document.createElement("img");
        newImage.src = srcData;

        /*console.log(newImage.width + " - " + newImage.height);

        if (newImage.height === 0 || newImage.height > 128) {
          //newImage.height = 128;
          this.setState({ height: 128 });
        } else {
          this.setState({ height: newImage.height });
        }

        if (newImage.width === 0 || newImage.width > 128) {
          //newImage.width = 128;
          this.setState({ width: 128 });
        } else {
          this.setState({ width: newImage.widths });
        }*/

        this.setState({
          image: srcData,
          errorPhoto: false,
          photoPreview: true
        });

        document.getElementById("photoPreview").innerHTML = newImage.outerHTML;
      };
      fileReader.readAsDataURL(fileToLoad);
    }
  };

  render() {
    return (
      <React.Fragment>
        {/* Modal Photo de profil*/}
        <Modal
          size="mini"
          open={this.state.open}
          closeIcon={true}
          onClose={() => this.setState({ open: false })}
        >
          <Modal.Header>Photo de profil</Modal.Header>
          <Modal.Content>
            <Grid columns="equal" style={{ marginBottom: "7px" }}>
              <Grid.Column />
              <Grid.Column width={12} style={{ textAlign: "center" }}>
                {_.isEmpty(this.state.image) ? (
                  <Icon name="user" size="massive" />
                ) : (
                  <Image src={this.state.image} centered={true} />
                )}
              </Grid.Column>
              <Grid.Column />
            </Grid>

            <Form>
              <Form.Input
                id="photo"
                type="file"
                onChange={(e, d) => this.base64Photo(e, d)}
              />
            </Form>
            {this.state.errorPhoto ? (
              <Message warning={true}>
                <Message.Header>Erreur de format</Message.Header>
                <Message.Content>
                  <p>
                    Une erreur s'est produite lors du chargement de la photo de
                    profil. <br />
                    <strong>JPEG</strong> et <strong>PNG</strong> sont les
                    formats d'images supportés !
                  </p>
                </Message.Content>
              </Message>
            ) : (
              ""
            )}
          </Modal.Content>
          <Modal.Actions>
            {!_.isEmpty(this.state.image) ? (
              <Button
                negative={true}
                onClick={() => {
                  this.props.onImageChange("");
                  this.setState({
                    open: false
                  });
                }}
              >
                Supprimer la photo
              </Button>
            ) : (
              ""
            )}
          </Modal.Actions>
        </Modal>

        {/*Modal preview photo de profil*/}

        <Modal size="mini" open={this.state.photoPreview}>
          <Modal.Header>Photo de profil</Modal.Header>
          <Modal.Content>
            {/*<div id="photoPreview" style={{ textAlign: "center" }} />*/}
            <Grid columns="equal">
              <Grid.Column />
              <Grid.Column width={12}>
                <Image
                  id="photoPreview"
                  src={this.state.image}
                  //height={this.state.height}
                  //width={this.state.width}
                  centered={true}
                />
              </Grid.Column>
              <Grid.Column />
            </Grid>
          </Modal.Content>
          <Modal.Actions>
            <Button
              negative={true}
              onClick={() =>
                this.setState({
                  image: this.props.image,
                  photoPreview: false,
                  open: false
                })
              }
            >
              Annuler
            </Button>
            <Ref innerRef={node => node.firstChild.parentElement.focus()}>
              <Button
                primary={true}
                onClick={() => {
                  this.props.onImageChange(this.state.image);
                  this.setState({
                    photoPreview: false,
                    open: false
                  });
                }}
              >
                Valider
              </Button>
            </Ref>
          </Modal.Actions>
        </Modal>

        <Button
          icon={this.props.icon}
          content={this.props.content}
          onClick={() => this.setState({ open: true })}
        />
      </React.Fragment>
    );
  }
}
