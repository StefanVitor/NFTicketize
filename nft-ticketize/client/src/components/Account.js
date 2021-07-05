import React, {useEffect} from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import { firebase } from '@firebase/app';
import { EnvConstant} from "../const";
import '@firebase/database';

const useStyles = makeStyles((theme) => ({
    root: {
        alignItems: "center",
        textAlign: "center",
        padding: theme.spacing(2)
    },
    textField: {
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
        width: 500
    },
    textField_2: {
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
        width: 244
    },
    button: {
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2), 
    }
}));


const validateEmail = function (email) {
    const regexp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regexp.test(email);
};

function Account(props) {

    const [address] = React.useState(props.account);
    const [email, setEmail] = React.useState("");
    const [emailValidation, setEmailValidation] = React.useState(false);
    const [firstName, setFirstName] = React.useState("");
    const [lastName, setLastName] = React.useState("");

    const classes = useStyles();

    useEffect(() => {
        if (!firebase.apps.length) {
            firebase.initializeApp(EnvConstant.firebaseConfig);
        } else {
            firebase.app(); // if already initialized, use that one
        }
        const dbRef = firebase.database().ref();

        dbRef.child("users").child(address).get().then((snapshot) => {
            if (snapshot.exists()) {
              var obj = snapshot.val();
              if (obj) {
                setEmail(obj.email);
                setFirstName(obj.first_name);
                setLastName(obj.last_name);
              }
            } 
          }).catch((error) => {
            console.error(error);
          });
    }, [address]);

    const changeEmail = (email) => {
        setEmail(email);
    };

    // Save profile
    const handleSaveProfile = () => {
        
        // Validation for email
        if (!validateEmail(email)) {
            setEmailValidation(true);
            return;
        } else {
            setEmailValidation(false);
        }

        //Save in firebase database
        firebase.database().ref('users/' + address).set({
            email: email,
            first_name: firstName,
            last_name: lastName
        });
    };

    return (
        <div>
            <form className={classes.root} noValidate autoComplete="off">
                <div>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="address"
                        label="Address"
                        className={classes.textField}
                        disabled
                        value = {address}
                    />
                </div>
                <div>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="email"
                        label="E-mail"
                        className={classes.textField}
                        value = {email}
                        onChange={event => {
                            changeEmail(event.target.value);
                        }}
                        error={emailValidation}
                    />
                </div>
                <div>
                    <TextField
                        margin="dense"
                        id="first_name"
                        label="Fist name"
                        className={classes.textField_2}
                        value = {firstName}
                        onChange={event => {
                            setFirstName(event.target.value);
                        }}
                    />

                    <TextField
                        margin="dense"
                        id="last_name"
                        label="Last name"
                        className={classes.textField_2}
                        value = {lastName}
                        onChange={event => {
                            setLastName(event.target.value);
                        }}
                    />
                </div>

                <div>
                    <Button color="primary" className={classes.button}>
                        Cancel
                    </Button>
                    <Button color="primary" className={classes.button} onClick={() => handleSaveProfile()}>
                        Save profile
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default Account;