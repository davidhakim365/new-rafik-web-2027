export default {
  "api-store-file": {
    input: "http://localhost:5000/swagger/v1/swagger.json",
    output: {
      mode: "single",
      target: "src/generated/api.ts",
      schemas: "src/generated/model",
      client: "react-query",
      override: {
        mutator: {
          path: "./src/lib/axiosCustomInstant.ts",
          name: "customInstance",
        },
      },
    },
  },
};
