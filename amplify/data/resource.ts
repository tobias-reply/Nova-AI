import { type ClientSchema, a, defineData, defineFunction } from "@aws-amplify/backend";

export const MODEL_ID = "amazon.nova-lite-v1:0";

export const generateTextFunction = defineFunction({
  entry: "./generateText.ts",
  environment: {
    MODEL_ID,
  },
});

const schema = a.schema({
  generateText: a
    .query()
    .arguments({
      prompt: a.string().required(),
      imageData: a.string(),
      imageFormat: a.string(),
    })
    .returns(a.string())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(generateTextFunction)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});


