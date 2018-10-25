import React from "react";

import {
  Button,
  Form,
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
    image: "",
    photoPreview: false
  };

  componentWillReceiveProps(next) {
    this.setState({
      image: next.image
      //height: 0,
      //width: 0
    });
  }

  base64Photo = (e, d) => {
    let filesSelected = document.getElementById(d.id).files;

    console.log(filesSelected);

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

        //console.log(newImage.width + " - " + newImage.height);

        if (newImage.height > 128) {
          newImage.height = 128;
          //this.setState({ height: newImage.height });
        } else {
          //this.setState({ height: newImage.height });
        }

        if (newImage.width > 128) {
          newImage.width = 128;
          //this.setState({ width: newImage.width });
        } else {
          //this.setState({ width: newImage.widths });
        }

        /*let canvas = document.createElement("canvas");
        canvas.width = newImage.width;
        canvas.height = newImage.height;

        let ctx = canvas.getContext("2d");
        ctx.drawImage(newImage, 0, 0);*/

        //let dataURL = canvas.toDataURL("image/png");

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
          size="tiny"
          open={this.state.open}
          closeIcon={true}
          onClose={() => this.setState({ open: false })}
        >
          <Modal.Header>Photo de profil</Modal.Header>
          <Modal.Content>
            {_.isEmpty(this.state.image) ? (
              <Icon name="user" size="massive" />
            ) : (
              <div>
                {" "}
                {/* vraie photo */}
                <Image
                  src={this.state.image}
                  centered={
                    true
                  } /*style={{ height: this.state.height + "px", width: this.state.width + "px"}}*/
                />
              </div>
            )}
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
            <Image id="photoPreview" src={this.state.image} />
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
