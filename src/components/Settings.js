import site from "./SiteSettings";

import moment from "moment";

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
    recurrents: [
      {
        titre: "Réunion début de semaine",
        couleur: "#000000",
        background: true,
        recurrence: 0,
        from: 0,
        step: 0,
        start: "",
        end: "",
        horaires: [
          [],
          [
            {
              start: "09:00",
              end: "10:00"
            }
          ],
          [],
          [],
          [],
          [],
          []
        ]
      }
    ],
    reservation: {
      autorisationMin: 0,
      autorisationMax: 1,
      autorisationMinAgenda: 1,
      congesCouleur: "#D0021B",
      congesVisibles: true,
      congesFeries: true,
      conges: [
        {
          titre: "Fermeture annuelle",
          start: "2018-08-01",
          end: "2018-08-20"
        },
        {
          titre: "Congés de fin d'année",
          start: "2018-12-20",
          end: "2019-01-02"
        }
      ],
      delaiMax: 120,
      delaiPrevenance: 48,
      denominationFormat: "NP",
      denominationDefaut: "Anonyme",
      planningsAssocies: [],
      motifs: [
        {
          autorisationMin: 0,
          couleur: "#4A90E2",
          duree: 10,
          motif: "Première consultation"
        },
        {
          autorisationMin: 0,
          couleur: "#4A90E2",
          duree: 10,
          motif: "Je suis adressé(e) pour avis par un médecin/un dentiste"
        },
        {
          autorisationMin: 1,
          couleur: "#4A90E2",
          duree: 15,
          motif: "Consultation de suivi"
        },
        {
          autorisationMin: 1,
          couleur: "#4A90E2",
          duree: 30,
          motif: "Détartrage"
        },
        {
          autorisationMin: 1,
          couleur: "#4A90E2",
          duree: 30,
          motif:
            "J'envisage la réalisation du plan de traitement qui m'a été proposé"
        },
        {
          autorisationMin: 1,
          couleur: "#4A90E2",
          duree: 20,
          motif: "Je pense avoir un problème à une dent"
        },
        {
          autorisationMin: 1,
          couleur: "#4A90E2",
          duree: 20,
          motif: "Je pense avoir un problème à la gencive"
        },
        {
          autorisationMin: 1,
          couleur: "#4A90E2",
          duree: 10,
          motif: "Je pense avoir des problèmes avec une prothèse"
        }
      ],
      horaires: [
        [
          [],
          [],
          [
            {
              start: "14:00",
              end: "19:00"
            }
          ],
          [],
          [],
          [],
          []
        ],
        [
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
          []
        ],
        [[], [], [], [], [], [], []],
        [[], [], [], [], [], [], []]
      ]
    }
  },
  sms: {
    rappel12: false,
    rappel24: false,
    rappel48: false,
    rappelTexte:
      "Nous vous rappelons votre RDV {date-heure}.\nDr (saisir les coordonnées)\n{infos-annulation}",
    confirmationTexte:
      "RDV le {date-heure}.\nDr (saisir les coordonnées)\n{infos-annulation}"
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
};

/*
 * Format de dénomination
 */
const denominationDefaultFormat = "NP";

// local dev => no auth -> identification patient par id + password
const localdev = false;
const appToken = "bXlhcHA6bXlhcHBteWFwcA";
const authUrl = "https://auth-dev.rhapi.net";

/*
 * rdvEtats états des rendez-vous (idEtat du groupe RendezVous)
 */
const rdvEtats = [
  { text: "RDV non confirmé", color: "black" }, // RDV pris en ligne non encore confirmé (masqué)
  { text: "Statut non renseigné", color: "grey" },
  { text: "Présence à l'heure", color: "green" },
  { text: "Retard", color: "yellow" },
  { text: "Retard important", color: "orange" },
  { text: "RDV annulé dernier moment", color: "red" }, // Hors délai de prévenance
  { text: "Absence", color: "red" },
  { text: "RDV annulé", color: "black" } // Annulation dans les délais (masqué)
];

export {
  localdev,
  appToken,
  authUrl,
  site,
  maxWidth,
  fsize,
  hsize,
  defaultPlanning,
  rdvDateTime,
  codePostalRegex,
  emailRegex,
  telRegex,
  telFormat,
  denominationDefaultFormat,
  rdvEtats
};
