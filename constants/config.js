const corsOptions = {
  origin: [
    "https://academicbridge.mdnazim.in'",
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.CLIENT_URL,
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

const CHATTU_TOKEN = "chattu-token";

export { corsOptions, CHATTU_TOKEN };
