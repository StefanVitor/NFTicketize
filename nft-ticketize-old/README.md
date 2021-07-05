
<!-- PROJECT LOGO -->
<br />
<p align="center">

  <h3 align="center">Creators Boost</h3>

  <p align="center">
    Creators Boost is patreon-like platform where people can create tiers of NFTs that their followers can purchase and get access to exclusive content, one on one chats, access to a private group etc. based on the number as well as type of NFTs. The access to these tiers can last for a week, month or lifetime. Creators Boost also has tier market, where people who owns some tier can sold that tier, and also tier creators could be paid when someone resell their tier.
    <br />
  <a href="https://www.youtube.com/watch?v=YZkqU-yCZwE"><strong>Application Demo</strong></a>
    <br />
  </p>
</p>



<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgements">Acknowledgements</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

* Login - login is very simple form, where users put their mail, and on mail arrives link for authorization

![login](https://user-images.githubusercontent.com/25621259/121596342-9a92e280-ca3f-11eb-9e89-bc4d2a61f38e.png)
![login_1](https://user-images.githubusercontent.com/25621259/121675703-0adb4b80-cab4-11eb-9f4a-393ae610d43c.png)



* Home page - page where users could see posts from subscribed tiers(has token for that tiers) or their own tiers(projects)

![home_page](https://user-images.githubusercontent.com/25621259/121597442-0590e900-ca41-11eb-96a5-04bedec960a6.png)



* My projects - in Creators Boost, one user could have unlimited projects. For every project, user could create unlimited tiers number

![my_projects](https://user-images.githubusercontent.com/25621259/121597875-7d5f1380-ca41-11eb-9b1b-fb55ba98175d.png)



* Owner project detail - on this page, project owner could create new tiers or new posts (display)

![project_detail_creator](https://user-images.githubusercontent.com/25621259/121599297-222e2080-ca43-11eb-9977-7e3fc82df43f.png)



* Owner project detail - on this page, project owner could create new tiers or new posts (create new tier)

  Fields 
  - Tier name 
  - Tier description
  - Total number of tokens (limited / unlimited) for that tier
  - If total number of tokens is limited, user put that number
  - Tier time limit (week, month, lifetime and minute for testing purpose)
  - Tier (token) price
  - Resell fee for project owner (type and value) - this is interesting feature, where project(tier) owner received a certain amount of ZIL currency for every resell token of that tier. For example, if tier(project) creator put for type "Percent" and for value "10", for every resell tokens from that tier, user will receive 10 percent of sell value for that token. Or, for example, if creator put for type "Fixed" and for value "3", for every resell tokens from that tier, user will receive 3 ZIL. I will show bellow how resell and tier market works

![project_detail_new_tier](https://user-images.githubusercontent.com/25621259/121601031-aed9de00-ca45-11eb-8818-37a063e37987.png)



* Owner project detail - on this page, project owner could create new tiers or new posts - create new post 

  Fields 
  - Post title 
  - Post description
  - Check tiers that could see this post

![project_detail_new_post](https://user-images.githubusercontent.com/25621259/121601347-1e4fcd80-ca46-11eb-94bc-c02b4399d91d.png)



* Non owner (others) project detail - on this page, users could see project tiers and posts(if they possess some tiers) for that project. In picture bellow, for every tier, you could see diferent button.

  - Button "Buy" - user doesn't possess that tier, and when click on "Buy", user could buy that tier
  - Button "Sell" - user possess token for that tier, and when click on "Sell", it opens dialog where user put sell price, and that token(tier) will be display on tier market  
  - Button "Cancel sell" - token for that tier is on market, and when user click on "Cancel sell", that token pulls from market
  - Button "Burn" - this button is unlocked when token expired. When user "burn" token, token will be burn and user could buy new one
  
![project_detail_non_creator](https://user-images.githubusercontent.com/25621259/121603228-b9e23d80-ca48-11eb-9d20-0e3dc16f61df.png)
![project_detail_non_creator_sell](https://user-images.githubusercontent.com/25621259/121603232-bb136a80-ca48-11eb-9ae7-44cb4d94c4db.png)



* Tier market - when radio button is "For sell (my tiers)", users can see their own tiers(tokens) for sell, and when is "For buy" users can see tiers(tokens) that other users want to sell. In example bellow, sell price for token "Superb tier" is 150 ZIL, where 10 ZIL went to project(tier) owner and another 140 ZIL went to token owner.

![tier_market](https://user-images.githubusercontent.com/25621259/121606601-bfdb1d00-ca4e-11eb-9947-0690bbfc7589.png)
![tier_market_sell](https://user-images.githubusercontent.com/25621259/121678851-fe58f200-cab7-11eb-835a-0550a0749a24.png)



* Subscribed tiers - tiers that user subscribed (user has token for that tiers)

![subscribed_tiers](https://user-images.githubusercontent.com/25621259/121606879-41cb4600-ca4f-11eb-891e-f6f23e896de9.png)



### Built With

This project has five main components
* [ReactJS](https://reactjs.org/)
* [Magic](https://magic.link/)
* [Zilliqa-JS](https://github.com/Zilliqa/Zilliqa-JavaScript-Library)
* [Firebase](https://firebase.google.com/)
* [Zilliqa Blockchain](https://www.zilliqa.com/)

More detail description how it works: 
* On frontend there is ReactJS with [Material-UI](https://material-ui.com/) compoments. When user click on login page, login token with firebase function automatic writes on database and user has authorization to write on database (and to work in app). 
* Data are writes on two side - data that are important for smart contract are writes on blockchain, and other (description) data are writes on firebase database, where key for  firebase data is key from blockchain (on that way, there is connection between blockchain data and centralized database)
* Comunication for smart contract transition and get balance for user works with [Magic Zilliqa](https://docs.magic.link/blockchains/zilliqa) (because, user is authenticated with Magic SKD), while reading data from smart contract works with [Zilliqa-JS](https://github.com/Zilliqa/Zilliqa-JavaScript-Library)

<!-- GETTING STARTED -->
## Getting Started

This is an example of how you may give instructions on setting up your project locally.
To get a local copy up and running follow these simple example steps.

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/StefanVitor/Creators-Boost.git
   ```
2. Create project on Firebase and import serviceAccountKey.json on 'functions' directory (on request, I'll send my current serviceAccountKey.json)

3. Start project
     ```sh
   npm start
   ```

<!-- ROADMAP -->
## Roadmap

* Development new functionalities and integration with other wallets

* Integration with Discord and Discourse

* Application design

* Test cases



<!-- CONTRIBUTING -->
## Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



<!-- LICENSE -->
## License

Distributed under the GNU General Public License v3.0. See `LICENSE` for more information.



<!-- CONTACT -->
## Contact

Stefan Vitorovic - [@StefanVitorovic](https://twitter.com/StefanVitorovic) - vitorovicstefan@gmail.com

Project Link: [https://github.com/StefanVitor/Creators-Boost](https://github.com/StefanVitor/Creators-Boost)



<!-- ACKNOWLEDGEMENTS -->
## Acknowledgements
* [Gitcoin](https://gitcoin.co/)
* [Zilliqa team](https://www.zilliqa.com/)


