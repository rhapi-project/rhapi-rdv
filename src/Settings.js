import site from "./SiteSettings";

import moment from "moment";

import _ from "lodash";

/*
 * maxWidth : Largeur de la colonne centrale
 * (d'autres largeurs sont définies
 *  comme des fractions de maxWidth)
 */

const maxWidth = 500;

/*
 * psize : Preferred Semantic UI Form size
 * hsize : Preferred Semantic UI Header/Title Size
 */

const fsize = "large";
const hsize = "large";

/*
 * Affichage par défaut Date/Heure d'un rendez-vous (format long en Français)
 */

const rdvDateTime = dateStr =>
  moment(dateStr).format("dddd D MMMM YYYY à HH:mm");

/*
 * defaultPlanning : Planning par défaut
 */

const defaultPlanning = {
  titre: "Sans titre",
  description: "Nouveau planning",
  couleur: "#7ED321",
  optionsJO: {
    acl: {
      owners: [],
      admin: ""
    },
    plages: {
      duree: 30,
      dureeMin: 15,
      horaires: [
        [],
        [
          {
            start: "09:00",
            end: "12:00"
          },
          {
            start: "14:00",
            end: "19:00"
          }
        ],
        [
          {
            start: "09:00",
            end: "12:00"
          },
          {
            start: "14:00",
            end: "19:00"
          }
        ],
        [
          {
            start: "09:00",
            end: "12:00"
          },
          {
            start: "14:00",
            end: "19:00"
          }
        ],
        [],
        [
          {
            start: "09:00",
            end: "12:00"
          },
          {
            start: "14:00",
            end: "19:00"
          }
        ],
        [
          {
            start: "09:00",
            end: "12:00"
          }
        ]
      ]
    },
    recurrents: [],
    reservation: {
      autorisationMin: 4,
      autorisationMax: 2,
      autorisationMinAgenda: 0,
      confirmationDragAndDrop: true,
      congesCouleur: "#D0021B",
      congesVisibles: true,
      congesFeries: true,
      conges: [],
      delaiMax: 120,
      delaiPrevenance: 48,
      denominationFormat: "Np",
      denominationDefaut: "Anonyme",
      planningsAssocies: [],
      motifs: []
    }
  },
  sms: {
    rappel1: false,
    rappel24: false,
    rappel48: false,
    rappelTexte:
      "Bonjour,\nRDV {date-heure}.\nDr (saisir les coordonnées)\n{infos-annulation}",
    confirmationTexte:
      "RDV {date-heure}.\nDr (saisir les coordonnées)\n{infos-annulation}"
  }
};

/*
 * Regex code postal, email, et téléphones
 */
const codePostalRegex = /^[0-9]{5}$/;

const emailRegex = /(^\w)([\w+.-])*([\w+-])*(@)([\w+.-])+\.([a-z]{2,4})$/i;

//Les formats valides :
//  01 12 45 78 14 pattern 1 (ou sans espace)
//  01.12.45.78.14 pattern 2
//  +33 6 00 00 00 00 pattern 3 (ou sans espace)
//  00 33 6 00 00 00 00 pattern 4 (ou sans espace)
const telRegex = [
  /^0[1-9]([\s.]?[0-9]{2}){4}$/, // pattern 1 et 2
  /^\+[1-9][0-9]{1,2}(\s)?[1-9](\s?[0-9]{2}){4}$/, // pattern 3
  /^00(\s)?[1-9][0-9]{1,2}(\s)?([1-9])(\s?[0-9]{2}){4}$/
];

// Formatage du numéro de téléphone pour l'affichage seulement
const telFormat = telephone => {
  if (!telephone) {
    return "";
  }
  let result = "";
  for (let i = 0; i < telRegex.length; i++) {
    if (i === 0 && telRegex[i].test(telephone)) {
      // match avec les patterns 1 et 2
      let val = telephone.replace(/(\.|\s)/g, ""); // remplacer tous les . par des espaces
      for (let j = 0; j < val.length; j++) {
        if (j % 2 === 0 || j === val.length - 1) {
          result += val[j];
        } else {
          result = result + val[j] + " ";
        }
      }
      return result;
    } else if (i === 1 && telRegex[i].test(telephone)) {
      // match avec le pattern 3
      let val = telephone.replace(/\s/g, "");
      if (val.length === 12) {
        for (let j = 0; j < val.length; j++) {
          if ((j === 1 || j === val.length - 1 || j % 2 === 0) && j !== 2) {
            result += val[j];
          } else {
            result = result + val[j] + " ";
          }
        }
        return result;
      } else if (val.length === 13) {
        for (let j = 0; j < val.length; j++) {
          if (
            j === 0 ||
            j === 2 ||
            j === val.length - 1 ||
            (j % 2 !== 0 && j !== 3)
          ) {
            result += val[j];
          } else {
            result = result + val[j] + " ";
          }
        }
        return result;
      }
    } else if (i === 2 && telRegex[i].test(telephone)) {
      // match avec le pattern 4
      let val = telephone.replace(/\s/g, "");
      if (val.length === 13) {
        for (let j = 0; j < val.length; j++) {
          if (
            j === 0 ||
            j === 2 ||
            j === val.length - 1 ||
            (j % 2 !== 0 && j !== 1 && j !== 3)
          ) {
            result += val[j];
          } else {
            result = result + val[j] + " ";
          }
        }
        return result;
      } else if (val.length === 14) {
        for (let j = 0; j < val.length; j++) {
          if (j === 4 || (j % 2 !== 0 && j !== 3 && j !== val.length - 1)) {
            result = result + val[j] + " ";
          } else {
            result += val[j];
          }
        }
        return result;
      }
    }
  }
  return telephone;
};

/*
 * Format de dénomination
 */
const denominationDefaultFormat = "NP";

/*
 * Fonctions qui seront utilisées pour le formatage de la dénomination
 * lors de l'affichage
 * -> camelDenomination et affichageDenomination
 */
const camelDenomination = text => {
  let result = "";
  let prev = "";
  for (let i = 0; i < text.length; i++) {
    let c = text[i];
    if (i === 0 || prev === " " || prev === "'" || prev === "-") {
      c = _.toUpper(c);
    } else {
      c = _.toLower(c);
    }
    prev = c;
    result += c;
  }
  return result;
};

const affichageDenomination = (denominationDefaultFormat, nom, prenom) => {
  switch (denominationDefaultFormat) {
    case "NP":
      return _.toUpper(nom) + " " + _.toUpper(prenom);
    case "Np":
      return _.toUpper(nom) + " " + camelDenomination(prenom);
    case "PN":
      return _.toUpper(prenom) + " " + _.toUpper(nom);
    case "pN":
      return camelDenomination(prenom) + " " + _.toUpper(nom);
    case "np":
      return camelDenomination(nom) + " " + camelDenomination(prenom);
    case "pn":
      return camelDenomination(prenom) + " " + camelDenomination(nom);
    default:
      return nom + " " + prenom;
  }
};

// Retourne une chaine de caractères décrivant la civilité
// ex : M., Mme, Professeur etc.
const civilite = (short, valCivilite) => {
  let civilites = [
    { text: "", shorttext: "", value: 0 },
    { text: "Monsieur", shorttext: "M.", value: 1 },
    { text: "Madame", shorttext: "Mme", value: 2, hidden: true },
    { text: "Mademoiselle", shorttext: "Mlle", value: 3 },
    { text: "Enfant", shorttext: "Enfant", value: 4 }
  ];

  let civiliteNum = 1 * valCivilite;
  let civiliteStr = "" + valCivilite;
  if (!isNaN(civiliteNum)) {
    if (civiliteNum < civilites.length) {
      civiliteStr = short
        ? civilites[civiliteNum].shorttext
        : civiliteNum === 3 // Mademoiselle (obsolète) est géré comme un texte libre (autre)
        ? civilites[civiliteNum].text
        : "";
    } else {
      civiliteStr = "";
    }
  }
  return civiliteStr;
};

/*
 * rdvEtats états des rendez-vous (idEtat du groupe RendezVous)
 */
const rdvEtats = [
  { text: "RDV non confirmé", color: "black" }, // (0) RDV pris en ligne non encore confirmé (masqué)
  { text: "Statut non renseigné", color: "lightgrey" }, // (1)
  { text: "Présence à l'heure", color: "lime" }, // (2)
  { text: "Retard", color: "yellow" }, // (3)
  { text: "Retard important", color: "orange" }, // (4)
  { text: "RDV annulé dernier moment", color: "red" }, // (5)// Hors délai de prévenance
  { text: "Absence", color: "red" }, // (6)
  { text: "RDV annulé", color: "black" } // (7) // Annulation dans les délais (masqué)
];

/*
 * popups d'aide
 */
const helpPopup = {
  on: "hover",
  size: "mini",
  inverted: true
};

// local dev => no auth -> identification patient par id + password
const localdev = false;

export {
  localdev,
  site,
  maxWidth,
  helpPopup,
  fsize,
  hsize,
  defaultPlanning,
  rdvDateTime,
  codePostalRegex,
  emailRegex,
  telRegex,
  telFormat,
  civilite,
  camelDenomination,
  denominationDefaultFormat,
  affichageDenomination,
  rdvEtats
};
