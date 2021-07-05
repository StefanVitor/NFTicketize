require('dotenv').config();

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://creators-boost-default-rtdb.europe-west1.firebasedatabase.app"
});

const handleExistingUser = async (user, claim) => {
    /* Check for replay attack (https://go.magic.link/replay-attack) */
    let lastSignInTime = Date.parse(user.metadata.lastSignInTime) / 1000;
    let tokenIssuedTime = claim.iat;
    if (tokenIssuedTime <= lastSignInTime) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "This DID token is invalid."
      );
    }
    let firebaseToken = await admin.auth().createCustomToken(user.uid);
    return {
      uid: user.uid,
      token: firebaseToken
    };
  };
  
  const handleNewUser = async email => {
    const newUser = await admin.auth().createUser({
      email: email,
      emailVerified: true
    });
    let firebaseToken = await admin.auth().createCustomToken(newUser.uid);
    return {
      uid: newUser.uid,
      token: firebaseToken
    };
  };
  
  exports.auth = functions.https.onCall(async (data, context) => {
    const { Magic } = require("@magic-sdk/admin");
    const magic = new Magic("sk_test_A2A9483556DF4774");
    const didToken = data.didToken;
    const metadata = await magic.users.getMetadataByToken(didToken);
    const email = metadata.email;
    try {
      /* Get existing user by email address,
         compatible with legacy Firebase email users */
      let user = (await admin.auth().getUserByEmail(email)).toJSON();
      const claim = magic.token.decode(didToken)[1];
      return await handleExistingUser(user, claim);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        /* Create new user */
        return await handleNewUser(email);
      } else {
        throw err;
      }
    }
  });