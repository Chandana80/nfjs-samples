/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');

const PERMISSIONS = ['alexa::profile:given_name:read', 'alexa::profile:email:read'];
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {

    const { requestEnvelope, serviceClientFactory, responseBuilder} = handlerInput;

    try {
      const client = serviceClientFactory.getUpsServiceClient();
      const email = await client.getProfileEmail();
      const givenName = await client.getProfileGivenName();
      console.log("GOT PROFILE DATA : ", email, givenName);
    } catch (error) {
      if (error.name === 'ServiceError' && error.statusCode == 403) {
        return responseBuilder
            .speak("Please grant me permission to access your email address and name in the Amazon Alexa app.")
            .withAskForPermissionsConsentCard(PERMISSIONS)
            .getResponse();
      }
      throw error;
    }

    const speechText = 'Welcome to StarFlyer Travel. Where do you want to go?';

    return responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const HelloWorldIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'HelloWorldIntent';
  },
  handle(handlerInput) {
    const speechText = 'Hello traveler!';
    console.log('Saying hello...');
    console.log(handlerInput);

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('StarFlyer Travel', speechText)
      .getResponse();
  },
};

const ScheduleTripIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'ScheduleTripIntent'
      && (request.dialogState === 'COMPLETED');

  },
  handle(handlerInput) {
    const allSlots = handlerInput.requestEnvelope.request.intent.slots;
    // const destination = allSlots['destination'].value;
    const destination = allSlots['destination']
        .resolutions.resolutionsPerAuthority[0].values[0].value.name;

    const departureDate = allSlots['departureDate'].value;
    const returnDate = allSlots['returnDate'].value;

    const speechText = `Enjoy your trip to ${destination}! Thanks for using StarFlyer Travel.`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('StarFlyer Travel', speechText)
      .withShouldEndSession(true)
      .getResponse();
  },
};

const ScheduleTripIntentHandler_InProgress = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'ScheduleTripIntent'
      && (request.dialogState === 'STARTED' || request.dialogState === 'IN_PROGRESS');
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    const allSlots = currentIntent.slots;
    const departureString = allSlots['departureDate'].value;
    const returnString = allSlots['returnDate'].value;

    if (departureString && returnString) {
      const departureDate = new Date(departureString);
      const returnDate = new Date(returnString);
      if (departureDate >= returnDate) {
        currentIntent.slots['returnDate'].value = null;
        return handlerInput.responseBuilder
          .speak("StarFlyer Travel specializes in space travel, \
              not time travel. Please specify a return date that is \
              after the departure date.")
          .addDelegateDirective(currentIntent)
          .getResponse();
      }
    }

    return handlerInput.responseBuilder
        .addDelegateDirective(currentIntent)
        .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can say hello to me!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    HelloWorldIntentHandler,
    ScheduleTripIntentHandler,
    ScheduleTripIntentHandler_InProgress,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .withApiClient(new Alexa.DefaultApiClient())
  .addErrorHandlers(ErrorHandler)
  .lambda();
