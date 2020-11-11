/**
 * Credits schema.
 */
export const schema = {
  // tslint:disable:quotemark
  // tslint:disable:trailing-comma
  "$schema": "http://json-schema.org/draft-07/schema",
  "title": "MicroHE Meta-Data",
  "description": "MicroHE Meta-Data",
  "type": "object",
  "properties": {
    "$schema": {
      "description": "A path to JSON Schema definition file",
      "type": "string"
    },
    "$evidence": {
      "description": "A URI pointing to the evidence JSON with data needed to certify this asset",
      "type": "string"
    },
    "name": {
      "description": "A property that holds a name of an asset",
      "type": "string"
    },
    "description": {
      "description": "A property that holds a detailed description of an asset",
      "type": "string"
    },
    "image": {
      "description": "A public property that can be a valid URI pointing to a resource with mime type image/* representing the asset to which this digital assets represents",
      "type": "string",
      "format": "uri"
    },
    "identifier": {
      "description": "Identifier of a qualification",
      "type": "string"
    },
    "refLanguage": {
      "description": "ISO 639-1 code of the qualification language",
      "type": "string"
    },
    "title": {
      "description": "Official title of the qualification",
      "type": "string"
    },
    "altLabel": {
      "description": "Alternative name of the qualification",
      "type": "string"
    },
    "definition": {
      "description": "Short description of the qualification",
      "type": "string"
    },
    "learningOutcomeDesc": {
      "description": "Full learning outcome description of the qualification",
      "type": "string"
    },
    "field": {
      "description": "Field of Education and Training Code (ISCED FoET 2013)",
      "type": "string"
    },
    "EQFLevel": {
      "description": "European Qualification Framework level",
      "type": "string"
    },
    "NQFLevel": {
      "description": "National/Regional Qualification Framework level",
      "type": "string"
    },
    "creditSystem": {
      "description": "Name of the Credit system in use (e.g. ECTS)",
      "type": "string"
    },
    "creditSysTitle": {
      "description": "Exact and official title of the Credit system",
      "type": "string"
    },
    "creditSysDef": {
      "description": "Short and abstract description of the Credit system",
      "type": "string"
    },
    "creditSysValue": {
      "description": "Value described in terms of hours/certificates/accompl.",
      "type": "string"
    },
    "creditSysIssuer": {
      "description": "Which organization/consortium/law regulates who can issue this token",
      "type": "string"
    },
    "canConsistOf": {
      "description": "Which other credential type/credit system can be used to build this system",
      "type": "string"
    },
    "creditSysRefNum": {
      "description": "Credit system reference number",
      "type": "string"
    },
    "numCreditPoints": {
      "description": "Number of credit points assigned to the qualification following this system",
      "type": "number"
    },
    "ECTSCreditPoints": {
      "description": "Number of credit points assigned to the qualification following ECTS system",
      "type": "number"
    },
    "volumeOfLearning": {
      "description": "How many hours of learning are needed (notional learning hours)",
      "type": "string"
    },
    "isPartialQual": {
      "description": "Indicates whether a qualification is a full qualification or a part of another qualification",
      "type": "boolean"
    },
    "consistsOf": {
      "description": "Other credentials which may make up this credential, by Unique Identifer",
      "type": "string"
    },
    "waysToAcquire": {
      "description": "Whether the qualification can be acquired by validation of a formal/non-formal and/or informal learning processes",
      "type": "string"
    },
    "eduCredType": {
      "description": "Full name of the qualification type or credit system in use",
      "type": "string"
    },
    "entryReq": {
      "description": "Entry requirement of the qualification",
      "type": "string"
    },
    "learningOutcome": {
      "description": "Expresses a learning outcome of the qualification as a relation to a skill, competence or knowledge from a known framework or standard classification",
      "type": "string"
    },
    "relatedOccupation": {
      "description": "Relates the qualification to an occupation or occupational field from a known framework or standard classification",
      "type": "string"
    },
    "recognition": {
      "description": "Information related to the formal recognition of a qualification",
      "type": "string"
    },
    "awardingBody": {
      "description": "Awarding body",
      "type": "string"
    },
    "awardingActivity": {
      "description": "Activity related to the awarding of the qualification",
      "type": "string"
    },
    "awardingMethod": {
      "description": "Whether the qualification is certified through undergoing the learning activity or an assessment of acquired competence",
      "type": "string"
    },
    "gradeScheme": {
      "description": "Description of  the grading scheme and what the grade means",
      "type": "string"
    },
    "modeOfStudy": {
      "description": "Online, face to face, practice, workplace, informal learning",
      "type": "string"
    },
    "publicKey": {
      "description": "Public Key the institution uses to identify itself and authenticate the credentials",
      "type": "string"
    },
    "assesmentMethod": {
      "description": "Description of the form of assessment",
      "type": "string"
    },
    "accreditation": {
      "description": "Information related to the accreditation, quality assurance and regulation of a qualification",
      "type": "string"
    },
    "homePage": {
      "description": "The homepage (a public web document) of a qualification",
      "type": "string",
      "format": "uri"
    },
    "landingPage": {
      "description": "A web page that can be navigated to in a web browser to gain access to the qualification and/or additional information",
      "type": "string",
      "format": "uri"
    },
    "supplDoc": {
      "description": "A public web document containing additional documentation about the qualification, such as a diploma or certificate supplement",
      "type": "string",
      "format": "uri"
    },
    "dateIssued": {
      "description": "The date when the qualification was published and the metadata about the qualification was made available",
      "type": "string",
      "format": "date"
    },
    "dateModified": {
      "description": "Date when the qualification was last updated since it was published",
      "type": "string",
      "format": "date"
    },
    "changeNote": {
      "description": "A property to record information about fine grained changes of the qualification",
      "type": "string"
    },
    "historyNote": {
      "description": "A property to record information about major lifecycle changes of the qualification (e.g. past state/use/meaning of a qualification)",
      "type": "string"
    },
    "additionalNote": {
      "description": "A property to record any further information about a qualification",
      "type": "string"
    },
    "status": {
      "description": "The publication status of a qualification, e.g. released, obsolete, ...",
      "type": "string"
    },
    "replaces": {
      "description": "A related qualification that was replaced, displaced or superseded by this qualification",
      "type": "string"
    },
    "replacedBy": {
      "description": "The qualification that replaces, displaces or supersedes this qualification",
      "type": "string"
    },
    "owner": {
      "description": "The organization owning rights over the qualification, e.g. an awarding body, a national or regional authority, etc.",
      "type": "string"
    },
    "creator": {
      "description": "Organisation primarily responsible for establishing, defining and managing the qualification and its curricula",
      "type": "string"
    },
    "publisher": {
      "description": "Agent responsible for making the information about the qualification available",
      "type": "string"
    },
    "holder": {
      "description": "Name of the person receiving the credential",
      "type": "string"
    },
    "dateOfBirth": {
      "description": "Date of birth of the person receiving the credential",
      "type": "string",
      "format": "date"
    },
    "studentId": {
      "description": "Student identification number or code or public key used to authenticate student",
      "type": "string"
    },
    "grade": {
      "description": "Grade achieved",
      "type": "string"
    },
    "creditsAwarded": {
      "description": "Number of credits awarded",
      "type": "number"
    },
    "uniqueId": {
      "description": "Automatically generated for each credential",
      "type": "string"
    },
    "credential": {
      "description": "The credential which is being awarded to the student",
      "type": "string"
    },
    "expiryPeriod": {
      "description": "Date on which the credential will expire",
      "type": "string",
      "format": "date"
    },
    "cheating": {
      "description": "Methods for cheating prevention",
      "type": "string"
    }
  }
};
