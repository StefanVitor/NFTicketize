import React, {useState, useRef, useEffect } from "react";
import { EnvConstant} from "./const";
import { firebase } from '@firebase/app';
import { BrowserRouter as Router, Switch, Route, Link} from 'react-router-dom';
import Home from './components/Home';
import MyEvents from "./components/MyEvents";
import MyTickets from './components/MyTickets';
import EventDetail from './components/EventDetail';
import TicketMarket from './components/TicketMarket';
import Account from './components/Account';
import Button from '@material-ui/core/Button';
import MetaMaskOnboarding from '@metamask/onboarding';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import '@firebase/functions';
import '@firebase/auth';

function App() {

  const [account, setAccount] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const onboarding = useRef();
  

  useEffect(() => {
    if (!onboarding.current) {
      onboarding.current = new MetaMaskOnboarding();
    }
  }, []);

  useEffect(() => {
    if (!firebase.apps.length) {
      firebase.initializeApp(EnvConstant.firebaseConfig);
    } else {
      firebase.app(); // if already initialized, use that one
    }
    
  }, []);

  useEffect(() => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      if (account) {
        //setButtonText(CONNECTED_TEXT);
        //setDisabled(true);
        onboarding.current.stopOnboarding();
      } else {
        //setButtonText(CONNECT_TEXT);
        //setDisabled(false);
      }
    }
  }, [account]);

  useEffect(() => {
    function handleNewAccounts(newAccounts) {
        if (newAccounts.length > 0) {
          setAccount(newAccounts[0]);
          loginBackend(newAccounts[0]);
        }
    }
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
        window.ethereum
          .request({ method: 'eth_requestAccounts' })
          .then(handleNewAccounts);
        window.ethereum.on('accountsChanged', handleNewAccounts);
        return () => {
          window.ethereum.off('accountsChanged', handleNewAccounts);
        };
    }
  }, []);

  // Login button
  const loginBackend = async (address) => {
    const auth = firebase.functions().httpsCallable("auth");
    /* DID token is passed into the auth callable function */
    let result = (await auth({ address })).data;
    /* Firebase user access token is used to authenticate */
    await firebase.auth().signInWithCustomToken(result.token);

    setIsLoggedIn(true);
  }

  const logout = async () => {

    await firebase.auth().signOut();

    setIsLoggedIn(false);
  };

  const loginMetamask = async() => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      window.ethereum
        .request({ method: 'eth_requestAccounts' })
        .then((newAccounts) => { 
            if (newAccounts.length > 0) {
              setAccount(newAccounts[0]);
              loginBackend(newAccounts[0]);
            }
          });
    } else {
      onboarding.current.startOnboarding();
    }
  };

  return (
    <div>
      <Router>
            <div>
                <h2>NFTicketize</h2>
                <nav className="navbar navbar-expand-lg navbar-light bg-light">
                    <div className="container-fluid">
                        <ul className="navbar-nav mr-auto">
                            <li><Link to={'/'} className="nav-link"> Home </Link></li>
                            <li><Link to={'/subsribed_tiers'} className="nav-link">Subscribed tiers</Link></li>
                            <li hidden={!isLoggedIn}><Link to={'/my_events'} className="nav-link">My events</Link></li>
                            <li><Link to={'/tier_market'} className="nav-link">Tier market</Link></li>
                        </ul>
                        {isLoggedIn === true ? 
                          <form className="d-flex">
                              <div className="dropdown">
                                  <button className="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown">Account
                                  <span className="caret"></span></button>
                                  <ul className="dropdown-menu">
                                    <li><Link to={'/account'} href="/#" className="dropdown-item">Account</Link></li>
                                    <li><hr className="dropdown-divider"/></li>
                                    <li><Link to={'/'} href="/#" className="dropdown-item" onClick={() => logout()}>Logout</Link></li>
                                  </ul>
                              </div>
                          </form>
                          : 
                          <Button variant="contained" onClick={() => { loginMetamask()}}>
                            Login
                          </Button>
                        }
                    </div>
                </nav>
                
                <Switch>
                    <Route exact path='/' component={Home} />
                    <Route path='/my_tickets' component={MyTickets} />
                    <Route path='/my_events' component={MyEvents} />
                    <Route path='/event_detail' component={EventDetail} />
                    <Route path='/ticket_market' component={TicketMarket} />
                    <Route path='/account' component={() => <Account account={account} isLoggedIn={isLoggedIn}/>} />
                </Switch>
            </div>
        </Router>
    </div>
);
}

export default App;
