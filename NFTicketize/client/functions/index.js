

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://nfticketize-default-rtdb.europe-west1.firebasedatabase.app/"
});

const handleExistingUser = async (user) => {
    let firebaseToken = await admin.auth().createCustomToken(user.uid);
    return {
      uid: user.uid,
      token: firebaseToken
    };
  };
  
  const handleNewUser = async uid => {
    const newUser = await admin.auth().createUser({
        uid: uid
    });
    let firebaseToken = await admin.auth().createCustomToken(newUser.uid);
    return {
      uid: newUser.uid,
      token: firebaseToken
    };
  };
  
  exports.auth = functions.https.onCall(async (data, context) => {
    const address = data.address;
    try {
      /* Get existing user by email address,
         compatible with legacy Firebase email users */
      let user = (await admin.auth().getUser(address)).toJSON();
      return await handleExistingUser(user);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        /* Create new user */
        return await handleNewUser(address);
      } else {
        throw err;
      }
    }
  });