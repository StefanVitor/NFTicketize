import React, {useState, useEffect} from 'react';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import MyProjects from './components/MyProjects';
import SubscribedTiers from './components/SubscribedTiers';
import ProjectDetail from './components/ProjectDetail';
import { firebase } from '@firebase/app';
import { Magic } from "magic-sdk";
import { ZilliqaExtension } from "@magic-ext/zilliqa";
import { EnvConstant} from "./const";
import AllProjects from './components/AllProjects';
import { Zilliqa } from '@zilliqa-js/zilliqa';
import { BN, units}  from '@zilliqa-js/util';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import '@firebase/functions';
import '@firebase/auth';
import TierMarket from './components/TierMarket';

// Magic initialization
const magic = new Magic(EnvConstant.magicPrivateKey, {
    extensions: {
        zilliqa: new ZilliqaExtension({
            rpcUrl: 'https://dev-api.zilliqa.com' 
        })
    }
});
// Zilliqa initialization
const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');

function App() {
    if (!firebase.apps.length) {
        firebase.initializeApp(EnvConstant.firebaseConfig);
    } else {
        firebase.app(); // if already initialized, use that one
    }
 
    const [email, setEmail] = useState("");
    const [publicAddress, setPublicAddress] = useState("");
    const [balance, setBalance] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userMetadata, setUserMetadata] = useState({});

    useEffect(() => {
        magic.user.isLoggedIn().then(async magicIsLoggedIn => {
        setIsLoggedIn(magicIsLoggedIn);
        if (magicIsLoggedIn) {
            const publicAddress = (await magic.zilliqa.getWallet()).bech32Address;
            setPublicAddress(publicAddress);
            setUserMetadata(await magic.user.getMetadata());
            const balance = await zilliqa.blockchain.getBalance(publicAddress);
            if (balance.result) {
                setBalance(parseFloat(units.fromQa(new BN(balance.result.balance), units.Units.Zil)).toFixed(2));
            } else {
                setBalance("0");
            }
        }});
    }, [isLoggedIn]);

    // Login button
    const login = async () => {
        const didToken = await magic.auth.loginWithMagicLink({ email });

        const auth = firebase.functions().httpsCallable("auth");
        /* DID token is passed into the auth callable function */
        let result = (await auth({ didToken })).data;
        /* Firebase user access token is used to authenticate */
        await firebase.auth().signInWithCustomToken(result.token);

        setIsLoggedIn(true);
    };

    const logout = async () => {
        await magic.user.logout();
        setIsLoggedIn(false);
    };

    // Go to network account
    const goToNetworkAccount = async () => {
        const link = "https://devex.zilliqa.com/address/" + publicAddress + "?network=https://dev-api.zilliqa.com";
        window.open(link, '_blank').focus();
    };

    return (
        <div>
        {!isLoggedIn ? (
                <div style={{
                    position: 'absolute', left: '50%', top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '300px',
                    'text-align': 'center',
                    padding: '27px 18px',
                    'margin-bottom': '27px'
                }}>
                    <h1>Please sign up or login</h1>
                    <input
                        type="email"
                        name="email"
                        required="required"
                        placeholder="Enter your email"
                        onChange={event => {
                            setEmail(event.target.value);
                        }}
                    />
                    <button onClick={login}>Send</button>
                </div>
            ) : (<Router>
                <div>
                    <h2>Creators Boost</h2>
                    <nav className="navbar navbar-expand-lg navbar-light bg-light">
                        <div className="container-fluid">
                            <ul className="navbar-nav mr-auto">
                                <li><Link to={'/'} className="nav-link"> Home </Link></li>
                                <li><Link to={'/subsribed_tiers'} className="nav-link">Subscribed tiers</Link></li>
                                <li><Link to={'/my_projects'} className="nav-link">My projects</Link></li>
                                <li><Link to={'/all_projects'} className="nav-link">All projects</Link></li>
                                <li><Link to={'/tier_market'} className="nav-link">Tier market</Link></li>
                            </ul>
                            <form className="d-flex">
                                <a className="navbar-brand">#{balance} ZIL</a>
                                <div className="dropdown">
                                    <button className="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown">{userMetadata.email}
                                    <span className="caret"></span></button>
                                    <ul className="dropdown-menu">
                                        <li><a className="dropdown-item" onClick={goToNetworkAccount}>Account</a></li>
                                        <li><hr className="dropdown-divider"/></li>
                                        <li><a className="dropdown-item" onClick={logout}>Logout</a></li>
                                    </ul>
                                </div>
                            </form>
                        </div>
                    </nav>
                    
                    <Switch>
                        <Route exact path='/' component={Home} />
                        <Route path='/subsribed_tiers' component={SubscribedTiers} />
                        <Route path='/my_projects' component={MyProjects} />
                        <Route path='/all_projects' component={AllProjects} />
                        <Route path='/project_detail' component={ProjectDetail} />
                        <Route path='/tier_market' component={TierMarket} />
                    </Switch>
                </div>
            </Router>
        )}
    </div>
    );
}

export default App;